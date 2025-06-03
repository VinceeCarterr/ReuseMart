<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pembayaran;
use App\Models\Transaksi;
use App\Models\Detiltransaksi;
use App\Models\Barang;
use App\Models\FcmToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
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
                    return response()->json(['error' => 'Payment is not in pending verification status'], 400);
                }

                $transaksi = Transaksi::where('id_pembayaran', $pembayaran->id_pembayaran)->firstOrFail();
                $detilTransaksis = Detiltransaksi::where('id_transaksi', $transaksi->id_transaksi)->get();

                $pembayaran->update([
                    'status_pembayaran' => $request->status,
                    'verified_at' => now(),
                ]);

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
                    'message' => "Payment marked as {$request->status}",
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'status_pembayaran' => $pembayaran->status_pembayaran,
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('Error verifying payment: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to verify payment'], 500);
        }
    }

    public function uploadProof(Request $request)
    {
        $request->validate([
            'transaksi_id' => 'required|exists:transaksi,id_transaksi',
            'pembayaran_id' => 'required|exists:pembayaran,id_pembayaran',
            'proof' => 'required|image|mimes:jpeg,png,jpg|max:20480',
        ]);

        try {
            return DB::transaction(function () use ($request) {
                $transaksi = Transaksi::findOrFail($request->transaksi_id);
                $pembayaran = Pembayaran::findOrFail($request->pembayaran_id);

                if ($transaksi->id_pembayaran !== $pembayaran->id_pembayaran) {
                    return response()->json(['error' => 'Transaksi dan pembayaran tidak sesuai'], 400);
                }

                $createdAt = $transaksi->created_at;
                if (now()->diffInSeconds($createdAt) > 10) {
                    return response()->json(['error' => 'Waktu untuk mengunggah bukti pembayaran telah habis'], 400);
                }

                $file = $request->file('proof');
                $filename = Str::random(10) . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($filename);

                $pembayaran->update([
                    'ss_pembayaran' => $filename,
                    'status_pembayaran' => 'Menunggu Verifikasi',
                ]);

                return response()->json([
                    'message' => 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi.',
                    'pembayaran_id' => $pembayaran->id_pembayaran,
                    'proof_path' => $filename,
                ], 200);
            });
        } catch (Exception $e) {
            Log::error('Gagal mengunggah bukti pembayaran: ' . $e->getMessage());
            return response()->json(['error' => 'Gagal mengunggah bukti pembayaran'], 500);
        }
    }
}
