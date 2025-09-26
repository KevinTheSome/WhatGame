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
    public function getUsersFriends(User $user)
    {
        $sent_friends_query = Friend::where('sender_id', $user->id)
            ->where('accepted', true)
            ->join('users', 'users.id', '=', 'friends.receiver_id')
            ->select('friends.*', 'users.name');

        $received_friends_query = Friend::where('receiver_id', $user->id)
            ->where('accepted', true)
            ->join('users', 'users.id', '=', 'friends.sender_id')
            ->select('friends.*', 'users.name');
            
        $sent_friends = $sent_friends_query->get();
        $received_friends = $received_friends_query->get();

        return $friends = array_merge($sent_friends->toArray(), $received_friends->toArray());
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
    public function favoritedGames()
    {
        return $this->hasMany(Game::class);
    }

    /**
     * Check if a user is a friend
     */
    public function isFriendWith(User $user): bool
    {
        return $this->getUsersFriends($this)->contains('id', $user->id);
    }

    /**
     * Get favorited games (basic info without API calls)
     */
    public function getFavoritedGames()
    {
        return $this->favoritedGames()->get();
    }

    /**
     * Get favorited games with their details from RAWG API
     */
    public function getFavoritedGamesWithDetails()
    {
        $games = $this->favoritedGames()->get();
        $gamesWithDetails = [];

        foreach ($games as $game) {
            $gameInfo = $game->getInfo();
            $gamesWithDetails[] = [
                'game' => $game,
                'details' => $gameInfo
            ];
        }

        return $gamesWithDetails;
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
