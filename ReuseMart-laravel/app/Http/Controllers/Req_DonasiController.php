<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Req_Donasi;
use Illuminate\Support\Facades\Log;
use Exception;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Storage;

class Req_DonasiController extends Controller
{
    public function index()
    {
        try {
            $reqDonasi = Req_Donasi::with('user')->orderBy('id_reqdonasi', 'desc')->get();
            return response()->json($reqDonasi);
        } catch (Exception $e) {
            Log::error('Error fetching Req_Donasi: '.$e->getMessage());
            return response()->json(['error'=>'Failed to fetch requests'], 500);
        }
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'nama_barangreq'     => 'required|string|max:255',
            'kategori_barangreq' => 'required|string|max:255',
            'deskripsi'          => 'nullable|string|max:300',
            'contoh_foto'        => 'nullable|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            if ($request->hasFile('contoh_foto')) {
                $fotoPath = $request
                    ->file('contoh_foto')
                    ->store('Foto_Req', 'public');
            } else {
                $fotoPath = 'Foto_Req/dummy.jpg';
            }

            $reqDonasi = Req_Donasi::create([
                'id_user'            => $request->user()->id_user,
                'nama_barangreq'     => $request->nama_barangreq,
                'kategori_barangreq' => $request->kategori_barangreq,
                'deskripsi'          => $request->deskripsi ?? null,
                'contoh_foto'        => $fotoPath,
            ]);

            return response()->json([
                'message'         => 'Request donasi berhasil dibuat',
                'req_donasi'      => $reqDonasi,
                'contoh_foto_url' => asset('storage/'.$fotoPath),
            ], 201);

        } catch (Exception $e) {
            Log::error('Error creating Req_Donasi: '.$e->getMessage());
            return response()->json([
                'error'     => 'Failed to create request donasi',
                'exception' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {   
        Log::info('UPDATE REQ_DONASI PAYLOAD', $request->all());
        $req = Req_Donasi::findOrFail($id);

        $v = Validator::make($request->all(), [
            'nama_barangreq'     => 'sometimes|required|string|max:255',
            'kategori_barangreq' => 'sometimes|required|string|max:255',
            'deskripsi'          => 'nullable|string|max:300',
            'contoh_foto'        => 'nullable|image|max:2048',
        ]);

        if ($v->fails()) {
            return response()->json(['errors'=>$v->errors()], 422);
        }

        try {
            $data = $v->validated();

            if ($request->hasFile('contoh_foto')) {
                if ($req->contoh_foto !== 'Foto_Req/dummy.jpg') {
                    Storage::disk('public')->delete($req->contoh_foto);
                }
                $data['contoh_foto'] = $request->file('contoh_foto')
                                             ->store('Foto_Req','public');
            }

            $req->update($data);

            return response()->json([
                'message'         => 'Updated',
                'req_donasi'      => $req,
                'contoh_foto_url' => asset('storage/'.$req->contoh_foto)
            ]);
        } catch (Exception $e) {
            Log::error('Error updating Req_Donasi: '.$e->getMessage());
            return response()->json(['error'=>'Server error'], 500);
        }
    }

    public function destroy($id)
    {
        $req = Req_Donasi::findOrFail($id);

        try {
            if ($req->contoh_foto && $req->contoh_foto !== 'Foto_Req/dummy.jpg') {
                Storage::disk('public')->delete($req->contoh_foto);
            }
            $req->delete();
            return response()->json(['message'=>'Deleted']);
        } catch (Exception $e) {
            Log::error('Error deleting Req_Donasi: '.$e->getMessage());
            return response()->json(['error'=>'Server error'], 500);
        }
    }

    public function userIndex(Request $request)
    {
        $userId = $request->user()->id_user;

        try {
            $myRequests = Req_Donasi::where('id_user', $userId)
                ->orderBy('id_reqdonasi', 'desc')
                ->get();

            return response()->json($myRequests);
        } catch (Exception $e) {
            Log::error("Error fetching Req_Donasi for user {$userId}: " . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch your requests'], 500);
        }
    }
}
