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

        try {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('Foto_Barang', $fileName, 'public');

            $foto = new Foto_Barang();
            $foto->id_barang = $request->id_barang;
            $foto->path = $path;
            $foto->save();

            Log::info('New photo stored', ['id_barang' => $request->id_barang, 'path' => $path]);

            return response()->json([
                'message' => 'Foto berhasil diunggah',
                'data' => $foto,
            ], 201);
        } catch (Exception $e) {
            Log::error('Error storing photo: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to upload photo'], 500);
        }
    }

public function updateFoto(Request $request, $id)
{
    $request->validate([
        'file' => 'nullable|image|max:2048',
        'id_barang' => 'sometimes|required|exists:barang,id_barang',
    ]);

    try {
        $foto = Foto_Barang::findOrFail($id);

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $fileName = time() . '_' . $file->getClientOriginalName();
            $path = $file->storeAs('Foto_Barang', $fileName, 'public');

            // Verifikasi file tersimpan
            if (!Storage::disk('public')->exists($path)) {
                throw new Exception('File failed to save to storage at path: ' . $path);
            }

            // Delete old file if exists
            if ($foto->path) {
                Storage::disk('public')->delete($foto->path);
            }

            // Update the existing photo's path
            $foto->path = $path;
        }

        $foto->save();

        Log::info('Photo updated', [
            'id_foto' => $id,
            'id_barang' => $foto->id_barang,
            'old_path' => $foto->getOriginal('path'),
            'new_path' => $foto->path,
            'storage_exists' => Storage::disk('public')->exists($foto->path),
        ]);

        return response()->json([
            'message' => 'Foto berhasil diperbarui',
            'data' => $foto,
        ], 200);
    } catch (Exception $e) {
        Log::error('Error updating photo: ' . $e->getMessage(), ['id_foto' => $id]);
        return response()->json(['error' => 'Failed to update photo: ' . $e->getMessage()], 500);
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
            Log::info('Photo metadata updated', ['id' => $id]);
            return response()->json($foto_barang);
        } catch (Exception $e) {
            Log::error('Error updating photo metadata: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update photo'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $foto_barang = Foto_Barang::findOrFail($id);
            $foto_barang->delete();
            Log::info('Photo record deleted', ['id' => $id, 'path' => $foto_barang->path]);
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
            Log::info('Fetched photos for barang', ['id_barang' => $id_barang, 'count' => $fotos->count()]);
            return response()->json($fotos);
        } catch (Exception $e) {
            Log::error('Error fetching foto barang by id_barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch photos'], 500);
        }
    }
}