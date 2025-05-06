<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $userRole = null;

        if (method_exists($user, 'role')) {
            $userRole = $user->role?->nama_role;
        } elseif (method_exists($user, 'jabatan')) {
            $userRole = $user->jabatan?->nama_jabatan;
        }

        if (!$userRole || !in_array($userRole, $roles)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
