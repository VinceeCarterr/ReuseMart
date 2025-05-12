<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Foto_Barang;
use Exception;
use Illuminate\Support\Facades\Log;


class Foto_BarangController extends Controller
{
    public function index()
    {
        try {
            $foto_barang = Foto_Barang::all();
            return response()->json($foto_barang);
        } catch (Exception $e) {
            Log::error('Error fetching photos: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch photos'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $foto_barang = Foto_Barang::create($request->all());
            return response()->json($foto_barang, 201);
        } catch (Exception $e) {
            Log::error('Error storing photo: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to store photo'], 500);
        }
    }

    public function show($id)
    {
        try {
            $foto_barang = Foto_Barang::findOrFail($id);
            return response()->json($foto_barang);
        } catch (Exception $e) {
            Log::error('Error fetching photo: ' . $e->getMessage());
            return response()->json(['error' => 'Photo not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $foto_barang = Foto_Barang::findOrFail($id);
            $foto_barang->update($request->all());
            return response()->json($foto_barang);
        } catch (Exception $e) {
            Log::error('Error updating photo: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update photo'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $foto_barang = Foto_Barang::findOrFail($id);
            $foto_barang->delete();
            return response()->json(['message' => 'Photo deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting photo: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete photo'], 500);
        }
    }

    public function getByBarangId($id_barang)
    {
        try {
            $fotos = Foto_Barang::where('id_barang', $id_barang)->get();
            return response()->json($fotos);
        } catch (Exception $e) {
            Log::error('Error fetching foto barang by id_barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch photos'], 500);
        }
    }

}
