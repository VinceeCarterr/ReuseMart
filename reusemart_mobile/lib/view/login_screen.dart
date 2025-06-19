import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/home_page.dart';
import 'package:reusemart_mobile/view/hunter/history_hunter_page.dart';
import 'package:reusemart_mobile/view/kurir/pengiriman_list_page.dart';
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
    final rememberMe = prefs.getBool('remember_me') ?? false;

    if (token != null && rememberMe) {
      try {
        final user = await _apiService.validateToken();
        if (user != null && mounted) {
          _goToRolePage(user);
        } else {
          await prefs.remove('access_token');
          await prefs.remove('remember_me');
        }
      } catch (_) {
        await prefs.remove('access_token');
        await prefs.remove('remember_me');
      }
    }
  }

  Future<void> _login() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final UserModel user = await _apiService.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
      if (user.accessToken.isEmpty) {
        throw Exception("Access token is empty after login");
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('access_token', user.accessToken);
      await prefs.setBool('remember_me', _rememberMe);

      final fcmToken = await FirebaseMessaging.instance.getToken();
      if (fcmToken != null) {
        await _apiService.registerFcmToken(fcmToken);
      }

      if (!mounted) return;
      _goToRolePage(user);
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _goToRolePage(UserModel user) async {
    final int uid = int.tryParse(user.id) ?? 0;
    Widget? target;

    if (user.type == 'user') {
      switch (user.role?.toLowerCase()) {
        case 'pembeli':
          target = const HomePage();
          break;
        case 'penitip':
          target = const HomePage();
          break;
      }
    } else if (user.type == 'pegawai') {
      switch (user.jabatan?.toLowerCase()) {
        case 'hunter':
          target = HistoryHunterPage(hunterId: uid);
          break;
        case 'kurir':
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setInt('kurir_id', uid);
            target = const PengirimanListPage();
          } catch (e) {
            setState(() {
              _errorMessage = 'Failed to load list pengiriman: $e';
            });
            return;
          }
          break;
      }
    }

    if (target != null) {
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => target!),
      );
    } else {
      setState(() {
        _errorMessage = 'Invalid role or jabatan';
      });
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
            TextField(
              controller: _emailController,
              decoration: const InputDecoration(
                labelText: 'Email',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _passwordController,
              decoration: const InputDecoration(
                labelText: 'Password',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Checkbox(
                  value: _rememberMe,
                  onChanged: (v) => setState(() => _rememberMe = v ?? false),
                ),
                const Text('Remember Me'),
              ],
            ),
            if (_errorMessage != null) ...[
              const SizedBox(height: 8),
              Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
            ],
            const SizedBox(height: 16),
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
