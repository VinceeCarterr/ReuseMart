import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/view/splash_screen.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:reusemart_mobile/view/home_page.dart';
import 'package:reusemart_mobile/view/hunter/history_hunter_page.dart';
import 'package:reusemart_mobile/view/info_umum.dart';

Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  debugPrint('📨 BG message: ${message.messageId}');
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

  @override
  void initState() {
    super.initState();
    _initFcm();
    _listenForegroundMessages();
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
      if (mounted) {
        final title = msg.notification?.title ?? '';
        final body = msg.notification?.body ?? '';
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('$title: $body')),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'ReUseMart',
      theme: ThemeData(primarySwatch: Colors.blue),
      debugShowCheckedModeBanner: false,
      home: const AuthenticatedHome(),
    );
  }
}

class AuthenticatedHome extends StatefulWidget {
  const AuthenticatedHome({Key? key}) : super(key: key);
  @override
  State<AuthenticatedHome> createState() => _AuthenticatedHomeState();
}

class _AuthenticatedHomeState extends State<AuthenticatedHome> {
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) setState(() => _showSplash = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_showSplash) {
      return const SplashScreen();
    }

    return FutureBuilder<UserModel?>(
      future: UserService().validateToken(),
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        final user = snap.data;
        if (user == null) {
          return const InfoUmum();
        }

        // logged in → route by type/role
        if (user.type == 'pegawai') {
          final jab = user.jabatan?.toLowerCase();
          if (jab == 'hunter') {
            final uid = int.tryParse(user.id) ?? 0;
            return HistoryHunterPage(hunterId: uid);
          }
          return const LoginScreen();
        }

        final role = user.role?.toLowerCase();
        if (role == 'pembeli') {
          return const HomePage();
        }

        if (role == 'penitip') {
          return const HomePage();
        }

        return const LoginScreen();
      },
    );
  }
}
