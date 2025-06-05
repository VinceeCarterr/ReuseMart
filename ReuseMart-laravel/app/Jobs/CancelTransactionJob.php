<?php

namespace App\Jobs;

use App\Models\Transaksi;
use App\Models\Pembayaran;
use App\Models\DetilTransaksi;
use App\Models\Barang;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CancelTransactionJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $transaksiId;
    protected $pointsRedeemed;
    protected $userId;

    public function __construct($transaksiId, $pointsRedeemed, $userId)
    {
        $this->transaksiId = $transaksiId;
        $this->pointsRedeemed = $pointsRedeemed;
        $this->userId = $userId;
    }

    public function handle()
    {
        try {
            Log::info("Starting CancelTransactionJob", [
                'transaksi_id' => $this->transaksiId,
                'user_id' => $this->userId,
                'points_redeemed' => $this->pointsRedeemed,
                'timestamp' => now()->toDateTimeString(),
            ]);

            DB::transaction(function () {
                $transaksi = Transaksi::find($this->transaksiId);
                if (!$transaksi) {
                    Log::warning("Transaksi tidak ditemukan untuk ID: {$this->transaksiId}");
                    $this->handleOrphanedData();
                    return;
                }

                $pembayaran = Pembayaran::find($transaksi->id_pembayaran);
                if (!$pembayaran) {
                    Log::warning("Pembayaran tidak ditemukan untuk transaksi_id: {$this->transaksiId}");
                    $this->cancelTransaction($transaksi, null);
                    return;
                }

                // Only cancel if payment is still Pending
                if ($pembayaran->status_pembayaran !== 'Pending') {
                    Log::info("Pembayaran sudah diproses: {$pembayaran->status_pembayaran}. Membatalkan job.");
                    return;
                }

                $this->cancelTransaction($transaksi, $pembayaran);
            });
        } catch (\Exception $e) {
            Log::error("Gagal membatalkan transaksi: " . $e->getMessage(), [
                'transaksi_id' => $this->transaksiId,
                'user_id' => $this->userId,
                'trace' => $e->getTraceAsString(),
            ]);
        }
    }

    private function cancelTransaction($transaksi, $pembayaran)
    {
        // Update transaction and payment status
        $transaksi->update([
            'status_transaksi' => 'Batal',
        ]);
        Log::info("Updated transaksi status to Batal", [
            'transaksi_id' => $transaksi->id_transaksi,
        ]);

        if ($pembayaran) {
            $pembayaran->update([
                'status_pembayaran' => 'Tidak Valid',
            ]);
            Log::info("Updated pembayaran status to Tidak Valid", [
                'pembayaran_id' => $pembayaran->id_pembayaran,
            ]);
        }

        // Restore item status to Available
        $detilTransaksis = DetilTransaksi::where('id_transaksi', $this->transaksiId)->get();
        if ($detilTransaksis->isEmpty()) {
            Log::warning("Tidak ada detail transaksi untuk transaksi_id: {$this->transaksiId}");
        } else {
            foreach ($detilTransaksis as $detil) {
                $barang = Barang::find($detil->id_barang);
                if ($barang && $barang->status === 'On Hold') {
                    Log::info("Mengubah status barang ID: {$barang->id_barang} ke Available");
                    $barang->status = 'Available';
                    $barang->save();
                }
            }
        }

        // Refund redeemed points
        if ($this->pointsRedeemed > 0) {
            $user = User::find($this->userId);
            if ($user) {
                Log::info("Mengembalikan {$this->pointsRedeemed} poin ke user ID: {$this->userId}");
                $user->poin_loyalitas += $this->pointsRedeemed;
                $user->save();
            } else {
                Log::warning("User tidak ditemukan untuk ID: {$this->userId}");
            }
        }

        Log::info("Transaksi ID: {$this->transaksiId} dibatalkan. Status updated to Batal, pembayaran Tidak Valid");
    }

    private function handleOrphanedData()
    {
        $detilTransaksis = DetilTransaksi::where('id_transaksi', $this->transaksiId)->get();
        if ($detilTransaksis->isNotEmpty()) {
            foreach ($detilTransaksis as $detil) {
                $barang = Barang::find($detil->id_barang);
                if ($barang && $barang->status === 'On Hold') {
                    Log::info("Mengubah status barang ID: {$barang->id_barang} ke Available");
                    $barang->status = 'Available';
                    $barang->save();
                }
            }
        }

        if ($this->pointsRedeemed > 0) {
            $user = User::find($this->userId);
            if ($user) {
                Log::info("Mengembalikan {$this->pointsRedeemed} poin ke user ID: {$this->userId}");
                $user->poin_loyalitas += $this->pointsRedeemed;
                $user->save();
            }
        }

        Log::info("Handled orphaned data for transaksi_id: {$this->transaksiId}");
    }
}
