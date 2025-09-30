<?php

namespace App\Http\Controllers;

use App\Models\Lobby;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LobbyController extends Controller
{
    public function getAllLobies(Request $request): JsonResponse
    {
        //del test route
        return response()->json(Cache::get("lobbies", []), 200);
    }

    public function delAllLobies(Request $request): JsonResponse
    {
        //del test route
        Cache::forget("lobbies");
        return response()->json([], 200);
    }

    public function createLobby(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            //auth check
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }
            //lobby check
            $lobbies = Cache::get("lobbies", []);
            foreach ($lobbies as $lobby) {
                if (in_array($user->id, $lobby->getUsers())) {
                    return response()->json(
                        [
                            "success" => false,
                            "error" => "You are already in a lobby.",
                        ],
                        409,
                    );
                }
            }

            //validate request
            $validated = $request->validate([
                "name" => "required|string|max:50",
                "filter" => "required|string|in:public,friends",
                "max_players" => "required|integer|min:2|max:24",
            ]);

            //check if lobby with same name exists
            $lobbies = Cache::get("lobbies", []);
            $existingLobby = collect($lobbies)->first(
                fn($lobby) => strtolower($lobby->name) ===
                    strtolower($validated["name"]),
            );

            if ($existingLobby) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "A lobby with this name already exists",
                    ],
                    409,
                );
            }

            //create lobby
            $lobby = new Lobby(
                $validated["name"],
                $validated["filter"],
                $validated["max_players"],
                $request->user(),
            );

            //add lobby to cache
            $lobbies[$lobby->getId()] = $lobby;
            Cache::put("lobbies", $lobbies);

            return response()->json(
                [
                    "success" => true,
                    "message" => "Lobby created successfully",
                    "lobby" => $lobby->toArray(),
                ],
                201,
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
            \Log::error("Error creating lobby: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to create lobby. Please try again.",
                    "errorMessage" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function joinLobby(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $validated = $request->validate(["lobby_id" => "required|string"]);

            $lobbies = Cache::get("lobbies", []);
            if (!isset($lobbies[$validated["lobby_id"]])) {
                return response()->json(
                    ["success" => false, "error" => "Lobby not found"],
                    404,
                );
            }

            $lobby = $lobbies[$validated["lobby_id"]];
            $user = $request->user();

            if (in_array($user->id, $lobby->getUsers())) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "You are already in this lobby",
                    ],
                    400,
                );
            }

            if ($lobby->getUserCount() >= $lobby->maxPlayers) {
                return response()->json(
                    ["success" => false, "error" => "Lobby is full"],
                    400,
                );
            }

            if (!$lobby->addUser($user->id)) {
                return response()->json(
                    [
                        "success" => false,
                        "error" =>
                            "Failed to join lobby. You may not have permission to join this lobby.",
                    ],
                    403,
                );
            }

            $lobbies[$validated["lobby_id"]] = $lobby;
            Cache::put("lobbies", $lobbies);

            return response()->json([
                "success" => true,
                "message" => "Successfully joined lobby",
                "lobby" => $lobby->toArray(),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(
                [
                    "success" => false,
                    "error" => "Validation error",
                    "errorMessage" => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            \Log::error("Error joining lobby: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to join lobby. Please try again.",
                ],
                500,
            );
        }
    }

    public function getLobbies(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $request->validate([
                "search" => "sometimes|max:255",
                "filter" => "sometimes|string|in:all,friends",
            ]);

            $lobbies = Cache::get("lobbies", []);
            $userFriends = $user->getUsersFriends($user);
            $friendIds = array_unique(
                array_merge(
                    array_column($userFriends, "sender_id"),
                    array_column($userFriends, "receiver_id"),
                ),
            );

            $searchTerm = trim($request->input("search", ""));
            if (!empty($searchTerm)) {
                $lobbies = collect($lobbies)->filter(function (
                    Lobby $lobby,
                ) use ($searchTerm) {
                    return stripos(
                        strtolower($lobby->name),
                        strtolower($searchTerm),
                    ) !== false;
                });
                $filterType = $request->input("filter", "all");
                $visibleLobbies = collect($lobbies)->filter(function (
                    Lobby $lobby,
                ) use ($user, $friendIds, $filterType) {
                    $creatorId = $lobby->getCreatorId();

                    if ($filterType === "all") {
                        return true;
                    } elseif ($filterType === "friends") {
                        return in_array($creatorId, $friendIds);
                    }

                    return false;
                });
            } else {
                $visibleLobbies = collect($lobbies);
            }

            $lobbyArray = $visibleLobbies->map(function (Lobby $lobby) {
                $lobbyData = $lobby->toArray();
                if (
                    !isset($lobbyData["lobby_code"]) &&
                    method_exists($lobby, "getLobbyCode")
                ) {
                    $lobbyData["lobby_code"] = $lobby->getLobbyCode();
                }
                return $lobbyData;
            });

            if (empty($searchTerm)) {
                $lobbyArray = $lobbyArray->sortByDesc("user_count");
            }

            return response()->json(
                [
                    "success" => true,
                    "lobbies" => array_values($lobbyArray->toArray()),
                ],
                200,
            );
        } catch (\Exception $e) {
            \Log::error("Error getting lobbies: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to retrieve lobbies. Please try again.",
                    "error_message" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function leaveLobby(Request $request): JsonResponse
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(
                    ["success" => false, "error" => "User not authenticated"],
                    401,
                );
            }

            $lobbies = Cache::get("lobbies", []);
            $userId = $user->id;

            $lobby = null;
            $lobbyId = null;
            foreach ($lobbies as $id => $l) {
                if (in_array($userId, $l->getUsers())) {
                    $lobby = $l;
                    $lobbyId = $id;
                    break;
                }
            }

            if (!$lobby) {
                return response()->json(
                    ["success" => false, "error" => "Not in any lobby"],
                    404,
                );
            }

            $lobby->removeUser($userId);

            if ($lobby->getUserCount() === 0) {
                unset($lobbies[$lobbyId]);
                Cache::put("lobbies", $lobbies);
                return response()->json([
                    "success" => true,
                    "message" =>
                        "Left lobby and it was removed as it became empty",
                    "lobby_removed" => true,
                ]);
            }

            $lobbies[$lobbyId] = $lobby;
            Cache::put("lobbies", $lobbies);

            return response()->json([
                "success" => true,
                "lobby" => $lobby->toArray(),
                "lobby_removed" => false,
            ]);
        } catch (\Exception $e) {
            \Log::error("Error leaving lobby: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to leave lobby. Please try again.",
                    "errorMessage" => $e->getMessage(),
                ],
                500,
            );
        }
    }

    public function getLobbyInfo(Request $request): JsonResponse
    {
        try {
            $lobbies = Cache::get("lobbies", []);
            $userId = $request->user()->id;

            $lobby = collect($lobbies)->first(
                fn($lobby) => in_array($userId, $lobby->getUsers()),
            );

            if (!$lobby) {
                return response()->json(
                    ["success" => false, "error" => "Not in any lobby"],
                    404,
                );
            }
            $usersId = $lobby->getUsers();
            $users = DB::table("users")
                ->whereIn("id", $usersId)
                ->select("id", "name")
                ->get()
                ->toArray();

            $lobby = $lobby->toArray();

            if (in_array($userId, $usersId)) {
                $lobby["in_lobby"] = true;
            } else {
                $lobby["in_lobby"] = false;
            }

            $lobby["users"] = $users;

            return response()->json([
                "success" => true,
                "lobby" => $lobby,
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json(
                [
                    "success" => false,
                    "error" => "Validation error",
                    "errors" => $e->errors(),
                ],
                422,
            );
        } catch (\Exception $e) {
            \Log::error("Error getting lobby info: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to get lobby info. Please try again.",
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

            $lobbies = Cache::get("lobbies", []);

            // Find the lobby the user is currently in
            $currentLobby = null;
            foreach ($lobbies as $lobby) {
                if (in_array($user->id, $lobby->getUsers())) {
                    $currentLobby = $lobby;
                    break;
                }
            }

            if (!$currentLobby) {
                return response()->json(
                    ["success" => false, "error" => "You are not in any lobby"],
                    404,
                );
            }

            // Check if user is the creator of the lobby
            if ($currentLobby->getCreatorId() != $user->id) {
                return response()->json(
                    [
                        "success" => false,
                        "error" => "You are not the creator of this lobby",
                    ],
                    403,
                );
            }

            if ($currentLobby->startLobby($user)) {
                // Update the lobby in cache with the new state
                $lobbies[$currentLobby->getId()] = $currentLobby;
                Cache::put("lobbies", $lobbies);
                return response()->json([
                    "success" => true,
                    "message" => "Lobby started successfully",
                ]);
            }
            return response()->json(
                [
                    "success" => false,
                    "error" =>
                        "Failed to start lobby. Make user you are the creator of the lobby and lobby is not already started",
                ],
                500,
            );
        } catch (\Exception $e) {
            \Log::error("Error starting lobby: " . $e->getMessage());
            return response()->json(
                [
                    "success" => false,
                    "error" => "Failed to start lobby. Please try again.",
                    "errorMessage" => $e->getMessage(),
                ],
                500,
            );
        }
    }
}
