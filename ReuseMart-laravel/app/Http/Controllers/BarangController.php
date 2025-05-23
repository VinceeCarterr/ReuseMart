<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barang;
use Exception;
use Illuminate\Support\Facades\Log;


class BarangController extends Controller
{
    public function index()
    {
        $barangs = Barang::with('foto')->get();
        return response()->json($barangs);
    }

    public function store(Request $request)
    {
        try {
            $barang = Barang::create($request->all());
            return response()->json($barang, 201);
        } catch (Exception $e) {
            Log::error('Error creating barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create barang'], 500);
        }
    }

    public function show($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error fetching barang: ' . $e->getMessage());
            return response()->json(['error' => 'Barang not found'], 404);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->update($request->all());
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error updating barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update barang'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->delete();
            return response()->json(['message' => 'Barang deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete barang'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $barang = Barang::where('name', 'LIKE', "%$query%")->get();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error searching barang: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search barang'], 500);
        }
    }

    public function updateStatusBarang($id)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->status = "Donated";
            $barang->save();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error updating barang status: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update barang status'], 500);
        }
    }

    public function updateRatingBarang($id, Request $request)
    {
        try {
            $barang = Barang::findOrFail($id);
            $barang->rating = $request->input('rating');
            $barang->save();
            return response()->json($barang);
        } catch (Exception $e) {
            Log::error('Error updating barang rating: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update barang rating'], 500);
        }
    }

    public function getUserRatings()
    {
        try {
            $ratings = Barang::with(['penitipan.user' => function ($query) {
                $query->select('id_user', 'rating');
            }])
            ->whereIn('status', ['Available'])
            ->whereIn('status_periode', ['Periode 1', 'Periode 2'])
            ->get()
            ->map(function ($barang) {
                return [
                    'id_barang' => $barang->id_barang,
                    'rating' => $barang->penitipan && $barang->penitipan->user ? $barang->penitipan->user->rating : null
                ];
            });

            return response()->json($ratings);
        } catch (Exception $e) {
            Log::error('Error fetching user ratings: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch user ratings'], 500);
        }
    }

    public function akanAmbilAll()
    {
        $items = Barang::with([
                'foto', 
                'kategori', 
                'Penitipan.user'  // eager-load the user who titip
            ])
            ->where('status', 'Akan Ambil')
            ->get();

        // if you want to follow your other APIs returning { data: [...] }
        return response()->json(['data' => $items]);
    }

    public function markAsTaken(Request $request, $id)
    {
        $barang = Barang::findOrFail($id);

        try {
            $barang->update([
                'status'        => 'Sudah Ambil',
                'tanggal_titip' => '1111-11-11 11:11:11',
            ]);
        } catch (\Exception $e) {
            \Log::error("markAsTaken failed for barang #{$id}: ".$e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal memperbarui status.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'data'    => $barang,
        ]);
    }

    public function patchStatusBarang(Request $req, $id)
    {
        $b = Barang::findOrFail($id);
        $b->status = $req->input('status');
        $b->save();
        return response()->json($b, 200);
    }
}
