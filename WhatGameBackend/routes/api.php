<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\GamesController;
use App\Http\Controllers\AuthController;

Route::post('/register', [AuthController::class, 'register'])->name('register');
Route::post('/login', [AuthController::class, 'login'])->name('login');
Route::get('/status', function (Request $request) {
    return response()->json(['success' => 'success'], 200);
});

Route::middleware('auth:sanctum')->group(function () {

    // user
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/logout', [AuthController::class, 'logout']) ->name('logout');

    // favourites
    Route::post('/search', [GamesController::class, 'searchGame'])->name('search');
    Route::post('/addToFavourites', [GamesController::class, 'addToFavourites'])->name('addToFavourites');
    Route::post('/getUserFavourites', [GamesController::class, 'getUserFavourites'])->name('getUserFavourites');
    Route::post('/delUserFavourit', [GamesController::class, 'delUserFavourit'])->name('delUserFavourit');

    // friends
    Route::post('/addFriend', [GamesController::class, 'addFriend'])->name('addFriend');
    Route::post('/getFriends', [GamesController::class, 'getFriends'])->name('getFriends');
    Route::post('/delFriend', [GamesController::class, 'delFriend'])->name('delFriend');
    
    // lobby system
    Route::prefix('lobby')->group(function () {
        Route::post('/create', [LobbyController::class, 'createLobby'])->name('lobby.create');
        Route::post('/join', [LobbyController::class, 'joinLobby'])->name('lobby.join');
        Route::post('/leave', [LobbyController::class, 'leaveLobby'])->name('lobby.leave');
        Route::get('/list', [LobbyController::class, 'getLobbies'])->name('lobby.list');
        Route::get('/info', [LobbyController::class, 'getLobbyInfo'])->name('lobby.info');
    });
    
});
