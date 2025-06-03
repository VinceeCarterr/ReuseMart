import 'dart:async';
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:reusemart_mobile/view/home_screen.dart';
import 'package:reusemart_mobile/view/splash_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';

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
  final UserService _userService = UserService();
  String? _fcmToken;
  bool _showSplash = true;

  @override
  void initState() {
    super.initState();
    _initFcm();
    _listenForegroundMessages();

    Future.delayed(const Duration(seconds: 3), () {
      setState(() {
        _showSplash = false;
      });
    });
  }

  Future<void> _initFcm() async {
    await FirebaseMessaging.instance.requestPermission();
    final token = await FirebaseMessaging.instance.getToken();
    if (token == null) return;
    setState(() => _fcmToken = token);
    debugPrint('🔑 FCM Token: $token');

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

  void _listenForegroundMessages() {
    FirebaseMessaging.onMessage.listen((RemoteMessage msg) {
      print('🍊 onMessage got a notification: ${msg.notification?.title}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '${msg.notification?.title ?? ""}: ${msg.notification?.body ?? ""}',
          ),
        ),
      );
    });
  }

  Future<Widget> _getInitialScreen() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    final rememberMe = prefs.getBool('remember_me') ?? false;

    if (token != null && rememberMe) {
      try {
        final user = await _userService.validateToken();
        if (user != null) return HomeScreen(user: user);
      } catch (e) {
        debugPrint('❌ Token validation failed: $e');
        await prefs.remove('access_token');
        await prefs.remove('remember_me');
      }
    }
    return const LoginScreen();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Reusemart',
      theme: ThemeData(primarySwatch: Colors.blue),
      debugShowCheckedModeBanner: false,
      home: _showSplash
          // ← USE your custom SplashScreen (with logo + Poppins + colors)
          ? const SplashScreen()
          : FutureBuilder<Widget>(
              future: _getInitialScreen(),
              builder: (context, snapshot) {
                if (snapshot.connectionState == ConnectionState.waiting) {
                  return const Scaffold(
                    body: Center(child: CircularProgressIndicator()),
                  );
                }
                return Stack(
                  children: [
                    snapshot.data ?? const LoginScreen(),
                    if (_fcmToken != null)
                      Align(
                        alignment: Alignment.bottomCenter,
                        child: Container(
                          color: Colors.black87,
                          padding: const EdgeInsets.all(8),
                          child: SelectableText(
                            'FCM Token:\n$_fcmToken',
                            style: const TextStyle(
                                color: Colors.white, fontSize: 12),
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                  ],
                );
              },
            ),
    );
  }
}
