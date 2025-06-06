import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';

class ProfilePage extends StatelessWidget {
  final UserModel user;

  const ProfilePage({super.key, required this.user});

  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  @override
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          Expanded(
            flex: 2,
            child: _TopPortion(
                profilePictureUrl:
                    user.profile_picture), // Pass the profile picture URL
          ),
          Expanded(
            flex: 3,
            child: Padding(
              padding: const EdgeInsets.all(8.0),
              child: Column(
                children: [
                  Text(
                    user.name,
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    user.email,
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
                  _ProfileInfoRow(user: user),
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
  final UserModel user;

  const _ProfileInfoRow({required this.user});

  @override
  Widget build(BuildContext context) {
    final items = [
      if (user.no_telp != null) ProfileInfoItem("Phone", user.no_telp),
      if (user.type == 'user' && user.poin_loyalitas != null)
        ProfileInfoItem("Loyalty Points", user.poin_loyalitas),
    ];

    return Container(
      height: 80,
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
  final String? profilePictureUrl;

  const _TopPortion({this.profilePictureUrl});

  @override
  Widget build(BuildContext context) {
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
                ClipOval(
                  child: CachedNetworkImage(
                    imageUrl: profilePictureUrl != null
                        ? 'http://10.0.2.2:8000$profilePictureUrl' // Remove extra slash
                        : 'https://via.placeholder.com/150',
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        const CircularProgressIndicator(),
                    errorWidget: (context, url, error) {
                      print('Image load error: $error, URL: $url'); // Debug log
                      return Image.network(
                        'https://via.placeholder.com/150',
                        fit: BoxFit.cover,
                      );
                    },
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
