<?php

namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8'
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password)
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function delUser(Request $request){
        $request->validate([
            "user_pass" => 'required|string|min:8'
        ]);

        if(!Hash::check($request->user_pass, $request->user()->password)){
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $request->user()->delete();
        return response()->json(['message' => 'User deleted'], 200);
    }

    // paarbauda lietotāja datus un aizūta derīgu token
    public function login(Request $request)
    {
        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        $user = User::where('email', $request['email'])->firstOrFail();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Successfully logged out']);
    }

    public function changePassword(Request $request){
        $request->validate([
            "user_pass" => 'required|string|min:8',
            "new_pass" => 'required|string|min:8',
            "new_pass_confirm" => 'required|string|min:8',
        ]);

        if(!Hash::check($request->user_pass, $request->user()->password)){
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if($request->new_pass == $request->user()->password){
            return response()->json(['error' => 'Passwords can\'t be the same'], 400);
        }

        if($request->new_pass != $request->new_pass_confirm){
            return response()->json(['error' => 'Passwords do not match'], 400);
        }

        $request->user()->update([
            'password' => Hash::make($request->new_pass)
        ]);

        return response()->json(['message' => 'Password changed successfully']);
    }

    public function updateUser(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|string|email|max:255|unique:users,email,' . $user->id,
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user->update($request->only('name', 'email'));

        return response()->json(['message' => 'User updated successfully', 'user' => $user]);
    }
}