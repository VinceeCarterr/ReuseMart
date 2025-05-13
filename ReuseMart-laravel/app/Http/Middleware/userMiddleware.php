<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class UserMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request   $request
     * @param  Closure   $next
     * @param  string[]  ...$allowedRoles  e.g. ['pembeli','organisasi','penitip']
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = Auth::user();
        $theirRole = 
             $user->role?->nama_role
          ?? $user->jabatan?->nama_jabatan
          ?? null;

        if (
            ! $theirRole ||
            ! in_array(
                strtolower($theirRole),
                array_map(fn($r)=>strtolower($r), $allowedRoles),
                true
            )
        ) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
