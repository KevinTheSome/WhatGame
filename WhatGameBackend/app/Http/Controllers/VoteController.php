<?php

namespace App\Http\Controllers;

use App\Models\Lobby;
use App\Models\Vote;
use App\Models\User;
use App\Models\Game;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use PhpParser\Node\Stmt\TryCatch;

class VoteController extends Controller
{
    private function getCurrentLobby($user)
    {
        $lobbies = Cache::get("lobbies", []);
        return collect($lobbies)->first(
            fn($lobby) => in_array($user->id, $lobby->getUsers()),
        );
    }

    private function getLobbyGames($lobby)
    {
        return collect($lobby->getUsers())
            ->map(function ($userId) {
                $user = User::find($userId);
                $userGames = $user->getFavoritedGames();

                return collect($userGames)
                    ->map(function ($gameData) {
                        $game = new Game([
                            "user_id" => $gameData->user_id,
                            "game_id" => $gameData->game_id,
                        ]);
                        $game->id = $gameData->id;
                        $game->timestamps = false;

                        $info = $game->getInfo();
                        return [
                            "id" => $gameData->game_id,
                            "name" => $info["name"] ?? "Unknown Game",
                        ];
                    })
                    ->filter()
                    ->toArray();
            })
            ->flatten(1)
            ->unique("id")
            ->pluck("name", "id")
            ->toArray();
    }

    private function getOrCreateVote($lobby)
    {
        if (!$lobby->getLobbyState()) {
            return null;
        }

        $voteId = "vote_" . $lobby->getId();
        $vote = Cache::get($voteId);

        if (!$vote) {
            $games = $this->getLobbyGames($lobby);
            $vote = new Vote($lobby, $games);
            Cache::put($voteId, $vote);
        }

        return $vote;
    }

    public function postVote(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $validated = $request->validate([
                "game_id" => "required|integer",
                "vote" => "required|integer|in:1,-1", // 1 = upvote, -1 = downvote
            ]);

            $userLobby = $this->getCurrentLobby($user);

            if (!$userLobby) {
                return response()->json(
                    ["success" => false, "error" => "You are not in any lobby"],
                    404,
                );
            }

            $vote = $this->getOrCreateVote($userLobby);

            if (!$vote) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "Voting has not started yet",
                    ],
                    400,
                );
            }

            // Check if user has already voted on this game
            $playerVotes = $vote->getPlayerVotes();
            if (
                isset($playerVotes[$user->id][$validated["game_id"]]) &&
                $playerVotes[$user->id][$validated["game_id"]] !== 0
            ) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "You have already voted on this game",
                    ],
                    400,
                );
            }

            // Cast the vote
            $vote->voteGame(
                $validated["game_id"],
                $user->id,
                $validated["vote"],
            );

            // Update cache with new vote data
            $voteId = "vote_" . $userLobby->getId();
            Cache::put($voteId, $vote);

            $games = $vote->getGames();
            $gameData = $games[$validated["game_id"]];

            return response()->json(
                [
                    "success" => true,
                    "message" => "Vote recorded successfully",
                    "game_id" => $validated["game_id"],
                    "game_name" => $gameData["name"],
                    "user_vote" => $validated["vote"],
                    "new_total_votes" => $gameData["votes"],
                    "new_upvotes" => $gameData["upvotes"],
                    "new_downvotes" => $gameData["downvotes"],
                ],
                200,
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(
                [
                    "success" => false,
                    "error" => "Validation error",
                    "errorMessages" => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            \Log::error("Error voting: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to vote. Please try again.",
                    "errorDetails" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function voteResult(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $userLobby = $this->getCurrentLobby($user);

            if (!$userLobby) {
                return response()->json(
                    ["success" => false, "error" => "You are not in any lobby"],
                    404,
                );
            }

            $lobby = $userLobby;

            if (!$lobby->getLobbyState()) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "Voting has not started yet",
                    ],
                    400,
                );
            }

            $voteId = "vote_" . $lobby->getId();
            $vote = Cache::get($voteId);

            if (!$vote) {
                return response()->json(
                    ["success" => false, "error" => "No voting session found"],
                    404,
                );
            }

            $results = $vote->getVoteResults();
            $favorites = $vote->getVotedGames();

            // Sort games by total votes (descending)
            $sortedGames = collect($results["games"])
                ->sortByDesc("votes")
                ->toArray();

            return response()->json(
                [
                    "success" => true,
                    "lobby_id" => $lobby->getId(),
                    "games" => $sortedGames,
                    "players_favorite_games" => $favorites,
                    "total_votes_cast" => $results["total_votes"],
                    "total_players" => count($lobby->getUsers()),
                    "player_votes" => $results["player_votes"],
                ],
                200,
            );
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(
                [
                    "success" => false,
                    "error" => "Validation error",
                    "errorMessages" => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            \Log::error("Error getting vote results: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to get vote results. Please try again.",
                ],
                500,
            );
        }
    }

    public function startVoting(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $lobby = $this->getCurrentLobby($user);

            if (!$lobby) {
                return response()->json(
                    ["success" => false, "error" => "You are not in any lobby"],
                    404,
                );
            }

            if ($lobby->getLobbyState()) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "Voting has already started",
                    ],
                    400,
                );
            }

            // if ($user->id !== $lobby->getCreatorId()) {
            //     return response()->json(
            //         [
            //             "success" => false,
            //             "error" => "Only the lobby creator can start voting",
            //         ],
            //         403,
            //     );
            // }

            $lobby->startLobby($user);

            // Update cache
            $lobbies = Cache::get("lobbies", []);
            $updatedLobbies = collect($lobbies)
                ->map(function ($l) use ($lobby) {
                    if ($l->getId() === $lobby->getId()) {
                        return $lobby;
                    }
                    return $l;
                })
                ->values()
                ->toArray();
            Cache::put("lobbies", $updatedLobbies);

            return response()->json(
                [
                    "success" => true,
                    "message" => "Voting started successfully",
                ],
                200,
            );
        } catch (\Exception $e) {
            \Log::error("Error starting voting: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to start voting. Please try again.",
                    "errorMessages" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function getVoteGames(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $currentLobby = $this->getCurrentLobby($user);

            if (!$currentLobby) {
                return response()->json(
                    ["success" => false, "error" => "You are not in any lobby"],
                    404,
                );
            }

            if (!$currentLobby->getLobbyState()) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "Voting has not started yet",
                    ],
                    400,
                );
            }

            $games = collect($currentLobby->getUsers())
                ->map(function ($userId) {
                    $user = User::find($userId);
                    $userGames = $user->getFavoritedGames();

                    $gamesWithDetails = collect($userGames)
                        ->map(function ($gameData) {
                            $game = new Game([
                                "user_id" => $gameData->user_id,
                                "game_id" => $gameData->game_id,
                            ]);
                            $game->id = $gameData->id;
                            $game->timestamps = false; // Prevent timestamp updates

                            return [
                                "id" => $gameData->id,
                                "user_id" => $gameData->user_id,
                                "game_id" => $gameData->game_id,
                                "info" => $game->getInfo(),
                            ];
                        })
                        ->filter()
                        ->toArray();

                    return $gamesWithDetails;
                })
                ->flatten(1)
                ->filter()
                ->unique("game_id")
                ->values()
                ->toArray();

            return response()->json(
                [
                    "success" => true,
                    "games" => $games,
                ],
                200,
            );
        } catch (\Exception $e) {
            \Log::error("Error getting current game: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to get current game. Please try again.",
                ],
                500,
            );
        }
    }

    private function getWinner($games)
    {
        if (empty($games)) {
            return null;
        }

        $winner = array_reduce($games, function ($carry, $game) {
            return !$carry || $game["votes"] > $carry["votes"] ? $game : $carry;
        });

        return [
            "game_id" => array_search($winner, $games),
            "game_name" => $winner["name"],
            "total_votes" => $winner["votes"],
        ];
    }
}
