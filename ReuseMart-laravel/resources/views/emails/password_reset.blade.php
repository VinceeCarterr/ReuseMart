<!DOCTYPE html>
<html>

<head>
    <title>Reset Your Password</title>
</head>

<body>
    <h1>Reset Your Password</h1>
    <p>Hello {{ $user->first_name ?? $user->email }},</p>

    <p>We received a request to reset your password. Click the button below to reset your password:</p>

    <a href="{{ $resetUrl }}"
        style="display: inline-block; padding: 10px 20px; background-color: #3490dc; color: white; text-decoration: none; border-radius: 5px;">
        Reset Password
    </a>

    <p>If you didn't request a password reset, please ignore this email.</p>

    <p>This link will expire in 1 hour.</p>

    <p>Thank you,<br>
        Reuse Mart Team</p>
</body>

</html>