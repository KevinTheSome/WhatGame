<?php

namespace App\Http\Controllers;

use App\Models\Friend;
use App\Models\User;
use Throwable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class FriendController extends Controller
{
    public function peopleSearch(Request $request)
    {
        try {
            $request->validate([
                "name" => 'required|string',
            ]);

            $user_ids = Friend::where('sender_id', $request->user()->id)->pluck('receiver_id')->toArray();
            $user_ids = array_merge($user_ids, Friend::where('receiver_id', $request->user()->id)->pluck('sender_id')->toArray());
            $users = User::where('name', 'like', '%' . $request->name . '%')->where('id', '!=', $request->user()->id)->whereNotIn('id', $user_ids)->get();
            
            return response()->json($users, 200);
        } catch (Throwable $th) {
            Log::error('Failed to get friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get friend', 'errorMessage' => $th->getMessage()], 500);
        }
    }

    public function addFriend(Request $request)
    {
        try {
            $request->validate([
                "receiver_id" => 'required|exists:users,id',
            ]);

            if(Friend::where('sender_id', $request->user()->id)->where('receiver_id', $request->receiver_id)->exists()) {
                return response()->json(['error' => 'Friend request already sent'], 400);
            }
            if ($request->receiver_id == $request->user()->id){
                return response()->json(['error' => 'You can\'t be your own friends'], 400);     
            }

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

            return response()->json(['error' => 'Failed to add friend', 'errorMessage' => $th->getMessage()], 500);
        }
    }

    public function getFriends(Request $request)
    {
        try {
            $friends = Friend::where('sender_id', $request->user()->id)->where('accepted', true)->get();
            return response()->json($friends, 200);
        } catch (Throwable $th) {
            Log::error('Failed to get friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get friends', 'errorMessage' => $th->getMessage()], 500);
        }
    }

    public function getPending(Request $request)
    {
        try {
            $friends = Friend::where('receiver_id', $request->user()->id)->where('sender_id', $request->user()->id)->where('accepted', false)
            ->join('users', 'users.id', '=', 'friends.sender_id')
            ->select('friends.*', 'users.name')->get();
            return response()->json($friends, 200);
        } catch (Throwable $th) {
            Log::error('Failed to get friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to get friends', 'errorMessage' => $th->getMessage()], 500);
        }
    }

    public function delFriend(Request $request)
    {
        try {
            $request->validate([
                "frainds_id" => 'required|exists:users,id',
            ]);

            Friend::where('sender_id', $request->user()->id)->where('receiver_id', $request->frainds_id)->delete();
            Friend::where('sender_id', $request->frainds_id)->where('receiver_id', $request->user()->id)->delete();
            return response()->json(['success' => 'Friend removed'], 200);
        } catch (Throwable $th) {
            Log::error('Failed to remove friend', [
                'error' => $th->getMessage()
            ]);

            return response()->json(['error' => 'Failed to remove friend'], 500);
        }
    }

}
