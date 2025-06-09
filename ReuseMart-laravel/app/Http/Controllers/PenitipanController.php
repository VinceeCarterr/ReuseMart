<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Penitipan;
use Exception;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class PenitipanController extends Controller
{
    public function index()
    {
        try {
            $penitipan = Penitipan::all();
            return response()->json($penitipan);
        } catch (Exception $e) {
            Log::error('Error fetching penitipans: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch penitipans'], 500);
        }
    }

    public function show($id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            return response()->json($penitipan);
        } catch (Exception $e) {
            Log::error('Error fetching penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Penitipan not found'], 404);
        }
    }

    public function getPenitipan($id)
    {
        $penitipan = Penitipan::findOrFail($id);
        return response()->json($penitipan);
    }

    public function store(Request $request)
    {
        try {
            $penitipan = Penitipan::create($request->all());
            return response()->json($penitipan, 201);
        } catch (Exception $e) {
            Log::error('Error creating penitipan: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create penitipan'], 500);
        }
    }



    public function update(Request $request, $id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            $penitipan->update($request->all());
            return response()->json($penitipan);
        } catch (Exception $e) {
            Log::error('Error updating penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update penitipan'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            $penitipan->delete();
            return response()->json(['message' => 'Penitipan deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete penitipan'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $penitipans = Penitipan::where('name', 'LIKE', "%{$query}%")->get();
            return response()->json($penitipans);
        } catch (Exception $e) {
            Log::error('Error searching penitipans: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search penitipans'], 500);
        }
    }

    public function laporanTransaksiPenitip(Request $request)
    {
        try {
            $request->validate([
                'id_user' => 'required|integer|exists:user,id_user',
                'bulan' => 'required|integer|between:1,12',
                'tahun' => 'required|integer|min:2000|max:2100',
            ]);

            $id_user = $request->id_user;
            $bulan = $request->bulan;
            $tahun = $request->tahun;

            $penitip = DB::table('user')
                ->join('role', 'user.id_role', '=', 'role.id_role')
                ->where('user.id_user', $id_user)
                ->where('role.id_role', 2)
                ->select('user.id_user', 'user.first_name', 'user.last_name')
                ->first();

            if (!$penitip) {
                return response()->json(['message' => 'Penitip tidak ditemukan'], 404);
            }

            // Fetch transaction data
            $transaksi = DB::table('transaksi')
                ->join('detiltransaksi', 'transaksi.id_transaksi', '=', 'detiltransaksi.id_transaksi')
                ->join('barang', 'detiltransaksi.id_barang', '=', 'barang.id_barang')
                ->join('penitipan', 'barang.id_penitipan', '=', 'penitipan.id_penitipan')
                ->leftJoin('komisi', 'detiltransaksi.id_dt', '=', 'komisi.id_dt')
                ->where('penitipan.id_user', $id_user)
                ->whereMonth('transaksi.tanggal_transaksi', $bulan)
                ->whereYear('transaksi.tanggal_transaksi', $tahun)
                ->where('transaksi.status_transaksi', '!=', 'Batal')
                ->select(
                    'barang.kode_barang',
                    'barang.nama_barang',
                    'barang.tanggal_titip as tanggal_masuk',
                    'transaksi.tanggal_transaksi as tanggal_laku',
                    'barang.harga',
                    DB::raw('COALESCE(komisi.komisi_perusahaan, 0) as komisi_perusahaan'),
                    DB::raw('COALESCE(komisi.komisi_hunter, 0) as komisi_hunter'),
                    DB::raw('
                        CASE 
                            WHEN DATEDIFF(transaksi.tanggal_transaksi, barang.tanggal_titip) <= 7 
                            THEN 30000 
                            ELSE 0 
                        END as bonus_cepat
                    ')
                )
                ->get();

            $transaksi = $transaksi->map(function ($item) {
                $harga_jual_bersih = $item->harga - ($item->komisi_perusahaan + $item->komisi_hunter);
                $pendapatan = $harga_jual_bersih + $item->bonus_cepat;
                return [
                    'kode_barang' => $item->kode_barang,
                    'nama_barang' => $item->nama_barang,
                    'tanggal_masuk' => $item->tanggal_masuk,
                    'tanggal_laku' => $item->tanggal_laku,
                    'harga_jual_bersih' => $harga_jual_bersih,
                    'bonus_cepat' => $item->bonus_cepat,
                    'pendapatan' => $pendapatan,
                ];
            });

            return response()->json([
                'penitip' => [
                    'id_user' => $penitip->id_user,
                    'nama' => trim($penitip->first_name . ' ' . $penitip->last_name),
                ],
                'transaksi' => $transaksi,
            ]);
        } catch (\Exception $e) {
            Log::error('Error fetching penitip transaction report: ' . $e->getMessage());
            return response()->json([
                'message' => 'Gagal memuat laporan transaksi penitip',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
