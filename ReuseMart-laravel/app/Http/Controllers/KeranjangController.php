<?php

namespace App\Http\Controllers;

use App\Models\Keranjang;
use App\Models\Barang;
use App\Models\Transaksi;
use App\Models\DetilTransaksi;
use App\Models\Pembayaran;
use App\Models\User;
use App\Jobs\CancelTransactionJob;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;


class KeranjangController extends Controller
{

    public function addToCart(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_barang' => 'required|integer|exists:barang,id_barang',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $barang = Barang::find($request->id_barang);
        if ($barang->status !== 'Available') {
            return response()->json([
                'status' => 'error',
                'message' => 'Barang tidak tersedia untuk ditambahkan ke keranjang.',
            ], 400);
        }

        $existingCartItem = Keranjang::where('id_user', Auth::id())
            ->where('id_barang', $request->id_barang)
            ->first();

        if ($existingCartItem) {
            return response()->json([
                'status' => 'error',
                'message' => 'Barang sudah ada di keranjang Anda.',
            ], 400);
        }

        $keranjang = Keranjang::create([
            'id_user' => Auth::id(),
            'id_barang' => $request->id_barang,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Barang berhasil ditambahkan ke keranjang.',
            'data' => $keranjang,
        ], 201);
    }

    public function getCart(Request $request)
    {
        try {
            $cartItems = Keranjang::select('id_keranjang', 'id_barang')
                ->where('id_user', Auth::id())
                ->with(['barang' => function ($query) {
                    $query->select('id_barang', 'nama_barang', 'harga', 'deskripsi', 'kategori', 'status')
                        ->with(['foto' => function ($subQuery) {
                            $subQuery->select('id_foto', 'id_barang', 'path')->take(1);
                        }]);
                }])
                ->get();

            $cartItems = $cartItems->map(function ($item) {
                if (!$item->barang) {
                    return null;
                }
                return [
                    'id_keranjang' => $item->id_keranjang,
                    'id_barang' => $item->id_barang,
                    'barang' => [
                        'id_barang' => $item->barang->id_barang,
                        'nama_barang' => $item->barang->nama_barang,
                        'harga' => $item->barang->harga,
                        'deskripsi' => $item->barang->deskripsi,
                        'kategori' => $item->barang->kategori,
                        'status' => $item->barang->status,
                        'foto' => $item->barang->foto->isNotEmpty() ? url('storage/' . $item->barang->foto->first()->path) : '/assets/placeholder.jpg',
                    ],
                ];
            })->filter()->values();

            return response()->json([
                'status' => 'success',
                'data' => $cartItems,
            ], 200);
        } catch (\Exception $e) {
            Log::error('GetCart Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengambil data keranjang. Silakan coba lagi.',
            ], 500);
        }
    }

    public function removeFromCart(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_keranjang' => 'required|integer|exists:keranjang,id_keranjang',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        $keranjang = Keranjang::where('id_keranjang', $request->id_keranjang)
            ->where('id_user', Auth::id())
            ->first();

        if (!$keranjang) {
            return response()->json([
                'status' => 'error',
                'message' => 'Item keranjang tidak ditemukan atau bukan milik Anda.',
            ], 404);
        }

        $keranjang->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Barang berhasil dihapus dari keranjang.',
        ], 200);
    }

    public function checkout(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'metode_pengiriman' => 'required|in:Delivery,Pick Up',
            'alamat' => 'required_if:metode_pengiriman,Delivery|string|nullable',
            'biaya_pengiriman' => 'required|numeric|min:0',
            'diskon' => 'required|numeric|min:0',
            'points_redeemed' => 'required|integer|min:0',
            'selected_items' => 'required|array|min:1',
            'selected_items.*' => 'integer|exists:keranjang,id_keranjang',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $user = User::findOrFail(Auth::id());
                $pointsRedeemed = $request->points_redeemed;

                // Validate points
                if ($pointsRedeemed > $user->poin_loyalitas) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Poin yang ditukar melebihi poin yang dimiliki.',
                    ], 400);
                }

                // Fetch and validate cart items
                $cartItems = Keranjang::where('id_user', $user->id_user)
                    ->whereIn('id_keranjang', $request->selected_items)
                    ->with(['barang' => function ($query) {
                        $query->select('id_barang', 'nama_barang', 'harga', 'status');
                    }])
                    ->get();

                if ($cartItems->isEmpty()) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Tidak ada item valid di keranjang.',
                    ], 400);
                }

                // Check item availability
                $unavailableItems = $cartItems->filter(function ($item) {
                    return !$item->barang || $item->barang->status !== 'Available';
                });

                if ($unavailableItems->isNotEmpty()) {
                    $itemName = $unavailableItems->first()->barang->nama_barang ?? 'Unknown';
                    return response()->json([
                        'status' => 'error',
                        'message' => "Barang {$itemName} tidak tersedia.",
                    ], 400);
                }

                // Calculate totals
                $subtotal = $cartItems->sum(function ($item) {
                    return $item->barang->harga;
                });
                $diskon = round($request->diskon);
                $totalBeforeDiscount = $subtotal + $request->biaya_pengiriman;
                $total = $totalBeforeDiscount - $diskon;

                // Validate discount
                if ($total < 0) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Diskon tidak boleh melebihi total harga.',
                    ], 400);
                }

                // Create payment
                $pembayaran = Pembayaran::create([
                    'total' => $total,
                    'ss_pembayaran' => '',
                    'status_pembayaran' => 'Pending',
                    'tanggal_pembayaran' => now(),
                ]);

                // Create transaction with temporary no_nota
                $transaksi = Transaksi::create([
                    'no_nota' => 'TEMP',
                    'id_user' => $user->id_user,
                    'id_pembayaran' => $pembayaran->id_pembayaran,
                    'metode_pengiriman' => $request->metode_pengiriman,
                    'alamat' => $request->metode_pengiriman === 'Delivery' ? $request->alamat : '',
                    'jumlah_item' => $cartItems->count(),
                    'biaya_pengiriman' => $request->biaya_pengiriman,
                    'subtotal' => $subtotal,
                    'diskon' => $diskon,
                    'total' => $total,
                    'status_transaksi' => 'Menunggu Pembayaran',
                    'tanggal_transaksi' => now(),
                ]);

                $noNota = sprintf('%s%s%s', now()->format('Y'), now()->format('m'), $transaksi->id_transaksi);
                $transaksi->update(['no_nota' => $noNota]);

                // Update payment with id_transaksi
                $pembayaran->update(['id_transaksi' => $transaksi->id_transaksi]);

                // Create detail transactions
                $detilTransaksiData = $cartItems->map(function ($item) use ($transaksi) {
                    return [
                        'id_transaksi' => $transaksi->id_transaksi,
                        'id_barang' => $item->id_barang,
                    ];
                })->toArray();
                DetilTransaksi::insert($detilTransaksiData);

                // Update item status to OnHold
                Barang::whereIn('id_barang', $cartItems->pluck('id_barang'))
                    ->update(['status' => 'On Hold']);

                // Deduct redeemed points
                if ($pointsRedeemed > 0) {
                    $user->poin_loyalitas -= $pointsRedeemed;
                    $user->save();
                }

                // Clear cart
                Keranjang::whereIn('id_keranjang', $request->selected_items)->delete();

                // Schedule transaction cancellation job (60 seconds)
                CancelTransactionJob::dispatch($transaksi->id_transaksi, $pointsRedeemed, $user->id_user)
                    ->delay(now()->addSeconds(60));

                return response()->json([
                    'status' => 'success',
                    'message' => 'Checkout berhasil. Silakan upload bukti pembayaran dalam 1 menit.',
                    'transaksi_id' => $transaksi->id_transaksi,
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error('Checkout Error: ' . $e->getMessage(), [
                'user_id' => Auth::id(),
                'request' => $request->all(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal melakukan checkout. Silakan coba lagi.',
            ], 500);
        }
    }

    public function uploadProof(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'transaksi_id' => 'required|exists:transaksi,id_transaksi',
            'pembayaran_id' => 'required|exists:pembayaran,id_pembayaran',
            'proof' => 'required|image|mimes:jpeg,png,jpg|max:20480',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {
                $transaksi = Transaksi::findOrFail($request->transaksi_id);
                $pembayaran = Pembayaran::findOrFail($request->pembayaran_id);
                $user = $transaksi->user;

                // Validate transaction and payment match
                if ($transaksi->id_pembayaran !== $pembayaran->id_pembayaran) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Transaksi dan pembayaran tidak sesuai',
                    ], 400);
                }

                // Check timeout (60 seconds)
                $createdAt = $transaksi->tanggal_transaksi;
                if (now()->diffInSeconds($createdAt) > 60) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Waktu untuk mengunggah bukti pembayaran telah habis',
                    ], 400);
                }

                // Store proof
                $file = $request->file('proof');
                $filename = Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('bukti_bayar', $filename, 'public');

                // Update payment
                $pembayaran->update([
                    'ss_pembayaran' => 'bukti_bayar/' . $filename,
                    'status_pembayaran' => 'Menunggu Verifikasi',
                ]);

                // Update transaction status
                $transaksi->update([
                    'status_transaksi' => 'Menunggu Verifikasi',
                ]);

                // Update item status to Sold
                $detilTransaksis = DetilTransaksi::where('id_transaksi', $transaksi->id_transaksi)->get();
                $barangIds = $detilTransaksis->pluck('id_barang');
                Barang::whereIn('id_barang', $barangIds)->update(['status' => 'Sold']);

                // Add loyalty points
                $totalPrice = $transaksi->total;
                $earnedPoints = floor($totalPrice / 10000 * ($totalPrice > 500000 ? 1.2 : 1));
                $user->poin_loyalitas += $earnedPoints;
                $user->save();

                // Ensure cart is cleared for these items
                Keranjang::where('id_user', $user->id_user)
                    ->whereIn('id_barang', $barangIds)
                    ->delete();

                Log::info("Upload proof successful", [
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'proof_path' => 'bukti_bayar/' . $filename,
                    'earned_points' => $earnedPoints,
                    'user_id' => $user->id_user,
                ]);

                return response()->json([
                    'status' => 'success',
                    'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi.',
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'proof_path' => 'bukti_bayar/' . $filename,
                    'earned_points' => $earnedPoints,
                ], 200);
            });
        } catch (\Exception $e) {
            Log::error('Upload Proof Error: ' . $e->getMessage(), [
                'transaksi_id' => $request->transaksi_id,
                'pembayaran_id' => $request->pembayaran_id,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal mengunggah bukti pembayaran. Silakan coba lagi.',
            ], 500);
        }
    }
}
