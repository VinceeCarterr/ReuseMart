<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pegawai extends Model
{
    use HasFactory;
    protected $table = 'pegawai';
    protected $primaryKey = 'id_pegawai';
    protected $fillable = [
        'id_jabatan',
        'first_name',
        'last_name',
        'email',
        'password',
        'no_telp',
        'hunter',
    ];

    public function jabatan()
    {
        return $this->belongsTo(Jabatan::class, 'id_jabatan');
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

    public function pegawai()
    {
        return $this->hasMany(Pegawai::class, 'id_pegawai');
    }
}
