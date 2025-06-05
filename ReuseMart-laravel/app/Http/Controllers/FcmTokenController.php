<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FcmToken;
use App\Models\User;
use App\Models\Pegawai;

class FcmTokenController extends Controller
{   
     public function store(Request $req)
    {
        $req->validate([
          'device_token' => 'required|string',
        ]);

        $actor = $req->user(); 
        if (! $actor) {
            abort(403, 'Unauthenticated');
        }

        $ownerId   = $actor->getKey();
        $ownerType = get_class($actor);
        
        FcmToken::updateOrCreate(
          ['token' => $req->device_token],
          [
            'owner_id'   => $ownerId,
            'owner_type' => $ownerType,
          ]
        );

        return response()->json(['message' => 'Token registered']);
    }
}
