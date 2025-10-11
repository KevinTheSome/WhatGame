<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Log;
use Tests\TestCase;
use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class LobbyTest extends TestCase
{
    use RefreshDatabase;

    private User $user;
    private User $otherUser;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::forget("lobbies");
        $this->user = User::factory()->create();
        $this->otherUser = User::factory()->create();
    }

    public function test_create_lobby_unauthenticated()
    {
        $response = $this->postJson("/api/createLobby", [
            "name" => "Test Lobby",
            "filter" => "public",
            "max_players" => 4,
        ]);

        $response->assertStatus(401);
    }

    public function test_create_lobby_validation_errors()
    {
        $response = $this->actingAs($this->user)->postJson("/api/createLobby");

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["name", "filter", "max_players"]);

        $response = $this->actingAs($this->user)->postJson("/api/createLobby", [
            "name" => str_repeat("a", 51),
            "filter" => "invalid",
            "max_players" => 1,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["name", "filter", "max_players"]);

        $response = $this->actingAs($this->user)->postJson("/api/createLobby", [
            "name" => "Test",
            "filter" => "public",
            "max_players" => 25,
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["max_players"]);
    }

    public function test_create_lobby_already_in_lobby()
    {
        $lobby = new \App\Models\Lobby(
            "Existing Lobby",
            "public",
            4,
            $this->user,
        );
        $lobbies = ["existing_id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/createLobby", [
            "name" => "New Lobby",
            "filter" => "public",
            "max_players" => 4,
        ]);

        $response->assertStatus(409)->assertJson([
            "success" => false,
            "error" => "You are already in a lobby.",
        ]);
    }

    public function test_create_lobby_duplicate_name()
    {
        $lobby = new \App\Models\Lobby("Test Lobby", "public", 4, $this->user);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->otherUser)->postJson(
            "/api/createLobby",
            [
                "name" => "Test Lobby",
                "filter" => "public",
                "max_players" => 4,
            ],
        );

        $response->assertStatus(409)->assertJson([
            "success" => false,
            "error" => "A lobby with this name already exists",
        ]);
    }

    public function test_create_lobby_success()
    {
        $response = $this->actingAs($this->user)->postJson("/api/createLobby", [
            "name" => "Test Lobby for test",
            "filter" => "public",
            "max_players" => 4,
        ]);

        $response
            ->assertStatus(201)
            ->assertJson([
                "success" => true,
                "message" => "Lobby created successfully",
            ])
            ->assertJsonStructure(["success", "message", "lobby"]);

        $lobbies = Cache::get("lobbies", []);
        $this->assertArrayHasKey($response->json("lobby.id"), $lobbies);
        $this->assertEquals(
            "Test Lobby for test",
            $lobbies[$response->json("lobby.id")]->name,
        );
        $this->assertContains(
            strval($this->user->id),
            $response->json()["lobby"]["users"],
        );
    }

    public function test_join_lobby_unauthenticated()
    {
        $response = $this->postJson("/api/joinLobby", [
            "lobby_id" => "test_id",
        ]);

        $response->assertStatus(401);
    }

    public function test_join_lobby_validation_error()
    {
        $response = $this->actingAs($this->user)->postJson("/api/joinLobby");

        $response->assertStatus(422)->assertJsonValidationErrors(["lobby_id"]);
    }

    public function test_join_lobby_not_found()
    {
        $response = $this->actingAs($this->user)->postJson("/api/joinLobby", [
            "lobby_id" => "nonexistent",
        ]);

        $response
            ->assertStatus(404)
            ->assertJson(["success" => false, "error" => "Lobby not found"]);
    }

    public function test_join_lobby_already_in()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->otherUser);
        $lobbies = ["id" => $lobby];
        $lobby->addUser($this->user->id);
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/joinLobby", [
            "lobby_id" => "id",
        ]);

        $response->assertStatus(400)->assertJson([
            "success" => false,
            "error" => "You are already in this lobby",
        ]);
    }

    public function test_join_lobby_full()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 1, $this->otherUser);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/joinLobby", [
            "lobby_id" => "id",
        ]);

        $response
            ->assertStatus(400)
            ->assertJson(["success" => false, "error" => "Lobby is full"]);
    }

    public function test_join_lobby_friends_only_not_friend()
    {
        $lobby = new \App\Models\Lobby("Test", "friends", 4, $this->otherUser);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        // Assume no friend relation
        $response = $this->actingAs($this->user)->postJson("/api/joinLobby", [
            "lobby_id" => "id",
        ]);

        $response->assertStatus(403)->assertJson([
            "success" => false,
            "error" =>
                "Failed to join lobby. You may not have permission to join this lobby.",
        ]);
    }

    public function test_join_lobby_public_success()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->otherUser);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/joinLobby", [
            "lobby_id" => "id",
        ]);

        $response->assertStatus(200)->assertJson([
            "success" => true,
            "message" => "Successfully joined lobby",
        ]);

        $lobbies = Cache::get("lobbies", []);
        $this->assertEquals(2, $lobbies["id"]->getUserCount());
    }

    public function test_get_lobbies_unauthenticated()
    {
        $response = $this->postJson("/api/getLobbies");

        $response->assertStatus(401);
    }

    public function test_get_lobbies_validation()
    {
        $longSearch = str_repeat("a", 256);

        $response = $this->actingAs($this->user)->postJson("/api/getLobbies", [
            "search" => $longSearch,
            "filter" => "invalid",
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors(["search", "filter"]);
    }

    public function test_get_lobbies_no_lobbies()
    {
        $response = $this->actingAs($this->user)->postJson("/api/getLobbies");

        $response
            ->assertStatus(200)
            ->assertJson(["success" => true, "lobbies" => []]);
    }

    public function test_get_lobbies_search_filter_all()
    {
        $lobby1 = new \App\Models\Lobby(
            "Mario Game",
            "public",
            4,
            $this->otherUser,
        );
        $lobby2 = new \App\Models\Lobby(
            "Zelda Adventure",
            "public",
            4,
            User::factory()->create(),
        );
        $lobbies = ["id1" => $lobby1, "id2" => $lobby2];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/getLobbies", [
            "search" => "mari",
            "filter" => "all",
        ]);

        $response
            ->assertStatus(200)
            ->assertJson(["success" => true])
            ->assertJsonCount(1, "lobbies")
            ->assertJsonFragment(["name" => "Mario Game"]);

        // Without search, sorted by user_count desc
        $response = $this->actingAs($this->user)->postJson("/api/getLobbies", [
            "filter" => "all",
        ]);
        $response->assertStatus(200)->assertJsonCount(2, "lobbies");
    }

    public function test_leave_lobby_unauthenticated()
    {
        $response = $this->getJson("/api/leaveLobby");

        $response->assertStatus(401);
    }

    public function test_leave_lobby_not_in_any()
    {
        $response = $this->actingAs($this->user)->getJson("/api/leaveLobby");

        $response
            ->assertStatus(404)
            ->assertJson(["success" => false, "error" => "Not in any lobby"]);
    }

    public function test_leave_lobby_success_not_empty()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->otherUser);
        $lobby->addUser($this->user->id);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->getJson("/api/leaveLobby");

        $response
            ->assertStatus(200)
            ->assertJson(["success" => true, "lobby_removed" => false]);

        $lobbiesAfter = Cache::get("lobbies", []);
        $this->assertEquals(1, $lobbiesAfter["id"]->getUserCount());
        $this->assertNotContains(
            $this->user->id,
            $lobbiesAfter["id"]->getUsers(),
        );
    }

    public function test_leave_lobby_success_empty_removed()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 2, $this->user);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->getJson("/api/leaveLobby");

        $response
            ->assertStatus(200)
            ->assertJson(["success" => true, "lobby_removed" => true]);

        $this->assertEmpty(Cache::get("lobbies", []));
    }

    public function test_get_lobby_info_unauthenticated()
    {
        $response = $this->getJson("/api/getLobbyInfo");

        $response->assertStatus(401);
    }

    public function test_get_lobby_info_not_in_any()
    {
        $response = $this->actingAs($this->user)->getJson("/api/getLobbyInfo");

        $response
            ->assertStatus(404)
            ->assertJson(["success" => false, "error" => "Not in any lobby"]);
    }

    public function test_get_lobby_info_success()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->otherUser);
        $lobby->addUser($this->user->id);
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->getJson("/api/getLobbyInfo");

        $response
            ->assertStatus(200)
            ->assertJson(["success" => true])
            ->assertJsonStructure([
                "success",
                "lobby" => [
                    "id",
                    "name",
                    "users",
                    "user_count",
                    "state",
                    "filter",
                    "max_players",
                    "creator_id",
                    "in_lobby",
                ],
            ])
            ->assertJsonFragment(["in_lobby" => true])
            ->assertJsonCount(2, "lobby.users");
    }

    public function test_start_voting_unauthenticated()
    {
        $response = $this->postJson("/api/startVoting");

        $response->assertStatus(401);
    }

    public function test_start_voting_not_in_lobby()
    {
        $response = $this->actingAs($this->user)->postJson("/api/startVoting");

        $response->assertStatus(400)->assertJson([
            "success" => false,
            "error" => "You are not in any lobby",
        ]);
    }

    public function test_start_voting_already_started()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->user);
        $lobby->state = true;
        $lobbies = ["id" => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/startVoting");

        $response->assertStatus(400)->assertJson([
            "success" => false,
            "error" => "Voting has already started",
        ]);
    }

    public function test_start_voting_success()
    {
        $lobby = new \App\Models\Lobby("Test", "public", 4, $this->user);
        $lobbyId = $lobby->getId();
        $lobbies = [$lobbyId => $lobby];
        Cache::put("lobbies", $lobbies);

        $response = $this->actingAs($this->user)->postJson("/api/startVoting");

        $response->assertStatus(200)->assertJson([
            "success" => true,
            "message" => "Voting started successfully",
        ]);

        $lobbiesAfter = Cache::get("lobbies", []);
        $this->assertTrue($lobby->getLobbyState());
    }
}
