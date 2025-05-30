<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use App\Models\User;
use App\Mail\PasswordResetMail;
use Carbon\Carbon;
use App\Models\Penitipan;
use App\Models\Barang;
use Exception;

class UserController extends Controller
{

    public function index()
    {
        try {
            $organisasi = User::with('role')
                ->whereHas('role', function ($query) {
                    $query->where('nama_role', 'Organisasi');
                })
                ->get();

            return response()->json($organisasi, 200);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Failed to fetch organizations',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function getUserPegawai(Request $request)
    {
        $user = $request->user();
        if ($user instanceof \App\Models\User) {
            return response()->json([
                'type' => 'user',
                'user' => [
                    'id' => $user->id_user,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'role' => $user->role->nama_role ?? null,
                ],
                'access_token' => $request->bearerToken(),
                'token_type' => 'Bearer',
            ]);
        } elseif ($user instanceof \App\Models\Pegawai) {
            return response()->json([
                'type' => 'pegawai',
                'pegawai' => [
                    'id' => $user->id_pegawai,
                    'name' => $user->first_name . ' ' . $user->last_name,
                    'email' => $user->email,
                    'jabatan' => $user->jabatan->nama_jabatan ?? null,
                ],
                'access_token' => $request->bearerToken(),
                'token_type' => 'Bearer',
            ]);
        }
        return response()->json(['error' => 'User not found'], 404);
    }

    public function publicList()
    {
        $users = User::select('id_user', 'first_name', 'last_name', 'no_telp', 'rating', 'email', 'poin_loyalitas')->get();

        return response()->json($users);
    }

    public function gudangList()
    {
        $users = User::select('id_user', 'id_role', 'first_name', 'last_name', 'no_telp', 'rating')->get();

        return response()->json($users);
    }


    public function me(Request $request)
    {
        $user = $request->user()->load('role', 'alamat', 'transaksi');
        return response()->json($user);
    }

    public function updateAvatar(Request $request)
    {
        $request->validate([
            "profile_picture" => "required|image|max:2048",
        ]);

        $user = $request->user();
        if ($user->profile_picture) {
            Storage::disk("public")->delete($user->profile_picture);
        }
        $path = $request
            ->file("profile_picture")
            ->store("profile_pictures", "public");
        $user->profile_picture = $path;
        $user->save();

        return response()->json([
            "profile_picture" => "/storage/" . $path,
        ]);
    }

    public function checkNIK(Request $request)
    {
        $exists = User::where('NIK', $request->input('NIK'))->exists();
        return response()->json(['unique' => !$exists]);
    }

    public function penitip()
    {
        try {
            $penitips = User::with(['role', 'alamat'])
                ->where('id_role', 2)
                ->get();

            return response()->json($penitips);
        } catch (Exception $e) {
            Log::error('Error fetching penitips: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch penitips'], 500);
        }
    }

    public function updatePenitip(Request $r, $id)
    {
        $data = $r->validate([
            'first_name' => 'required|string|max:255',
            'last_name'  => 'nullable|string|max:255',
            'email'      => 'required|email|unique:user,email,' . $id . ',id_user',
            'password'   => 'nullable|string|min:6',
            'no_telp'    => 'required|string|max:15',
            'saldo'      => 'nullable|numeric',
            'rating'     => 'nullable|numeric',
        ]);

        try {
            $user = User::findOrFail($id);
            $user->first_name = $data['first_name'];
            $user->last_name  = $data['last_name']  ?? $user->last_name;
            $user->email      = $data['email'];
            $user->no_telp    = $data['no_telp'];
            $user->saldo      = $data['saldo']       ?? $user->saldo;
            $user->rating     = $data['rating']      ?? $user->rating;
            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }
            $user->save();

            return response()->json(['message' => 'Penitip updated', 'user' => $user]);
        } catch (Exception $e) {
            Log::error("Failed updating penitip $id: " . $e->getMessage());
            return response()->json(['error' => 'Unable to update penitip'], 500);
        }
    }


    public function destroyPenitip($id)
    {
        try {
            User::destroy($id);
            return response()->json(['message' => 'Penitip deleted']);
        } catch (Exception $e) {
            Log::error("Failed deleting penitip $id: " . $e->getMessage());
            return response()->json(['error' => 'Unable to delete penitip'], 500);
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
            'first_name'      => 'required|string|max:255',
            'last_name'       => 'nullable|string|max:255',
            'email'           => 'required|email|unique:user,email',
            'password'        => 'required|string|min:6',
            'id_role'         => 'required|exists:role,id_role',
            'no_telp'         => 'required|string|max:15',
            'profile_picture' => 'nullable|image|max:2048',
            'NIK'             => 'nullable|string|max:16|unique:user,NIK',
            'rating'          => 'nullable|numeric',
            'saldo'           => 'nullable|numeric',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            // Handle the uploaded profile picture, if any
            $picturePath = null;
            if ($request->hasFile('profile_picture')) {
                $picturePath = $request
                    ->file('profile_picture')
                    ->store('profile_pictures', 'public');
            }

            $user = User::create([
                'first_name'      => $request->first_name,
                'last_name'       => $request->last_name ?? '',
                'email'           => $request->email,
                'password'        => Hash::make($request->password),
                'id_role'         => $request->id_role,
                'no_telp'         => $request->no_telp,
                'profile_picture' => $picturePath,            // store the relative path
                'poin_loyalitas'  => 0,
                'NIK'             => $request->NIK ?? null,
                'rating'          => $request->rating ?? null,
                'saldo'           => $request->saldo ?? null,
            ]);

            return response()->json([
                'message'         => 'User registered successfully',
                'user'            => $user,
                'profile_picture' => $picturePath ? '/storage/' . $picturePath : null,
            ], 201);
        } catch (Exception $e) {
            Log::error('Register error: ' . $e->getMessage());
            return response()->json([
                'error'     => 'Failed to register user',
                'exception' => $e->getMessage(),
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
                'name' => $user->first_name . ' ' . $user->last_name ?? "",
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

        if ($user && Hash::check($request->password, $user->password)) {
            $token = $user->createToken('user_token')->plainTextToken;

            return response()->json([
                'access_token' => $token,
                'token_type' => 'Bearer',
                'type' => 'user',
                'user' => [
                    'id' => $user->id_user,
                    'name' => $user->first_name . ' ' . $user->last_name ?? "",
                    'email' => $user->email,
                    'role' => $user->role->nama_role ?? null,
                ]
            ]);
        }

        // bistu baru pegawai
        $pegawai = \App\Models\Pegawai::with('jabatan')->where('email', $request->email)->first();

        if ($pegawai && Hash::check($request->password, $pegawai->password)) {
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

    public function deleteOrganisasi($id)
    {
        try {
            User::destroy($id);
            return response()->json(['message' => 'Organisasi deleted']);
        } catch (Exception $e) {
            Log::error("Failed deleting organisasi $id: " . $e->getMessage());
            return response()->json(['error' => 'Unable to delete penitip'], 500);
        }
    }

    public function updateOrganisasi(Request $r, $id)
    {
        $data = $r->validate([
            'first_name' => 'required|string|max:255',
            'email'      => 'required|email|unique:user,email,' . $id . ',id_user',
            'password'   => 'nullable|string|min:6',
        ]);

        try {
            $user = User::findOrFail($id);

            $user->first_name = $data['first_name'];
            $user->email      = $data['email'];

            if (!empty($data['password'])) {
                $user->password = Hash::make($data['password']);
            }

            $user->save();

            return response()->json(['message' => 'Organisasi berhasil diperbarui', 'user' => $user]);
        } catch (Exception $e) {
            Log::error("Gagal memperbarui organisasi $id: " . $e->getMessage());
            return response()->json(['error' => 'Gagal memperbarui organisasi'], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|exists:user,email', // Ubah ke 'user'
        ]);

        try {
            $user = User::where('email', strtolower($request->email))->first();

            if (!$user) {
                return response()->json([
                    'error' => 'Email tidak terdaftar',
                ], 404);
            }

            $token = Str::random(60);

            // Simpan token
            DB::table('password_reset_tokens')->updateOrInsert(
                ['email' => $user->email],
                [
                    'token' => Hash::make($token),
                    'created_at' => Carbon::now(),
                ]
            );

            // Buat URL reset
            $resetUrl = config('app.frontend_url') . '/reset-password?token=' . $token . '&email=' . urlencode($user->email);

            // Kirim email
            Mail::to($user->email)->send(new PasswordResetMail($user, $resetUrl));

            Log::info('Reset password link sent to: ' . $user->email);
            return response()->json([
                'message' => 'Link reset password telah dikirim ke email Anda',
            ], 200);
        } catch (Exception $e) {
            Log::error('Forgot password error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Gagal mengirim link reset password',
            ], 500);
        }
    }

    public function resetPassword(Request $request)
    {
        // Validasi input
        try {
            $request->validate([
                'email' => 'required|email|exists:user,email', // Ubah ke 'user'
                'token' => 'required|string',
                'password' => 'required|string|min:6|confirmed',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Validation failed in resetPassword: ' . json_encode($e->errors()));
            return response()->json([
                'error' => 'Validasi gagal',
                'details' => $e->errors(),
            ], 400);
        }

        try {
            // Normalisasi email
            $email = strtolower($request->email);

            // Cari token reset
            $passwordReset = DB::table('password_reset_tokens')
                ->where('email', $email)
                ->first();

            if (!$passwordReset) {
                Log::error('Token not found for email: ' . $email);
                return response()->json([
                    'error' => 'Token reset tidak valid atau email tidak ditemukan',
                ], 400);
            }

            // Periksa token
            if (!Hash::check($request->token, $passwordReset->token)) {
                Log::error('Token mismatch for email: ' . $email);
                return response()->json([
                    'error' => 'Token reset tidak valid',
                ], 400);
            }

            // Periksa kadaluarsa (1 jam)
            $createdAt = Carbon::parse($passwordReset->created_at);
            if ($createdAt->diffInHours(Carbon::now()) > 1) {
                Log::error('Token expired for email: ' . $email);
                return response()->json([
                    'error' => 'Token reset telah kadaluarsa',
                ], 400);
            }

            // Mulai transaksi
            DB::beginTransaction();

            // Update password
            $user = User::where('email', $email)->first();
            if (!$user) {
                DB::rollBack();
                Log::error('User not found for email: ' . $email);
                return response()->json([
                    'error' => 'Pengguna tidak ditemukan',
                ], 400);
            }

            $user->password = Hash::make($request->password);
            $user->save();

            // Hapus token
            DB::table('password_reset_tokens')
                ->where('email', $email)
                ->delete();

            DB::commit();

            Log::info('Password reset successfully for email: ' . $email);
            return response()->json([
                'message' => 'Password berhasil direset',
            ], 200);
        } catch (\Illuminate\Database\QueryException $e) {
            DB::rollBack();
            Log::error('Database error in resetPassword: ' . $e->getMessage());
            return response()->json([
                'error' => 'Gagal mereset password karena masalah database',
            ], 500);
        } catch (Exception $e) {
            DB::rollBack();
            Log::error('Reset password error: ' . $e->getMessage());
            return response()->json([
                'error' => 'Gagal mereset password',
            ], 500);
        }
    }

    public function tambahPoinPenitip($id_barang)
{
    try {
        // Fetch the barang to get id_penitip
        $barang = Barang::findOrFail($id_barang);
        
        // Fetch the penitipan record using id_penitip from barang
        $penitipan = Penitipan::where('id_penitipan', $barang->id_penitipan)->first();
        
        if (!$penitipan) {
            return response()->json([
                'message' => 'Penitipan tidak ditemukan untuk barang ini',
            ], 404);
        }

        // Fetch the user using id_user from penitipan
        $user = User::findOrFail($penitipan->id_user);
        
        // Calculate points based on barang price
        $poin = floor($barang->harga / 10000);
        $user->poin_loyalitas += $poin;
        $user->save();

        return response()->json([
            'message' => 'Poin penitip berhasil ditambahkan',
            'poin' => $user->poin_loyalitas,
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'message' => 'Gagal menambahkan poin: ' . $e->getMessage(),
        ], 500);
    }
}

    public function updateAllUserRatings()
    {
        try {
            // Fetch average ratings for users based on their barang ratings through penitipan
            $users = DB::table('user')
                ->join('penitipan', 'user.id_user', '=', 'penitipan.id_user')
                ->join('barang', 'penitipan.id_penitipan', '=', 'barang.id_penitipan')
                ->whereNotNull('barang.rating')
                ->where('barang.rating', '>', 0)
                ->select('user.id_user', DB::raw('ROUND(AVG(barang.rating), 2) as avg_rating'))
                ->groupBy('user.id_user')
                ->get();

            Log::info('Fetched user ratings', ['users' => $users]);
            $updatedCount = 0;

            // Update user ratings
            foreach ($users as $user) {
                $userModel = User::find($user->id_user);
                if ($userModel) {
                    $userModel->rating = $user->avg_rating;
                    $userModel->save();
                    $updatedCount++;
                    Log::info("Updated rating for user {$user->id_user}: {$user->avg_rating}");
                } else {
                    Log::warning("User not found: {$user->id_user}");
                }
            }

            // Reset ratings for users with no rated barang
            $usersWithNoRatings = User::whereNotIn('id_user', $users->pluck('id_user')->toArray())
                ->whereNotNull('rating')
                ->update(['rating' => null]);

            Log::info("Reset ratings for {$usersWithNoRatings} users with no rated items");

            return response()->json([
                'message' => 'Rating semua pengguna diperbarui.',
                'updated_users' => $updatedCount,
                'reset_ratings' => $usersWithNoRatings,
            ], 200);
        } catch (Exception $e) {
            Log::error("Gagal memperbarui rating pengguna: {$e->getMessage()}");
            return response()->json([
                'error' => 'Gagal memperbarui rating pengguna',
                'exception' => $e->getMessage(),
            ], 500);
        }
    }
}
