<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Komisi extends Model
{
    use HasFactory;
    protected $table = 'komisi';
    protected $primaryKey = 'id_komisi';
    public $timestamps = false;
    protected $fillable = [
        'id_dt',
        'presentase_perusahaan',
        'presentase_hunter',
        'komisi_perusahaan',
        'komisi_hunter',
    ];

    public function dt()
    {
        return $this->belongsTo(DetilTransaksi::class, 'id_dt');
    }
}
