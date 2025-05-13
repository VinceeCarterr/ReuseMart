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

Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);

Route::get('/barang', [BarangController::class, 'index']);
Route::get('/barang/{id}', [BarangController::class, 'show']);
Route::get('/barang/{id_barang}/komentar', [ForumController::class, 'getComments']);

Route::post('/forgot-password', [UserController::class, 'forgotPassword']);
Route::post('/reset-password', [UserController::class, 'resetPassword']);
Route::get('/user/public', [UserController::class, 'publicList']);
    
//fotobarang
Route::get('/foto_barang', [Foto_BarangController::class, 'index']);
Route::get('/foto-barang/{id_barang}', [Foto_BarangController::class, 'getByBarangId']);
Route::get('/user-ratings', [BarangController::class, 'getUserRatings']);


Route::get('/barang', [BarangController::class, 'index']);
Route::get('/barang/{id}', [BarangController::class, 'show']);


Route::middleware('auth:sanctum')->group(function () {

    Route::post('user/avatar', [UserController::class, 'updateAvatar']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user', [UserController::class, 'me']);
    Route::get('/organisasi', [UserController::class, 'index'])->middleware('isPembeli:organisasi');
    Route::delete('/organisasi/{id}', [UserController::class, 'deleteOrganisasi']);
    Route::put('organisasi/{id}', [UserController::class, 'updateOrganisasi']);

    Route::get('penitip', [UserController::class, 'penitip']);
    Route::put('penitip/{id}', [UserController::class, 'updatePenitip']);
    Route::delete('penitip/{id}', [UserController::class, 'destroyPenitip']);
    Route::post('/user/check-nik', [UserController::class, 'checkNIK']);

    Route::put('/user/add-point-by-barang/{id_barang}', [UserController::class, 'tambahPoinPenitip']);


    Route::get('transaksi/history', [TransaksiController::class, 'historyByUserId']);
    Route::get('transaksi/historyPenitip', [TransaksiController::class, 'historyPenitip']);
    Route::get('kategori', [KategoriController::class, 'index']);

    //alamat
    Route::get('/alamat', [AlamatController::class, 'getAlamatByUserId']);
    Route::put('/alamat/{id}/set-default', [AlamatController::class, 'setDefault']);
    Route::post('/alamat/create', [AlamatController::class, 'store']);
    Route::put('/alamat/{id}', [AlamatController::class, 'update']);
    Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);

    //Req_Donasi
    Route::get('/reqDonasi/all', [Req_DonasiController::class, 'index']);
    Route::get('/reqDonasi', [Req_DonasiController::class, 'userIndex']);
    Route::post('/addReqDonasi', [Req_DonasiController::class, 'store']);
    Route::put('/updateReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'update']);
    Route::delete('/deleteReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'destroy']);

    //Forum
    Route::post('/barang/{id_barang}/komentar', [ForumController::class, 'addComment']);
    Route::put('/barang/{id}/updateStatus', [BarangController::class, 'updateStatusBarang']);
    

    //donasi
    Route::get('/donasi', [DonasiController::class, 'index']);
    Route::post('/donasi/tambah', [DonasiController::class, 'store']);


    //penitipan
    Route::get('/penitipan', [PenitipanController::class, 'index']);

    //pegawai
    Route::get('/pegawai', [PegawaiController::class, 'index']);
    Route::get('/pegawai/{id}', [PegawaiController::class, 'show']);
    Route::post('/pegawai/register', [PegawaiController::class, 'register']);
    Route::put('/pegawai/{id}', [PegawaiController::class, 'update']);
    Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy']);
});
