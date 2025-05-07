<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use App\Http\Controllers\TransaksiController;
use Illuminate\Http\Request;

Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);

//pegawai
Route::get('/pegawai', [PegawaiController::class, 'index']);
Route::delete('/pegawai/{id}', [PegawaiController::class, 'destroy']);
Route::post('/pegawai/register', [PegawaiController::class, 'register']);
Route::put('/pegawai/{id}', [PegawaiController::class, 'update']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);

    
    Route::get('transaksi/history', [TransaksiController::class, 'history']);
    Route::get('transaksi/history/{id}', [TransaksiController::class, 'historyByUserId']);

    //Pegawai
    
    

});