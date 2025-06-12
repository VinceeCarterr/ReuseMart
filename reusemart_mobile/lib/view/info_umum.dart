import 'package:flutter/material.dart';
import 'package:reusemart_mobile/view/home_page.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

class InfoUmum extends StatelessWidget {
    const InfoUmum({Key? key}) : super(key: key);

    @override
    Widget build(BuildContext context) {
        return Scaffold(
        body: Container(
            decoration: const BoxDecoration(
            gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                Color(0xFF66BB6A),
                Color(0xFF4CAF50),
                ],
            ),
            ),
            child: SingleChildScrollView(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                      Image.network(
                        'http://10.0.2.2:8000/storage/logo_ReuseMart.png',
                        width: 80,
                        height: 80,
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) => const Icon(
                          Icons.error,
                          size: 80,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 20),
                      const Text(
                      'ReuseMart',
                      style: TextStyle(
                          fontSize: 36,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          shadows: [
                          Shadow(
                              blurRadius: 5.0,
                              color: Colors.black26,
                              offset: Offset(2.0, 2.0),
                          ),
                          ],
                      ),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      Text(
                      'Temukan harta karun barang bekas berkualitas! Beri kesempatan kedua, selamatkan bumi.',
                      style: TextStyle(
                          fontSize: 18, 
                          color: Colors.white.withOpacity(0.9)),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 24),
                      const Text(
                      'Visi:',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                      ),
                      const Text(
                      'Kurangi sampah dengan menjual lagi barang bekas yang layak.',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                      'Misi:',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                      ),
                      const Text(
                      'Menjadi Platform untuk pengalaman berbelanja yang menyenangkan',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      const Text(
                      'Kategori:',
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                      ),
                      textAlign: TextAlign.center,
                      ),
                      const Text(
                      'Elektronik & Gadget, Pakaian & Aksesoris, Perabotan Rumah Tangga, Buku Alat Tulis & Peralatan Sekolah, Hobi Mainan & Koleksi, Perlengkapan Bayi & Anak, Otomotif & Aksesori, Perlengkapan Taman & Outdoor, Peralatan Kantor & Industri, Kosmetik & Perawatan Diri',
                      style: TextStyle(fontSize: 16, color: Colors.white),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 32),
                      const Text(
                      'Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!',
                      style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                          fontStyle: FontStyle.italic,
                      ),
                      textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 40),
                      ElevatedButton(
                      onPressed: () {
                          Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const LoginScreen()),
                          );
                      },
                      style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: const Color(0xFF4CAF50),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 16),
                          textStyle: const TextStyle(fontSize: 18),
                          shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          ),
                      ),
                      child: const Text('Masuk'),
                      ),
                      const SizedBox(height: 16),
                      OutlinedButton(
                      onPressed: () {
                          Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (context) => const HomePage()),
                          );
                      },
                      style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white, width: 2),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 16),
                          textStyle: const TextStyle(fontSize: 18),
                          shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                          ),
                      ),
                      child: const Text(
                          'Jelajahi Produk',
                          style: TextStyle(color: Colors.white),
                      ),
                      ),
                      const SizedBox(height: 24), // Added padding at the bottom
                  ],
                  ),
                ),
              ),
            ),
        ),
        );
    }
}