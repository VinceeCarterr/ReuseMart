<!DOCTYPE html>
<html>

<head>
    <title>Reset Password</title>
</head>

<body>
    <h1>Reset Password</h1>
    <p>Halo {{ $user->first_name }},</p>
    <p>Klik tautan berikut untuk mereset password Anda:</p>
    <a href="{{ $resetUrl }}">Reset Password</a>
    <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
    <p>Terima kasih,</p>
    <p>Tim ReuseMart</p>
</body>

</html>