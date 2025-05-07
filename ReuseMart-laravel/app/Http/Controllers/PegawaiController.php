<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\Pegawai;
use Exception;

class PegawaiController extends Controller
{
    public function index()
    {
        try {
            $pegawai = Pegawai::with('jabatan')->get();
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pegawai'], 500);
        }
    }

    public function show($id)
    {
        try {
            $pegawai = Pegawai::with('jabatan')->findOrFail($id);
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Pegawai not found'], 404);
        }
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_jabatan' => 'required|exists:jabatan,id_jabatan',
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'email'      => 'required|email|unique:pegawai,email',
            'password'   => 'required|string|min:6',
            'no_telp'    => 'required|string|max:15',
            'komisi'     => 'nullable|numeric|max:19',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $pegawai = Pegawai::create([
                'id_jabatan' => $request->id_jabatan,
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
                'email'      => $request->email,
                'password'   => Hash::make($request->password),
                'no_telp'    => $request->no_telp,
                'komisi'     => $request->komisi ?? 0,
            ]);

            return response()->json(['message' => 'Pegawai registered successfully', 'pegawai' => $pegawai], 201);
        } catch (Exception $e) {
            Log::error('Register error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to register pegawai',
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

        $pegawai = Pegawai::with('jabatan')->where('email', $request->email)->first();

        if (!$pegawai || !Hash::check($request->password, $pegawai->password)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        $token = $pegawai->createToken('pegawai_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'pegawai' => [
                'id' => $pegawai->id_pegawai,
                'name' => $pegawai->first_name . ' ' . $pegawai->last_name,
                'email' => $pegawai->email,
                'jabatan' => $pegawai->jabatan->nama_jabatan ?? null,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully']);
    }

    public function update(Request $request, $id)
    {
        try {
            $pegawai = Pegawai::findOrFail($id);

            $data = $request->only([
                'first_name', 'last_name', 'email', 'id_jabatan', 'no_telp', 'komisi'
            ]);

            if ($request->filled('password')) {
                $data['password'] = Hash::make($request->password);
            }

            $pegawai->update($data);

            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error updating pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update pegawai'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $pegawai = Pegawai::findOrFail($id);
            $pegawai->delete();
            return response()->json(['message' => 'Pegawai deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete pegawai'], 500);
        }
    }

    public function search(Request $request)
    {
        try {
            $query = $request->input('query');
            $pegawai = Pegawai::where('first_name', 'LIKE', "%$query%")
                              ->orWhere('last_name', 'LIKE', "%$query%")
                              ->get();

            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error searching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to search pegawai'], 500);
        }
    }
}
