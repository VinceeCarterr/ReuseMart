<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\FcmToken;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification as FcmNotification;

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
        $request->validate([
            'title' => 'required|string',
            'body'  => 'required|string',
        ]);

        $tokens = FcmToken::pluck('token')->all();
        if (empty($tokens)) {
            return response()->json(['error' => 'No device tokens registered'], 400);
        }

        $message = CloudMessage::new()
            ->withNotification(FcmNotification::create(
                $request->title,
                $request->body
            ))
            // optional data payload
            ->withData(['foo' => 'bar']);

        // sendMulticast takes two args: the message, then an array of tokens
        $report = $this->messaging->sendMulticast($message, $tokens);

        return response()->json([
            'success_count' => $report->successes()->count(),
            'failure_count' => $report->failures()->count(),
        ]);
    }
}
