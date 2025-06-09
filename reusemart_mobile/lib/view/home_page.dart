import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/barang_model.dart';
import 'package:reusemart_mobile/model/foto_barang_model.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/product_service.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:reusemart_mobile/view/productPage.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:reusemart_mobile/view/profile_page.dart';
import 'package:reusemart_mobile/view/history_page.dart';
import 'package:reusemart_mobile/view/historyPembeli_page.dart';
import 'package:reusemart_mobile/view/merch_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _selectedIndex = 0;
  List<Barang> _barangList = [];
  List<dynamic> _penitipanList = [];
  List<dynamic> _userList = [];
  bool _isLoading = true;
  String _searchQuery = "";
  String? _error;
  UserModel? _user;
  final _userService = UserService();

  static const _navBarItems = [
    BottomNavigationBarItem(
      icon: Icon(Icons.home_outlined),
      activeIcon: Icon(Icons.home_rounded),
      label: 'Home',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.history_outlined),
      activeIcon: Icon(Icons.history_rounded),
      label: 'History',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.redeem_outlined),
      activeIcon: Icon(Icons.redeem_outlined),
      label: 'Merch',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.person_outline_rounded),
      activeIcon: Icon(Icons.person_rounded),
      label: 'Profile',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _fetchAllData();
    _loadUser().then((_) {
      if (mounted) setState(() {});
    });
  }

  Future<void> _loadUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      debugPrint("HomePage - Access token: $token");
      final user = await _userService.validateToken();
      debugPrint("HomePage - User loaded: ${user?.name}");
      if (mounted) {
        setState(() {
          _user = user;
        });
      }
    } catch (e) {
      debugPrint("HomePage - Error loading user: $e");
      if (mounted) {
        setState(() {
          _user = null;
        });
      }
    }
  }

  Future<void> _fetchAllData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final results = await Future.wait([
        ProductService.fetchAllBarang(),
        ProductService.fetchPenitipanPublic(),
        ProductService.fetchUserPublic(),
      ]);

      final allBarang = results[0] as List<Barang>;
      final penitipan = results[1] as List<dynamic>;
      final users = results[2] as List<dynamic>;

      for (var b in allBarang) {
        debugPrint(
            ">> BARANG #${b.id_barang}: status='${b.status}' | status_periode='${b.status_periode}'");
      }

      for (var b in allBarang) {
        final p = penitipan.firstWhere(
          (p) => p['id_penitipan'] == b.id_penitipan,
          orElse: () => <String, dynamic>{},
        );
        if (p.isNotEmpty) {
          final userId = p['id_user'];
          final u = users.firstWhere(
            (u) => u['id_user'] == userId,
            orElse: () => <String, dynamic>{},
          );
          if (u.isNotEmpty && u['rating'] != null) {
            b.rating = u['rating'] as int;
          }
        }
      }

      setState(() {
        _barangList = allBarang;
        _penitipanList = penitipan;
        _userList = users;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error fetching home data: $e");
      setState(() {
        _error = "Gagal mengambil data. Silakan coba lagi.";
        _isLoading = false;
      });
    }
  }

  List<Barang> _filteredList() {
    if (_searchQuery.isEmpty) return _barangList;
    return _barangList
        .where((b) =>
            b.nama_barang.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  Widget _buildProductCard(Barang barang) {
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ProductPage(barangId: barang.id_barang),
          ),
        );
      },
      child: Card(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
        elevation: 4,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            SizedBox(
              height: 100,
              child: FutureBuilder<List<FotoBarang>>(
                future: ProductService.fetchFotos(barang.id_barang),
                builder: (context, snapshot) {
                  String imageUrl =
                      "http://10.0.2.2:8000/storage/defaults/no-image.png";

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8.0),
                        ),
                      ),
                      child: const Center(child: CircularProgressIndicator()),
                    );
                  }

                  if (snapshot.hasData) {
                    final fotos = snapshot.data!;
                    if (fotos.isNotEmpty) {
                      imageUrl =
                          "http://10.0.2.2:8000/storage/${fotos.first.path}";
                    }
                  }

                  return Container(
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8.0),
                      ),
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(8.0),
                      ),
                      child: Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.broken_image, size: 40),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            Expanded(
              child: Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8.0, vertical: 6.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      barang.nama_barang,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      barang.formattedHarga,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      barang.kategori,
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const Spacer(),
                    Row(
                      children: [
                        const Text(
                          "Rating: ",
                          style: TextStyle(fontSize: 12),
                        ),
                        if (barang.rating != null) ...[
                          Text(
                            barang.rating.toString(),
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ] else ...[
                          const Text(
                            "N/A",
                            style: TextStyle(fontSize: 12),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHomeContent() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator(color: Colors.green))
        : _error != null
            ? Center(
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.red, fontSize: 16),
                ),
              )
            : SingleChildScrollView(
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 24),
                      Center(
                        child: Column(
                          children: const [
                            Text(
                              "Selamat Datang di ReuseMart!",
                              style: TextStyle(
                                fontSize: 22,
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              "Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!",
                              style: TextStyle(fontSize: 16),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 24),
                      TextField(
                        decoration: InputDecoration(
                          hintText: "Cari produk...",
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8.0),
                          ),
                        ),
                        onChanged: (val) {
                          setState(() {
                            _searchQuery = val.trim();
                          });
                        },
                      ),
                      const SizedBox(height: 24),
                      const Text(
                        "Kesempatan Terakhir!",
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.green,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Builder(
                        builder: (_) {
                          final kesempatanList = _filteredList()
                              .where((b) =>
                                  b.status.toLowerCase() == "available" &&
                                  b.status_periode.toLowerCase() == "periode 2")
                              .toList();

                          if (kesempatanList.isEmpty) {
                            return const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12.0),
                              child: Text(
                                "Tidak ada kesempatan terakhir saat ini.",
                                style: TextStyle(color: Colors.grey),
                              ),
                            );
                          }

                          return SizedBox(
                            height: 250,
                            child: ListView.separated(
                              scrollDirection: Axis.horizontal,
                              itemCount: kesempatanList.length,
                              separatorBuilder: (_, __) => const SizedBox(width: 12),
                              itemBuilder: (ctx, idx) {
                                final barang = kesempatanList[idx];
                                return SizedBox(
                                  width: 160,
                                  child: _buildProductCard(barang),
                                );
                              },
                            ),
                          );
                        },
                      ),
                      const SizedBox(height: 24),
                      const Divider(thickness: 1.0),
                      const SizedBox(height: 12),
                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        itemCount: _filteredList()
                            .where((b) =>
                                b.status.toLowerCase() == "available" &&
                                (b.status_periode.toLowerCase() == "periode 1" ||
                                    b.status_periode.toLowerCase() == "periode 2"))
                            .length,
                        gridDelegate:
                            const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          childAspectRatio: 0.7,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                        itemBuilder: (ctx, idx) {
                          final gridItems = _filteredList()
                              .where((b) =>
                                  b.status.toLowerCase() == "available" &&
                                  (b.status_periode.toLowerCase() == "periode 1" ||
                                      b.status_periode.toLowerCase() == "periode 2"))
                              .toList();
                          final barang = gridItems[idx];
                          return _buildProductCard(barang);
                        },
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              );
  }

  List<Widget> _buildPageContent() {
    return [
      _buildHomeContent(),
      _user == null
          ? const Center(
              child: Text(
                "Silahkan Login Terlebih Dahulu",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            )
          : _user!.role == 'Pembeli'
              ? const HistoryPembeliPage()
              : _user!.role == 'Penitip'
                  ? const HistoryPage()
                  : const Center(
                      child: Text(
                        "Riwayat tidak tersedia untuk role ini",
                        style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                    ),
      MerchPage(),
      _user == null
          ? const Center(
              child: Text(
                "Silahkan Login Terlebih Dahulu",
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            )
          : ProfilePage(user: _user!),
    ];
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.green,
        centerTitle: false,
        title: Row(
          children: [
            const Text(
              "ReUseMart",
              style: TextStyle(
                color: Colors.white,
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Spacer(),
            if (_user != null)
              Text(
                "Hello, ${_user!.name}!",
                style: const TextStyle(
                  color: Colors.white70,
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                ),
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        actions: [
          if (_user == null)
            TextButton(
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => const LoginScreen()),
                );
              },
              child: const Text(
                "Login",
                style: TextStyle(color: Colors.white),
              ),
            ),
        ],
      ),
      body: _buildPageContent()[_selectedIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: _navBarItems,
        currentIndex: _selectedIndex,
        selectedItemColor: Colors.green,
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
      ),
    );
  }
}