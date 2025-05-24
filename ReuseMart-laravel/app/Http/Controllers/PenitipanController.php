<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Penitipan;
use Exception;
use Illuminate\Support\Facades\Log;

class PenitipanController extends Controller
{
    public function index()
{
    try {
        $penitipan = Penitipan::all();
        return response()->json($penitipan);
    } catch (Exception $e) {
        Log::error('Error fetching penitipans: ' . $e->getMessage());
        return response()->json(['error' => 'Failed to fetch penitipans'], 500);
    }
}

    public function show($id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            return response()->json($penitipan);
        } catch (Exception $e) {
            Log::error('Error fetching penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Penitipan not found'], 404);
        }
    }

    public function getPenitipan($id)
    {
        $penitipan = Penitipan::findOrFail($id);
        return response()->json($penitipan);
    }
    
    public function store(Request $request)
    {
        try {
            $penitipan = Penitipan::create($request->all());
            return response()->json($penitipan, 201);
        } catch (Exception $e) {
            Log::error('Error creating penitipan: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create penitipan'], 500);
        }
    }



    public function update(Request $request, $id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            $penitipan->update($request->all());
            return response()->json($penitipan);
        } catch (Exception $e) {
            Log::error('Error updating penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update penitipan'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $penitipan = Penitipan::findOrFail($id);
            $penitipan->delete();
            return response()->json(['message' => 'Penitipan deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting penitipan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete penitipan'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $penitipans = Penitipan::where('name', 'LIKE', "%{$query}%")->get();
            return response()->json($penitipans);
        } catch (Exception $e) {
            Log::error('Error searching penitipans: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search penitipans'], 500);
        }
    }
}
