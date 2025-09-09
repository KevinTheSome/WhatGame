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
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => Hash::make('password123'),
        ]);
        
        // Create a second user for friend requests
        $this->friendUser = User::factory()->create([
            'name' => 'Friend User',
            'email' => 'friend@example.com',
            'password' => Hash::make('password123'),
        ]);
    }

    /** @test */
    public function user_can_register()
    {
        $response = $this->postJson('/api/register', [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
                'token'
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'newuser@example.com',
            'name' => 'New User',
        ]);
    }

    /** @test */
    public function user_can_login()
    {
        $response = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'user' => [
                    'id',
                    'name',
                    'email',
                ],
                'token'
            ]);
    }

    /** @test */
    public function user_can_logout()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);

        $token = $loginResponse->json('token');
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/logout');

        $response->assertStatus(200)
            ->assertJson(['message' => 'Logged out successfully']);
    }

    /** @test */
    public function user_can_add_and_remove_favorite()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $token = $loginResponse->json('token');
        
        // Add to favorites
        $addResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/addToFavourites', [
            'game_id' => 'test-game-123',
            'game_name' => 'Test Game',
            'cover_url' => 'http://example.com/cover.jpg'
        ]);

        $addResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        // Get favorites
        $getResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/getUserFavourites');

        $getResponse->assertStatus(200)
            ->assertJsonStructure([
                'favorites' => [
                    '*' => ['id', 'game_id', 'game_name', 'cover_url']
                ]
            ]);

        // Remove from favorites
        $removeResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/delUserFavourit', [
            'favorite_id' => $getResponse->json('favorites.0.id')
        ]);

        $removeResponse->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function user_can_add_and_remove_friend()
    {
        // Login first user
        $loginResponse1 = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        $token1 = $loginResponse1->json('token');
        
        // Login second user
        $loginResponse2 = $this->postJson('/api/login', [
            'email' => 'friend@example.com',
            'password' => 'password123',
        ]);
        $token2 = $loginResponse2->json('token');
        
        // User 1 sends friend request to User 2
        $addResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token1,
        ])->postJson('/api/addFriend', [
            'friend_id' => $this->friendUser->id,
        ]);

        $addResponse->assertStatus(200)
            ->assertJson(['success' => true]);

        // Get friends list for User 1
        $getResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token1,
        ])->postJson('/api/getFriends');

        $getResponse->assertStatus(200)
            ->assertJsonStructure([
                'friends' => [
                    '*' => ['id', 'name', 'email']
                ]
            ]);

        // Remove friend
        $removeResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token1,
        ])->postJson('/api/delFriend', [
            'friend_id' => $this->friendUser->id,
        ]);

        $removeResponse->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    /** @test */
    public function user_can_search_games()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'test@example.com',
            'password' => 'password123',
        ]);
        
        $token = $loginResponse->json('token');
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/search', [
            'query' => 'test game',
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'results' => [
                    '*' => ['id', 'name', 'cover']
                ]
            ]);
    }
}
