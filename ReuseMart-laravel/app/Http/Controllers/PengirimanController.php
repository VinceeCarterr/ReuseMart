<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pengiriman;
use Illuminate\Support\Facades\Log;
use Exception;

class PengirimanController extends Controller
{
    public function index()
    {
        try {
            $pengiriman = Pengiriman::all();
            return response()->json($pengiriman);
        } catch (Exception $e) {
            Log::error('Error fetching pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pengiriman'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pengiriman = Pengiriman::findOrFail($id);
            return response()->json($pengiriman);
        } catch (Exception $e) {
            Log::error('Error fetching pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Pengiriman not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $pengiriman = Pengiriman::create($request->all());
            return response()->json($pengiriman, 201);
        } catch (Exception $e) {
            Log::error('Error creating pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create pengiriman'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pengiriman = Pengiriman::findOrFail($id);
            $pengiriman->update($request->all());
            return response()->json($pengiriman);
        } catch (Exception $e) {
            Log::error('Error updating pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update pengiriman'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pengiriman = Pengiriman::findOrFail($id);
            $pengiriman->delete();
            return response()->json(['message' => 'Pengiriman deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pengiriman: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pengiriman'], 500);
        }
    }
}
