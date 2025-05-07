<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Transaksi;
use Illuminate\Support\Facades\Log;
use Exception;
use Carbon\Carbon; 

class TransaksiController extends Controller
{
    public function index()
    {
        try {
            $transaksis = Transaksi::all();
            return response()->json($transaksis);
        } catch (Exception $e) {
            Log::error('Error fetching transactions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch transactions'], 500);
        }
    }

    public function show($id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            return response()->json($transaksi);
        } catch (Exception $e) {
            Log::error('Error fetching transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Transaction not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $transaksi = Transaksi::create($request->all());
            return response()->json($transaksi, 201);
        } catch (Exception $e) {
            Log::error('Error creating transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create transaction'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            $transaksi->update($request->all());
            return response()->json($transaksi);
        } catch (Exception $e) {
            Log::error('Error updating transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update transaction'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $transaksi = Transaksi::findOrFail($id);
            $transaksi->delete();
            return response()->json(['message' => 'Transaction deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting transaction: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete transaction'], 500);
        }
    }

    public function history(Request $request)
    {
        $transaksis = Transaksi::whereDate('tanggal_transaksi', '<=', Carbon::now()->toDateString())
            ->orderBy('tanggal_transaksi', 'desc')
            ->get();
    
        return response()->json($transaksis);
    }

    public function historyByUserId(Request $request)
    {
        $idUser = $request->user()->id_user;
        $transaksis = Transaksi::where('id_user', $idUser)
            ->whereDate('tanggal_transaksi', '<=', Carbon::now()->toDateString())
            ->orderBy('tanggal_transaksi', 'desc')
            ->get();
        return response()->json($transaksis);
    }
}
