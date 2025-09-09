<?php

namespace App\Models;

class Lobby
{
    private string $id;
    private array $users = [];
    private string $creatorId;
    private ?string $name;

    public function __construct(string $creatorId, ?string $name = null)
    {
        $this->id = uniqid('lobby_');
        $this->creatorId = $creatorId;
        $this->name = $name;
        $this->addUser($creatorId);
    }

    public function addUser(string $userId): void
    {
        if (!in_array($userId, $this->users)) {
            $this->users[] = $userId;
        }
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
        return $this->creatorId;
    }

    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'creator_id' => $this->creatorId,
            'users' => $this->users,
            'user_count' => $this->getUserCount(),
        ];
    }
}
