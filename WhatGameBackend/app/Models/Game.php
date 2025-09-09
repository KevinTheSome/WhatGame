<?php

namespace App\Models;

use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class game extends Model
{
    protected $table = 'games';

    protected $fillable = [
        'user_id',
        'game_id',
    ];

    public function getInfo()
    {
        try {
            $results =  Http::get('https://api.rawg.io/api/games/{game_id}?key={key}', [
                'key' => env('RAWG_API_KEY'),
                'game_id' => $this->game_id,
            ]);

            $results->throw();

            return $results->json();
        } catch (Exception $e) {
            // Handle the error
            Log::error('Failed to get games from RAWG API', [
                'error' => $e->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get games from RAWG API'], 500);
        }
    }
}
