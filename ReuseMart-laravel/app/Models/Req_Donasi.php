<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Req_Donasi extends Model
{
    use HasFactory;

    protected $table = 'req_donasi';
    protected $primaryKey = 'id_reqdonasi';

    public $timestamps = false;
    const CREATED_AT = null;
    const UPDATED_AT = null;
    
    protected $fillable = [
        'id_user',
        'nama_barangreq',
        'kategori_barangreq',
        'deskripsi',
        'contoh_foto'
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function donasi()
    {
        return $this->hasMany(Donasi::class, 'id_reqdonasi');
    }
    
}
