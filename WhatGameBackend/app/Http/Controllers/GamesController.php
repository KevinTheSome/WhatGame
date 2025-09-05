<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class gamesController extends Controller
{
    public function searchGame(Request $request) {
        try {
            $results =  Http::get('https://api.rawg.io/api/games?key={key}&search={search}&page={page}&page_size=12', [
                'key' => env('RAWG_API_KEY'),
                'search' => $request->search,
                'page' => $request->page,
            ]);

            $results->throw();

            return $results->json();
        } catch (\Exception $e) {
            // Handle the error
            \Log::error('Failed to get games from RAWG API', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get games from RAWG API'], 500);
        }
    }

    public function addToFavourites(Request $request) {
        try {
            
        } catch (\Throwable $th) {
            \Log::error('Failed to get games from RAWG API', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to set game as favourite'], 500);
        }
        
    }
}
