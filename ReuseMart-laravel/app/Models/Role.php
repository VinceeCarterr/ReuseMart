<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Role extends Model
{
    use HasFactory;

    protected $table = 'role';
    protected $primaryKey = 'id_tiket';
    protected $fillable = [
        'nama_role',
    ];

    public function user()
    {
        return $this->hasMany(User::class, 'id_role');
    }
}
