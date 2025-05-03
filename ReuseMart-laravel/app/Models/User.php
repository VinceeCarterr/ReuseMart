<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Models
{
    use HasFactory;

    protected $table = 'user';
    protected $primaryKey = 'id_user';
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

    public function role()
    {
        return $this->belongsTo(Role::class, 'id_role');
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
        return $this->hasMany(ReqDonasi::class, 'id_user');
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
}