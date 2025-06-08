<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Merch extends Model
{
    use HasFactory;
    protected $table = 'merch';
    protected $primaryKey = 'id_merch';
    public $timestamps = false;
    protected $fillable = [
        'nama_merch',
        'poin_merch',
        'stock'
    ];

    public function redeem()
    {
        return $this->hasMany(Redeem::class, 'id_merch');
    }
}
