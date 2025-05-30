import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

class HomeScreen extends StatelessWidget {
  final UserModel user;

  const HomeScreen({super.key, required this.user});

  void _logout(BuildContext context) async {
    final userService = UserService();
    try {
      await userService.logout();
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (context) => const LoginScreen()),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Logout failed: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Home'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => _logout(context),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Selamat Datang, ${user.name}!'),
            Text('Email: ${user.email}'),
            Text('Tipe: ${user.type}'),
            if (user.role != null) Text('Role: ${user.role}'),
            if (user.jabatan != null) Text('Jabatan: ${user.jabatan}'),
          ],
        ),
      ),
    );
  }
}
