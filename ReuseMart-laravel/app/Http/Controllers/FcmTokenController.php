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

        $actor = $req->user(); 

        if ($actor instanceof \App\Models\User) {
          $ownerColumn = 'id_user';
          $ownerId     = $actor->id_user;
        }
        elseif ($actor instanceof \App\Models\Pegawai) {
          $ownerColumn = 'id_pegawai';
          $ownerId     = $actor->id_pegawai;
        }
        else {
          abort(403, 'Unauthenticated');
        }

        \App\Models\FcmToken::updateOrCreate(
          ['token' => $req->device_token],
          [ $ownerColumn => $ownerId ]
        );

        return response()->json(['message' => 'Token registered']);
  }
}
