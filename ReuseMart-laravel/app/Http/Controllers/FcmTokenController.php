<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FcmToken;

class FcmTokenController extends Controller
{
    public function store(Request $req)
    {
        $req->validate(['device_token'=>'required|string']);

        $userId = $req->user()->id_user;
        $token  = $req->device_token;

        // This will create OR update the row so it always points to the current user
        \App\Models\FcmToken::updateOrCreate(
          ['token'   => $token],
          ['id_user' => $userId]
        );

        return response()->json(['message'=>'Token registered']);
    }
}
