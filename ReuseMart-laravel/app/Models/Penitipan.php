<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Penitipan extends Model
{
    use HasFactory;
    protected $table = 'penitipan';
    protected $primaryKey = 'id_penitipan';
    public $timestamps = false;
    protected $fillable = [
        'id_user',
        'jumlah_barang',
        'no_nota',
    ];

    public function barang()
    {
        return $this->hasMany(Barang::class, 'id_penitipan', 'id_penitipan');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
