<?php

namespace App\Http\Controllers;

use Exception;
use Throwable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use app\Models\Game;
use Illuminate\Support\Facades\Log;

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
            Log::error('Failed to get games from RAWG API', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get games from RAWG API'], 500);
        }
    }

    public function addToFavourites(Request $request) {
        try {
            $request->validate([
                'game_id' => 'required',
            ]);

            $game = Game::create([
                'game_id' => $request->game_id,
                'user_id' => $request->user()->id,
            ]);

            return response()->json(['success' => 'Game added to favourites'], 200);

            
        } catch (Throwable $th) {
            Log::error('Failed to get games from RAWG API', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to set game as favourite'], 500);
        }
        
    }

    public function getUserFavourites(Request $request) {
        try {
            $request->validate([
                'user_id' => 'required',
            ]);

            $favourites = Game::where('user_id', $request->user_id)->get();
            $favResponse = [];
            foreach ($favourites as $key => $value) {
                $favResponse[] = Game::find($value->game_id)->getInfo();
            }

            return response()->json($favResponse, 200);
        } catch (Throwable $th) {
            Log::error('Failed to get Favourited games', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get favorited games'], 500);
        }

        
    }

    public function delUserFavourit(Request $request) {
        try {
            $request->validate([
                'game_id' => 'required',
            ]);

            Game::where('game_id', $request->game_id)->delete();

            return response()->json(['success' => 'Game removed from favourites'], 200);
        } catch (\Throwable $th) {
            Log::error('Failed to remove game from favorite', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to remove game from favourites'], 500);
        }
    }
}
