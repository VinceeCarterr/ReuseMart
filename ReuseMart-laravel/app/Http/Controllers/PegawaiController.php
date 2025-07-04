<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use App\Models\Pegawai;
use Illuminate\Support\Facades\Auth;
use App\Models\Transaksi;
use Exception;

class PegawaiController extends Controller
{
    public function index($id)
    {
        try {
            $pegawai = Pegawai::with('jabatan')->findOrFail($id);
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pegawai'], 404);
        }
    }

    public function showAllPegawai()
    {
        try {
            $pegawai = Pegawai::all();
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch pegawai'], 404);
        }
    }

    public function showHunter($id)
    {
        try {
            $pegawai = Pegawai::with('jabatan')->findOrFail($id);
            return response()->json($pegawai);
        } catch (Exception $e) {
            Log::error('Error fetching pegawai: ' . $e->getMessage());
            return response()->json(['error' => 'Pegawai not found'], 404);
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
            'tanggal_lahir' => 'required|date',
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
                'tanggal_lahir' => $request->tanggal_lahir,
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
        $validator = Validator::make($request->all(), [
            'id_jabatan' => 'required|exists:jabatan,id_jabatan',
            'first_name' => 'required|string|max:255',
            'last_name'  => 'required|string|max:255',
            'no_telp'    => 'required|string|max:15',
            'tanggal_lahir' => 'required|date',
            'komisi'     => 'nullable|numeric|max:19',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        try {
            $pegawai = Pegawai::findOrFail($id);

            $data = $request->only([
                'first_name',
                'last_name',
                'id_jabatan',
                'no_telp',
                'tanggal_lahir',
                'komisi'
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

    public function resetPassword($id)
    {
        $pegawai = Pegawai::find($id);

        if (!$pegawai) {
            return response()->json(['error' => 'Pegawai tidak ditemukan'], 404);
        }

        if (!$pegawai->tanggal_lahir) {
            return response()->json(['error' => 'Tanggal lahir tidak tersedia'], 400);
        }

        $formattedPassword = \Carbon\Carbon::parse($pegawai->tanggal_lahir)->format('dmY');

        $pegawai->password = Hash::make($formattedPassword);
        $pegawai->save();

        return response()->json(['message' => 'Password berhasil direset ke tanggal lahir (ddmmyyyy)']);
    }

    public function publicKurir()
    {
        $kurirs = Pegawai::where('id_jabatan', 4)->get();
        return response()->json($kurirs);
    }

    public function updateKomisi(Request $request, Pegawai $pegawai)
    {
        $data = $request->validate([
            'komisi' => 'required|numeric|min:0',
        ]);

        $pegawai->komisi = $data['komisi'];
        $pegawai->save();

        return response()->json([
            'message' => 'Komisi pegawai updated',
            'pegawai' => $pegawai,
        ]);
    }

    public function getDeliveryHistory(Request $request)
    {
        $courier = Auth::guard('pegawai')->user();

        if (!$courier || $courier->id_jabatan != 4) {
            return response()->json([
                'message' => 'Unauthorized: Only couriers can access this endpoint',
            ], 403);
        }

        $deliveries = Transaksi::select(
            'transaksi.id_transaksi',
            'transaksi.tanggal_transaksi',
            'transaksi.alamat',
            'transaksi.metode_pengiriman',
            'transaksi.biaya_pengiriman',
            'transaksi.total',
            'transaksi.no_nota',
            'transaksi.status_transaksi',
            'user.first_name as user_first_name',
            'user.last_name as user_last_name'
        )
            ->join('user', 'transaksi.id_user', '=', 'user.id_user')
            ->join('pengiriman', 'transaksi.id_transaksi', '=', 'pengiriman.id_transaksi')
            ->where('transaksi.metode_pengiriman', 'Delivery')
            ->where('pengiriman.id_pegawai', $courier->id_pegawai)
            ->with(['detilTransaksi.barang' => function ($query) {
                $query->select('barang.id_barang', 'barang.nama_barang', 'barang.harga', 'barang.deskripsi');
            }])
            ->orderBy('transaksi.tanggal_transaksi', 'desc')
            ->get();

        return response()->json([
            'message' => 'Delivery history retrieved successfully',
            'data' => $deliveries
        ], 200);
    }
}
