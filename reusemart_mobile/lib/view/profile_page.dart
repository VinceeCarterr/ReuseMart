import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:reusemart_mobile/view/home_page.dart';
import 'package:reusemart_mobile/services/user_service.dart'; // Import your UserService

class ProfilePage extends StatefulWidget {
  final UserModel user;

  const ProfilePage({Key? key, required this.user}) : super(key: key);

  @override
  _ProfilePageState createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  UserModel? _user;
  bool _isLoading = false;
  final UserService _userService = UserService(); // Instantiate UserService

  @override
  void initState() {
    super.initState();
    _user = widget.user; // Initialize with the passed user data
    _loadProfileData();
  }

  Future<void> _loadProfileData() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final prefs = await SharedPreferences.getInstance();
      final accessToken = prefs.getString('access_token');
      if (accessToken != null) {
        // Use UserService to validate the token and get the user
        final fetchedUser = await _userService.validateToken();
        if (fetchedUser != null) {
          setState(() {
            _user = fetchedUser;
          });
        } else {
          // Token validation failed, navigate to login
          print("Token validation failed. Navigating to login.");
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      } else {
        // Handle case where access token is null (e.g., user is not logged in)
        print("Access token is null. User might not be logged in.");
        // Optionally navigate to login page
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } catch (e) {
      print("Error fetching profile: $e");
      // Handle error appropriately (e.g., show a snackbar)
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to refresh profile data: $e')),
      );
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }


  Future<void> _logout(BuildContext context) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('access_token');
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const HomePage()), // Navigate to LoginPage after logout
      (route) => false,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _isLoading
          ? Center(child: CircularProgressIndicator())
          : (_user == null
              ? Center(child: Text("Failed to load profile."))
              : Column(
                  children: [
                    Expanded(
                      flex: 2,
                      child: _TopPortion(
                          profilePictureUrl:
                              _user!.profile_picture), // Use the updated user data
                    ),
                    Expanded(
                      flex: 3,
                      child: Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Column(
                          children: [
                            Text(
                              _user!.name, // Use the updated user data
                              style: Theme.of(context)
                                  .textTheme
                                  .headlineMedium
                                  ?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              _user!.email, // Use the updated user data
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
                            _ProfileInfoRow(user: _user!), // Use the updated user data
                          ],
                        ),
                      ),
                    ),
                  ],
                )),
    );
  }
}

class _ProfileInfoRow extends StatelessWidget {
  final UserModel user;

  const _ProfileInfoRow({required this.user});

  @override
  Widget build(BuildContext context) {
    // Initialize NumberFormat for Rupiah
    final fmt = NumberFormat('#,##0', 'id_ID');

    final items = [
      if (user.no_telp != null) ProfileInfoItem("Nomor Telepon", user.no_telp),
      if (user.type == 'user' && user.poin_loyalitas != null)
        ProfileInfoItem("Poin Loyalitas", user.poin_loyalitas),
      if (user.role?.toLowerCase() == 'penitip') // Show Saldo for role 3
        ProfileInfoItem("Saldo", user.saldo), // Pass raw saldo value
      if (user.role == '1') ProfileInfoItem("Role", user.role ?? "Pembeli"),
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

  Widget _singleItem(BuildContext context, ProfileInfoItem item) {
    // Initialize NumberFormat for Rupiah
    final rupiahFormat = NumberFormat.currency(
      locale: 'id_ID',
      symbol: 'Rp ',
      decimalDigits: 0, // No decimal places for Rupiah
    );

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Padding(
          padding: const EdgeInsets.all(4.0),
          child: Text(
            item.title == "Saldo" && item.value != null
                ? item.value is String
                    ? '${rupiahFormat.format(int.parse(item.value))}'
                    : '${rupiahFormat.format(item.value)}'
                : item.value?.toString() ?? 'N/A',
            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
          ),
        ),
        Text(item.title, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }
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
                        ? 'https://mediumvioletred-newt-905266.hostingersite.com/storage/$profilePictureUrl'
                        : 'https://via.placeholder.com/150',
                    fit: BoxFit.cover,
                    placeholder: (context, url) =>
                        const CircularProgressIndicator(),
                    errorWidget: (context, url, error) {
                      print('Image load error: $error, URL: $url');
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