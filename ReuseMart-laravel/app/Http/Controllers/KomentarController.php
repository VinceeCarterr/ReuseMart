<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Komentar;
use Exception;
use Illuminate\Support\Facades\Log;

class KomentarController extends Controller
{
    public function index()
    {
        try {
            $komentar = Komentar::all();
            return response()->json($komentar);
        } catch (Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch comments'], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $komentar = Komentar::create($request->all());
            return response()->json($komentar, 201);
        } catch (Exception $e) {
            Log::error('Error storing comment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to store comment'], 500);
        }
    }

    public function show($id)
    {
        try {
            $komentar = Komentar::findOrFail($id);
            return response()->json($komentar);
        } catch (Exception $e) {
            Log::error('Error fetching comment: ' . $e->getMessage());
            return response()->json(['error' => 'Comment not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $komentar = Komentar::findOrFail($id);
            $komentar->update($request->all());
            return response()->json($komentar);
        } catch (Exception $e) {
            Log::error('Error updating comment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update comment'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $komentar = Komentar::findOrFail($id);
            $komentar->delete();
            return response()->json(['message' => 'Comment deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting comment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete comment'], 500);
        }
    }
}
