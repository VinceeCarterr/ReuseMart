<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use App\Models\Donasi;
use App\Models\Barang;
use App\Models\Penitipan;
use Exception;
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

    public function laporanDonasiBarang(Request $request)
    {
        $year = $request->query('year', date('Y'));

        $donations = Donasi::select(
            'donasi.id_donasi',
            'donasi.tanggal_donasi',
            'donasi.nama_penerima',
            'barang.kode_barang',
            'barang.nama_barang',
            'penitipan.id_penitipan',
            'penitip.first_name as penitip_first_name',
            'penitip.last_name as penitip_last_name',
            'organisasi.first_name as organisasi_name'
        )
            ->join('barang', 'donasi.id_barang', '=', 'barang.id_barang')
            ->join('penitipan', 'barang.id_penitipan', '=', 'penitipan.id_penitipan')
            ->join('user as penitip', 'penitipan.id_user', '=', 'penitip.id_user')
            ->join('req_donasi', 'donasi.id_reqdonasi', '=', 'req_donasi.id_reqdonasi')
            ->join('user as organisasi', 'req_donasi.id_user', '=', 'organisasi.id_user')
            ->whereYear('donasi.tanggal_donasi', $year)
            ->get();

        $formattedDonations = $donations->map(function ($donation) {
            return [
                'id_donasi' => $donation->id_donasi,
                'tanggal_donasi' => $donation->tanggal_donasi,
                'nama_penerima' => $donation->nama_penerima,
                'barang' => [
                    'kode_barang' => $donation->kode_barang,
                    'nama_barang' => $donation->nama_barang,
                ],
                'penitipan' => [
                    'id_penitip' => $donation->id_penitipan,
                    'user' => [
                        'first_name' => $donation->penitip_first_name,
                        'last_name' => $donation->penitip_last_name,
                    ],
                ],
                'req_donasi' => [
                    'user' => [
                        'first_name' => $donation->organisasi_name,
                    ],
                ],
            ];
        });

        return response()->json($formattedDonations);
    }
}
