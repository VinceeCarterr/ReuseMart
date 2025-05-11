<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Foto_Barang extends Model
{
    use HasFactory;

    protected $table = 'foto_barang';
    protected $primaryKey = 'id_foto';
    public $timestamps = false;
    protected $fillable = [
        'id_foto',
        'id_barang',
        'path',
    ];

    public function barang()
    {
        return $this->belongsTo(Barang::class, 'id_barang', 'id_barang');
    }
}
