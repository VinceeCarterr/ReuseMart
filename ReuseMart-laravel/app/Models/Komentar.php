<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Komentar extends Model
{
    use HasFactory;
    protected $table = 'komentar';
    protected $primaryKey = 'id_komentar';
    public $timestamps = false;
    protected $fillable = [
        'id_forum',
        'id_user',
        'id_pegawai',
        'komentar',
        'waktu_komentar',
    ];

    public function forum()
    {
        return $this->belongsTo(Forum::class, 'id_forum');
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function pegawai()
    {
        return $this->belongsTo(Pegawai::class, 'id_pegawai');
    }
}
