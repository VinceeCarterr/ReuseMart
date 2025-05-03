<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pegawai;
use Illuminate\Support\Facades\Log;
use Exception;

class PegawaiController extends Controller
{
    public function index()
    {
        try {
            $pegawai = Pegawai::all();
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pegawai'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pegawai = Pegawai::findOrFail($id);
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Pegawai not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $pegawai = Pegawai::create($request->all());
            return response()->json($pegawai, 201);
        } catch (Exception $e) {
            Log::error('Error creating pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create pegawai'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pegawai = Pegawai::findOrFail($id);
            $pegawai->update($request->all());
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error updating pegawai with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update pegawai'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pegawai = Pegawai::findOrFail($id);
            $pegawai->delete();
            return response()->json(['message' => 'Pegawai deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pegawai with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pegawai'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $pegawai = Pegawai::where('nama_pegawai', 'LIKE', "%$query%")->get();
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error searching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search pegawai'], 500);
        }
    }
}
