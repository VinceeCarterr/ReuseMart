<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barang;
use Exception;
use Illuminate\Support\Facades\Log;


class BarangController extends Controller
{
    public function index()
    {
       try {
            $barang = Barang::all();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error fetching barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch barang'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $barang = Barang::create($request->all());
            return response()->json($barang, 201);
        } catch (Exception $e) {
            Log::error('Error creating barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create barang'], 500);
        }
    }

    public function show($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error fetching barang: ' . $e->getMessage());
            return response()->json(['error' => 'Barang not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->update($request->all());
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error updating barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update barang'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->delete();
            return response()->json(['message' => 'Barang deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete barang'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $barang = Barang::where('name', 'LIKE', "%$query%")->get();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error searching barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search barang'], 500);
        }
    }

    public function updateStatusBarang($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->status_periode = 'Sudah didonasikan';
            $barang->status = "Donated";
            $barang->save();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error updating barang status: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update barang status'], 500);
        }
    }
}
