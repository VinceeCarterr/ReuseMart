<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Forum;
use Illuminate\Support\Facades\Log;
use Exception;


class ForumController extends Controller
{
    public function index()
    {
        try {
            $forums = Forum::all();
            return response()->json($forums);
        } catch (Exception $e) {
            Log::error('Error fetching forums: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to fetch forums'], 500);
        }
    }

    public function show($id)
    {
        try {
            $forum = Forum::findOrFail($id);
            return response()->json($forum);
        } catch (Exception $e) {
            Log::error('Error fetching forum: ' . $e->getMessage());
            return response()->json(['error' => 'Forum not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $forum = Forum::create($request->all());
            return response()->json($forum, 201);
        } catch (Exception $e) {
            Log::error('Error creating forum: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to create forum'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $forum = Forum::findOrFail($id);
            $forum->update($request->all());
            return response()->json($forum);
        } catch (Exception $e) {
            Log::error('Error updating forum: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to update forum'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $forum = Forum::findOrFail($id);
            $forum->delete();
            return response()->json(['message' => 'Forum deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting forum: ' . $e->getMessage());
            return response()->json(['error' => 'Unable to delete forum'], 500);
        }
    }
}
