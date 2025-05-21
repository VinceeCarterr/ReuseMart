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

Route::post('/updateAllUserRatings', [UserController::class, 'updateAllUserRatings']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('kategori', [KategoriController::class, 'index']);
    Route::get('/penitipan', [PenitipanController::class, 'index']);

    

    //authentifikasi | mengelola data pegawai
    Route::middleware('role:admin')->group(function () {
        //admin reset pw pegawai
        Route::put('/pegawai/{id}/reset-password', [PegawaiController::class, 'resetPassword']);

        //kelola data pegawai
        Route::get('/pegawai', [PegawaiController::class, 'index']);
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


    //halaman profile
    Route::middleware('role:pembeli')->group(function () {
        Route::get('transaksi/history', [TransaksiController::class, 'historyByUserId']);
        Route::post('user/avatar', [UserController::class, 'updateAvatar']);
        Route::post('/cart/add', [TransaksiController::class, 'addToCart']);
        Route::get('/cart', [TransaksiController::class, 'getCart']);
        Route::delete('cart/remove', [TransaksiController::class, 'removeFromCart']);
        Route::put('barang/{id_barang}/updateRating', [BarangController::class, 'updateRatingBarang']);
    });

    Route::middleware('role:penitip')->group(function () {
        Route::get('transaksi/historyPenitip', [TransaksiController::class, 'historyPenitip']);
        Route::patch('transaksi/historyPenitip/{id_barang}',[TransaksiController::class, 'updateHistoryPenitip']);
    });


    //kelola alamat
    Route::middleware('role:pembeli,organisasi')->group(function () {
        Route::get('/alamat', [AlamatController::class, 'getAlamatByUserId']);
        Route::put('/alamat/{id}/set-default', [AlamatController::class, 'setDefault']);
        Route::post('/alamat/create', [AlamatController::class, 'store']);
        Route::put('/alamat/{id}', [AlamatController::class, 'update']);
        Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);
    });


    //mengelola data penitip
    Route::middleware('role:cs')->group(function () {
        Route::get('/penitip', [UserController::class, 'penitip']);
        Route::put('/penitip/{id}', [UserController::class, 'updatePenitip']);
        Route::delete('/penitip/{id}', [UserController::class, 'destroyPenitip']);
        Route::post('/user/check-nik', [UserController::class, 'checkNIK']);
    });

    Route::middleware('role:pembeli,cs')->group(function () {
        Route::post('/barang/{id_barang}/komentar', [ForumController::class, 'addComment']);
        Route::put('/barang/{id}/updateStatus', [BarangController::class, 'updateStatusBarang']);
    });


    //mendonasikan barang
    Route::middleware('role:owner')->group(function () {
        Route::get('/donasi', [DonasiController::class, 'index']);
        Route::post('/donasi/tambah', [DonasiController::class, 'store']);
        Route::put('/barang/{id}/updateStatus', [BarangController::class, 'updateStatusBarang']);
        Route::get('/reqDonasi/all', [Req_DonasiController::class, 'index']);
        Route::put('/user/add-point-by-barang/{id_barang}', [UserController::class, 'tambahPoinPenitip']);
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
        Route::get('/penitipan', [PenitipanController::class, 'index']);
        Route::get('/pegawai', [PegawaiController::class, 'index']);
        Route::get('/pegawai', [PegawaiController::class, 'index']);
        Route::get('/user/gudang', [UserController::class, 'gudangList']);
    });

});
