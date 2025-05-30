<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Donasi;
use App\Models\Barang;
use App\Models\Penitipan;
use App\Models\User;
use App\Models\Req_Donasi;
use Exception;


use Illuminate\Support\Facades\Log;

class DonasiController extends Controller
{
    protected $notificationController;

    public function __construct(NotificationController $notificationController)
    {
        $this->notificationController = $notificationController;
    }

    public function index()
    {
        try {
            $donasi = Donasi::all();
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error fetching donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch donasi'], 500);
        }
    }

    public function show($id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error fetching donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Donasi not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            // Validate request data
            $validated = $request->validate([
                'id_reqdonasi' => 'required|exists:req_donasi,id_reqdonasi',
                'id_barang' => 'required|exists:barang,id_barang',
                'nama_penerima' => 'required|string|max:255',
                'tanggal_donasi' => 'required|date',
            ]);

            // Create donasi record
            $donasi = Donasi::create($validated);

            // Fetch barang
            $barang = Barang::findOrFail($validated['id_barang']);
            if (!$barang->id_penitipan) {
                throw new Exception('Barang tidak terkait dengan penitipan.');
            }

            // Fetch penitipan
            $penitipan = Penitipan::findOrFail($barang->id_penitipan);
            if (!$penitipan->id_user) {
                throw new Exception('Penitipan tidak terkait dengan user.');
            }

            // Fetch donor user (from penitipan)
            $donorUser = User::findOrFail($penitipan->id_user);

            // Fetch req_donasi
            $reqDonasi = Req_Donasi::findOrFail($validated['id_reqdonasi']);
            if (!$reqDonasi->id_user) {
                throw new Exception('Request donasi tidak terkait dengan user.');
            }

            // Fetch organization user (from req_donasi)
            $orgUser = User::findOrFail($reqDonasi->id_user);
            $orgName = trim("{$orgUser->first_name} {$orgUser->last_name}");
            
            // Send notification to donor
            if ($donorUser->id_user) {
                $this->notificationController->sendNotification(
                    new Request([
                        'user_id' => $donorUser->id_user,
                        'title' => 'Donasi Berhasil',
                        'body' => "Barang {$barang->nama_barang} telah didonasikan kepada {$validated['nama_penerima']} melalui organisasi {$orgName} pada tanggal {$validated['tanggal_donasi']}."
                    ])
                );
            } else {
                Log::warning('Donor User ID ' . $donorUser->id_user . ' does not have a device token.');
            }

            // Send notification to organization
            if ($orgUser->id_user) {
                $this->notificationController->sendNotification(
                    new Request([
                        'user_id' => $orgUser->id_user,
                        'title' => 'Donasi Diterima',
                        'body' => "Organisasi Anda menerima donasi barang {$barang->nama_barang} untuk {$validated['nama_penerima']} pada tanggal {$validated['tanggal_donasi']}."
                    ])
                );
            } else {
                Log::warning('Organization User ID ' . $orgUser->id_user . ' does not have a device token.');
            }

            return response()->json($donasi, 201);
        } catch (Exception $e) {
            Log::error('Error creating donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create donasi: ' . $e->getMessage()], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            $donasi->update($request->all());
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error updating donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update donasi'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $donasi = Donasi::findOrFail($id);
            $donasi->delete();
            return response()->json(['message' => 'Donasi deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting donasi with ID ' . $id . ': ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete donasi'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $donasi = Donasi::where('name', 'LIKE', "%{$query}%")->get();
            return response()->json($donasi);
        } catch (Exception $e) {
            Log::error('Error searching donasi: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search donasi'], 500);
        }
    }
}
