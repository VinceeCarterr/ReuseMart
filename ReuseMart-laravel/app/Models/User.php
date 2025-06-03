<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, HasApiTokens, Notifiable;

    protected $table = 'user';
    protected $primaryKey = 'id_user';
    public $timestamps = false;
    protected $fillable = [
        'id_role',
        'first_name',
        'last_name',
        'email',
        'password',
        'no_telp',
        'profile_picture',
        'poin_loyalitas',
        'NIK',
        'rating',
        'saldo',
    ];

    protected $hidden = ['password', 'remember_token'];

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role', 'id_role');
    }

    public function alamat()
    {
        return $this->hasMany(Alamat::class, 'id_user');
    }

    public function redeem()
    {
        return $this->hasMany(Redeem::class, 'id_user');
    }

    public function req_donasi()
    {
        return $this->hasMany(Req_Donasi::class, 'id_user');
    }

    public function komentar()
    {
        return $this->hasMany(Komentar::class, 'id_user');
    }

    public function penitipan()
    {
        return $this->hasMany(Penitipan::class, 'id_user');
    }

    public function transaksi()
    {
        return $this->hasMany(Transaksi::class, 'id_user');
    }

    public function fcmTokens()
    {
        return $this->morphMany(FcmToken::class, 'owner');
    }
}
