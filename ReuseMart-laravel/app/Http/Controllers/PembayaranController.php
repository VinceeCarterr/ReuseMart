<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Transaksi;
use App\Models\Detiltransaksi;
use App\Models\Barang;
use App\Models\FcmToken;
use App\Models\User;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Facades\DB;

class PembayaranController extends Controller
{
    protected $messaging;

    public function __construct()
    {
        $this->messaging = (new Factory)
            ->withServiceAccount(storage_path('app/firebase_credentials.json'))
            ->createMessaging();
    }

    public function index()
    {
        try {
            $pembayarans = Pembayaran::with(['transaksi.user', 'transaksi.detiltransaksi.barang'])
                ->where('status_pembayaran', 'Menunggu Verifikasi')
                ->get();
            return response()->json($pembayarans);
        } catch (Exception $e) {
            Log::error('Error fetching pending payments: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pending payments'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pembayaran = Pembayaran::with(['transaksi.user', 'transaksi.detiltransaksi.barang'])
                ->findOrFail($id);
            return response()->json($pembayaran);
        } catch (Exception $e) {
            Log::error('Error fetching payment: ' . $e->getMessage());
            return response()->json(['error' => 'Payment not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $pembayaran = Pembayaran::create($request->all());
            return response()->json($pembayaran, 201);
        } catch (Exception $e) {
            Log::error('Error creating payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create payment'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $pembayaran = Pembayaran::findOrFail($id);
            $pembayaran->update($request->all());
            return response()->json($pembayaran);
        } catch (Exception $e) {
            Log::error('Error updating payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update payment'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pembayaran = Pembayaran::findOrFail($id);
            $pembayaran->delete();
            return response()->json(['message' => 'Payment deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete payment'], 500);
        }
    }

    public function verify(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:Berhasil,Tidak Valid',
        ]);

        try {
            return DB::transaction(function () use ($request, $id) {
                $pembayaran = Pembayaran::findOrFail($id);

                if ($pembayaran->status_pembayaran !== 'Menunggu Verifikasi') {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'Pembayaran tidak dalam status menunggu verifikasi.',
                    ], 400);
                }

                $transaksi = Transaksi::where('id_pembayaran', $pembayaran->id_pembayaran)->firstOrFail();
                $detilTransaksis = DetilTransaksi::where('id_transaksi', $transaksi->id_transaksi)->get();
                $user = User::findOrFail($transaksi->id_user);

                $pembayaran->update([
                    'status_pembayaran' => $request->status,
                    'verified_at' => now(),
                ]);

                $transaksi->update([
                    'status_transaksi' => $request->status === 'Berhasil' ? 'Disiapkan' : 'Gagal',
                ]);

                if ($request->status === 'Tidak Valid') {
                    // Refund points
                    $pointsRedeemed = floor($transaksi->diskon / 100);
                    if ($pointsRedeemed > 0) {
                        $user->poin_loyalitas += $pointsRedeemed;
                        $user->save();
                        Log::info("Refunded {$pointsRedeemed} points to user ID {$user->id_user} for transaction ID {$transaksi->id_transaksi}");
                    }
                }

                foreach ($detilTransaksis as $detil) {
                    $barang = Barang::findOrFail($detil->id_barang);
                    $barang->update([
                        'status' => $request->status === 'Berhasil' ? 'Sold' : 'Available',
                    ]);

                    if ($request->status === 'Berhasil') {
                        $penitipId = $barang->penitipan->id_user;
                        $tokens = FcmToken::where('id_user', $penitipId)
                            ->pluck('token')
                            ->toArray();

                        if (!empty($tokens)) {
                            $title = "Selamat! Barang Anda Laku!";
                            $body = "Barang \"{$barang->nama_barang}\" telah terjual. Cek saldo Anda segera!";

                            $message = CloudMessage::new()
                                ->withNotification(FcmNotification::create($title, $body));

                            try {
                                $report = $this->messaging->sendMulticast($message, $tokens);
                                Log::info("Notification sent to penitip ID {$penitipId} for barang {$barang->nama_barang}", [
                                    'success_count' => $report->successes()->count(),
                                    'failure_count' => $report->failures()->count(),
                                ]);
                            } catch (Exception $e) {
                                Log::warning("Failed to send notification to penitip ID {$penitipId}: " . $e->getMessage());
                            }
                        }
                    }
                }

                return response()->json([
                    'status' => 'success',
                    'message' => "Pembayaran ditandai sebagai {$request->status}.",
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'status_pembayaran' => $pembayaran->status_pembayaran,
                    'status_transaksi' => $transaksi->status_transaksi,
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('Error verifying payment: ' . $e->getMessage(), [
                'pembayaran_id' => $id,
                'status' => $request->status,
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'status' => 'error',
                'message' => 'Gagal memverifikasi pembayaran.',
            ], 500);
        }
    }
}
