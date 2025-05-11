<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaksi;
use App\Models\Barang;
use App\Models\Penitipan;
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
            // Validasi input untuk filter
            $request->validate([
                'start_date' => 'nullable|date',
                'end_date' => 'nullable|date|after_or_equal:start_date',
                'status' => 'nullable|in:Available,Sold,Donated,On Hold',
                'category' => 'nullable|string',
                'search' => 'nullable|string',
                'per_page' => 'nullable|integer|min:1|max:100',
            ]);

            // Query untuk mengambil barang yang dititipkan oleh penitip
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

            // Filter berdasarkan periode penitipan
            if ($request->filled('start_date')) {
                $query->whereDate('tanggal_titip', '>=', $request->start_date);
            }
            if ($request->filled('end_date')) {
                $query->whereDate('tanggal_titip', '<=', $request->end_date);
            }

            // Filter berdasarkan status barang
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }

            // Filter berdasarkan kategori
            if ($request->filled('category')) {
                $query->whereHas('kategori', function ($q) use ($request) {
                    $q->where('nama_kategori', 'like', '%' . $request->category . '%')
                        ->orWhere('sub_kategori', 'like', '%' . $request->category . '%');
                });
            }

            // Pencarian berdasarkan nama atau kode barang
            if ($request->filled('search')) {
                $query->where(function ($q) use ($request) {
                    $q->where('nama_barang', 'like', '%' . $request->search . '%')
                        ->orWhere('kode_barang', 'like', '%' . $request->search . '%');
                });
            }

            // Urutkan dan paginasi
            $query->orderBy('tanggal_titip', 'desc');
            $perPage = $request->input('per_page', 10);
            $barangs = $query->paginate($perPage);

            // Format hasil
            $result = $barangs->getCollection()->map(function ($barang) {
                // Tentukan masa penitipan berdasarkan status_periode
                $days = $barang->status_periode === 'Periode 2' ? 60 : 30;
                $akhirPenitipan = $barang->tanggal_titip
                    ? Carbon::parse($barang->tanggal_titip)->addDays($days)
                    : null;

                // Inisialisasi default
                $komisiPerusahaan = 0;
                $komisiHunter = 0;
                $saldoPenitip = 0;
                $transaksi = null;

                if ($barang->status === 'Sold' && $barang->detilTransaksi && $barang->detilTransaksi->isNotEmpty()) {
                    $detilTransaksi = $barang->detilTransaksi->first();
                    $transaksi = $detilTransaksi->transaksi;
                    $komisi = $detilTransaksi->komisi;

                    // Komisi perusahaan: 20% untuk Periode 1, 30% untuk Periode 2
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

                // Ambil foto dari tabel foto_barang dengan pengecekan
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

            // Ganti koleksi paginasi dengan hasil yang diformat
            $barangs->setCollection($result);

            // Kembalikan respons
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
}
