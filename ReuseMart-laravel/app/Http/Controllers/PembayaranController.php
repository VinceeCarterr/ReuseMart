<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use Illuminate\Support\Facades\Log;
use Exception;

class PembayaranController extends Controller
{
    public function index()
    {
        try {
            $pembayarans = Pembayaran::all();
            return response()->json($pembayarans);
        } catch (Exception $e) {
            Log::error('Error fetching payments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch payments'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pembayaran = Pembayaran::findOrFail($id);
            return response()->json($pembayaran);
        } catch (Exception $e) {
            Log::error('Error fetching payment: ' . $e->getMessage());
            return response()->json(['error' => 'Payment not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $pembayaran = Pembayaran::create($request->all());
            return response()->json($pembayaran, 201);
        } catch (Exception $e) {
            Log::error('Error creating payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pembayaran = Pembayaran::findOrFail($id);
            $pembayaran->update($request->all());
            return response()->json($pembayaran);
        } catch (Exception $e) {
            Log::error('Error updating payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update payment'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pembayaran = Pembayaran::findOrFail($id);
            $pembayaran->delete();
            return response()->json(['message' => 'Payment deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete payment'], 500);
        }
    }
}
