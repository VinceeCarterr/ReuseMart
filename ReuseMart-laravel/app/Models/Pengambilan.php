<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pengambilan extends Model
{
    use HasFactory;
    protected $table = 'pengambilan';
    protected $primaryKey = 'id_pengambilan';
    protected $fillable = [
        'id_transaksi',
        'tanggal_pengambilan',
        'status_pengambilan',
    ];

    public function transaksi()
    {
        return $this->belongsTo(Transaksi::class, 'id_transaksi');
    }
}
