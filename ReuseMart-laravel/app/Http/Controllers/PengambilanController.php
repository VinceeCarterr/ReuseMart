<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pengambilan;
use Illuminate\Support\Facades\Log;
use Exception;

class PengambilanController extends Controller
{
    public function index()
    {
        try {
            $pengambilans = Pengambilan::all();
            return response()->json($pengambilans);
        } catch (Exception $e) {
            Log::error('Error fetching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengambilan data'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pengambilan = Pengambilan::findOrFail($id);
            return response()->json($pengambilan);
        } catch (Exception $e) {
            Log::error('Error fetching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengambilan data'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([
            'id_transaksi'        => 'required|exists:transaksi,id_transaksi|unique:pengambilan,id_transaksi',
            'tanggal_pengambilan' => 'required|date',
            'status_pengambilan'  => 'required|in:Belum diambil,Sudah diambil,Tidak diambil',
        ]);

        try {
            $pengambilan = Pengambilan::create($request->only([
                'id_transaksi',
                'tanggal_pengambilan',
                'status_pengambilan',
            ]));

            return response()->json([
                'message'     => 'Pengambilan berhasil dijadwalkan',
                'pengambilan' => $pengambilan,
            ], 201);
        } catch (Exception $e) {
            Log::error('Error scheduling pengambilan: ' . $e->getMessage());
            return response()->json([
                'error' => 'Gagal menjadwalkan pengambilan'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status_pengambilan' => 'required|string'
        ]);

        $ambil = Pengambilan::findOrFail($id);
        $ambil->status_pengambilan = $request->status_pengambilan;
        $ambil->save();

        return response()->json($ambil);
    }

    public function destroy($id)
    {
        try {
            $pengambilan = Pengambilan::findOrFail($id);
            $pengambilan->delete();
            return response()->json(['message' => 'Pengambilan deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pengambilan data'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $pengambilans = Pengambilan::where('name', 'LIKE', "%$query%")->get();
            return response()->json($pengambilans);
        } catch (Exception $e) {
            Log::error('Error searching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search pengambilan data'], 500);
        }
    }
}
