// lib/main.dart

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:reusemart_mobile/view/home_screen.dart';
import 'package:reusemart_mobile/model/user_model.dart';

/// 1️⃣ Background handler must be a top‐level function:
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📨 BG message: ${message.messageId}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  // Register the background handler:
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  final UserService _userService = UserService();
  String? _fcmToken;
  UserModel? _currentUser; // if you want to auto‐login later

  @override
  void initState() {
    super.initState();
    _initFcm();
    _listenForegroundMessages();
  }

  /// 2️⃣ Set up FCM: request permission, grab token, register it.
  Future<void> _initFcm() async {
    // Request (iOS) permission – no‐op on Android
    await FirebaseMessaging.instance.requestPermission();

    // Grab the FCM device token
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;

    setState(() => _fcmToken = token);
    debugPrint('🔑 FCM Token: $token');

    // Fetch your saved API token from SharedPreferences
    final apiToken = await _userService.getToken();
    if (apiToken != null) {
      try {
        await _userService.registerFcmToken(token);
        debugPrint('✅ Token registered with server');
      } catch (e) {
        debugPrint('❌ Failed to register token: $e');
      }
    } else {
      debugPrint('⚠️ No API token yet – user not logged in');
    }
  }

  /// 3️⃣ Show a SnackBar for messages when app is in the foreground
  void _listenForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage msg) {
      print('🍊 onMessage got a notification: ${msg.notification?.title}');
      // you’ll need to surface it manually:
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content:
              Text('${msg.notification!.title}: ${msg.notification!.body}')));
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Reusemart',
      theme: ThemeData(primarySwatch: Colors.blue),
      home: Stack(
        children: [
          // Your real entrypoint:
          _currentUser == null
              ? const LoginScreen()
              : HomeScreen(user: _currentUser!),
          // Overlay the raw FCM token for debugging:
          if (_fcmToken != null)
            Align(
              alignment: Alignment.bottomCenter,
              child: Container(
                color: Colors.black87,
                padding: const EdgeInsets.all(8),
                child: SelectableText(
                  'FCM Token:\n$_fcmToken',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
