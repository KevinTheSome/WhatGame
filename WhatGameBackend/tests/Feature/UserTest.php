<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class AuthFavoritesFriendsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create a test user
        $this->user = User::factory()->create([
            "name" => "Test User",
            "email" => "test@example.com",
            "password" => Hash::make("password123"),
        ]);

        // Create a second user for friend requests
        $this->friendUser = User::factory()->create([
            "name" => "Friend User",
            "email" => "friend@example.com",
            "password" => Hash::make("password123"),
        ]);
    }

    public function testUserCanRegister()
    {
        $response = $this->postJson("/api/register", [
            "name" => "New User",
            "email" => "newuser@example.com",
            "password" => "password123",
            "password_confirmation" => "password123",
        ]);

        $response->assertStatus(201)->assertJsonStructure([
            "user" => ["id", "name", "email"],
            "access_token",
            "token_type",
        ]);

        $this->assertDatabaseHas("users", [
            "email" => "newuser@example.com",
            "name" => "New User",
        ]);
    }

    public function testUserCanLogin()
    {
        $response = $this->postJson("/api/login", [
            "email" => "test@example.com",
            "password" => "password123",
        ]);

        $response->assertStatus(200)->assertJsonStructure([
            "user" => ["id", "name", "email"],
            "access_token",
            "token_type",
        ]);
    }

    // test priekš lietotāja izrakstīšanos.
    public function testUserCanLogout()
    {
        // Noteiktajam api routam aizsūta derīgu json.
        $loginResponse = $this->postJson("/api/login", [
            "email" => "test@example.com",
            "password" => "password123",
        ]);

        // Dabū tokena vērtību no atbildes.
        $token = $loginResponse->json("token");

        // Iztestē lietotāja izrakstīšanos.
        $response = $this->withHeaders([
            "Authorization" => "Bearer " . $token,
        ])->postJson("/api/logout");

        // Pārbauda servera atbildi, vai lietotājs ir izrakstīts.
        $response
            ->assertStatus(200)
            ->assertJson(["message" => "Successfully logged out"]);
    }
}
