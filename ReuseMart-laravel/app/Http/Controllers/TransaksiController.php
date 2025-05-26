<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Transaksi;
use App\Models\Barang;
use App\Models\DetilTransaksi;
use App\Models\Pembayaran;
use App\Models\Penitipan;
use App\Jobs\CancelTransactionJob;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Log;
use Exception;
use Carbon\Carbon;

class TransaksiController extends Controller
{
    public function index()
    {
        try {
            $transaksis = Transaksi::all();
            return response()->json($transaksis);
        } catch (Exception $e) {
            Log::error('Error fetching transactions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transactions'], 500);
        }
    }

    public function show($id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            return response()->json($transaksi);
        } catch (Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Transaction not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $transaksi = Transaksi::create($request->all());
            return response()->json($transaksi, 201);
        } catch (Exception $e) {
            Log::error('Error creating transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create transaction'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            $transaksi->update($request->all());
            return response()->json($transaksi);
        } catch (Exception $e) {
            Log::error('Error updating transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update transaction'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            $transaksi->delete();
            return response()->json(['message' => 'Transaction deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete transaction'], 500);
        }
    }

    public function history(Request $request)
    {
        $transaksis = Transaksi::with([
            'detilTransaksi.Barang.penitipan.user',
            'detilTransaksi.Barang.foto',
            'pengiriman',
            'pengambilan',
        ])
            ->whereDate('tanggal_transaksi', '<=', now()->toDateString())
            ->orderBy('tanggal_transaksi', 'desc')
            ->get();

        return response()->json($transaksis);
    }

    public function historyByUserId(Request $request)
    {
        $idUser = $request->user()->id_user;

        $transaksis = Transaksi::with([
            'pembayaran',
            'detilTransaksi.Barang.Penitipan.user',
            'detilTransaksi.Barang.foto',
            'pengiriman',
            'pengambilan',
        ])
            ->where('id_user', $idUser)
            ->whereDate('tanggal_transaksi', '<=', now()->toDateString())
            ->orderBy('tanggal_transaksi', 'desc')
            ->get();

        return response()->json($transaksis);
    }

    public function historyPenitip(Request $request)
    {
        if ($request->filled('status')) {
            $request->merge([
                'status' => ucwords(strtolower($request->input('status')))
            ]);
        }
        if ($request->filled('status_periode')) {
            $request->merge([
                'status_periode' => ucwords(strtolower($request->input('status_periode')))
            ]);
        }

        $request->validate([
            'start_date'     => 'nullable|date',
            'end_date'       => 'nullable|date|after_or_equal:start_date',
            'status'         => 'nullable|in:Available,Sold,Donated,On Hold',
            'status_periode' => 'nullable|in:Periode 1,Periode 2,Expired',
            'category'       => 'nullable|string',
            'search'         => 'nullable|string',
            'per_page'       => 'nullable|integer|min:1|max:100',
        ]);

        try {
            $idPenitip = $request->user()->id_user;

            $query = Barang::with([
                'penitipan.user:id_user,first_name,last_name',
                'kategori:id_kategori,nama_kategori,sub_kategori',
                'detilTransaksi.transaksi.pembayaran',
                'detilTransaksi.transaksi.pengiriman',
                'detilTransaksi.transaksi.pengambilan',
                'detilTransaksi.komisi',
                'donasi:id_donasi,id_reqdonasi,id_barang,tanggal_donasi',
                'donasi.requestDonasi:id_reqdonasi,id_user',
                'donasi.requestDonasi.user:id_user,first_name,last_name',
                'foto:id_foto,id_barang,path',
            ])
                ->whereHas(
                    'penitipan',
                    fn($q) =>
                    $q->where('id_user', $idPenitip)
                )
                ->select([
                    'id_barang',
                    'kode_barang',
                    'nama_barang',
                    'id_kategori',
                    'deskripsi',
                    'harga',
                    'status',
                    'status_periode',
                    'tanggal_titip',
                    'byHunter',
                    'garansi',
                ]);

            if ($request->filled('start_date')) {
                $query->whereDate('tanggal_titip', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('tanggal_titip', '<=', $request->end_date);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
            if ($request->filled('status_periode')) {
                $query->where('status_periode', $request->status_periode);
            }
            if ($request->filled('category')) {
                $query->whereHas(
                    'kategori',
                    fn($q) =>
                    $q->where('nama_kategori', 'like', "%{$request->category}%")
                        ->orWhere('sub_kategori',  'like', "%{$request->category}%")
                );
            }
            
            if ($request->filled('search')) {
                $search = $request->search;

                $query->where(function ($q) use ($search) {
                    $q->where('nama_barang', 'like', "%{$search}%")
                        ->orWhere('kode_barang', 'like', "%{$search}%")
                        ->orWhere('deskripsi', 'like', "%{$search}%")
                        ->orWhere('garansi', 'like', "%{$search}%")
                        ->orWhereHas('kategori', function ($sub) use ($search) {
                            $sub->where('nama_kategori', 'like', "%{$search}%")
                                ->orWhere('sub_kategori', 'like', "%{$search}%");
                        })
                        ->orWhereHas('detilTransaksi.transaksi', function ($sub) use ($search) {
                            $sub->where('alamat', 'like', "%{$search}%")
                                ->orWhere('metode_pengiriman', 'like', "%{$search}%");
                        });
                });
            }

            $barangs = $query
                ->orderBy('tanggal_titip', 'desc')
                ->paginate($request->input('per_page', 10));

            $items = $barangs->getCollection()->map(function ($b) {
                // consign period end
                $days = $b->status_periode === 'Periode 2' ? 60 : 30;
                $akhir = $b->tanggal_titip
                    ? Carbon::parse($b->tanggal_titip)->addDays($days)
                    : null;

                // sold commissions
                $komisiPerusahaan = $komisiHunter = $saldo = 0;
                $trans = null;
                if ($b->status === 'Sold' && $b->detilTransaksi->isNotEmpty()) {
                    $dt   = $b->detilTransaksi->first();
                    $rate = $b->status_periode === 'Periode 2' ? 0.30 : 0.20;
                    $komisiPerusahaan = $dt->komisi
                        ? $dt->komisi->komisi_perusahaan
                        : ($b->harga * $rate);
                    $komisiHunter = $b->byHunter ? ($b->harga * 0.05) : 0;
                    $saldo        = $b->harga - $komisiPerusahaan - $komisiHunter;
                    $trans        = $dt->transaksi;
                }

                // donated payload
                $donasiInfo = null;
                if ($b->status === 'Donated' && $b->donasi && $b->donasi->requestDonasi && $b->donasi->requestDonasi->user) {
                    $u = $b->donasi->requestDonasi->user;
                    $donasiInfo = [
                        'organisasi'     => "{$u->first_name} {$u->last_name}",
                        'tanggal_donasi' => $b->donasi->tanggal_donasi,
                    ];
                }

                return [
                    'id_barang'       => $b->id_barang,
                    'kode_barang'     => $b->kode_barang,
                    'nama_barang'     => $b->nama_barang,
                    'kategori'        => [
                        'nama_kategori' => $b->kategori->nama_kategori,
                        'sub_kategori'  => $b->kategori->sub_kategori,
                    ],
                    'deskripsi'       => $b->deskripsi,
                    'harga'           => $b->harga,
                    'foto'            => $b->foto->pluck('path')->toArray(),
                    'status'          => $b->status,
                    'status_periode'  => $b->status_periode,
                    'tanggal_titip'   => $b->tanggal_titip,
                    'akhir_penitipan' => $akhir,
                    'garansi'         => $b->garansi,
                    'transaksi'       => $trans ? [
                        'id_transaksi'      => $trans->id_transaksi,
                        'tanggal_transaksi' => $trans->tanggal_transaksi,
                        'subtotal'          => $trans->subtotal,
                        'metode_pengiriman' => $trans->metode_pengiriman,
                        'alamat'            => $trans->alamat,
                        'status_pembayaran' => $trans->pembayaran->status_pembayaran ?? null,
                        'pengiriman'        => $trans->pengiriman ? [
                            'status_pengiriman'  => $trans->pengiriman->status_pengiriman,
                            'tanggal_pengiriman' => $trans->pengiriman->tanggal_pengiriman,
                        ] : null,
                        'pengambilan'       => $trans->pengambilan ? [
                            'status_pengambilan'  => $trans->pengambilan->status_pengambilan,
                            'tanggal_pengambilan' => $trans->pengambilan->tanggal_pengambilan,
                        ] : null,
                        'komisi_perusahaan' => $komisiPerusahaan,
                        'komisi_hunter'     => $komisiHunter,
                        'saldo_penitip'     => $saldo,
                    ] : null,
                    'donasi'          => $donasiInfo,
                ];
            });

            return response()->json([
                'data'         => $items,
                'current_page' => $barangs->currentPage(),
                'last_page'    => $barangs->lastPage(),
                'per_page'     => $barangs->perPage(),
                'total'        => $barangs->total(),
            ]);
        } catch (Exception $e) {
            Log::error("Error fetching penitip history: {$e->getMessage()}", [
                'user_id' => $request->user()->id_user,
                'filters' => $request->only(['status', 'status_periode', 'start_date', 'end_date', 'category', 'search', 'per_page']),
                'trace'   => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error'   => 'Failed to fetch penitip history',
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    public function updateHistoryPenitip(Request $request, $id_barang)
    {
        $request->validate([
            'tanggal_titip'   => 'sometimes|date',
            'status_periode'  => 'sometimes|in:Periode 1,Periode 2,Expired',
            'status'          => 'sometimes|in:Available,Sold,Donated,On Hold,Untuk Donasi,Akan Ambil,Bisa Perpanjang',
        ]);

        $barang = Barang::with('penitipan')->findOrFail($id_barang);

        if ($request->user()->id_user !== optional($barang->penitipan)->id_user) {
            return response()->json(['error' => 'Unauthorized or no penitipan'], 403);
        }

        if ($request->has('tanggal_titip')) {
            $barang->tanggal_titip = $request->input('tanggal_titip');
        }
        if ($request->has('status_periode')) {
            $barang->status_periode = $request->input('status_periode');
        }
        if ($request->has('status')) {
            $barang->status = $request->input('status');
        }

        $barang->save();
        \Log::error('Barang update error', ['request' => $request->all()]);
        return response()->json(['message' => 'Updated successfully']);
    }

    public function addToCart(Request $request)
    {
        $request->validate([
            'id_barang' => 'required|exists:barang,id_barang',
        ]);

        try {
            $user = $request->user();

            $barang = Barang::findOrFail($request->id_barang);

            if ($barang->status !== 'Available') {
                return response()->json(['error' => 'Barang tidak tersedia untuk dibeli'], 400);
            }

            $transaksi = Transaksi::firstOrCreate(
                ['id_user' => $user->id_user, 'id_pembayaran' => null],
                [
                    'tanggal_transaksi' => now(),
                    'jumlah_item' => 0,
                    'metode_pengiriman' => 'Belum Dipilih',
                    'alamat' => '',
                    'biaya_pengiriman' => 0,
                    'diskon' => 0,
                    'subtotal' => 0,
                    'total' => 0,
                ]
            );

            DetilTransaksi::create([
                'id_transaksi' => $transaksi->id_transaksi,
                'id_barang' => $request->id_barang,
            ]);

            return response()->json(['message' => 'Barang berhasil ditambahkan ke keranjang'], 201);
        } catch (Exception $e) {
            Log::error('Gagal add to cart: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal menambahkan barang ke keranjang'], 500);
        }
    }

    public function getCart(Request $request)
    {
        try {
            $user = $request->user();

            $transaksi = Transaksi::with(['detilTransaksi.Barang.foto'])
                ->where('id_user', $user->id_user)
                ->whereNull('id_pembayaran')
                ->first();

            if (!$transaksi) {
                return response()->json([
                    'message' => 'Keranjang kosong',
                    'data' => [],
                ], 200);
            }

            $items = $transaksi->detilTransaksi->map(function ($detil) use ($user) {
                if (!$detil->Barang) {
                    return null;
                }

                $isSold = $detil->Barang->status === 'sold' ||
                    Transaksi::where('id_transaksi', '!=', $detil->id_transaksi)
                    ->whereNotNull('id_pembayaran')
                    ->whereHas('detilTransaksi', function ($query) use ($detil) {
                        $query->where('id_barang', $detil->Barang->id_barang);
                    })
                    ->exists();

                if ($isSold) {
                    $detil->delete();
                    return null;
                }

                return [
                    'id_barang' => $detil->Barang->id_barang,
                    'nama_barang' => $detil->Barang->nama_barang,
                    'harga' => $detil->Barang->harga,
                    'foto' => $detil->Barang->foto->isNotEmpty() ? url('storage/' . $detil->Barang->foto->first()->path) : null,
                    'status' => $detil->Barang->status,
                ];
            })->filter()->values();

            if ($items->isEmpty()) {
                $transaksi->delete();
                return response()->json([
                    'message' => 'Keranjang kosong setelah memfilter barang yang sudah sold',
                    'data' => [],
                ], 200);
            }

            return response()->json([
                'message' => 'Keranjang berhasil diambil',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'items' => $items,
                ],
            ], 200);
        } catch (\Exception $e) {
            Log::error('Gagal mengambil keranjang: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengambil keranjang'], 500);
        }
    }

    public function removeFromCart(Request $request)
    {
        $request->validate([
            'id_barang' => 'required|exists:barang,id_barang',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $user = $request->user();

                $transaksi = Transaksi::where('id_user', $user->id_user)
                    ->whereNull('id_pembayaran')
                    ->first();

                if (!$transaksi) {
                    return response()->json(['error' => 'Keranjang tidak ditemukan'], 404);
                }

                $detil = DetilTransaksi::where('id_transaksi', $transaksi->id_transaksi)
                    ->where('id_barang', $request->id_barang)
                    ->first();

                if (!$detil) {
                    return response()->json(['error' => 'Barang tidak ditemukan di keranjang'], 404);
                }

                $detil->delete();

                if ($transaksi->detilTransaksi()->count() === 0) {
                    $transaksi->delete();
                }

                return response()->json(['message' => 'Barang berhasil dihapus dari keranjang'], 200);
            });
        } catch (\Exception $e) {
            Log::error('Gagal menghapus barang dari keranjang: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal menghapus barang dari keranjang'], 500);
        }
    }

    public function penjadwalan(Request $request)
    {
        $request->validate([
            'metode_pengiriman' => 'nullable|in:Delivery,Pick Up',
            'search'            => 'nullable|string',
        ]);

        $query = Transaksi::with([
            'user',
            'pembayaran',
            'pengiriman.pegawai',
            'pengambilan',
            'detilTransaksi.Komisi',
            'detilTransaksi.Barang.foto',
            'detilTransaksi.Barang.penitipan.user',
        ])
            ->whereHas(
                'pembayaran',
                fn($q) =>
                $q->where('status_pembayaran', 'Berhasil')
            );

        if ($request->filled('metode_pengiriman')) {
            $query->where('metode_pengiriman', $request->metode_pengiriman);
        }

        if ($request->filled('search')) {
            $term = $request->search;
            $query->where(function ($q) use ($term) {
                $q->where('id_transaksi', 'like', "%{$term}%")
                    ->orWhereHas(
                        'user',
                        fn($u) =>
                        $u->where('first_name', 'like', "%{$term}%")
                            ->orWhere('last_name', 'like', "%{$term}%")
                    );
            });
        }

        $schedules = $query
            ->orderBy('tanggal_transaksi', 'desc')
            ->get();

        return response()->json($schedules);
    }

    public function checkout(Request $request)
    {
        $request->validate([
            'metode_pengiriman' => 'required|in:Delivery,Pick Up',
            'alamat' => 'required_if:metode_pengiriman,Delivery|string|nullable',
            'biaya_pengiriman' => 'required|numeric|min:0',
            'diskon' => 'nullable|numeric|min:0',
            'points_redeemed' => 'nullable|integer|min:0',
            'selected_items' => 'required|array',
            'selected_items.*' => 'exists:barang,id_barang',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $user = $request->user();
                $selectedItems = $request->selected_items;

                $transaksiKeranjang = Transaksi::with('detilTransaksi.Barang')
                    ->where('id_user', $user->id_user)
                    ->whereNull('id_pembayaran')
                    ->first();

                if (!$transaksiKeranjang || $transaksiKeranjang->detilTransaksi->isEmpty()) {
                    return response()->json(['error' => 'Keranjang kosong'], 400);
                }

                $detilTransaksis = $transaksiKeranjang->detilTransaksi->filter(function ($detil) use ($selectedItems) {
                    return in_array($detil->id_barang, $selectedItems);
                });

                if ($detilTransaksis->isEmpty()) {
                    return response()->json(['error' => 'Tidak ada barang yang dipilih untuk checkout'], 400);
                }

                $subtotal = 0;
                foreach ($detilTransaksis as $detil) {
                    $barang = Barang::findOrFail($detil->id_barang);
                    if ($barang->status !== 'Available') {
                        return response()->json(['error' => "Barang {$barang->nama_barang} sudah tidak tersedia"], 400);
                    }
                    $subtotal += $barang->harga;
                }

                $total_step1 = $subtotal + $request->biaya_pengiriman;
                $total = $total_step1 - ($request->diskon ?? 0);
                $pointsRedeemed = $request->points_redeemed ?? 0;
                if ($pointsRedeemed > 0) {
                    if ($pointsRedeemed > $user->poin_loyalitas) {
                        return response()->json(['error' => 'Poin loyalitas tidak cukup'], 400);
                    }
                    $user->poin_loyalitas -= $pointsRedeemed;
                    $user->save();
                }

                $transaksiBaru = Transaksi::create([
                    'id_user' => $user->id_user,
                    'id_pembayaran' => null,
                    'tanggal_transaksi' => now(),
                    'jumlah_item' => $detilTransaksis->count(),
                    'metode_pengiriman' => $request->metode_pengiriman,
                    'alamat' => $request->metode_pengiriman === 'Delivery' ? $request->alamat : '',
                    'biaya_pengiriman' => $request->biaya_pengiriman,
                    'diskon' => $request->diskon ?? 0,
                    'subtotal' => $subtotal,
                    'total' => $total,
                    'status' => 'Menunggu',
                ]);

                $year = now()->year;
                $month = now()->format('m');
                $no_nota = "{$year}.{$month}.{$transaksiBaru->id_transaksi}";

                $transaksiBaru->update(['no_nota' => $no_nota]);

                foreach ($detilTransaksis as $detil) {
                    DetilTransaksi::create([
                        'id_transaksi' => $transaksiBaru->id_transaksi,
                        'id_barang' => $detil->id_barang,
                    ]);
                    $detil->delete();
                }

                foreach ($detilTransaksis as $detil) {
                    $barang = Barang::findOrFail($detil->id_barang);
                    $barang->status = 'On Hold';
                    $barang->save();
                }

                $pembayaran = Pembayaran::create([
                    'ss_pembayaran' => 'pending.jpg',
                    'status_pembayaran' => 'Menunggu',
                ]);

                $transaksiBaru->update([
                    'id_pembayaran' => $pembayaran->id_pembayaran,
                ]);

                CancelTransactionJob::dispatch($transaksiBaru->id_transaksi, $pointsRedeemed, $user->id_user)
                    ->delay(now()->addMinutes(1));

                if ($transaksiKeranjang->detilTransaksi()->count() === 0) {
                    $transaksiKeranjang->delete();
                }

                return response()->json([
                    'message' => 'Checkout berhasil. Silakan upload bukti pembayaran dalam 1 menit.',
                    'transaksi_id' => $transaksiBaru->id_transaksi,
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'no_nota' => $no_nota,
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('Gagal checkout: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal melakukan checkout: ' . $e->getMessage()], 500);
        }
    }

    public function uploadProof(Request $request)
    {
        $request->validate([
            'transaksi_id' => 'required|exists:transaksi,id_transaksi',
            'pembayaran_id' => 'required|exists:pembayaran,id_pembayaran',
            'proof' => 'required|image|mimes:jpeg,png,jpg|max:20480',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $transaksi = Transaksi::findOrFail($request->transaksi_id);
                $pembayaran = Pembayaran::findOrFail($request->pembayaran_id);

                if ($transaksi->id_pembayaran !== $pembayaran->id_pembayaran) {
                    return response()->json(['error' => 'Transaksi dan pembayaran tidak sesuai'], 400);
                }

                $createdAt = $transaksi->created_at;
                if (now()->diffInSeconds($createdAt) > 10) {
                    return response()->json(['error' => 'Waktu untuk mengunggah bukti pembayaran telah habis'], 400);
                }

                $file = $request->file('proof');
                $filename = Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($filename);

                $pembayaran->update([
                    'ss_pembayaran' => $filename,
                    'status_pembayaran' => 'Menunggu Verifikasi',
                ]);

                return response()->json([
                    'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi.',
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'proof_path' => $filename,
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('Gagal mengunggah bukti pembayaran: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengunggah bukti pembayaran'], 500);
        }
    }

    public function showOne($id)
    {
        $t = Transaksi::with([
            'user',
            'detilTransaksi.Barang.foto',
            'pengiriman.pegawai',
            'pengambilan',
        ])->findOrFail($id);

        return response()->json($t);
    }
}
