<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Merch;
use Illuminate\Support\Facades\Log;
use Exception;

class MerchController extends Controller
{
    public function index()
    {
        try {
            $merch = Merch::all();
            return response()->json($merch);
        } catch (Exception $e) {
            Log::error('Error fetching merch: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch merch'], 500);
        }
    }

    public function show($id)
    {
        try {
            $merch = Merch::findOrFail($id);
            return response()->json($merch);
        } catch (Exception $e) {
            Log::error('Error fetching merch with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Merch not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $merch = Merch::create($request->all());
            return response()->json($merch, 201);
        } catch (Exception $e) {
            Log::error('Error creating merch: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create merch'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $merch = Merch::findOrFail($id);
            $merch->update($request->all());
            return response()->json($merch);
        } catch (Exception $e) {
            Log::error('Error updating merch with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update merch'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $merch = Merch::findOrFail($id);
            $merch->delete();
            return response()->json(['message' => 'Merch deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting merch with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete merch'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $merch = Merch::where('nama_merch', 'LIKE', "%$query%")->get();
            return response()->json($merch);
        } catch (Exception $e) {
            Log::error('Error searching merch: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search merch'], 500);
        }
    }
}
