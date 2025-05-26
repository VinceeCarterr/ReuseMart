<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
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
        $request->validate([
            'file' => 'required|image|max:2048',
            'id_barang' => 'required|exists:barang,id_barang',
        ]);

        $file = $request->file('file');

        $path = $file->store('Foto_Barang', 'public');

        $foto = new Foto_Barang();
        $foto->id_barang = $request->id_barang;
        $foto->path = $path; 
        $foto->save();

        return response()->json([
            'message' => 'Foto berhasil diunggah',
            'data' => $foto,
        ], 201);
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
        if (Storage::disk('public')->exists($foto_barang->path)) {
            Storage::disk('public')->delete($foto_barang->path);
        } else {
            Log::warning('File not found in storage: ' . $foto_barang->path);
        }
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
