<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class DetilTransaksi extends Model
{
    use HasFactory;

    protected $table = 'detiltransaksi';
    protected $primaryKey = 'id_dt';
    public $timestamps = false;
    protected $fillable = [
        'id_transaksi',
        'id_barang',
    ];

    public function Transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi');
    }

    public function Barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang');
    }

    public function Komisi()
    {
        return $this->hasOne(Komisi::class, 'id_dt');
    }
}
