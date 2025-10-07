<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class Game extends Model
{
    protected $table = "games";

    protected $fillable = ["user_id", "game_id"];

    /**
     * Get the user who favorited this game
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getInfo()
    {
        try {
            $results = Http::get(
                "https://api.rawg.io/api/games/{$this->game_id}?key=" .
                    env("RAWG_API_KEY"),
            );

            $results->throw();

            return $results->json();
        } catch (Exception $e) {
            Log::error("Failed to get games from RAWG API", [
                "error" => $e->getMessage(),
            ]);

            return response()->json(
                ["error" => "Failed to get games from RAWG API"],
                500,
            );
        }
    }
}
