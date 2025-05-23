<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Barang extends Model
{
    use HasFactory;

    protected $table = 'barang';
    protected $primaryKey = 'id_barang';
    public $timestamps = false;
    protected $fillable = [
        'id_kategori',
        'id_pegawai',
        'nama_barang',
        'kategori',
        'deskripsi',
        'harga',
        'status',
        'garansi',
        'tanggal_titip',
        'status_periode',
        'rating',
        'byHunter',
    ];

    public function Kategori()
    {
        return $this->belongsTo(Kategori::class, 'id_kategori');
    }

    public function Pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai');
    }

    public function DetilTransaksi()
    {
        return $this->hasMany(DetilTransaksi::class, 'id_barang');
    }

    public function Donasi()
    {
        return $this->hasOne(Donasi::class, 'id_barang');
    }

    public function Penitipan()
    {
        return $this->belongsTo(Penitipan::class, 'id_penitipan', 'id_penitipan');
    }

    public function Forum()
    {
        return $this->hasOne(Forum::class, 'id_barang');
    }

    public function foto()
    {
        return $this->hasMany(Foto_Barang::class, 'id_barang', 'id_barang');
    }
}
