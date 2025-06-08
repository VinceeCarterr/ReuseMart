<?php

namespace App\Http\Controllers;

use App\Models\Redeem;
use App\Models\User;
use App\Models\Merch;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\Log;

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

    public function store(Request $req) {
        $user = $req->user();
         $req->validate([
            'id_merch' => 'required|integer|exists:merch,id_merch',
        ]);

        $merch = Merch::findOrFail($req->id_merch);

        if ($user->poin_loyalitas < $merch->poin_merch) {
        return response()->json(['error'=>'Not enough points'], 422);
        }
        if ($merch->stock < 1) {
        return response()->json(['error'=>'Out of stock'], 422);
        }

        DB::transaction(function() use($user, $merch) {
        $user->decrement('poin_loyalitas', $merch->poin_merch);
        $merch->decrement('stock', 1);

        Redeem::create([
            'id_merch'      => $merch->id_merch,
            'id_user'       => $user->id_user,
            'id_pegawai'    => null,
            'tanggal_redeem'=> Carbon::now(),
            'tanggal_ambil' => null,
        ]);
        });

        return response()->json(['message'=>'Redeemed'], 201);
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
