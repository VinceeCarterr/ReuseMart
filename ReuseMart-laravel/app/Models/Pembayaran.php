<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Pembayaran extends Model
{
    use HasFactory;
    protected $table = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';
    protected $fillable = [
        'ss_pembayaran',
        'status_pembayaran',
    ];

    public function transaksi()
    {
        return $this->hasOne(Transaksi::class, 'id_pembayaran');
    }
}
