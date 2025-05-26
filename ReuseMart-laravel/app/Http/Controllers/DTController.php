<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DetilTransaksi;
use Exception;
use Illuminate\Support\Facades\Log;

class DTController extends Controller
{
   public function index()
   {
      try {
         $dt = DetilTransaksi::all();
         return response()->json($dt);
      } catch (Exception $e) {
         Log::error('Error fetching Detil Transaksi: ' . $e->getMessage());
         return response()->json(['error' => 'Failed to fetch data'], 500);
      }
   }

    public function show($id)
    {
        try {
            $dt = DetilTransaksi::findOrFail($id);
            return response()->json($dt);
        } catch (Exception $e) {
            Log::error('Error fetching Detil Transaksi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Data not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $dt = DetilTransaksi::create($request->all());
            return response()->json($dt, 201);
        } catch (Exception $e) {
            Log::error('Error creating Detil Transaksi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create data'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $dt = DetilTransaksi::findOrFail($id);
            $dt->update($request->all());
            return response()->json($dt);
        } catch (Exception $e) {
            Log::error('Error updating Detil Transaksi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update data'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $dt = DetilTransaksi::findOrFail($id);
            $dt->delete();
            return response()->json(['message' => 'Data deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting Detil Transaksi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete data'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $dt = DetilTransaksi::where('id_dt', 'LIKE', '%' . $query . '%')->get();
            return response()->json($dt);
        } catch (Exception $e) {
            Log::error('Error searching Detil Transaksi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search data'], 500);
        }
    }

    public function getByTransaksi($transaksiId)
    {
        try {
            $items = DetilTransaksi::with('Barang', 'barang.pegawai')
                ->where('id_transaksi', $transaksiId)
                ->get();

            return response()->json($items);
        } catch (\Throwable $e) {
            Log::error("getByTransaksi failed for transaksi {$transaksiId}: " . $e->getMessage());
            return response()->json([
                'error' => 'Server error fetching detail transaksi',
            ], 500);
        }
    }
}
