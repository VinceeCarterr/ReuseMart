<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Redeem;
use Illuminate\Support\Facades\Log;
use Exception;

class RedeemController extends Controller
{
    public function index()
    {
        try {
            $redeems = Redeem::all();
            return response()->json($redeems);
        } catch (Exception $e) {
            Log::error('Error fetching redeems: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch redeems'], 500);
        }
    }

    public function show($id)
    {
        try {
            $redeem = Redeem::findOrFail($id);
            return response()->json($redeem);
        } catch (Exception $e) {
            Log::error('Error fetching redeem: ' . $e->getMessage());
            return response()->json(['error' => 'Redeem not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $redeem = Redeem::create($request->all());
            return response()->json($redeem, 201);
        } catch (Exception $e) {
            Log::error('Error creating redeem: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create redeem'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $redeem = Redeem::findOrFail($id);
            $redeem->update($request->all());
            return response()->json($redeem);
        } catch (Exception $e) {
            Log::error('Error updating redeem: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update redeem'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $redeem = Redeem::findOrFail($id);
            $redeem->delete();
            return response()->json(['message' => 'Redeem deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting redeem: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete redeem'], 500);
        }
    }
}
