<?php

use App\Http\Controllers\UserController;
use App\Http\Controllers\PegawaiController;
use Illuminate\Http\Request;

Route::post('/register', [UserController::class, 'register']);
Route::post('/login', [UserController::class, 'unifiedLogin']);

Route::middleware('auth:sanctum')->group(function () {

    Route::post('/logout', [UserController::class, 'logout']);

    Route::middleware('role:Admin')->post('/pegawai/register', [PegawaiController::class, 'register']);
});