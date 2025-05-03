<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Transaksi extends Model
{
    use HasFactory;
    protected $table = 'transaksi';
    protected $primaryKey = 'id_transaksi';
    protected $fillable = [
        'id_pembayaran',
        'id_user',
        'jumlah_item',
        'tanggal_transaksi',
        'metode_pengiriman',
        'alamat',
        'biaya_pengiriman',
        'diskon',
        'subtotal',
        'total',
    ];

    public function pembayaran()
    {
        return $this->belongsTo(Pembayaran::class, 'id_pembayaran');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function detilTransaksi()
    {
        return $this->hasMany(DetilTransaksi::class, 'id_transaksi');
    }

    public function pengiriman()
    {
        return $this->hasOne(Pengiriman::class, 'id_transaksi');
    }

    public function pengambilan()
    {
        return $this->hasOne(Pengambilan::class, 'id_transaksi');
    }
}
