<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Jabatan;
use Exception;
use Illuminate\Support\Facades\Log;

class JabatanController extends Controller
{
    public function index()
    {
        try {
            $jabatans = Jabatan::all();
            return response()->json($jabatans);
        } catch (Exception $e) {
            Log::error('Error fetching jabatans: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch jabatans'], 500);
        }
    }

    public function show($id)
    {
        try {
            $jabatan = Jabatan::findOrFail($id);
            return response()->json($jabatan);
        } catch (Exception $e) {
            Log::error('Error fetching jabatan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Jabatan not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $jabatan = Jabatan::create($request->all());
            return response()->json($jabatan, 201);
        } catch (Exception $e) {
            Log::error('Error creating jabatan: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create jabatan'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $jabatan = Jabatan::findOrFail($id);
            $jabatan->update($request->all());
            return response()->json($jabatan);
        } catch (Exception $e) {
            Log::error('Error updating jabatan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update jabatan'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $jabatan = Jabatan::findOrFail($id);
            $jabatan->delete();
            return response()->json(['message' => 'Jabatan deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting jabatan with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete jabatan'], 500);
        }
    }
}
