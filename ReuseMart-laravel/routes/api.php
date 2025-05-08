<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\TransaksiController;
use App\Http\Controllers\KategoriController;
use App\Http\Controllers\AlamatController;
use Illuminate\Http\Request;

Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);

//pegawai


Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);

    Route::get('transaksi/history', [TransaksiController::class, 'historyByUserId']);
    Route::get('kategori', [KategoriController::class, 'index']);

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
