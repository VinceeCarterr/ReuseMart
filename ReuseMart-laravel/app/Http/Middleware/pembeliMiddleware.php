<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class PembeliMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Request  $request
     * @param  \Closure $next
     * @param  string   $role 
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = Auth::user();

        $theirRole = $user?->role?->nama_role;

        if (! $theirRole || strtolower($theirRole) !== strtolower($role)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return $next($request);
    }
}
