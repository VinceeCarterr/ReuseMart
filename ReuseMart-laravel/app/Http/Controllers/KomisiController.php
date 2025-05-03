<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Komisi;
use Illuminate\Support\Facades\Log;
use Exception;

class KomisiController extends Controller
{
    public function index()
    {
        try {
            $komisi = Komisi::all();
            return response()->json($komisi);
        } catch (Exception $e) {
            Log::error('Error fetching komisi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch komisi'], 500);
        }
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
        try {
            $komisi = Komisi::create($request->all());
            return response()->json($komisi, 201);
        } catch (Exception $e) {
            Log::error('Error creating komisi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create komisi'], 500);
        }
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
}
