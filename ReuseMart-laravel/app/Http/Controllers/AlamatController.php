<?php

namespace App\Http\Controllers;

use App\Models\Alamat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;

use Illuminate\Support\Facades\Log;

class AlamatController extends Controller
{
    public function index()
    {
        try {
            $alamat = Alamat::all();
            return response()->json($alamat);
        } catch (Exception $e) {
            Log::error('Error fetching addresses: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch addresses'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $alamat = Alamat::create($request->all());
            return response()->json($alamat, 201);
        } catch (Exception $e) {
            Log::error('Error creating address: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create address'], 500);
        }
    }

    public function show($id)
    {
        try {
            $alamat = Alamat::findOrFail($id);
            return response()->json($alamat);
        } catch (Exception $e) {
            Log::error('Error fetching address: ' . $e->getMessage());
            return response()->json(['error' => 'Address not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $alamat = Alamat::findOrFail($id);
            $alamat->update($request->all());
            return response()->json($alamat);
        } catch (Exception $e) {
            Log::error('Error updating address: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update address'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $alamat = Alamat::findOrFail($id);
            $alamat->delete();
            return response()->json(['message' => 'Address deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting address: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete address'], 500);
        }
    }

    public function getAlamatByUserId(Request $request)
    {
        $userId = $request->user()->id_user;

        try {
            $alamat = Alamat::where('id_user', $userId)->get();
            return response()->json($alamat);
        } catch (Exception $e) {
            Log::error('Error fetching addresses by user ID: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch addresses'], 500);
        }
    }

    public function setDefault(Request $request, $id_alamat)
    {
        try {
            $userId = $request->user()->id_user;

            DB::beginTransaction();

            Alamat::where('id_user', $userId)->update(['isdefault' => 0]);

            $alamat = Alamat::where('id_alamat', $id_alamat)
                ->where('id_user', $userId)
                ->firstOrFail();
            $alamat->isDefault = 1;
            $alamat->save();

            DB::commit();

            return response()->json([
                'message' => 'Default address set successfully',
                'data' => $alamat
            ], 200);
        } catch (Exception $e) {
            DB::rollBack();

            Log::error('Error setting default address: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to set default address'], 500);
        }
    }
}
