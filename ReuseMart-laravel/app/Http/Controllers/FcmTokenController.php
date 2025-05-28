<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FcmToken;

class FcmTokenController extends Controller
{
    public function store(Request $req)
    {
        $req->validate([
          'device_token' => 'required|string',
        ]);

        $user = $req->user();
        FcmToken::firstOrCreate(
          ['token'   => $req->device_token],
          ['id_user' => $user->id_user]
        );

        return response()->json(['message' => 'Token registered']);
    }
}
