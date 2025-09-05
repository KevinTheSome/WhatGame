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
    Route::get('/user', function (Request $request) {
        return $request->user();
    });
    Route::post('/search', [GamesController::class, 'searchGame'])->name('search');
    Route::post('/logout', [AuthController::class, 'logout']) ->name('logout');
});
