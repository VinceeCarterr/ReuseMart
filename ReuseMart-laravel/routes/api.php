<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\AlamatController;
use App\Http\Controllers\Req_DonasiController;
use App\Http\Controllers\ForumController;
use App\Http\Controllers\DonasiController;
use App\Http\Controllers\Foto_BarangController;
use App\Http\Controllers\PenitipanController;
use App\Http\Controllers\PengirimanController;
use App\Http\Controllers\PengambilanController;
use App\Http\Controllers\KomisiController;
use App\Http\Controllers\DTController;
use App\Http\Controllers\PembayaranController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\FcmTokenController;
use App\Http\Controllers\KeranjangController;
use App\Http\Controllers\MerchController;
use App\Http\Controllers\RedeemController;
use Illuminate\Http\Request;

//public no auth
Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);
Route::post('/forgot-password', [UserController::class, 'forgotPassword']);
Route::post('/reset-password', [UserController::class, 'resetPassword']);
Route::get('/user/public', [UserController::class, 'publicList']);

//barang for landingpage
Route::get('/barang', [BarangController::class, 'index']);
Route::get('/barang/{id}', [BarangController::class, 'show']);
Route::get('/barang/{id_barang}/komentar', [ForumController::class, 'getComments']);
Route::get('/foto_barang', [Foto_BarangController::class, 'index']);
Route::get('/foto-barang/{id_barang}', [Foto_BarangController::class, 'getByBarangId']);
Route::get('/user-ratings', [BarangController::class, 'getUserRatings']);
Route::get('/penitipan/public', [PenitipanController::class, 'index']);
Route::post('/updateAllUserRatings', [UserController::class, 'updateAllUserRatings']);
Route::put('/barang/updateExpired', [BarangController::class, 'updateStatusExpired']);
Route::post('/barang/notifPenitip', [BarangController::class, 'sendNotifBarangPenitip']);

Route::get('/transaksi/getOne/{id}', [TransaksiController::class, 'showOne']);

// 2) fetch all detilTransaksi for a given transaksi
Route::get('/detilTransaksi/getByTransaksi/{id}', [DTController::class, 'getByTransaksi']);

// 3) fetch pengiriman record(s) for a given transaksi
Route::get('/pengiriman/getByTransaksi/{id}', [PengirimanController::class, 'getByTransaksi']);

// 4) fetch public list of couriers (pegawai with jabatan = 4)
Route::get('/kurir/public', [PegawaiController::class, 'publicKurir']);

Route::post('/send-notification', [NotificationController::class, 'sendNotification']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('kategori', [KategoriController::class, 'index']);
    Route::patch('transaksi/historyPenitip/{id_barang}', [TransaksiController::class, 'updateHistoryPenitip']);
    Route::post('/register-token', [FcmTokenController::class, 'store']);
    Route::get('/getUserPegawai', [UserController::class, 'getUserPegawai']);



    //authentifikasi | mengelola data pegawai
    Route::middleware('role:admin')->group(function () {
        //admin reset pw pegawai
        Route::put('/pegawai/{id}/reset-password', [PegawaiController::class, 'resetPassword']);


        Route::post('/set-top-seller', [UserController::class, 'setTopSeller']);
        //kelola data pegawai
        Route::get('/pegawai/admin', [PegawaiController::class, 'showAllPegawai']);
        Route::get('/pegawai/{id}', [PegawaiController::class, 'show']);
        Route::post('/pegawai/register', [PegawaiController::class, 'register']);
        Route::put('/pegawai/{id}', [PegawaiController::class, 'update']);
        Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy']);

        //kelola data organisasi
        Route::get('/organisasi', [UserController::class, 'index']);
        Route::put('organisasi/{id}', [UserController::class, 'updateOrganisasi']);
        Route::delete('/organisasi/{id}', [UserController::class, 'deleteOrganisasi']);
    });


    //getProfile user
    Route::middleware('role:penitip,pembeli,organisasi')->group(function () {
        Route::get('/user', [UserController::class, 'me']);
    });

    Route::middleware('role:kurir,hunter')->group(function () {
        Route::get('/pegawai-kurir/{id}', [PegawaiController::class, 'index']);
    });


    //halaman profile
    Route::middleware('role:pembeli')->group(function () {
        Route::get('transaksi/history', [TransaksiController::class, 'historyByUserId']);
        Route::post('user/avatar', [UserController::class, 'updateAvatar']);
        Route::post('/cart/add', [KeranjangController::class, 'addToCart']);
        Route::get('/cart', [KeranjangController::class, 'getCart']);
        Route::delete('cart/remove', [KeranjangController::class, 'removeFromCart']);
        Route::put('barang/{id_barang}/updateRating', [BarangController::class, 'updateRatingBarang']);
        Route::post('/checkout', [KeranjangController::class, 'checkout']);
        Route::post('/upload-proof', [KeranjangController::class, 'uploadProof']);
        Route::get('/merch', [MerchController::class,'index']);
        Route::get('/user/points', fn(Request $r) => response()->json(['poin_loyalitas'=>$r->user()->poin_loyalitas]));
        Route::post('/redeem', [RedeemController::class,'store']);
    });

    Route::middleware('role:penitip')->group(function () {
        Route::get('transaksi/historyPenitip', [TransaksiController::class, 'historyPenitip']);
    });


    //kelola alamat
    Route::middleware('role:pembeli,organisasi')->group(function () {
        Route::get('/alamat', [AlamatController::class, 'getAlamatByUserId']);
        Route::put('/alamat/{id}/set-default', [AlamatController::class, 'setDefault']);
        Route::post('/alamat/create', [AlamatController::class, 'store']);
        Route::put('/alamat/{id}', [AlamatController::class, 'update']);
        Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);
    });


    Route::middleware('role:cs')->group(function () {
        Route::get('/penitip', [UserController::class, 'penitip']);
        Route::put('/penitip/{id}', [UserController::class, 'updatePenitip']);
        Route::delete('/penitip/{id}', [UserController::class, 'destroyPenitip']);
        Route::post('/user/check-nik', [UserController::class, 'checkNIK']);
        Route::get('/pembayaran', [PembayaranController::class, 'index']);
        Route::get('/pembayaran/{id}', [PembayaranController::class, 'show']);
        Route::post('/pembayaran/verify/{id}', [PembayaranController::class, 'verify']);

        Route::get('/userCS', [UserController::class, 'publicList']);
        Route::get('/pegawaiCS', [PegawaiController::class, 'showAllPegawai']);
        Route::get('/merchCS', [MerchController::class, 'index']);
        Route::get('/redeemCS', [RedeemController::class, 'index']);
        Route::put('/redeemCS/{id}', [RedeemController::class, 'update']);
    });

    Route::middleware('role:pembeli,cs')->group(function () {
        Route::post('/barang/{id_barang}/komentar', [ForumController::class, 'addComment']);
        Route::put('/barang/{id}/updateStatus', [BarangController::class, 'updateStatusBarang']);
    });


    //mendonasikan barang
    Route::middleware('role:owner')->group(function () {
        Route::get('/donasi', [DonasiController::class, 'index']);
        Route::get('/barangOwner', [BarangController::class, 'index']);
        Route::get('/penitipan/owner', [PenitipanController::class, 'index']);
        Route::get('/pegawaiOwner', [PegawaiController::class, 'showAllPegawai']);
        Route::get('/userOwner', [UserController::class, 'publicList']);
        Route::post('/donasi/tambah', [DonasiController::class, 'store']);
        Route::put('/barang/{id}/updateStatus', [BarangController::class, 'updateStatusBarang']);
        Route::get('/reqDonasi/all', [Req_DonasiController::class, 'index']);
        Route::put('/user/add-point-by-barang/{id_barang}', [UserController::class, 'tambahPoinPenitip']);
        Route::get('/laporan/penjualan-per-kategori', [BarangController::class, 'laporanPenjualanPerKategori']);
        Route::get('/laporan/barang-expired', [BarangController::class, 'laporanBarangExpired']);
        Route::get('/laporan/donasi-barang', [DonasiController::class, 'laporanDonasiBarang']);
    });


    //kelola req donasi
    Route::middleware('role:organisasi')->group(function () {
        Route::get('/reqDonasi', [Req_DonasiController::class, 'userIndex']);
        Route::post('/addReqDonasi', [Req_DonasiController::class, 'store']);
        Route::put('/updateReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'update']);
        Route::delete('/deleteReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'destroy']);
    });

    Route::middleware('role:gudang')->group(function () {
        Route::get('/barang/with-users', [BarangController::class, 'getAllWithUsers']);
        Route::post('/barang/addBarang', [BarangController::class, 'store']);
        Route::get('/barangShow/{id}', [BarangController::class, 'show']);
        Route::get('/kategoriGudang', [KategoriController::class, 'index']);
        Route::get('/fotoGudang', [Foto_BarangController::class, 'index']);
        Route::post('/foto/addFoto', [Foto_BarangController::class, 'store']);
        Route::put('/foto/update/{id}', [Foto_BarangController::class, 'update']);
        Route::get('/fotoBarang/{id}', [Foto_BarangController::class, 'show']);
        Route::put('/foto/updateFoto/{id}', [Foto_BarangController::class, 'updateFoto']);
        Route::delete('/deleteFoto/{id}', [Foto_BarangController::class, 'destroy']);
        Route::put('/barang/{id}', [BarangController::class, 'update']);
        Route::get('/barangGudang', [BarangController::class, 'index']);
        Route::get('/alamat/gudang', [AlamatController::class, 'index']);
        Route::post('/forum/addForum', [ForumController::class, 'store']);
        Route::post('/penitipan/addPenitipan', [PenitipanController::class, 'store']);
        Route::get('/pegawaiGudang', [PegawaiController::class, 'index']);
        Route::get('/penitipan', [PenitipanController::class, 'index']);
        Route::put('/penitipan/{id}', [PenitipanController::class, 'update']);
        Route::get('/penitipan/getOne/{id}', [PenitipanController::class, 'getPenitipan']);
        Route::get('/user/gudang', [UserController::class, 'gudangList']);
        Route::get('akan-ambil', [BarangController::class, 'akanAmbilAll']);
        Route::patch('/barang/{id}/ambil', [BarangController::class, 'markAsTaken']);
        Route::get('/transaksi/penjadwalan', [TransaksiController::class, 'penjadwalan']);
        Route::post('/pengiriman', [PengirimanController::class, 'store']);
        Route::post('/pengambilan', [PengambilanController::class, 'store']);
        Route::patch('updateStatusPengambilan/{id}', [PengambilanController::class, 'updateStatusPengambilan']);
        Route::patch('pengiriman/{id}', [PengirimanController::class, 'update']);
        Route::patch('/barang/{id}', [BarangController::class, 'patchStatusBarang']);
        Route::post('/komisi', [KomisiController::class, 'store']);
        Route::get('/komisi', [KomisiController::class, 'index']);
        Route::patch('user/{id}', [UserController::class, 'update']);
        Route::delete('/deleteBarang/{id}', [BarangController::class, 'destroy']);
        Route::patch('/updateKomisiPegawai/{pegawai}', [PegawaiController::class, 'updateKomisi']);
        Route::get('/pegawai/{id}', [PegawaiController::class, 'showHunter']);
    });

    Route::middleware('role:admin,gudang')->group(function () {
        Route::get('/pegawai', [PegawaiController::class, 'index']);
    });

    Route::middleware('role:hunter')->group(function () {
        Route::get('/komisi/hunter/{id}', [KomisiController::class, 'byHunter']);
        Route::get('/hunter/{id}/transactions', [KomisiController::class, 'transactionsByHunter']);
    });
});
