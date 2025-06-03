<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FcmToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;
use App\Models\User;

class NotificationController extends Controller
{
    protected $messaging;

    public function __construct()
    {
        $this->messaging = (new Factory)
            ->withServiceAccount(storage_path('app/firebase_credentials.json'))
            ->createMessaging();
    }

    public function sendNotification(Request $request)
    {
        // 1) Fix the "exists" rule to point at the correct table name
        $request->validate([
            'title'   => 'required|string',
            'body'    => 'required|string',
            'user_id' => 'required|integer|exists:user,id_user',
        ]);

        $userId = $request->input('user_id');

        // 2) Fetch tokens using the polymorphic columns:
        $tokens = FcmToken::where('owner_type', User::class)
                          ->where('owner_id',   $userId)
                          ->pluck('token')
                          ->toArray();

        if (empty($tokens)) {
            return response()->json([
                'error' => 'No device tokens registered for this user'
            ], 400);
        }

        // 3) Build the FCM message
        $message = CloudMessage::new()
            ->withNotification(
                FcmNotification::create($request->title, $request->body)
            )
            ->withData(['foo' => 'bar']);

        // 4) Send to all tokens at once
        $report = $this->messaging->sendMulticast($message, $tokens);

        return response()->json([
            'success_count' => $report->successes()->count(),
            'failure_count' => $report->failures()->count(),
        ]);
    }
}
