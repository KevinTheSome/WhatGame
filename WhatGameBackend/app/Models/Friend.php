<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Friend extends Model
{
    protected $fillable = [
        'accepted',
        'sender_id',
        'receiver_id',
    ];

    /**
     * Get the user who sent the friend request
     */
    public function sender()
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    /**
     * Get the user who received the friend request
     */
    public function receiver()
    {
        return $this->belongsTo(User::class, 'receiver_id');
    }
}
