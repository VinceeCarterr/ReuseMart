<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Barang;
use Exception;
use Illuminate\Support\Facades\Log;
use App\Models\Penitipan;
use App\Models\User;
use App\Models\FcmToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;
use Carbon\Carbon;



class BarangController extends Controller
{

    protected $notificationController;

    public function __construct(NotificationController $notificationController)
    {
        $this->notificationController = $notificationController;
    }

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
        $barang = Barang::with('foto')->findOrFail($id);
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
            $ratings = Barang::with(['penitipan' => function ($query) {
                $query->with(['user' => function ($userQuery) {
                    $userQuery->select('id_user', 'rating');
                }]);
            }])
            ->whereIn('status', ['Available'])
            ->whereIn('status_periode', ['Periode 1', 'Periode 2'])
            ->get()
            ->map(function ($barang) {
                return [
                    'id_penitipan' => $barang->id_penitipan,
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
                'Penitipan.user' 
            ])
            ->where('status', 'Akan Ambil')
            ->get();


        return response()->json(['data' => $items]);
    }

    public function markAsTaken(Request $request, $id)
    {
        $barang = Barang::findOrFail($id);

        try {
            $barang->update([
                'status'        => 'Sudah Ambil',
                'tanggal_titip' => now(),
            ]);
        } catch (\Exception $e) {
            Log::error("markAsTaken failed for barang #{$id}: " . $e->getMessage());
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

    public function updateStatusExpired()
    {
        $threshold = now()->subDays(30)->startOfDay();

        $updatedCount = Barang::query()
            ->where('status', 'Available')
            ->whereDate('tanggal_titip', '<', $threshold)
            ->where('status_periode', '<>', 'Expired')
            ->update(['status_periode' => 'Expired']);

        return response()->json([
            'message'       => 'Successfully updated expired statuses for Available Barang',
            'updated_count' => $updatedCount,
        ], 200);
    }

public function sendNotifBarangPenitip()
    {
        $today = now()->startOfDay();
        $thirtyDaysAgo = now()->subDays(30)->startOfDay(); // tanggal_titip + 30 days = today
        $twentySevenDaysAgo = now()->subDays(27)->startOfDay(); // tanggal_titip + 27 days = today
        $notificationCount = 0;

        try {
            // Query for items expiring today (tanggal_titip + 30 days = today)
            $expiringTodayItems = Barang::query()
                ->where('status', 'Available')
                ->whereDate('tanggal_titip', '=', $thirtyDaysAgo)
                ->get();

            // Query for items expiring in 3 days (tanggal_titip + 27 days = today)
            $expiringSoonItems = Barang::query()
                ->where('status', 'Available')
                ->whereDate('tanggal_titip', '=', $twentySevenDaysAgo)
                ->get();

            $messaging = (new Factory)
                ->withServiceAccount(storage_path('app/firebase_credentials.json'))
                ->createMessaging();

            // Process items expiring today
            foreach ($expiringTodayItems as $item) {
                try {
                    $penitipan = Penitipan::findOrFail($item->id_penitipan);
                    $penitipId = $penitipan->id_user;

                    $tokens = FcmToken::where('id_user', $penitipId)
                        ->pluck('token')
                        ->toArray();

                    if (!empty($tokens)) {
                        $title = 'Masa Titip Barang Anda Berakhir Hari Ini!';
                        $body = "Masa penitipan untuk “{$item->nama_barang}” berakhir hari ini " . $today->format('d-m-Y') . ".";

                        $message = CloudMessage::new()
                            ->withNotification(FcmNotification::create($title, $body));

                        $report = $messaging->sendMulticast($message, $tokens);
                        $notificationCount++;
                    }
                } catch (Exception $e) {
                    Log::error("Failed to send notification for barang #{$item->id_barang} (expiring today): " . $e->getMessage());
                    continue;
                }
            }

            // Process items expiring in 3 days
            foreach ($expiringSoonItems as $item) {
                try {
                    $penitipan = Penitipan::findOrFail($item->id_penitipan);
                    $penitipId = $penitipan->id_user;

                    $tokens = FcmToken::where('id_user', $penitipId)
                        ->pluck('token')
                        ->toArray();

                    if (!empty($tokens)) {
                        $title = 'Masa Titip Barang Anda Akan Berakhir!';
                        $body = "Masa penitipan “{$item->nama_barang}” akan berakhir dalam 3 hari pada " . now()->addDays(3)->format('d-m-Y') . ".";

                        $message = CloudMessage::new()
                            ->withNotification(FcmNotification::create($title, $body));

                        $report = $messaging->sendMulticast($message, $tokens);
                        $notificationCount++;
                    }
                } catch (Exception $e) {
                    Log::error("Failed to send notification for barang #{$item->id_barang} (expiring in 3 days): " . $e->getMessage());
                    continue;
                }
            }

            return response()->json([
                'message' => 'Successfully sent notifications for items expiring today and items expiring in 3 days',
                'notification_count' => $notificationCount,
            ], 200);
        } catch (Exception $e) {
            Log::error('Error in sendNotifBarangPenitip: ' . $e->getMessage());
            return response()->json([
                'message' => 'Failed to send notifications',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function laporanPenjualanPerKategori(Request $request)
    {
        $tahun = $request->query('tahun');

        $rows = Barang::query()
            ->join('kategori', 'barang.id_kategori', '=', 'kategori.id_kategori')
            ->selectRaw("
                kategori.nama_kategori as kategori,
                SUM(CASE WHEN barang.status = 'sold' THEN 1 ELSE 0 END) as terjual,
                SUM(CASE WHEN barang.status_periode = 'expired' THEN 1 ELSE 0 END) as gagal
            ")
            ->groupBy('kategori.nama_kategori')
            ->orderBy('kategori.nama_kategori')
            ->get();
        return response()->json($rows);
    }

    public function laporanBarangExpired(Request $request)
    {
        $barangExpired = Barang::with(['penitipan.user'])
            ->where('status_periode', 'Expired')
            ->where('status', 'Available')
            ->get();

        $result = $barangExpired->map(function($barang) {
            $tanggalMasuk = $barang->tanggal_titip;
            
            $carbonMasuk = Carbon::parse($tanggalMasuk);
            $tanggalAkhir = $carbonMasuk->copy()->addDays(30)->format('Y-m-d');
            $batasAmbil   = $carbonMasuk->copy()->addDays(30 + 7)->format('Y-m-d');

            $penitipan = $barang->penitipan; 
            $user      = $penitipan ? $penitipan->user : null;

            return [
                'kode_barang'    => $barang->kode_barang,
                'nama_barang'    => $barang->nama_barang,
                'id_penitip'     => $penitipan ? $penitipan->id_user : null,
                'nama_penitip'   => $user 
                    ? trim($user->first_name . ' ' . ($user->last_name ?? '' )) 
                    : null,
                'tanggal_masuk'  => $tanggalMasuk,
                'tanggal_akhir'  => $tanggalAkhir,
                'batas_ambil'    => $batasAmbil,
            ];
        });

        return response()->json($result);
    }
}