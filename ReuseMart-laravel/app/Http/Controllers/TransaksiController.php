<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Transaksi;
use App\Models\Barang;
use App\Models\DetilTransaksi;
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
            'detilTransaksi.Barang.Penitipan.user',
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
        $idPenitip = $request->user()->id_user;

        try {
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'nullable|in:Available,Sold,Donated,On Hold',
                'category' => 'nullable|string',
                'search' => 'nullable|string',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            $query = Barang::with([
                'penitipan.user' => function ($q) {
                    $q->select('id_user', 'first_name', 'last_name');
                },
                'kategori' => function ($q) {
                    $q->select('id_kategori', 'nama_kategori', 'sub_kategori');
                },
                'detilTransaksi.transaksi.pembayaran',
                'detilTransaksi.transaksi.pengiriman',
                'detilTransaksi.transaksi.pengambilan',
                'detilTransaksi.komisi',
                'donasi.requestDonasi.user' => function ($q) {
                    $q->select('id_user', 'first_name', 'last_name');
                },
                'foto' => function ($q) {
                    $q->select('id_foto', 'id_barang', 'path');
                },
            ])
                ->whereHas('penitipan', function ($q) use ($idPenitip) {
                    $q->where('id_user', $idPenitip);
                })
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

            if ($request->filled('category')) {
                $query->whereHas('kategori', function ($q) use ($request) {
                    $q->where('nama_kategori', 'like', '%' . $request->category . '%')
                        ->orWhere('sub_kategori', 'like', '%' . $request->category . '%');
                });
            }

            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama_barang', 'like', '%' . $request->search . '%')
                        ->orWhere('kode_barang', 'like', '%' . $request->search . '%');
                });
            }

            $query->orderBy('tanggal_titip', 'desc');
            $perPage = $request->input('per_page', 10);
            $barangs = $query->paginate($perPage);

            $result = $barangs->getCollection()->map(function ($barang) {
                $days = $barang->status_periode === 'Periode 2' ? 60 : 30;
                $akhirPenitipan = $barang->tanggal_titip
                    ? Carbon::parse($barang->tanggal_titip)->addDays($days)
                    : null;

                $komisiPerusahaan = 0;
                $komisiHunter = 0;
                $saldoPenitip = 0;
                $transaksi = null;

                if ($barang->status === 'Sold' && $barang->detilTransaksi && $barang->detilTransaksi->isNotEmpty()) {
                    $detilTransaksi = $barang->detilTransaksi->first();
                    $transaksi = $detilTransaksi->transaksi;
                    $komisi = $detilTransaksi->komisi;

                    $komisiRate = $barang->status_periode === 'Periode 2' ? 0.30 : 0.20;
                    $komisiPerusahaan = $komisi ? $komisi->komisi_perusahaan : ($barang->harga * $komisiRate);
                    $komisiHunter = $barang->byHunter ? ($barang->harga * 0.05) : 0;
                    $saldoPenitip = $barang->harga - $komisiPerusahaan - $komisiHunter;
                }

                $donasi = null;
                if ($barang->status === 'Donated' && $barang->donasi && $barang->donasi->requestDonasi && $barang->donasi->requestDonasi->user) {
                    $donasi = [
                        'organisasi' => $barang->donasi->requestDonasi->user->first_name . ' ' . $barang->donasi->requestDonasi->user->last_name,
                        'tanggal_donasi' => $barang->donasi->created_at,
                    ];
                }

                $fotos = $barang->foto ? $barang->foto->map(function ($foto) {
                    return $foto->path ?? '';
                })->toArray() : [];

                return [
                    'id_barang' => $barang->id_barang,
                    'kode_barang' => $barang->kode_barang,
                    'nama_barang' => $barang->nama_barang,
                    'kategori' => $barang->kategori ? [
                        'nama_kategori' => $barang->kategori->nama_kategori ?? '',
                        'sub_kategori' => $barang->kategori->sub_kategori ?? '',
                    ] : null,
                    'deskripsi' => $barang->deskripsi ?? '',
                    'harga' => $barang->harga ?? 0,
                    'foto' => $fotos,
                    'status' => $barang->status ?? '',
                    'status_periode' => $barang->status_periode ?? '',
                    'tanggal_titip' => $barang->tanggal_titip,
                    'akhir_penitipan' => $akhirPenitipan,
                    'garansi' => $barang->garansi ?? '',
                    'transaksi' => $transaksi ? [
                        'id_transaksi' => $transaksi->id_transaksi ?? '',
                        'tanggal_transaksi' => $transaksi->tanggal_transaksi,
                        'subtotal' => $transaksi->subtotal ?? 0,
                        'metode_pengiriman' => $transaksi->metode_pengiriman ?? '',
                        'alamat' => $transaksi->alamat ?? '',
                        'status_pembayaran' => $transaksi->pembayaran ? $transaksi->pembayaran->status_pembayaran : null,
                        'pengiriman' => $transaksi->pengiriman ? [
                            'status_pengiriman' => $transaksi->pengiriman->status_pengiriman ?? '',
                            'tanggal_pengiriman' => $transaksi->pengiriman->tanggal_pengiriman,
                        ] : null,
                        'pengambilan' => $transaksi->pengambilan ? [
                            'status_pengambilan' => $transaksi->pengambilan->status_pengambilan ?? '',
                            'tanggal_pengambilan' => $transaksi->pengambilan->tanggal_pengambilan,
                        ] : null,
                        'komisi_perusahaan' => $komisiPerusahaan,
                        'komisi_hunter' => $komisiHunter,
                        'saldo_penitip' => $saldoPenitip,
                    ] : null,
                    'donasi' => $donasi,
                ];
            });

            $barangs->setCollection($result);

            return response()->json([
                'data' => $barangs->items(),
                'current_page' => $barangs->currentPage(),
                'last_page' => $barangs->lastPage(),
                'per_page' => $barangs->perPage(),
                'total' => $barangs->total(),
            ]);
        } catch (Exception $e) {
            Log::error('Error fetching history for penitip: ' . $e->getMessage(), [
                'user_id' => $idPenitip,
                'request' => $request->all(),
                'exception' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'error' => 'Failed to fetch penitip history',
                'message' => $e->getMessage(),
            ], 500);
        }
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

            $barang->status = 'On Hold';
            $barang->save();

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

            return response()->json([
                'message' => 'Keranjang berhasil diambil',
                'data' => [
                    'id_transaksi' => $transaksi->id_transaksi,
                    'items' => $transaksi->detilTransaksi->map(function ($detil) {
                        if (!$detil->Barang) {
                            return null;
                        }
                        return [
                            'id_barang' => $detil->Barang->id_barang,
                            'nama_barang' => $detil->Barang->nama_barang,
                            'harga' => $detil->Barang->harga,
                            'foto' => $detil->Barang->foto->isNotEmpty() ? url('storage/' . $detil->Barang->foto->first()->path) : null,
                        ];
                    })->filter()->values(),
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

                $barang = Barang::findOrFail($request->id_barang);
                $barang->status = 'Available';
                $barang->save();

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
}
