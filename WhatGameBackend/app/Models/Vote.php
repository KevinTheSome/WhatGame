<?php

namespace App\Models;

use App\Models\User;
use App\Models\Game;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Vote
{
    private $id;
    private $lobby;
    private $games = [];
    private $playerVotes;
    private $created_at;

    public function __construct($lobby, $games)
    {
        // Validate inputs
        if (!is_object($lobby) || !method_exists($lobby, "getId")) {
            throw new \InvalidArgumentException("Invalid lobby object");
        }

        if (!is_array($games) || empty($games)) {
            throw new \InvalidArgumentException(
                "Games must be a non-empty array",
            );
        }

        $this->id = uniqid("vote_");
        $this->lobby = $lobby;
        $this->created_at = now();
        $this->games = [];

        foreach ($games as $gameId => $gameName) {
            $this->games[$gameId] = [
                "name" => $gameName,
                "votes" => 0,
                "upvotes" => 0,
                "downvotes" => 0,
            ];

            try {
                $response = Http::get(
                    "https://api.rawg.io/api/games/{$gameId}?key=" .
                        env("RAWG_API_KEY"),
                );
                $response->throw();
                $data = $response->json();
                $this->games[$gameId]["background_image"] =
                    $data["background_image"] ?? null;
            } catch (\Exception $e) {
                Log::error(
                    "Failed to get background image for game {$gameId}",
                    ["error" => $e->getMessage()],
                );
                $this->games[$gameId]["background_image"] = null;
            }
        }

        $this->playerVotes = [];
        $this->initializePlayerVotes();
    }

    private function initializePlayerVotes()
    {
        $lobbyPlayers = $this->lobby->getUsers();
        foreach ($lobbyPlayers as $playerId) {
            $this->playerVotes[$playerId] = [];
            foreach (array_keys($this->games) as $gameId) {
                $this->playerVotes[$playerId][$gameId] = 0; // 0 = no vote, 1 = upvote, -1 = downvote
            }
        }
    }

    public function voteGame($gameId, $userId, $vote)
    {
        // Validate vote
        if ($vote !== 1 && $vote !== -1) {
            throw new \InvalidArgumentException(
                "Vote must be 1 (upvote) or -1 (downvote)",
            );
        }

        // Validate game exists
        if (!isset($this->games[$gameId])) {
            throw new \InvalidArgumentException("Invalid game ID");
        }

        // Validate user is in lobby
        if (!isset($this->playerVotes[$userId])) {
            throw new \InvalidArgumentException("User is not in this lobby");
        }

        // Remove previous vote if exists
        if (
            isset($this->playerVotes[$userId][$gameId]) &&
            $this->playerVotes[$userId][$gameId] !== 0
        ) {
            $previousVote = $this->playerVotes[$userId][$gameId];
            $this->games[$gameId]["votes"] -= $previousVote;
            if ($previousVote > 0) {
                $this->games[$gameId]["upvotes"]--;
            } else {
                $this->games[$gameId]["downvotes"]--;
            }
        }

        // Apply new vote
        $this->playerVotes[$userId][$gameId] = $vote;
        $this->games[$gameId]["votes"] += $vote;
        if ($vote > 0) {
            $this->games[$gameId]["upvotes"]++;
        } else {
            $this->games[$gameId]["downvotes"]++;
        }

        return true;
    }

    public function getGames()
    {
        return $this->games;
    }

    public function getPlayerVotes()
    {
        return $this->playerVotes;
    }

    public function getPlayerFavoriteGames()
    {
        $favorites = [];

        foreach ($this->playerVotes as $playerId => $votes) {
            $playerFavorites = [];
            foreach ($votes as $gameId => $vote) {
                if ($vote > 0) {
                    // Only include upvotes as favorites
                    $playerFavorites[] = $gameId;
                }
            }
            $favorites[$playerId] = $playerFavorites;
        }

        return $favorites;
    }

    public function getVotedGames()
    {
        $lobbyPlayers = $this->lobby->getUsers();
        $favorites = [];

        foreach ($lobbyPlayers as $playerId) {
            $playerFavorites = [];
            if (isset($this->playerVotes[$playerId])) {
                foreach ($this->playerVotes[$playerId] as $gameId => $vote) {
                    if ($vote > 0) {
                        // Only include upvotes as favorites
                        $playerFavorites[] = $gameId;
                    }
                }
            }
            $favorites[$playerId] = $playerFavorites;
        }

        return $favorites;
    }

    public function getVoteResults()
    {
        return [
            "games" => $this->games,
            "player_votes" => $this->playerVotes,
            "total_votes" => array_sum(array_column($this->games, "votes")),
        ];
    }

    public function toArray(): array
    {
        return [
            "id" => $this->id,
            "lobby_id" => $this->lobby->getId(),
            "games" => $this->games,
            "player_votes" => $this->playerVotes,
            "created_at" => $this->created_at,
        ];
    }
}
