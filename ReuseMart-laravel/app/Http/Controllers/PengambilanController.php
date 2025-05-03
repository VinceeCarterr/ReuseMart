<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pengambilan;
use Illuminate\Support\Facades\Log;
use Exception;

class PengambilanController extends Controller
{
    public function index()
    {
        try {
            $pengambilans = Pengambilan::all();
            return response()->json($pengambilans);
        } catch (Exception $e) {
            Log::error('Error fetching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengambilan data'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pengambilan = Pengambilan::findOrFail($id);
            return response()->json($pengambilan);
        } catch (Exception $e) {
            Log::error('Error fetching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengambilan data'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $pengambilan = new Pengambilan();
            $pengambilan->fill($request->all());
            $pengambilan->save();
            return response()->json($pengambilan, 201);
        } catch (Exception $e) {
            Log::error('Error storing pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to store pengambilan data'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pengambilan = Pengambilan::findOrFail($id);
            $pengambilan->fill($request->all());
            $pengambilan->save();
            return response()->json($pengambilan);
        } catch (Exception $e) {
            Log::error('Error updating pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update pengambilan data'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pengambilan = Pengambilan::findOrFail($id);
            $pengambilan->delete();
            return response()->json(['message' => 'Pengambilan deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pengambilan data'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $pengambilans = Pengambilan::where('name', 'LIKE', "%$query%")->get();
            return response()->json($pengambilans);
        } catch (Exception $e) {
            Log::error('Error searching pengambilan data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search pengambilan data'], 500);
        }
    }
}
