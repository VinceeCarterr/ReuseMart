<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Donasi;
use Exception;


use Illuminate\Support\Facades\Log;

class DonasiController extends Controller
{
    public function index()
    {
        try {
            $donasi = Donasi::all();
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error fetching donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch donasi'], 500);
        }
    }

    public function show($id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error fetching donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Donasi not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $donasi = Donasi::create($request->all());
            return response()->json($donasi, 201);
        } catch (Exception $e) {
            Log::error('Error creating donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create donasi'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            $donasi->update($request->all());
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error updating donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update donasi'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            $donasi->delete();
            return response()->json(['message' => 'Donasi deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete donasi'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $donasi = Donasi::where('name', 'LIKE', "%{$query}%")->get();
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error searching donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search donasi'], 500);
        }
    }
}
