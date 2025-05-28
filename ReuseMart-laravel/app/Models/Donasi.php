<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Donasi extends Model
{
    use HasFactory;
    protected $table = 'donasi';
    protected $primaryKey = 'id_donasi';
    public $timestamps = false;
    protected $fillable = [
        'id_reqdonasi',
        'id_barang',
        'tanggal_donasi',
        'nama_penerima',
    ];

    public function requestDonasi()
    {
        return $this->belongsTo(Req_Donasi::class, 'id_reqdonasi');
    }

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang');
    }
}
