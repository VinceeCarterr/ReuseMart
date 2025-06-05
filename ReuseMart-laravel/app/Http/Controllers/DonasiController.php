<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Donasi;
use App\Models\Barang;
use App\Models\Penitipan;
use App\Models\User;
use App\Models\FcmToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;

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
        $data = $request->validate([
                'id_reqdonasi'   => 'required|exists:req_donasi,id_reqdonasi',
                'id_barang'      => 'required|exists:barang,id_barang',
                'nama_penerima'  => 'required|string',
                'tanggal_donasi' => 'required|date',
            ]);

        try {
            $donasi = Donasi::create($data);
            $barang = Barang::findOrFail($data['id_barang']);
            $penitipan = Penitipan::findOrFail($barang->id_penitipan);
            $penitipId = $penitipan->id_user;

            $tokens = FcmToken::where('owner_id', $penitipId)
                    ->pluck('token')
                    ->toArray();

            if (!empty($tokens)) {
                $messaging = (new Factory)
                    ->withServiceAccount(storage_path('app/firebase_credentials.json'))
                    ->createMessaging();

                $title = 'Barang Anda Telah Didonasikan!';
                $body  = "Donasi untuk “{$barang->nama_barang}” telah dibuat. Terima kasih!";

                $message = CloudMessage::new()
                    ->withNotification(FcmNotification::create($title, $body));

                $report = $messaging->sendMulticast($message, $tokens);
            }

            return response()->json($donasi, 201);
        } catch (\Exception $e) {
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
