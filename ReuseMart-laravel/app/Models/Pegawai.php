<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class Pegawai extends Authenticatable
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $table = 'pegawai';
    protected $primaryKey = 'id_pegawai';
    public $timestamps = false;

    protected $fillable = [
        'id_jabatan',
        'first_name',
        'last_name',
        'email',
        'password',
        'no_telp',
        'tanggal_lahir',
        'komisi',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'id_jabatan', 'id_jabatan');
    }

    public function pengiriman()
    {
        return $this->hasMany(Pengiriman::class, 'id_pegawai');
    }

    public function komentar()
    {
        return $this->hasMany(Komentar::class, 'id_pegawai');
    }

    public function redeem()
    {
        return $this->hasMany(Redeem::class, 'id_pegawai');
    }

    public function fcmTokens()
    {
        return $this->morphMany(FcmToken::class, 'owner');
    }
}
