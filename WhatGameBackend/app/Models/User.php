<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;
    
    /**
     * Get all friends where this user is the sender
     */
    public function sentFriendRequests()
    {
        return $this->hasMany(Friend::class, 'sender_id');
    }
    
    /**
     * Get all friends where this user is the receiver
     */
    public function receivedFriendRequests()
    {
        return $this->hasMany(Friend::class, 'receiver_id');
    }
    
    /**
     * Get all accepted friends
     */
    public function friends()
    {
        $sentFriends = $this->sentFriendRequests()
            ->where('accepted', 1)
            ->with('receiver')
            ->get()
            ->pluck('receiver');
            
        $receivedFriends = $this->receivedFriendRequests()
            ->where('accepted', 1)
            ->with('sender')
            ->get()
            ->pluck('sender');
            
        return $sentFriends->merge($receivedFriends);
    }
    
    /**
     * Get all pending friend requests
     */
    public function pendingFriendRequests()
    {
        return $this->receivedFriendRequests()
            ->where('accepted', 0)
            ->with('sender')
            ->get();
    }
    
    /**
     * Check if a user is a friend
     */
    public function isFriendWith(User $user): bool
    {
        return $this->friends()->contains('id', $user->id);
    }

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }


}
