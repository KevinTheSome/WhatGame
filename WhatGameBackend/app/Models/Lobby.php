<?php

namespace App\Models;

use App\Models\User;

class Lobby
{
    private string $id;
    private array $users = [];
    public string $name;
    public string $filter;
    public int $maxPlayers;
    private ?User $creator = null;
    private ?array $friendsList = null;

    public function __construct(string $name = "" , string $filter = "public", int $maxPlayers = 2, ?User $creator = null)
    {
        $this->id = uniqid('lobby_');
        $this->name = $name;
        $this->filter = $filter;
        $this->maxPlayers = $maxPlayers;
        $this->creator = $creator;
        
        // If creator is provided and lobby is friends-only, preload friends list
        if ($this->creator && $this->filter === 'friends') {
            $this->friendsList = $this->creator->friends()->pluck('id')->toArray();
        }
        
        $this->addUser($this->creator->id);
    }
    
    /**
     * Set the creator user object and preload friends if needed
     */
    public function setCreator(User $creator): void
    {
        $this->creator = $creator;
        if ($this->filter === 'friends') {
            $this->friendsList = $creator->friends()->pluck('id')->toArray();
        }
    }

    public function addUser(string $userId): bool
    {
        // If user is already in the lobby, return false
        if (in_array($userId, $this->users)) {
            return false;
        }
        
        // If lobby is friends-only and user is not the creator, check if they're friends
        if ($this->filter === 'friends' && $userId !== $this->creator->id) {
            // If we don't have the friends list yet but have the creator, try to load it
            if ($this->friendsList === null && $this->creator) {
                $this->friendsList = $this->creator->friends()->pluck('id')->toArray();
            }
            
            // Check if user is in friends list
            if ($this->friendsList === null || !in_array($userId, $this->friendsList)) {
                return false; // User is not in the creator's friends list
            }
        }
        
        $this->users[] = $userId;
        return true;
    }
    
    public function canUserJoin(string $userId): bool
    {
        // Check if user is already in the lobby
        if (in_array($userId, $this->users)) {
            return false;
        }
        
        // Check if lobby is full
        if (count($this->users) >= $this->maxPlayers) {
            return false;
        }
        
        // If lobby is friends-only, check if user is in the creator's friends list
        if ($this->filter === 'friends' && $userId !== $this->creator->id) {
            // If we don't have the friends list yet but have the creator, try to load it
            if ($this->friendsList === null && $this->creator) {
                $this->friendsList = $this->creator->friends()->pluck('id')->toArray();
            }
            
            return $this->friendsList !== null && in_array($userId, $this->friendsList);
        }
        
        return true;
    }

    public function removeUser(string $userId): bool
    {
        $key = array_search($userId, $this->users);
        if ($key !== false) {
            unset($this->users[$key]);
            $this->users = array_values($this->users); // Reindex array
            return true;
        }
        return false;
    }

    public function getUsers(): array
    {
        return $this->users;
    }

    public function getUserCount(): int
    {
        return count($this->users);
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function getCreatorId(): string
    {
        return $this->creator->id;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'creator_id' => $this->creator->id,
            'users' => $this->users,
            'user_count' => $this->getUserCount(),
        ];
    }
}
