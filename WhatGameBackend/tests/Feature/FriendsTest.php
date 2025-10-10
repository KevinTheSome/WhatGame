<?php

use App\Models\User;
use App\Models\Friend;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\Fluent\AssertableJson;

uses(RefreshDatabase::class);

test("peopleSearch requires authentication", function () {
    $response = $this->postJson("/api/peopleSearch");

    $response->assertStatus(401);
});

test(
    "peopleSearch returns all users except self and existing friends/requests without search",
    function () {
        $user = User::factory()->create();
        $friendUser1 = User::factory()->create();
        $friendUser2 = User::factory()->create();
        $otherUser1 = User::factory()->create();
        $otherUser2 = User::factory()->create();

        // Create friend relationships
        Friend::create([
            "sender_id" => $user->id,
            "receiver_id" => $friendUser1->id,
            "accepted" => false,
        ]);
        Friend::create([
            "sender_id" => $friendUser2->id,
            "receiver_id" => $user->id,
            "accepted" => true,
        ]);

        $this->actingAs($user, "sanctum");

        $response = $this->postJson("/api/peopleSearch");

        $response
            ->assertStatus(200)
            ->assertJsonCount(2)
            ->assertJsonMissing(["id" => $user->id])
            ->assertJsonMissing(["id" => $friendUser1->id])
            ->assertJsonFragment(["id" => $otherUser1->id])
            ->assertJsonFragment(["id" => $otherUser2->id]);
    },
);

test("peopleSearch filters users by name with search parameter", function () {
    $user = User::factory()->create(["name" => "Alice"]);
    $matchingUser = User::factory()->create(["name" => "Alice Smith"]);
    $nonMatchingUser = User::factory()->create(["name" => "Bob Johnson"]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/peopleSearch", ["search" => "Alice"]);

    $response
        ->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment(["name" => "Alice Smith"])
        ->assertJsonMissing(["name" => "Bob Johnson"]);
});

test("peopleSearch handles empty search gracefully", function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/peopleSearch", ["search" => ""]);

    $response
        ->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment(["id" => $otherUser->id]);
});

test("addFriend requires authentication", function () {
    $response = $this->postJson("/api/addFriend", ["friend_id" => 1]);

    $response->assertStatus(401);
});

test("addFriend validates required friend_id", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/addFriend");

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("addFriend validates friend_id exists", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/addFriend", ["friend_id" => 999]);

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("addFriend prevents self-friending", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/addFriend", ["friend_id" => $user->id]);

    $response
        ->assertStatus(400)
        ->assertJsonFragment(["error" => "You can't be your own friends"]);
});

test("addFriend prevents duplicate requests", function () {
    $user = User::factory()->create();
    $friendUser = User::factory()->create();

    Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $friendUser->id,
        "accepted" => false,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/addFriend", [
        "friend_id" => $friendUser->id,
    ]);

    $response
        ->assertStatus(400)
        ->assertJsonFragment(["error" => "Friend request already sent"]);
});

test("addFriend successfully sends a friend request", function () {
    $user = User::factory()->create();
    $friendUser = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/addFriend", [
        "friend_id" => $friendUser->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonFragment(["success" => "Friend request sent"]);

    $this->assertDatabaseHas("friends", [
        "sender_id" => $user->id,
        "receiver_id" => $friendUser->id,
        "accepted" => false,
    ]);
});

test("acceptFriend requires authentication", function () {
    $response = $this->postJson("/api/acceptFriend", ["friend_id" => 1]);

    $response->assertStatus(401);
});

test("acceptFriend validates required friend_id", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/acceptFriend");

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("acceptFriend validates friend_id exists in friends table", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/acceptFriend", ["friend_id" => 999]);

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("acceptFriend prevents accepting as non-receiver", function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();
    $wrongUser = User::factory()->create();

    $friend = Friend::create([
        "sender_id" => $sender->id,
        "receiver_id" => $receiver->id,
        "accepted" => false,
    ]);

    $this->actingAs($wrongUser, "sanctum");

    $response = $this->postJson("/api/acceptFriend", [
        "friend_id" => $friend->id,
    ]);

    $response->assertStatus(400)->assertJsonFragment([
        "error" => 'You can\'t accept this friend request',
    ]);
});

test(
    "acceptFriend prevents re-accepting already accepted request",
    function () {
        $sender = User::factory()->create();
        $receiver = User::factory()->create();

        $friend = Friend::create([
            "sender_id" => $sender->id,
            "receiver_id" => $receiver->id,
            "accepted" => true,
        ]);

        $this->actingAs($receiver, "sanctum");

        $response = $this->postJson("/api/acceptFriend", [
            "friend_id" => $friend->id,
        ]);

        $response->assertStatus(400)->assertJsonFragment([
            "error" => "You already accepted this friend request",
        ]);
    },
);

test("acceptFriend successfully accepts a pending request", function () {
    $sender = User::factory()->create();
    $receiver = User::factory()->create();

    $friend = Friend::create([
        "sender_id" => $sender->id,
        "receiver_id" => $receiver->id,
        "accepted" => false,
    ]);

    $this->actingAs($receiver, "sanctum");

    $response = $this->postJson("/api/acceptFriend", [
        "friend_id" => $friend->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonFragment(["success" => "Friend request accepted"]);

    $this->assertDatabaseHas("friends", [
        "id" => $friend->id,
        "accepted" => true,
    ]);
});

test("getFriends requires authentication", function () {
    $response = $this->postJson("/api/getFriends");

    $response->assertStatus(401);
});

test("getFriends returns accepted friends without search", function () {
    $user = User::factory()->create();
    $friendUser1 = User::factory()->create(["name" => "Friend One"]);
    $friendUser2 = User::factory()->create(["name" => "Friend Two"]);
    $otherUser = User::factory()->create();

    // Create accepted friends
    Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $friendUser1->id,
        "accepted" => true,
    ]);
    Friend::create([
        "sender_id" => $friendUser2->id,
        "receiver_id" => $user->id,
        "accepted" => true,
    ]);
    // Pending should not be included
    Friend::create([
        "sender_id" => $otherUser->id,
        "receiver_id" => $user->id,
        "accepted" => false,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/getFriends");

    $response
        ->assertStatus(200)
        ->assertJsonCount(2)
        ->assertJsonFragment(["name" => "Friend One"])
        ->assertJsonFragment(["name" => "Friend Two"]);
});

test("getFriends filters friends by name with search", function () {
    $user = User::factory()->create();
    $matchingFriend = User::factory()->create(["name" => "Alice Friend"]);
    $nonMatchingFriend = User::factory()->create(["name" => "Bob Friend"]);

    Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $matchingFriend->id,
        "accepted" => true,
    ]);
    Friend::create([
        "sender_id" => $nonMatchingFriend->id,
        "receiver_id" => $user->id,
        "accepted" => true,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/getFriends", ["search" => "Alice"]);

    $response
        ->assertStatus(200)
        ->assertJsonCount(1)
        ->assertJsonFragment(["name" => "Alice Friend"])
        ->assertJsonMissing(["name" => "Bob Friend"]);
});

test("getPending requires authentication", function () {
    $response = $this->getJson("/api/getPending");

    $response->assertStatus(401);
});

test("getPending returns pending requests without search", function () {
    $user = User::factory()->create();
    $sentTo = User::factory()->create(["name" => "Sent To"]);
    $receivedFrom = User::factory()->create(["name" => "Received From"]);
    $friendUser = User::factory()->create(); // Accepted, should not include

    // Pending sent
    Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $sentTo->id,
        "accepted" => false,
    ]);
    // Pending received
    Friend::create([
        "sender_id" => $receivedFrom->id,
        "receiver_id" => $user->id,
        "accepted" => false,
    ]);
    // Accepted, exclude
    Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $friendUser->id,
        "accepted" => true,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->getJson("/api/getPending");

    $response
        ->assertStatus(200)
        ->assertJsonCount(2)
        ->assertJsonFragment(["name" => "Sent To"])
        ->assertJsonFragment(["name" => "Received From"]);
});

test(
    "getPending filters pending requests by name with search query param",
    function () {
        $user = User::factory()->create();
        $matchingSent = User::factory()->create(["name" => "Alice Pending"]);
        $nonMatchingSent = User::factory()->create(["name" => "Bob Pending"]);

        Friend::create([
            "sender_id" => $user->id,
            "receiver_id" => $matchingSent->id,
            "accepted" => false,
        ]);
        Friend::create([
            "sender_id" => $nonMatchingSent->id,
            "receiver_id" => $user->id,
            "accepted" => false,
        ]);

        $this->actingAs($user, "sanctum");

        $response = $this->getJson("/api/getPending?search=Alice");

        $response
            ->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonFragment(["name" => "Alice Pending"])
            ->assertJsonMissing(["name" => "Bob Pending"]);
    },
);

test("removeFriend requires authentication", function () {
    $response = $this->postJson("/api/removeFriend", ["friend_id" => 1]);

    $response->assertStatus(401);
});

test("removeFriend validates required friend_id", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/removeFriend");

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("removeFriend validates friend_id exists", function () {
    $user = User::factory()->create();

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/removeFriend", ["friend_id" => 999]);

    $response->assertStatus(422)->assertJsonValidationErrors(["friend_id"]);
});

test("removeFriend successfully removes a friend record", function () {
    $user = User::factory()->create();
    $friendUser = User::factory()->create();

    $friend = Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $friendUser->id,
        "accepted" => true,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/removeFriend", [
        "friend_id" => $friend->id,
    ]);

    $response
        ->assertStatus(200)
        ->assertJsonFragment(["success" => "Friend removed"]);

    $this->assertDatabaseMissing("friends", ["id" => $friend->id]);
});

test("removeFriend works for pending requests", function () {
    $user = User::factory()->create();
    $friendUser = User::factory()->create();

    $friend = Friend::create([
        "sender_id" => $user->id,
        "receiver_id" => $friendUser->id,
        "accepted" => false,
    ]);

    $this->actingAs($user, "sanctum");

    $response = $this->postJson("/api/removeFriend", [
        "friend_id" => $friend->id,
    ]);

    $response->assertStatus(200);

    $this->assertDatabaseMissing("friends", ["id" => $friend->id]);
});
