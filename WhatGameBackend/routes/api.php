<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GamesController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\FriendController;
use App\Http\Controllers\LobbyController;
use App\Http\Controllers\VoteController;

Route::post("/register", [AuthController::class, "register"])->name("register");
Route::post("/login", [AuthController::class, "login"])->name("login");
Route::get("/status", function (Request $request) {
    return response()->json(["success" => "success"], 200);
});

Route::middleware("auth:sanctum")->group(function () {
    // user
    Route::get("/user", function (Request $request) {
        return $request->user();
    });
    Route::post("/logout", [AuthController::class, "logout"])->name("logout");
    Route::post("/delUser", [AuthController::class, "delUser"])->name(
        "delUser",
    );
    Route::post("/updateUser", [AuthController::class, "updateUser"])->name(
        "updateUser",
    );
    Route::post("/changePassword", [
        AuthController::class,
        "changePassword",
    ])->name("changePassword");

    // favourites
    Route::post("/search", [GamesController::class, "searchGame"])->name(
        "search",
    );
    Route::post("/addToFavourites", [
        GamesController::class,
        "addToFavourites",
    ])->name("addToFavourites");
    Route::post("/getUserFavourites", [
        GamesController::class,
        "getUserFavourites",
    ])->name("getUserFavourites");

    // friends
    Route::post("/addFriend", [FriendController::class, "addFriend"])->name(
        "addFriend",
    );
    Route::post("/acceptFriend", [
        FriendController::class,
        "acceptFriend",
    ])->name("addFriend");
    Route::post("/getFriends", [FriendController::class, "getFriends"])->name(
        "getFriends",
    );
    Route::get("/getPending", [FriendController::class, "getPending"])->name(
        "getPending",
    );
    Route::post("/removeFriend", [
        FriendController::class,
        "removeFriend",
    ])->name("removeFriend");
    Route::post("/peopleSearch", [
        FriendController::class,
        "peopleSearch",
    ])->name("peopleSearch");

    // lobbys
    Route::post("/createLobby", [LobbyController::class, "createLobby"])->name(
        "createLobby",
    );
    Route::post("/joinLobby", [LobbyController::class, "joinLobby"])->name(
        "joinLobby",
    );
    Route::get("/leaveLobby", [LobbyController::class, "leaveLobby"])->name(
        "leaveLobby",
    );
    Route::post("/getLobbies", [LobbyController::class, "getLobbies"])->name(
        "getLobbies",
    );
    Route::get("/getLobbyInfo", [LobbyController::class, "getLobbyInfo"])->name(
        "getLobbyInfo",
    );

    // voting
    Route::post("/startVoting", [VoteController::class, "startVoting"])->name(
        "startVoting",
    );
    Route::post("/postVote", [VoteController::class, "postVote"])->name(
        "postVote",
    );
    Route::get("/voteResult", [VoteController::class, "voteResult"])->name(
        "voteResult",
    );
    Route::get("/getVoteGames", [VoteController::class, "getVoteGames"])->name(
        "getVoteGames",
    );

    //del later
    Route::get("/getAllLobies", [LobbyController::class, "getAllLobies"])->name(
        "getAllLobies",
    );
    Route::get("/delAllLobies", [LobbyController::class, "delAllLobies"])->name(
        "delAllLobies",
    );
});
