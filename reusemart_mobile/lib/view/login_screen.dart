// lib/view/login_screen.dart

import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/home_screen.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _apiService = UserService();

  final _userService = UserService();
  bool _isLoading = false;
  String? _errorMessage;
  bool _rememberMe = false;

  @override
  void initState() {
    super.initState();
    _checkRememberMe();
  }

  void _checkRememberMe() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token != null) {
      try {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (context) => HomeScreen(
              user: UserModel(
                id: '',
                name: 'User',
                email: '',
                type: '',
                accessToken: token,
                tokenType: 'Bearer',
              ),
            ),
          ),
        );
      } catch (e) {
        await prefs.remove('access_token');
      }
    }
  }

  Future<void> _login() async {
  setState(() {
    _isLoading = true;
    _errorMessage = null;
  });

  try {
    // 1️⃣ Perform the login and save access_token
    final UserModel user = await _apiService.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    // 2️⃣ Now that we're authenticated, grab the FCM token
    final fcmToken = await FirebaseMessaging.instance.getToken();
    if (fcmToken != null) {
      // 3️⃣ And register it with your back end
      await _apiService.registerFcmToken(fcmToken);
      debugPrint('✅ FCM token auto-registered');
    }

    // 4️⃣ Finally navigate to the home screen
    if (!mounted) return;
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => HomeScreen(user: user)),
    );
  } catch (e) {
    setState(() {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
    });
  } finally {
    if (mounted) setState(() => _isLoading = false);
  }
}

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Login')),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Email
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            // Password
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 24),
            // Error message
            if (_errorMessage != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              ),
            // Login button / spinner
            SizedBox(
              width: double.infinity,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator())
                  : ElevatedButton(
                      onPressed: _login,
                      child: const Text('Login'),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}
