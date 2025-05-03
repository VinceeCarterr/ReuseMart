<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Donasi extends Model
{
    use HasFactory;
    protected $table = 'donasi';
    protected $primaryKey = 'id_donasi';
    protected $fillable = [
        'id_reqdonasi',
        'id_barang',
    ];

    public function requestDonasi()
    {
        return $this->belongsTo(RequestDonasi::class, 'id_reqdonasi');
    }

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang');
    }
}
