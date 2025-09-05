<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class game extends Model
{
    protected $table = 'games';

    protected $fillable = [
        'user_id',
        'game_id',
    ];
}
