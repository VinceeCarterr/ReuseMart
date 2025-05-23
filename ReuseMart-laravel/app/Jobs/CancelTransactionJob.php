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
use Illuminate\Support\Facades\Storage;

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
            Log::info("Starting CancelTransactionJob for transaksi_id: {$this->transaksiId}, user_id: {$this->userId}, points_redeemed: {$this->pointsRedeemed}");

            DB::beginTransaction();

            $transaksi = Transaksi::find($this->transaksiId);
            if (!$transaksi) {
                Log::warning("Transaksi tidak ditemukan untuk ID: {$this->transaksiId}. Mungkin sudah dihapus.");
                $this->handleOrphanedData();
                DB::commit();
                return;
            }

            Log::info("Transaksi ditemukan: {$transaksi->id_transaksi}");

            $pembayaran = Pembayaran::find($transaksi->id_pembayaran);
            if (!$pembayaran) {
                Log::warning("Pembayaran tidak ditemukan untuk transaksi_id: {$this->transaksiId}. Melanjutkan penghapusan.");
                $this->cancelTransaction($transaksi, null);
            } else {
                Log::info("Pembayaran ditemukan, status: {$pembayaran->status_pembayaran}");
                if ($pembayaran->status_pembayaran === 'Menunggu' || $pembayaran->status_pembayaran === 'Tidak Valid') {
                    Log::info("Kondisi pembatalan terpenuhi, memproses penghapusan...");
                    $this->cancelTransaction($transaksi, $pembayaran);
                } else {
                    Log::info("Kondisi pembatalan tidak terpenuhi, status pembayaran: {$pembayaran->status_pembayaran}. Transaksi tidak dibatalkan.");
                    DB::commit();
                    return;
                }
            }

            DB::commit();
            Log::info("Transaksi berhasil diproses.");
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("Gagal membatalkan transaksi: " . $e->getMessage());
        }
    }

    private function cancelTransaction($transaksi, $pembayaran)
    {
        $detilTransaksis = DetilTransaksi::where('id_transaksi', $this->transaksiId)->get();
        if ($detilTransaksis->isEmpty()) {
            Log::warning("Tidak ada detail transaksi untuk transaksi_id: {$this->transaksiId}");
        }

        // Kembalikan status barang ke Available hanya jika statusnya "Sold"
        foreach ($detilTransaksis as $detil) {
            $barang = Barang::find($detil->id_barang);
            if ($barang) {
                if ($barang->status === 'Sold') {
                    Log::info("Mengubah status barang ID: {$barang->id_barang} ke Available");
                    $barang->status = 'Available';
                    if (!$barang->save()) {
                        Log::error("Gagal menyimpan perubahan status untuk barang ID: {$barang->id_barang}");
                    }
                } else {
                    Log::info("Status barang ID: {$barang->id_barang} tidak diubah karena bukan Sold: {$barang->status}");
                }
            } else {
                Log::warning("Barang tidak ditemukan untuk detil ID: {$detil->id_barang}");
            }
        }

        if ($this->pointsRedeemed > 0) {
            $user = User::find($this->userId);
            if ($user) {
                Log::info("Mengembalikan {$this->pointsRedeemed} poin ke user ID: {$this->userId}");
                $user->poin_loyalitas += $this->pointsRedeemed;
                if (!$user->save()) {
                    Log::error("Gagal menyimpan poin untuk user ID: {$this->userId}");
                }
            } else {
                Log::warning("User tidak ditemukan untuk ID: {$this->userId}");
            }
        }

        if ($pembayaran && $pembayaran->ss_pembayaran && $pembayaran->ss_pembayaran !== 'pending.jpg') {
            $filePath = 'public/bukti_pembayaran/' . $pembayaran->ss_pembayaran;
            if (Storage::exists($filePath)) {
                Log::info("Menghapus file: {$filePath}");
                Storage::delete($filePath);
            } else {
                Log::warning("File tidak ditemukan: {$filePath}");
            }
        }

        $deletedDetil = DetilTransaksi::where('id_transaksi', $this->transaksiId)->delete();
        Log::info("Menghapus {$deletedDetil} baris dari detil_transaksi");

        if ($pembayaran) {
            if ($pembayaran->delete()) {
                Log::info("Pembayaran ID: {$pembayaran->id_pembayaran} dihapus");
            } else {
                Log::error("Gagal menghapus pembayaran ID: {$pembayaran->id_pembayaran}");
            }
        }

        if ($transaksi->delete()) {
            Log::info("Transaksi ID: {$transaksi->id_transaksi} dihapus");
        } else {
            Log::error("Gagal menghapus transaksi ID: {$transaksi->id_transaksi}");
        }
    }

    private function handleOrphanedData()
    {
        $detilTransaksis = DetilTransaksi::where('id_transaksi', $this->transaksiId)->get();
        if ($detilTransaksis->isNotEmpty()) {
            Log::info("Menemukan detail transaksi yang terlantar, memproses...");
            foreach ($detilTransaksis as $detil) {
                $barang = Barang::find($detil->id_barang);
                if ($barang && $barang->status === 'Sold') {
                    Log::info("Mengubah status barang ID: {$barang->id_barang} ke Available");
                    $barang->status = 'Available';
                    $barang->save();
                }
                $detil->delete();
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
    }
}
