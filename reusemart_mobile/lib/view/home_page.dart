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
import 'package:reusemart_mobile/view/info_umum.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchAllData();
    _loadUser();
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

      // Link ratings and top-seller flags
      for (var b in allBarang) {
        final p = penitipan.firstWhere(
          (p) => p['id_penitipan'] == b.id_penitipan,
          orElse: () => null,
        );
        if (p != null) {
          final userId = p['id_user'];
          final u = users.firstWhere(
            (u) => u['id_user'] == userId,
            orElse: () => null,
          );
          if (u != null) {
            b.rating = u['rating'] as int?;
            try {
              final userData = UserModel.fromJson({
                ...u,
                'type': 'user',
                'access_token': '',
                'token_type': 'Bearer',
              });
              b.isTopSeller = userData.isTop;
            } catch (_) {
              b.isTopSeller = false;
            }
          } else {
            b.isTopSeller = false;
          }
        } else {
          b.isTopSeller = false;
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
              builder: (_) => ProductPage(barangId: barang.id_barang)),
        );
      },
      child: Card(
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
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
                      child:
                          const Center(child: CircularProgressIndicator()),
                    );
                  }
                  if (snapshot.hasData && snapshot.data!.isNotEmpty) {
                    imageUrl =
                        "http://10.0.2.2:8000/storage/${snapshot.data!.first.path}";
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
                padding: const EdgeInsets.symmetric(
                    horizontal: 8.0, vertical: 6.0),
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
                      style:
                          const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Text("Rating: ",
                            style: TextStyle(fontSize: 12)),
                        if (barang.rating != null) ...[
                          Text(
                            barang.rating.toString(),
                            style: const TextStyle(
                                fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                        ] else ...[
                          const Text("Tidak terdapat rating",
                              style: TextStyle(fontSize: 12)),
                        ],
                      ],
                    ),
                    if (barang.isTopSeller == true) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: const [
                          Icon(Icons.star, size: 16, color: Colors.yellow),
                          SizedBox(width: 5),
                          Text(
                            "Top Seller",
                            style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                                color: Colors.yellow),
                          ),
                        ],
                      ),
                    ],
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
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16.0, vertical: 12.0),
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
                                  b.status_periode
                                          .toLowerCase() ==
                                      "periode 2")
                              .toList();

                          if (kesempatanList.isEmpty) {
                            return const Padding(
                              padding:
                                  EdgeInsets.symmetric(vertical: 12.0),
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
                              separatorBuilder: (_, __) =>
                                  const SizedBox(width: 12),
                              itemBuilder: (ctx, idx) {
                                return SizedBox(
                                  width: 160,
                                  child: _buildProductCard(
                                      kesempatanList[idx]),
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
                                (b.status_periode
                                            .toLowerCase() ==
                                        "periode 1" ||
                                    b.status_periode
                                        .toLowerCase() ==
                                        "periode 2"))
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
                                  (b.status_periode
                                              .toLowerCase() ==
                                          "periode 1" ||
                                      b.status_periode
                                          .toLowerCase() ==
                                          "periode 2"))
                              .toList();
                          return _buildProductCard(gridItems[idx]);
                        },
                      ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              );
  }

  // Dynamically build nav items: omit Merch if user.role == 'penitip'
  List<BottomNavigationBarItem> get _navItems {
    final items = <BottomNavigationBarItem>[
      const BottomNavigationBarItem(
        icon: Icon(Icons.home_outlined),
        activeIcon: Icon(Icons.home_rounded),
        label: 'Home',
      ),
      const BottomNavigationBarItem(
        icon: Icon(Icons.history_outlined),
        activeIcon: Icon(Icons.history_rounded),
        label: 'History',
      ),
    ];
    if (_user?.role?.toLowerCase() != 'penitip') {
      items.add(const BottomNavigationBarItem(
        icon: Icon(Icons.redeem_outlined),
        activeIcon: Icon(Icons.redeem_outlined),
        label: 'Merch',
      ));
    }
    items.add(const BottomNavigationBarItem(
      icon: Icon(Icons.person_outline_rounded),
      activeIcon: Icon(Icons.person_rounded),
      label: 'Profile',
    ));
    return items;
  }

  // Dynamically build pages in the same order
  List<Widget> get _pages {
    final pages = <Widget>[
      _buildHomeContent(),
      _user == null
          ? const Center(
              child: Text(
                "Silahkan Login Terlebih Dahulu!",
                style:
                    TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
            )
          : _user!.role == 'Pembeli'
              ? const HistoryPembeliPage()
              : _user!.role == 'Penitip'
                  ? const HistoryPage()
                  : const Center(
                      child: Text(
                        "Riwayat tidak tersedia untuk role ini",
                        style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
    ];
    if (_user?.role?.toLowerCase() != 'penitip') {
      pages.add(_user == null
          ? const Center(
              child: Text(
                "Silahkan Login Terlebih Dahulu!",
                style: TextStyle(
                    fontSize: 24, fontWeight: FontWeight.bold),
              ),
            )
          : MerchPage());
    }
    pages.add(_user == null
        ? const Center(
            child: Text(
              "Silahkan Login Terlebih Dahulu!",
              style: TextStyle(
                  fontSize: 24, fontWeight: FontWeight.bold),
            ),
          )
        : ProfilePage(user: _user!));
    return pages;
  }

  @override
  Widget build(BuildContext context) {
    final navItems = _navItems;
    final pages = _pages;
    final currentIndex =
        _selectedIndex < pages.length ? _selectedIndex : pages.length - 1;

    return Scaffold(
      appBar: AppBar(
        automaticallyImplyLeading: false,
        backgroundColor: Colors.green,
        centerTitle: false,
        title: GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (_) => const InfoUmum()),
            );
          },
          child: Row(
            children: [
              const Text(
                "ReUseMart",
                style: TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold),
              ),
              const Spacer(),
              if (_user != null)
                Text(
                  "Hello, ${_user!.name}!",
                  style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 16,
                      fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
            ],
          ),
        ),
        actions: [
          if (_user == null)
            TextButton(
              onPressed: () {
                Navigator.of(context).push(MaterialPageRoute(
                    builder: (_) => const LoginScreen()));
              },
              child:
                  const Text("Login", style: TextStyle(color: Colors.white)),
            ),
        ],
      ),
      body: pages[currentIndex],
      bottomNavigationBar: BottomNavigationBar(
        items: navItems,
        currentIndex: currentIndex,
        selectedItemColor: Colors.green,
        unselectedItemColor: Colors.grey,
        onTap: (idx) async {
          // If tapping Profile, reload user
          if (idx == navItems.length - 1) {
            await _loadUser();
          }
          setState(() {
            _selectedIndex = idx;
          });
        },
      ),
    );
  }
}
