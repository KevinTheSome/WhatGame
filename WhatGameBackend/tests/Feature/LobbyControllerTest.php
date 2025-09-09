<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class LobbyControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        
        // Create test users
        $this->user1 = User::factory()->create([
            'name' => 'User One',
            'email' => 'user1@example.com',
            'password' => Hash::make('password123'),
        ]);
        
        $this->user2 = User::factory()->create([
            'name' => 'User Two',
            'email' => 'user2@example.com',
            'password' => Hash::make('password123'),
        ]);
    }

    /** @test */
    public function user_can_create_a_lobby()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);
        
        $token = $loginResponse->json('token');
        
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/lobby/create', [
            'user_id' => (string)$this->user1->id,
            'name' => 'Test Lobby'
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'lobby' => [
                    'id',
                    'name',
                    'creator_id',
                    'users',
                    'user_count'
                ]
            ]);
    }

    /** @test */
    public function user_can_join_and_leave_lobby()
    {
        // User 1 creates a lobby
        $loginResponse1 = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);
        $token1 = $loginResponse1->json('token');
        
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token1,
        ])->postJson('/api/lobby/create', [
            'user_id' => (string)$this->user1->id,
            'name' => 'Test Lobby'
        ]);
        
        $lobbyId = $createResponse->json('lobby.id');
        
        // User 2 joins the lobby
        $loginResponse2 = $this->postJson('/api/login', [
            'email' => 'user2@example.com',
            'password' => 'password123',
        ]);
        $token2 = $loginResponse2->json('token');
        
        $joinResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token2,
        ])->postJson('/api/lobby/join', [
            'user_id' => (string)$this->user2->id,
            'lobby_id' => $lobbyId
        ]);
        
        $joinResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'lobby' => [
                    'id' => $lobbyId,
                    'user_count' => 2
                ]
            ]);
            
        // User 2 leaves the lobby
        $leaveResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token2,
        ])->postJson('/api/lobby/leave', [
            'user_id' => (string)$this->user2->id,
            'lobby_id' => $lobbyId
        ]);
        
        $leaveResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'lobby_removed' => false
            ]);
    }

    /** @test */
    public function lobby_is_deleted_when_last_user_leaves()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);
        $token = $loginResponse->json('token');
        
        // Create lobby
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/lobby/create', [
            'user_id' => (string)$this->user1->id,
            'name' => 'Test Lobby'
        ]);
        
        $lobbyId = $createResponse->json('lobby.id');
        
        // Leave lobby (should delete it)
        $leaveResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/lobby/leave', [
            'user_id' => (string)$this->user1->id,
            'lobby_id' => $lobbyId
        ]);
        
        $leaveResponse->assertStatus(200)
            ->assertJson([
                'success' => true,
                'lobby_removed' => true,
                'message' => 'Left lobby and it was removed as it became empty'
            ]);
            
        // Verify lobby no longer exists
        $infoResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/lobby/info?lobby_id=$lobbyId");
        
        $infoResponse->assertStatus(404);
    }

    /** @test */
    public function can_list_all_lobbies()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);
        $token = $loginResponse->json('token');
        
        // Create a lobby
        $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/lobby/create', [
            'user_id' => (string)$this->user1->id,
            'name' => 'Test Lobby'
        ]);
        
        // Get list of lobbies
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson('/api/lobby/list');
        
        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'lobbies' => [
                    '*' => [
                        'id',
                        'name',
                        'creator_id',
                        'users',
                        'user_count'
                    ]
                ]
            ]);
    }

    /** @test */
    public function can_get_lobby_info()
    {
        $loginResponse = $this->postJson('/api/login', [
            'email' => 'user1@example.com',
            'password' => 'password123',
        ]);
        $token = $loginResponse->json('token');
        
        // Create a lobby
        $createResponse = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->postJson('/api/lobby/create', [
            'user_id' => (string)$this->user1->id,
            'name' => 'Test Lobby'
        ]);
        
        $lobbyId = $createResponse->json('lobby.id');
        
        // Get lobby info
        $response = $this->withHeaders([
            'Authorization' => 'Bearer ' . $token,
        ])->getJson("/api/lobby/info?lobby_id=$lobbyId");
        
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'lobby' => [
                    'id' => $lobbyId,
                    'name' => 'Test Lobby',
                    'creator_id' => (string)$this->user1->id,
                    'user_count' => 1
                ]
            ]);
    }
}
