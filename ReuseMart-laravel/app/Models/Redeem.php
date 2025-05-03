<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Redeem extends Model
{
    use HasFactory;
    protected $table = 'redeem';
    protected $primaryKey = 'id_redeem';
    protected $fillable = [
        'id_merch',
        'id_pegawai',
        'id_user',
        'tanggal_redeem',
    ];

    public function merch()
    {
        return $this->belongsTo(Merch::class, 'id_merch');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
