<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Role;
use Illuminate\Support\Facades\Log;
use Exception;

class RoleController extends Controller
{
    public function index()
    {
        try {
            $roles = Role::all();
            return response()->json($roles);
        } catch (Exception $e) {
            Log::error('Error fetching roles: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch roles'], 500);
        }
    }

    public function show($id)
    {
        try {
            $role = Role::findOrFail($id);
            return response()->json($role);
        } catch (Exception $e) {
            Log::error('Error fetching role: ' . $e->getMessage());
            return response()->json(['error' => 'Role not found'], 404);
        }
    }

    public function store(Request $request)
    {
        try {
            $role = Role::create($request->all());
            return response()->json($role, 201);
        } catch (Exception $e) {
            Log::error('Error creating role: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to create role'], 500);
        }
    }

    public function update(Request $request, $id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->update($request->all());
            return response()->json($role);
        } catch (Exception $e) {
            Log::error('Error updating role: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to update role'], 500);
        }
    }

    public function destroy($id)
    {
        try {
            $role = Role::findOrFail($id);
            $role->delete();
            return response()->json(['message' => 'Role deleted successfully']);
        } catch (Exception $e) {
            Log::error('Error deleting role: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to delete role'], 500);
        }
    }
}
