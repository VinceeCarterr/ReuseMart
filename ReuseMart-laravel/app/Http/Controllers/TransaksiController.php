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
        Log::error('Barang update error', ['request' => $request->all()]);
        return response()->json(['message' => 'Updated successfully']);
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
