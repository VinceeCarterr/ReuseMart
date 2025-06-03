import 'package:flutter/material.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color.fromARGB(255, 255, 252, 247),
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Image.asset(
              'assets/logo_ReuseMart.png',
              width: 120,
              height: 120,
              fit: BoxFit.contain,
            ),

            // const SizedBox(height: 6),
            const Text(
              'ReuseMart',
              style: TextStyle(
                fontFamily: 'Poppins',
                fontSize: 32,
                fontWeight: FontWeight.bold,
                color: Color(0xFF198754),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
