<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use App\Models\User;
use App\Models\Game;
use Illuminate\Support\Facades\Http;

class GamesTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
    }

    public function test_search_games_unauthenticated()
    {
        $response = $this->postJson("/api/search", ["search" => "test"]);

        $response->assertStatus(401);
    }

    public function test_search_games_validation()
    {
        $response = $this->actingAs($this->user)->postJson("/api/search");

        $response->assertStatus(422)->assertJsonValidationErrors(["search"]);
    }

    public function test_search_games()
    {
        Http::fake([
            "api.rawg.io/api/games*" => Http::response(
                [
                    "results" => [
                        ["id" => 1, "name" => "Test Game 1"],
                        ["id" => 2, "name" => "Test Game 2"],
                    ],
                    "next" => null,
                    "previous" => null,
                ],
                200,
            ),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/search", [
            "search" => "test",
        ]);

        $response
            ->assertStatus(200)
            ->assertJsonStructure([
                "results" => [
                    "*" => ["id", "name", "favorited"],
                ],
                "next",
                "previous",
            ])
            ->assertJsonFragment(["id" => 1, "favorited" => false])
            ->assertJsonFragment(["id" => 2, "favorited" => false]);
    }

    public function test_search_games_with_favorited()
    {
        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);

        Http::fake([
            "api.rawg.io/api/games*" => Http::response(
                [
                    "results" => [
                        ["id" => 1, "name" => "Test Game 1"],
                        ["id" => 2, "name" => "Test Game 2"],
                    ],
                    "next" => null,
                    "previous" => null,
                ],
                200,
            ),
        ]);

        $response = $this->actingAs($this->user)->postJson("/api/search", [
            "search" => "test",
        ]);

        $response
            ->assertStatus(200)
            ->assertJsonFragment(["id" => 1, "favorited" => true])
            ->assertJsonFragment(["id" => 2, "favorited" => false]);
    }

    public function test_add_to_favourites_unauthenticated()
    {
        $response = $this->postJson("/api/addToFavourites", ["game_id" => 1]);

        $response->assertStatus(401);
    }

    public function test_add_to_favourites_validation()
    {
        $response = $this->actingAs($this->user)->postJson(
            "/api/addToFavourites",
        );

        $response->assertStatus(422)->assertJsonValidationErrors(["game_id"]);

        $response = $this->actingAs($this->user)->postJson(
            "/api/addToFavourites",
            [
                "game_id" => "invalid",
            ],
        );

        $response->assertStatus(422)->assertJsonValidationErrors(["game_id"]);
    }

    public function test_add_to_favourites_adds_game()
    {
        $response = $this->actingAs($this->user)->postJson(
            "/api/addToFavourites",
            [
                "game_id" => 1,
            ],
        );

        $response
            ->assertStatus(200)
            ->assertJson(["success" => "Game added to favourites"]);

        $this->assertDatabaseHas("games", [
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);
    }

    public function test_add_to_favourites_toggles_remove()
    {
        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);

        $response = $this->actingAs($this->user)->postJson(
            "/api/addToFavourites",
            [
                "game_id" => 1,
            ],
        );

        $response
            ->assertStatus(200)
            ->assertJson(["success" => "Game added to favourites"]);

        $this->assertDatabaseMissing("games", [
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);
    }

    public function test_get_user_favourites_unauthenticated()
    {
        $response = $this->postJson("/api/getUserFavourites");

        $response->assertStatus(401);
    }

    public function test_get_user_favourites_validation()
    {
        $longSearch = str_repeat("a", 256);

        $response = $this->actingAs($this->user)->postJson(
            "/api/getUserFavourites",
            [
                "search" => $longSearch,
            ],
        );

        $response->assertStatus(422)->assertJsonValidationErrors(["search"]);
    }

    public function test_get_user_favourites_empty()
    {
        $response = $this->actingAs($this->user)->postJson(
            "/api/getUserFavourites",
        );

        $response->assertStatus(200)->assertJson([]);
    }

    public function test_get_user_favourites()
    {
        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);

        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 2,
        ]);

        Http::fake([
            "api.rawg.io/api/games/1*" => Http::response(
                [
                    "id" => 1,
                    "name" => "Test Game 1",
                ],
                200,
            ),
            "api.rawg.io/api/games/2*" => Http::response(
                [
                    "id" => 2,
                    "name" => "Test Game 2",
                ],
                200,
            ),
        ]);

        $response = $this->actingAs($this->user)->postJson(
            "/api/getUserFavourites",
        );

        $response
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonFragment([
                "id" => 1,
                "name" => "Test Game 1",
                "favorited" => true,
            ])
            ->assertJsonFragment([
                "id" => 2,
                "name" => "Test Game 2",
                "favorited" => true,
            ]);
    }

    public function test_get_user_favourites_with_search()
    {
        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 1,
        ]);

        Game::create([
            "user_id" => $this->user->id,
            "game_id" => 2,
        ]);

        Http::fake([
            "api.rawg.io/api/games/1*" => Http::response(
                [
                    "id" => 1,
                    "name" => "Test Game 1",
                ],
                200,
            ),
            "api.rawg.io/api/games/2*" => Http::response(
                [
                    "id" => 2,
                    "name" => "Test Game 2",
                ],
                200,
            ),
        ]);

        $response = $this->actingAs($this->user)->postJson(
            "/api/getUserFavourites",
            [
                "search" => "Game 1",
            ],
        );

        $response
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => 1,
                "name" => "Test Game 1",
                "favorited" => true,
            ]);
    }

    public function test_get_other_user_favourites()
    {
        $otherUser = User::factory()->create();

        Game::create([
            "user_id" => $otherUser->id,
            "game_id" => 3,
        ]);

        Http::fake([
            "api.rawg.io/api/games/3*" => Http::response(
                [
                    "id" => 3,
                    "name" => "Other Test Game",
                ],
                200,
            ),
        ]);

        $response = $this->actingAs($this->user)->postJson(
            "/api/getUserFavourites",
            [
                "user_id" => $otherUser->id,
            ],
        );

        $response
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment([
                "id" => 3,
                "name" => "Other Test Game",
                "favorited" => true,
            ]);
    }
}
