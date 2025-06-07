// lib/main.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/model/user_model.dart';

import 'package:reusemart_mobile/view/splash_screen.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:reusemart_mobile/view/home_page.dart';
import 'package:reusemart_mobile/view/hunter/history_hunter_page.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📨 BG message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({Key? key}) : super(key: key);

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  String? _fcmToken;
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    _initFcm();
    _listenForegroundMessages();
    // Hide splash after 3 seconds
    Future.delayed(const Duration(seconds: 3), () {
      setState(() => _showSplash = false);
    });
  }

  Future<void> _initFcm() async {
    await FirebaseMessaging.instance.requestPermission();
    final token = await FirebaseMessaging.instance.getToken();
    if (token != null) {
      setState(() => _fcmToken = token);
      debugPrint('🔑 FCM Token: $token');

      final apiToken = await UserService().getToken();
      if (apiToken != null) {
        try {
          await UserService().registerFcmToken(token);
          debugPrint('✅ Token registered with server');
        } catch (e) {
          debugPrint('❌ Failed to register token: $e');
        }
      }
    }
  }

  void _listenForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage msg) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${msg.notification?.title ?? ""}: ${msg.notification?.body ?? ""}',
          ),
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReUseMart',
      theme: ThemeData(primarySwatch: Colors.blue),
      debugShowCheckedModeBanner: false,
      home: _showSplash
          ? const SplashScreen()
          : FutureBuilder<UserModel?>(
              future: UserService().validateToken(),
              builder: (ctx, snap) {
                // still checking token?
                if (snap.connectionState != ConnectionState.done) {
                  return const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  );
                }

                final user = snap.data;
                if (user == null) {
                  // not logged in
                  return const LoginScreen();
                }

                // logged in → route by type/role/jabatan
                final int uid = int.tryParse(user.id) ?? 0;
                if (user.type == 'pegawai') {
                  final jab = user.jabatan?.toLowerCase();
                  if (jab == 'hunter') {
                    return HistoryHunterPage(hunterId: uid);
                  }
                  // any other pegawai falls back:
                  return const LoginScreen();
                }

                // user-type accounts:
                final role = user.role?.toLowerCase();
                if (role == 'pembeli') {
                  return HomePage();
                }
                return const LoginScreen();
              },
            ),
    );
  }
}
