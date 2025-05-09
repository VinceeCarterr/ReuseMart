<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\BarangController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\AlamatController;
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
    Route::get('kategori', [KategoriController::class, 'index']);

    //alamat
    Route::get('/alamat', [AlamatController::class, 'getAlamatByUserId']);
    Route::post('/alamat/create', [AlamatController::class, 'store']);
    Route::put('/alamat/{id}', [AlamatController::class, 'update']);
    Route::delete('/alamat/{id}', [AlamatController::class, 'destroy']);

    Route::get('/pegawai', [PegawaiController::class, 'index']);
    Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy']);
    Route::post('/pegawai/register', [PegawaiController::class, 'register']);
    Route::put('/pegawai/{id}', [PegawaiController::class, 'update']);
    Route::put('/pegawai/{id}/reset-password', [PegawaiController::class, 'resetPassword']);
});
