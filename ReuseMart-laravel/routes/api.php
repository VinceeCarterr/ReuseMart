<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\AlamatController;
use App\Http\Controllers\Req_DonasiController;

use Illuminate\Http\Request;

Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);




Route::get('/barang', [BarangController::class, 'index']);
Route::get('/barang/{id}', [BarangController::class, 'show']);
//pegawai


Route::middleware('auth:sanctum')->group(function () {

    Route::post('user/avatar', [UserController::class, 'updateAvatar']);
    Route::post('/logout', [UserController::class, 'logout']);
    Route::get('/user', [UserController::class, 'me']);
    Route::get('/organisasi', [UserController::class, 'index']);
    Route::delete('/organisasi/{id}', [UserController::class, 'deleteOrganisasi']);
    Route::put('organisasi/{id}', [UserController::class, 'updateOrganisasi']);
    Route::get('penitip', [UserController::class, 'penitip']);
    Route::put('penitip/{id}', [UserController::class, 'updatePenitip']);
    Route::delete('penitip/{id}', [UserController::class, 'destroyPenitip']);
    Route::post('/user/check-nik', [UserController::class, 'checkNIK']);

    Route::get('transaksi/history', [TransaksiController::class, 'historyByUserId']);
    Route::get('transaksi/historyPenitip', [TransaksiController::class, 'historyPenitip']);
    Route::get('kategori', [KategoriController::class, 'index']);

    //alamat
    Route::get('/alamat', [AlamatController::class, 'getAlamatByUserId']);
    Route::post('/alamat/create', [AlamatController::class, 'store']);
    Route::put('/alamat/{id}', [AlamatController::class, 'update']);
    Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);

    //Req_Donasi
    Route::get('/reqDonasi', [Req_DonasiController::class, 'userIndex']);
    Route::post('/addReqDonasi', [Req_DonasiController::class, 'store']);
    Route::put('/updateReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'update']);
    Route::delete('/deleteReqDonasi/{reqDonasi}', [Req_DonasiController::class, 'destroy']);
});
