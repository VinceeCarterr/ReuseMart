<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Komisi;
use App\Models\DetilTransaksi;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Exception;

class KomisiController extends Controller
{
    public function index(Request $request)
    {
        $query = Komisi::query();

        if ($request->filled('id_dt')) {
            $query->where('id_dt', $request->id_dt);
        }

        return response()->json($query->get());
    }

    public function show($id)
    {
        try {
            $komisi = Komisi::findOrFail($id);
            return response()->json($komisi);
        } catch (Exception $e) {
            Log::error('Error fetching komisi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Komisi not found'], 404);
        }
    }

    public function store(Request $request)
    {
        // validate payload
        $validator = Validator::make($request->all(), [
            'id_dt'                 => 'required|exists:detiltransaksi,id_dt',
            'presentase_perusahaan' => 'required|numeric',
            'presentase_hunter'     => 'required|numeric',
            'komisi_perusahaan'     => 'required|numeric',
            'komisi_hunter'         => 'required|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors(),
            ], 422);
        }

        // create the komisi
        $komisi = Komisi::create($validator->validated());

        return response()->json($komisi, 201);
    }



    public function update(Request $request, $id)
    {
        try {
            $komisi = Komisi::findOrFail($id);
            $komisi->update($request->all());
            return response()->json($komisi);
        } catch (Exception $e) {
            Log::error('Error updating komisi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update komisi'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $komisi = Komisi::findOrFail($id);
            $komisi->delete();
            return response()->json(['message' => 'Komisi deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting komisi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete komisi'], 500);
        }
    }

    public function byHunter($hunterId)
    {
        $komisis = Komisi::whereHas('dt.Barang', fn($q) => 
                $q->where('byHunter', $hunterId)
            )
            ->with(['dt.Barang', 'dt.Transaksi'])
            ->get();

        return response()->json($komisis);
    }

    public function transactionsByHunter($hunterId)
    {
        $lines = DetilTransaksi::whereHas('Barang', fn($q) =>
                $q->where('byHunter', $hunterId)
            )
            ->with(['Barang.foto','Transaksi','Komisi'])
            ->get();

        $grouped = $lines->groupBy(fn($dt) => $dt->Transaksi->id_transaksi);

        return response()->json($grouped);
    }
}
