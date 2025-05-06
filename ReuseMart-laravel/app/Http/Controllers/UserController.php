<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\User;
use Exception;

class UserController extends Controller
{
    public function index()
    {
        try {
            $users = User::with('role')->get();
            return response()->json($users);
        } catch (Exception $e) {
            Log::error('Error fetching users: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch users'], 500);
        }
    }

    public function show($id)
    {
        try {
            $user = User::with('role')->findOrFail($id);
            return response()->json($user);
        } catch (Exception $e) {
            Log::error('Error fetching user: ' . $e->getMessage());
            return response()->json(['error' => 'User not found'], 404);
        }
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:user,email',
            'password'   => 'required|string|min:6',
            'id_role'    => 'required|exists:role,id_role',
            'no_telp'    => 'required|string|max:15',
            'profile_picture' => 'nullable|numeric',
            'NIK' => 'nullable|string|max:16',
            'rating' => 'nullable|numeric',
            'saldo' => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $user = User::create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
                'email'      => $request->email,
                'password'   => Hash::make($request->password),
                'id_role'    => $request->id_role,
                'no_telp'    => $request->no_telp,
                'profile_picture' => $request->profile_picture ?? null,
                'poin_loyalitas' => 0,
                'NIK' => $request->NIK ?? null,
                'rating' => $request->rating ?? null,
                'saldo' => $request->saldo ?? null,
            ]);

            return response()->json([
                'message' => 'User registered successfully',
                'user' => $user,
            ], 201);
        } catch (Exception $e) {
            Log::error('Register error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to register user',
                'exception' => $e->getMessage()
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $user = User::with('role')->where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => [
                'id' => $user->id_user,
                'name' => $user->first_name . ' ' . $user->last_name,
                'email' => $user->email,
                'role' => $user->role->nama_role ?? null,
            ],
        ]);
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $users = User::where('first_name', 'LIKE', "%$query%")
                         ->orWhere('last_name', 'LIKE', "%$query%")
                         ->get();

            return response()->json($users);
        } catch (Exception $e) {
            Log::error('Error searching users: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to search users'], 500);
        }
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully']);
    }

    public function unifiedLogin(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        // Coba login sebagai User dulu
        $user = \App\Models\User::with('role')->where('email', $request->email)->first();

        if ($user && \Hash::check($request->password, $user->password)) {
            $token = $user->createToken('user_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'type' => 'user',
                'user' => [
                    'id' => $user->id_user,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role->nama_role ?? null,
                ]
            ]);
        }

        // bistu baru pegawai
        $pegawai = \App\Models\Pegawai::with('jabatan')->where('email', $request->email)->first();

        if ($pegawai && \Hash::check($request->password, $pegawai->password)) {
            $token = $pegawai->createToken('pegawai_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'type' => 'pegawai',
                'pegawai' => [
                    'id' => $pegawai->id_pegawai,
                    'name' => $pegawai->first_name . ' ' . $pegawai->last_name,
                    'email' => $pegawai->email,
                    'jabatan' => $pegawai->jabatan->nama_jabatan ?? null,
                ]
            ]);
        }

        return response()->json(['error' => 'Invalid credentials'], 401);
    }
}
