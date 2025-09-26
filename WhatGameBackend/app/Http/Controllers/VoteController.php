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

class VoteController extends Controller
{
    public function getVote(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $validated = $request->validate([
                'lobby_id' => 'required|string',
                'game_id' => 'required|string'
            ]);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'error' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            if (!in_array($user->id, $lobby->getUsers())) {
                return response()->json(['success' => false, 'error' => 'You are not in this lobby'], 403);
            }

            if (!$lobby->getLobbyState()) {
                return response()->json(['success' => false, 'error' => 'Voting has not started yet'], 400);
            }

            $voteId = 'vote_' . $validated['lobby_id'];
            $vote = Cache::get($voteId);

            if (!$vote) {
                return response()->json(['success' => false, 'error' => 'No voting session found'], 404);
            }

            $games = $vote->getGames();
            if (!isset($games[$validated['game_id']])) {
                return response()->json(['success' => false, 'error' => 'Game not found'], 404);
            }

            $playerVotes = $vote->getPlayerVotes();
            $userVote = $playerVotes[$user->id][$validated['game_id']] ?? 0;

            return response()->json([
                'success' => true,
                'game_id' => $validated['game_id'],
                'game_name' => $games[$validated['game_id']]['name'],
                'user_vote' => $userVote,
                'total_votes' => $games[$validated['game_id']]['votes'],
                'upvotes' => $games[$validated['game_id']]['upvotes'],
                'downvotes' => $games[$validated['game_id']]['downvotes']
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'Validation error', 'errorMessages' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error getting vote: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to get vote. Please try again.'], 500);
        }
    }

    public function vote(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $validated = $request->validate([
                'lobby_id' => 'required|string',
                'game_id' => 'required|string',
                'vote' => 'required|integer|in:1,-1', // 1 = upvote, -1 = downvote
            ]);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'error' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            if (!in_array($user->id, $lobby->getUsers())) {
                return response()->json(['success' => false, 'error' => 'You are not in this lobby'], 403);
            }

            if (!$lobby->getLobbyState()) {
                return response()->json(['success' => false, 'error' => 'Voting has not started yet'], 400);
            }

            $voteId = 'vote_' . $validated['lobby_id'];
            $vote = Cache::get($voteId);

            if (!$vote) {
                return response()->json(['success' => false, 'error' => 'No voting session found'], 404);
            }

            // Cast the vote
            $vote->voteGame($validated['game_id'], $user->id, $validated['vote']);

            // Update cache with new vote data
            Cache::put($voteId, $vote);

            $games = $vote->getGames();
            $gameData = $games[$validated['game_id']];

            return response()->json([
                'success' => true,
                'message' => 'Vote recorded successfully',
                'game_id' => $validated['game_id'],
                'game_name' => $gameData['name'],
                'user_vote' => $validated['vote'],
                'new_total_votes' => $gameData['votes'],
                'new_upvotes' => $gameData['upvotes'],
                'new_downvotes' => $gameData['downvotes']
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'Validation error', 'errorMessages' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error voting: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to vote. Please try again.'], 500);
        }
    }

    public function voteResult(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $validated = $request->validate([
                'lobby_id' => 'required|string'
            ]);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'error' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            if (!in_array($user->id, $lobby->getUsers())) {
                return response()->json(['success' => false, 'error' => 'You are not in this lobby'], 403);
            }

            if (!$lobby->getLobbyState()) {
                return response()->json(['success' => false, 'error' => 'Voting has not started yet'], 400);
            }

            $voteId = 'vote_' . $validated['lobby_id'];
            $vote = Cache::get($voteId);

            if (!$vote) {
                return response()->json(['success' => false, 'error' => 'No voting session found'], 404);
            }

            $results = $vote->getVoteResults();
            $favorites = $vote->getVotedGames();

            // Sort games by total votes (descending)
            $sortedGames = collect($results['games'])->sortByDesc('votes')->toArray();

            return response()->json([
                'success' => true,
                'lobby_id' => $validated['lobby_id'],
                'games' => $sortedGames,
                'players_favorite_games' => $favorites,
                'total_votes_cast' => $results['total_votes'],
                'total_players' => count($lobby->getUsers()),
                'player_votes' => $results['player_votes']
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'Validation error', 'errorMessages' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error getting vote results: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to get vote results. Please try again.'], 500);
        }
    }

    public function endVoting(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $validated = $request->validate([
                'lobby_id' => 'required|string'
            ]);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'error' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            if (!in_array($user->id, $lobby->getUsers())) {
                return response()->json(['success' => false, 'error' => 'You are not in this lobby'], 403);
            }

            if ($lobby->getCreatorId() != $user->id) {
                return response()->json(['success' => false, 'error' => 'Only the lobby creator can end voting'], 403);
            }

            if (!$lobby->getLobbyState()) {
                return response()->json(['success' => false, 'error' => 'Voting has not started yet'], 400);
            }

            // Get final results before ending
            $voteId = 'vote_' . $validated['lobby_id'];
            $vote = Cache::get($voteId);

            $finalResults = null;
            if ($vote) {
                $finalResults = $vote->getVoteResults();
                // Remove vote from cache
                Cache::forget($voteId);
            }

            // End the lobby (you might want to add an endLobby method to the Lobby model)
            // For now, we'll just return the results
            $lobbies[$validated['lobby_id']] = $lobby;
            Cache::put('lobbies', $lobbies);

            return response()->json([
                'success' => true,
                'message' => 'Voting ended successfully',
                'lobby_id' => $validated['lobby_id'],
                'final_results' => $finalResults,
                'winner' => $finalResults ? $this->getWinner($finalResults['games']) : null
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'error' => 'Validation error', 'errorMessages' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error ending voting: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to end voting. Please try again.'], 500);
        }
    }

    public function getVoteGames(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'error' => 'User not authenticated'], 401);
            }

            $lobbies = Cache::get('lobbies', []);
            $currentLobby = null;

            foreach ($lobbies as $lobby) {
                if (in_array($user->id, $lobby->getUsers())) {
                    $currentLobby = $lobby;
                    break;
                }
            }

            if (!$currentLobby) {
                return response()->json(['success' => false, 'error' => 'You are not in any lobby'], 404);
            }

            if (!$currentLobby->getLobbyState()) {
                return response()->json(['success' => false, 'error' => 'Voting has not started yet'], 400);
            }

            // $voteId = 'vote_' . $currentLobby->getId();
            // try {
            //     $vote = Cache::get($voteId);
            // } catch (\Exception $e) {
            //     $vote = new Vote($currentLobby, []);
            //     Cache::put($voteId, $vote);
            // }

            // $voteId = 'vote_' . $currentLobby->getId();
            // try {
            //     $vote = Cache::get($voteId);
            // } catch (\Exception $e) {
            //     $vote = new Vote($currentLobby, []);
            //     Cache::put($voteId, $vote);
            // }

            $games = collect($currentLobby->getUsers())->map(function ($userId) {
                $user = User::find($userId);
                $userGames = $user->getFavoritedGames();

                // Convert game IDs to Game models and get extra info
                $gamesWithDetails = collect($userGames)->map(function ($gameData) {
                    $game = new Game([
                        'user_id' => $gameData->user_id,
                        'game_id' => $gameData->game_id
                    ]);
                    $game->id = $gameData->id;
                    $game->timestamps = false; // Prevent timestamp updates

                    return [
                        'id' => $gameData->id,
                        'user_id' => $gameData->user_id,
                        'game_id' => $gameData->game_id,
                        'info' => $game->getInfo()
                    ];
                })->filter()->toArray();

                return $gamesWithDetails;
            })->flatten(1)->filter()->values()->toArray();

            return response()->json([
                'success' => true,
                'games' => $games,
            ], 200);

        } catch (\Exception $e) {
            \Log::error('Error getting current game: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to get current game. Please try again.'], 500);
        }
    }

    private function getWinner($games)
    {
        if (empty($games)) {
            return null;
        }

        $winner = array_reduce($games, function($carry, $game) {
            return (!$carry || $game['votes'] > $carry['votes']) ? $game : $carry;
        });

        return [
            'game_id' => array_search($winner, $games),
            'game_name' => $winner['name'],
            'total_votes' => $winner['votes']
        ];
    }
}
