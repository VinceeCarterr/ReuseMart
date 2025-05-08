<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Kategori;
use Exception;
use Illuminate\Support\Facades\Log;

class KategoriController extends Controller
{
    public function index()
    {
        try {
            // fetch just the fields we need
            $all = Kategori::select('id_kategori', 'nama_kategori', 'sub_kategori')->get();
    
            // group by main category name
            $grouped = $all->groupBy('nama_kategori')->map(function($items, $namaKategori) {
                return [
                    'nama_kategori' => $namaKategori,
                    'sub_kategori'  => $items->map(fn($i) => [
                        'id'   => $i->id_kategori,
                        'nama' => $i->sub_kategori,
                    ])->values(),
                ];
            })->values();
    
            return response()->json($grouped);
        } catch (Exception $e) {
            Log::error('Error fetching categories: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch categories'], 500);
        }
    }
   
    public function store(Request $request)
    {
        try {
            $kategori = Kategori::create($request->all());
            return response()->json($kategori, 201);
        } catch (Exception $e) {
            Log::error('Error creating category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create category'], 500);
        }
    }

    public function show($id)
    {
        try {
            $kategori = Kategori::findOrFail($id);
            return response()->json($kategori);
        } catch (Exception $e) {
            Log::error('Error fetching category: ' . $e->getMessage());
            return response()->json(['error' => 'Category not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $kategori = Kategori::findOrFail($id);
            $kategori->update($request->all());
            return response()->json($kategori);
        } catch (Exception $e) {
            Log::error('Error updating category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update category'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $kategori = Kategori::findOrFail($id);
            $kategori->delete();
            return response()->json(['message' => 'Category deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting category: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete category'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $kategoris = Kategori::where('nama_kategori', 'LIKE', "%$query%")->get();
            return response()->json($kategoris);
        } catch (Exception $e) {
            Log::error('Error searching categories: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search categories'], 500);
        }
    }
}
