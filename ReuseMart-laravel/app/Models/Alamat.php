<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Alamat extends Model
{
    use HasFactory;

    protected $table = 'alamat';
    protected $primaryKey = 'id_film';
    protected $fillable = [
        'id_user',
        'label',
        'kota',
        'kecamatan',
        'alamat',
        'catatan',
        'isDefault',
    ];

    public function User()
    {
        return $this->belongsTo(User::class, 'id_user');
        //belongsTo = relasi 1-n (fk nya ada di tabel ini)
        //hasMany = relasi n-1 (fk nya ada di tabel lain)
    }
}
