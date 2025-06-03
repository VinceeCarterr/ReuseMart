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

        // Laravel’s built‐in user() will return whichever guard is authenticated:
        // It could be an instance of App\Models\User or App\Models\Pegawai.
        $actor = $req->user(); 
        if (! $actor) {
            abort(403, 'Unauthenticated');
        }

        // Grab the primary key and class name automatically:
        $ownerId   = $actor->getKey();
        $ownerType = get_class($actor);
        
        // updateOrCreate will either find an existing row by token, or create a new one.
        // On update, it will set both owner_id + owner_type so that any previous owner 
        // is overwritten by the current actor.
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
