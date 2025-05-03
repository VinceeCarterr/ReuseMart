<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Req_Donasi;
use Illuminate\Support\Facades\Log;
use Exception;

class Req_DonasiController extends Controller
{
    public function index()
    {
        try {
            $req_donasi = Req_Donasi::all();
            return response()->json($req_donasi);
        } catch (Exception $e) {
            Log::error('Error fetching Req_Donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch data'], 500);
        }
    }

    public function show($id)
    {
        try {
            $req_donasi = Req_Donasi::findOrFail($id);
            return response()->json($req_donasi);
        } catch (Exception $e) {
            Log::error('Error fetching Req_Donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Data not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $req_donasi = Req_Donasi::create($request->all());
            return response()->json($req_donasi, 201);
        } catch (Exception $e) {
            Log::error('Error creating Req_Donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create data'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $req_donasi = Req_Donasi::findOrFail($id);
            $req_donasi->update($request->all());
            return response()->json($req_donasi);
        } catch (Exception $e) {
            Log::error('Error updating Req_Donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update data'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $req_donasi = Req_Donasi::findOrFail($id);
            $req_donasi->delete();
            return response()->json(['message' => 'Data deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting Req_Donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete data'], 500);
        }
    }

    public function getByUserId($user_id)
    {
        try {
            $req_donasi = Req_Donasi::where('user_id', $user_id)->get();
            return response()->json($req_donasi);
        } catch (Exception $e) {
            Log::error('Error fetching Req_Donasi for user ID ' . $user_id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch data'], 500);
        }
    }
}
