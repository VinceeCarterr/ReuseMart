// lib/view/hunter/profile_hunter_page.dart

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:reusemart_mobile/model/pegawai_model.dart';
import 'package:reusemart_mobile/services/pegawai_service.dart';
import 'package:reusemart_mobile/services/komisi_service.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

/// Holds user profile and total komisi
class _ProfileData {
  final PegawaiModel pegawai;
  final double totalKomisi;
  _ProfileData(this.pegawai, this.totalKomisi);
}

class ProfileHunterPage extends StatelessWidget {
  final int hunterId;
  const ProfileHunterPage({Key? key, required this.hunterId}) : super(key: key);

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('remember_me');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  Future<_ProfileData> _loadData() async {
    final pegawai = await PegawaiService().fetchPegawai(hunterId);
    final komisis = await KomisiService().fetchKomisiByHunter(hunterId);
    final totalKomisi = komisis.fold<double>(0, (sum, k) => sum + k.komisiHunter);
    return _ProfileData(pegawai, totalKomisi);
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0', 'id_ID');
    return FutureBuilder<_ProfileData>(
      future: _loadData(),
      builder: (ctx, snap) {
        if (snap.connectionState == ConnectionState.waiting) {
          return const Scaffold(
              body: Center(child: CircularProgressIndicator()));
        }
        if (snap.hasError) {
          return Scaffold(
              body: Center(child: Text('Error: ${snap.error}')));
        }
        final data = snap.data!;
        final pegawai = data.pegawai;
        // format komisi with dots
        final komisiStr = fmt.format(data.totalKomisi);
        return Scaffold(
          backgroundColor: Colors.white,
          body: Column(
            children: [
              Expanded(flex: 2, child: _TopPortion(pegawai: pegawai)),
              Expanded(
                flex: 3,
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Column(
                    children: [
                      Text(
                        pegawai.name,
                        style: Theme.of(context)
                            .textTheme
                            .headlineMedium
                            ?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        pegawai.email,
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 16),
                      FloatingActionButton.extended(
                        onPressed: () => _logout(context),
                        heroTag: 'logout',
                        elevation: 0,
                        backgroundColor: Colors.red,
                        icon: const Icon(Icons.logout),
                        label: const Text('Logout'),
                      ),
                      const SizedBox(height: 16),
                      _ProfileInfoRow(
                        phone: pegawai.noTelp ?? 'N/A',
                        birthDate: pegawai.tanggalLahir ?? 'N/A',
                        komisi: 'Rp$komisiStr',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  final String phone;
  final String birthDate;
  final String komisi;
  const _ProfileInfoRow({required this.phone, required this.birthDate, required this.komisi});

  @override
  Widget build(BuildContext context) {
    final items = [
      _InfoItem(title: 'Phone', value: phone),
      _InfoItem(title: 'Birth Date', value: birthDate),
      _InfoItem(title: 'Total Komisi', value: komisi, isGreen: true),
    ];
    return Container(
      height: 120,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: items
            .asMap()
            .entries
            .map((e) => Expanded(
                  child: Row(
                    children: [
                      if (e.key != 0) const VerticalDivider(),
                      Expanded(child: e.value),
                    ],
                  ),
                ))
            .toList(),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final String title;
  final String value;
  final bool isGreen;
  const _InfoItem({required this.title, required this.value, this.isGreen = false});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          value,
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: isGreen ? const Color(0xFF28A745) : Colors.black87,
          ),
        ),
        const SizedBox(height: 4),
        Text(title, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
}

class _TopPortion extends StatelessWidget {
  final PegawaiModel pegawai;
  const _TopPortion({required this.pegawai});

  @override
  Widget build(BuildContext context) {
    final initials =
        '${pegawai.firstName.isNotEmpty ? pegawai.firstName[0] : ''}'
        '${pegawai.lastName.isNotEmpty ? pegawai.lastName[0] : ''}';

    return Stack(
      fit: StackFit.expand,
      children: [
        Container(
          margin: const EdgeInsets.only(bottom: 70),
          color: Colors.green,
        ),
        Align(
          alignment: Alignment.bottomCenter,
          child: SizedBox(
            width: 150,
            height: 150,
            child: Stack(
              fit: StackFit.expand,
              children: [
                CircleAvatar(
                  radius: 75,
                  backgroundColor: Colors.grey[300],
                  child: Text(
                    initials.isNotEmpty ? initials : 'N/A',
                    style: const TextStyle(
                      fontSize: 48,
                      fontWeight: FontWeight.bold,
                      color: Colors.black,
                    ),
                  ),
                ),
                Positioned(
                  bottom: 0,
                  right: 0,
                  child: CircleAvatar(
                    radius: 20,
                    backgroundColor: Theme.of(context).scaffoldBackgroundColor,
                    child: Container(
                      margin: const EdgeInsets.all(8.0),
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
