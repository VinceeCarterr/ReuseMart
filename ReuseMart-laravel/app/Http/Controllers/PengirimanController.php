<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pengiriman;
use App\Models\Transaksi;
use Illuminate\Support\Facades\Log;
use Exception;

class PengirimanController extends Controller
{
    public function index()
    {
        try {
            $pengiriman = Pengiriman::all();
            return response()->json($pengiriman);
        } catch (Exception $e) {
            Log::error('Error fetching pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengiriman'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pengiriman = Pengiriman::findOrFail($id);
            return response()->json($pengiriman);
        } catch (Exception $e) {
            Log::error('Error fetching pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Pengiriman not found'], 404);
        }
    }

   public function store(Request $request)
    {
        $request->validate([
            'id_transaksi'     => 'required|exists:transaksi,id_transaksi',
            'id_pegawai'       => 'required|exists:pegawai,id_pegawai',
            'tanggal_pengiriman'=> 'required|date',
            'status_pengiriman'=> 'required|string',
        ]);

        try {
            $pengiriman = Pengiriman::create($request->only([
                'id_transaksi',
                'id_pegawai',
                'tanggal_pengiriman',
                'status_pengiriman',
            ]));

            return response()->json([
                'message'    => 'Pengiriman berhasil dijadwalkan',
                'pengiriman' => $pengiriman,
            ], 201);
        } catch (Exception $e) {
            Log::error('Error scheduling pengiriman: ' . $e->getMessage());
            return response()->json([
                'error' => 'Gagal menjadwalkan pengiriman'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $request->validate([
            'status_pengiriman' => 'required|string'
        ]);

        $ambil = Pengiriman::findOrFail($id);
        $ambil->status_pengiriman = $request->status_pengiriman;
        $ambil->save();

        return response()->json($ambil);
    }

    public function destroy($id)
    {
        try {
            $pengiriman = Pengiriman::findOrFail($id);
            $pengiriman->delete();
            return response()->json(['message' => 'Pengiriman deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pengiriman'], 500);
        }
    }

    public function getByTransaksi($transaksiId)
    {
        $ship = Pengiriman::where('id_transaksi', $transaksiId)
            ->with('pegawai')
            ->get();

        return response()->json($ship);
    }
}
