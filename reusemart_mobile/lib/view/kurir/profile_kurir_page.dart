import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/pegawai_model.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:reusemart_mobile/services/pegawai_service.dart';

class ProfileKurirPage extends StatelessWidget {
  final int kurirId;

  const ProfileKurirPage({super.key, required this.kurirId});

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    final pegawaiService = PegawaiService();

    return FutureBuilder<PegawaiModel>(
      future: pegawaiService.fetchPegawai(kurirId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError) {
          return Center(child: Text('Error: ${snapshot.error}'));
        } else if (!snapshot.hasData) {
          return const Center(child: Text('No data available'));
        }

        final pegawai = snapshot.data!;

        return Column(
          children: [
            Expanded(
              flex: 2,
              child: _TopPortion(pegawai: pegawai),
            ),
            Expanded(
              flex: 3,
              child: Padding(
                padding: const EdgeInsets.all(8.0),
                child: Column(
                  children: [
                    Text(
                      pegawai.name,
                      style:
                          Theme.of(context).textTheme.headlineMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      pegawai.email,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        FloatingActionButton.extended(
                          onPressed: () => _logout(context),
                          heroTag: 'logout',
                          elevation: 0,
                          backgroundColor: Colors.red,
                          label: const Text("Logout"),
                          icon: const Icon(Icons.logout),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _ProfileInfoRow(pegawai: pegawai),
                  ],
                ),
              ),
            ),
          ],
        );
      },
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  final PegawaiModel pegawai;

  const _ProfileInfoRow({required this.pegawai});

  @override
  Widget build(BuildContext context) {
    final items = [
      ProfileInfoItem("Phone", pegawai.noTelp),
      ProfileInfoItem("Birth Date", pegawai.tanggalLahir),
      ProfileInfoItem("Role", pegawai.namaJabatan),
    ];

    return Container(
      height: 120,
      constraints: const BoxConstraints(maxWidth: 400),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        children: items
            .asMap()
            .entries
            .map(
              (entry) => Expanded(
                child: Row(
                  children: [
                    if (entry.key != 0) const VerticalDivider(),
                    Expanded(child: _singleItem(context, entry.value)),
                  ],
                ),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _singleItem(BuildContext context, ProfileInfoItem item) => Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Padding(
            padding: const EdgeInsets.all(4.0),
            child: Text(
              item.value?.toString() ?? 'N/A',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
            ),
          ),
          Text(item.title, style: Theme.of(context).textTheme.bodySmall),
        ],
      );
}

class ProfileInfoItem {
  final String title;
  final dynamic value;
  const ProfileInfoItem(this.title, this.value);
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
          decoration: const BoxDecoration(
            color: Colors.green,
          ),
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
