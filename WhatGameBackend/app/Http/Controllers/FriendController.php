<?php

namespace App\Http\Controllers;

use App\Models\Friend;
use Throwable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FriendController extends Controller
{
    public function addFriend(Request $request)
    {
        try {
            $request->validate([
                $request->receiver_id => 'required|exists:users,id',
            ]);

            Friend::create([
                'sender_id' => $request->user()->id,
                'receiver_id' => $request->receiver_id,
                'accepted' => false
            ]);

            return response()->json(['success' => 'Friend request sent'], 200);
        } catch (Throwable $th) {
            Log::error('Failed to add friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to add friend'], 500);
        }
    }

    public function getFriends(Request $request)
    {
        try {
            $request->validate([
                $request->user_id => 'required|exists:users,id',
            ]);

            $friends = Friend::where('sender_id', $request->user_id)->andWhere('accepted', true)->orWhere('receiver_id', $request->user_id)->get();

            return response()->json($friends, 200);
        } catch (Throwable $th) {
            Log::error('Failed to get friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get friends'], 500);
        }
    }

    public function delFriend(Request $request)
    {
        try {
            $request->validate([
                $request->receiver_id => 'required|exists:users,id',
            ]);
        } catch (Throwable $th) {
            Log::error('Failed to remove friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to remove friend'], 500);
        }
    }

}
