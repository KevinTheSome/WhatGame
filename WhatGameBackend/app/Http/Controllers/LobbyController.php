<?php

namespace App\Http\Controllers;

use App\Models\Lobby;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;

class LobbyController extends Controller
{
    private static array $lobbies = [];

    public function createLobby(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|string',
            'name' => 'nullable|string|max:50'
        ]);

        $lobby = new Lobby(
            $request->user_id,
            $request->name ?? 'Lobby ' . (count(static::$lobbies) + 1)
        );

        static::$lobbies[$lobby->getId()] = $lobby;

        return response()->json([
            'success' => true,
            'lobby' => $lobby->toArray()
        ]);
    }

    public function joinLobby(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|string',
            'lobby_id' => 'required|string',
        ]);

        if (!isset(static::$lobbies[$request->lobby_id])) {
            return response()->json(['error' => 'Lobby not found'], 404);
        }

        $lobby = static::$lobbies[$request->lobby_id];
        $lobby->addUser($request->user_id);

        return response()->json([
            'success' => true,
            'lobby' => $lobby->toArray()
        ]);
    }

    public function getLobbies(Request $request): JsonResponse
    {
        $lobbies = array_map(
            fn(Lobby $lobby) => $lobby->toArray(),
            static::$lobbies
        );

        return response()->json([
            'success' => true,
            'lobbies' => array_values($lobbies) // Reset array keys for JSON
        ]);
    }

    public function leaveLobby(Request $request): JsonResponse
    {
        $request->validate([
            'user_id' => 'required|string',
            'lobby_id' => 'required|string',
        ]);

        if (!isset(static::$lobbies[$request->lobby_id])) {
            return response()->json(['error' => 'Lobby not found'], 404);
        }

        $lobby = static::$lobbies[$request->lobby_id];
        $lobby->removeUser($request->user_id);

        // Remove lobby if empty
        if ($lobby->getUserCount() === 0) {
            unset(static::$lobbies[$request->lobby_id]);
            return response()->json([
                'success' => true,
                'message' => 'Left lobby and it was removed as it became empty',
                'lobby_removed' => true
            ]);
        }

        return response()->json([
            'success' => true,
            'lobby' => $lobby->toArray(),
            'lobby_removed' => false
        ]);
    }

    public function getLobbyInfo(Request $request): JsonResponse
    {
        $request->validate([
            'lobby_id' => 'required|string',
        ]);

        if (!isset(static::$lobbies[$request->lobby_id])) {
            return response()->json(['error' => 'Lobby not found'], 404);
        }

        return response()->json([
            'success' => true,
            'lobby' => static::$lobbies[$request->lobby_id]->toArray()
        ]);
    }
}
