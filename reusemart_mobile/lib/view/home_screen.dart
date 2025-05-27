import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/user_model.dart';

class HomeScreen extends StatelessWidget {
  final UserModel user;

  const HomeScreen({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Selamat Datang, ${user.name}!'),
            Text('Email: ${user.email}'),
            Text('Tipe: ${user.type}'),
            if (user.role != null) Text('Role: ${user.role}'),
            if (user.jabatan != null) Text('Jabatan: ${user.jabatan}'),
            Text('Token: ${user.accessToken}'),
          ],
        ),
      ),
    );
  }
}
