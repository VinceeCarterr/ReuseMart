<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FcmToken extends Model
{
    protected $fillable = ['id_user', 'token'];

    public function user()
    {
       return $this->belongsTo(User::class, 'id_user', 'id_user');
    }
}
