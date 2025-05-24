<?php

namespace App\Http\Controllers;

use App\Models\Forum;
use App\Models\Komentar;
use App\Models\Barang;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;


class ForumController extends Controller
{
    public function getComments($id_barang)
    {
        try {
            $forum = Forum::where('id_barang', $id_barang)->first();

            if (!$forum) {
                return response()->json([
                    'message' => 'Forum untuk barang ini tidak ditemukan.',
                ], 404);
            }

            $komentar = Komentar::where('id_forum', $forum->id_forum)
                ->with(['user' => function ($query) {
                    $query->select('id_user', 'first_name', 'last_name');
                }, 'pegawai' => function ($query) {
                    $query->select('id_pegawai', 'first_name', 'last_name')->with(['jabatan' => function ($q) {
                        $q->select('id_jabatan', 'nama_jabatan');
                    }]);
                }])
                ->orderBy('waktu_komentar', 'asc')
                ->get();

            return response()->json([
                'message' => 'Daftar komentar berhasil diambil.',
                'data' => $komentar,
            ], 200);
        } catch (\Exception $e) {
            Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch comments'], 500);
        }
    }

    public function store(Request $request)
    {
        $request->validate([    
            'id_barang' => 'required|exists:barang,id_barang',
        ]);

        // Simpan forum baru
        $forum = new Forum();
        $forum->id_barang = $request->id_barang;
        $forum->save();

        return response()->json([
            'message' => 'Forum berhasil dibuat',
            'id_forum' => $forum->id_forum,
        ], 201);
    }

    // Menambahkan komentar baru
    public function addComment(Request $request, $id_barang)
    {
        $validator = Validator::make($request->all(), [
            'komentar' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            $barang = Barang::find($id_barang);
            if (!$barang) {
                return response()->json([
                    'message' => 'Barang tidak ditemukan.',
                ], 404);
            }

            $forum = Forum::where('id_barang', $id_barang)->first();

            if (!$forum) {
                $forum = Forum::create([
                    'id_barang' => $id_barang,
                ]);
            }

            $komentarData = [
                'id_forum' => $forum->id_forum,
                'komentar' => $request->komentar,
                'waktu_komentar' => now(),
            ];

            $user = $request->user();
            if (!$user) {
                return response()->json([
                    'message' => 'Anda harus login untuk mengomentari forum.',
                ], 401);
            }

            if ($user instanceof \App\Models\User) {
                $komentarData['id_user'] = $user->id_user;
                $komentarData['id_pegawai'] = null;
            } elseif ($user instanceof \App\Models\Pegawai) {
                if ($user->id_jabatan != 2) {
                    return response()->json([
                        'message' => 'Hanya CS yang dapat mengomentari forum.',
                    ], 403);
                }
                $komentarData['id_pegawai'] = $user->id_pegawai;
                $komentarData['id_user'] = null;
            } else {
                return response()->json([
                    'message' => 'Tipe pengguna tidak valid.',
                ], 403);
            }

            $komentar = Komentar::create($komentarData);

            return response()->json([
                'message' => 'Komentar berhasil ditambahkan.',
                'data' => $komentar->load(['user', 'pegawai.jabatan']),
            ], 201);
        } catch (\Exception $e) {
            Log::error('Error adding comment: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to add comment'], 500);
        }
    }
}
