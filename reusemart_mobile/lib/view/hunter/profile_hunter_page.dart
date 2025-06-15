import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';
import 'package:reusemart_mobile/model/pegawai_model.dart';
import 'package:reusemart_mobile/services/pegawai_service.dart';
import 'package:reusemart_mobile/services/komisi_service.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

class ProfileHunterPage extends StatefulWidget {
  final int hunterId;
  const ProfileHunterPage({Key? key, required this.hunterId}) : super(key: key);

  @override
  State<ProfileHunterPage> createState() => _ProfileHunterPageState();
}

class _ProfileHunterPageState extends State<ProfileHunterPage> {
  PegawaiModel? _pegawai;

  @override
  void initState() {
    super.initState();
    _loadPegawai();
  }

  Future<void> _loadPegawai() async {
    final data = await PegawaiService().fetchPegawai(widget.hunterId);
    setState(() => _pegawai = data);
  }

  Future<double> _loadTotalKomisi() async {
    final komisis = await KomisiService().fetchKomisiByHunter(widget.hunterId);
    return komisis.fold<double>(0, (sum, k) => sum + k.komisiHunter);
  }

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    await prefs.remove('remember_me');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final fmt = NumberFormat('#,##0', 'id_ID');

    if (_pegawai == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    return Scaffold(
      backgroundColor: Colors.white,
      body: Column(
        children: [
          Expanded(flex: 2, child: _TopPortion(pegawai: _pegawai!)),
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Column(
                children: [
                  Text(
                    _pegawai!.name,
                    style: Theme.of(context)
                        .textTheme
                        .headlineMedium
                        ?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _pegawai!.email,
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
                  FutureBuilder<double>(
                    future: _loadTotalKomisi(),
                    builder: (context, snapshot) {
                      final komisiStr = snapshot.hasData
                          ? 'Rp${fmt.format(snapshot.data!)}'
                          : 'Loading...';

                      return _ProfileInfoRow(
                        phone: _pegawai!.noTelp ?? 'N/A',
                        birthDate: _pegawai!.tanggalLahir ?? 'N/A',
                        komisi: komisiStr,
                      );
                    },
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  final String phone;
  final String birthDate;
  final String komisi;
  const _ProfileInfoRow({
    required this.phone,
    required this.birthDate,
    required this.komisi,
  });

  @override
  Widget build(BuildContext context) {
    final items = [
      _InfoItem(title: 'Phone', value: phone),
      _InfoItem(title: 'Birth Date', value: birthDate),
      _InfoItem(title: 'Total Komisi', value: komisi, isGreen: true),
    ];
    return SizedBox(
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
