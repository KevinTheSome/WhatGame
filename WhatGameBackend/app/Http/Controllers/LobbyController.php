<?php

namespace App\Http\Controllers;

use App\Models\Lobby;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class LobbyController extends Controller
{
    public function createLobby(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $lobbies = Cache::get('lobbies', []);
            foreach ($lobbies as $lobby) {
                if (in_array($user->id, $lobby->getUsers())) {
                    return response()->json(['success' => false, 'message' => 'You are already in a lobby.'], 409);
                }
            }

            $validated = $request->validate([
                'name' => 'required|string|max:50',
                'filter' => 'required|string|in:public,friends',
                'max_players' => 'required|integer|min:2|max:24',
            ]);

            $lobbies = Cache::get('lobbies', []);
            $existingLobby = collect($lobbies)->first(fn($lobby) => strtolower($lobby->name) === strtolower($validated['name']));

            if ($existingLobby) {
                return response()->json(['success' => false, 'message' => 'A lobby with this name already exists'], 409);
            }

            $lobby = new Lobby(
                $validated['name'],
                $validated['filter'],
                $validated['max_players'],
                $request->user()
            );

            $lobbies[$lobby->getId()] = $lobby;
            Cache::put('lobbies', $lobbies);

            return response()->json([
                'success' => true,
                'message' => 'Lobby created successfully',
                'lobby' => $lobby->toArray()
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating lobby: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to create lobby. Please try again.'], 500);
        }
    }

    public function joinLobby(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $validated = $request->validate(['lobby_id' => 'required|string']);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'message' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            $user = $request->user();

            if (in_array($user->id, $lobby->getUsers())) {
                return response()->json(['success' => false, 'message' => 'You are already in this lobby'], 400);
            }

            if ($lobby->getUserCount() >= $lobby->maxPlayers) {
                return response()->json(['success' => false, 'message' => 'Lobby is full'], 400);
            }

            if (!$lobby->addUser($user->id)) {
                return response()->json(['success' => false, 'message' => 'Failed to join lobby. You may not have permission to join this lobby.'], 403);
            }

            $lobbies[$validated['lobby_id']] = $lobby;
            Cache::put('lobbies', $lobbies);

            return response()->json([
                'success' => true,
                'message' => 'Successfully joined lobby',
                'lobby' => $lobby->toArray()
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error joining lobby: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to join lobby. Please try again.'], 500);
        }
    }

    public function getLobbies(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['success' => false, 'message' => 'User not authenticated'], 401);
            }

            $lobbies = Cache::get('lobbies', []);
            $userFriends = $user->friends()->pluck('id')->toArray();

            if($request->has('search') && $request->input('search') != '') {
                $searchTerm = strtolower($request->input('search'));

                $lobbies = collect($lobbies)->filter(function (Lobby $lobby) use ($searchTerm) {
                    return stripos(strtolower($lobby->name), $searchTerm) !== false;
                });
            }

            $visibleLobbies = collect($lobbies)->filter(function (Lobby $lobby) use ($user, $userFriends) {
                if ($lobby->filter === 'public') {
                    return true;
                }

                if ($lobby->filter === 'friends') {
                    return in_array($lobby->getCreatorId(), $userFriends) || $lobby->getCreatorId() === $user->id;
                }

                return false;
            })->map(fn(Lobby $lobby) => $lobby->toArray());

            return response()->json([
                'success' => true,
                'lobbies' => array_values($visibleLobbies->toArray())
            ],200);
        } catch (\Exception $e) {
            \Log::error('Error getting lobbies: ' . $e->getMessage());
            return response()->json(['success' => false, 'error' => 'Failed to retrieve lobbies. Please try again.'], 500);
        }
    }

    public function leaveLobby(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'lobby_id' => 'required|string',
            ]);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'message' => 'Lobby not found'], 404);
            }

            $lobby = $lobbies[$validated['lobby_id']];
            $lobby->removeUser($request->user()->id);

            if ($lobby->getUserCount() === 0) {
                unset($lobbies[$validated['lobby_id']]);
                Cache::put('lobbies', $lobbies);
                return response()->json(['success' => true, 'message' => 'Left lobby and it was removed as it became empty', 'lobby_removed' => true]);
            }

            $lobbies[$validated['lobby_id']] = $lobby;
            Cache::put('lobbies', $lobbies);

            return response()->json([
                'success' => true,
                'lobby' => $lobby->toArray(),
                'lobby_removed' => false
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error leaving lobby: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to leave lobby. Please try again.', 'error' => $e->getMessage()], 500);
        }
    }

    public function getLobbyInfo(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate(['lobby_id' => 'required|string']);

            $lobbies = Cache::get('lobbies', []);
            if (!isset($lobbies[$validated['lobby_id']])) {
                return response()->json(['success' => false, 'message' => 'Lobby not found'], 404);
            }

            return response()->json([
                'success' => true,
                'lobby' => $lobbies[$validated['lobby_id']]->toArray()
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(['success' => false, 'message' => 'Validation error', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            \Log::error('Error getting lobby info: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Failed to get lobby info. Please try again.'], 500);
        }
    }
}
