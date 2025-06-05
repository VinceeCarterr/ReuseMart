// lib/view/home_page.dart

import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/barang_model.dart';
import 'package:reusemart_mobile/model/foto_barang_model.dart';
import 'package:reusemart_mobile/services/product_service.dart';
import 'package:reusemart_mobile/view/productPage.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

class HomePage extends StatefulWidget {
  const HomePage({Key? key}) : super(key: key);

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  List<Barang> _barangList = [];
  List<dynamic> _penitipanList = [];
  List<dynamic> _userList = [];
  bool _isLoading = true;
  String _searchQuery = "";
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchAllData();
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

      // Debug‐print actual status strings to console:
      for (var b in allBarang) {
        debugPrint(
          ">> BARANG #${b.id_barang}: status='${b.status}' | status_periode='${b.status_periode}'"
        );
      }

      // Stitch rating into each Barang
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text("ReUseMart"),
        backgroundColor: Colors.green,
        actions: [
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
      body: _isLoading
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
                        // Welcome heading
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
                        // Search bar
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
                        // “Kesempatan Terakhir!” HORIZONTAL SCROLL
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
                            // Filter case‐insensitive for Available & Periode 2
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
                                separatorBuilder: (_, __) =>
                                    const SizedBox(width: 12),
                                itemBuilder: (ctx, idx) {
                                  final barang = kesempatanList[idx];
                                  return SizedBox(
                                    width: 160,       // <-- FIXED WIDTH
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

                        // GRID OF AVAILABLE (Periode 1 or 2)
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
                ),
    );
  }

  // Search filtering
  List<Barang> _filteredList() {
    if (_searchQuery.isEmpty) return _barangList;
    return _barangList
        .where((b) =>
            b.nama_barang.toLowerCase().contains(_searchQuery.toLowerCase()))
        .toList();
  }

  // Renders a single product card (first‐photo loaded via FutureBuilder)
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
        shape:
            RoundedRectangleBorder(borderRadius: BorderRadius.circular(8.0)),
        elevation: 4,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ─── IMAGE with FutureBuilder ────────────────────────────
            SizedBox(
              height: 100,
              child: FutureBuilder<List<FotoBarang>>(
                future: ProductService.fetchFotos(barang.id_barang),
                builder: (context, snapshot) {
                  // Default fallback:
                  String imageUrl =
                      "http://10.0.2.2:8000/storage/defaults/no-image.png";

                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(8.0)),
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
                          top: Radius.circular(8.0)),
                    ),
                    child: ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(8.0)),
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

            // ─── TEXTUAL INFO ───────────────────────────────────────
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
                                fontSize: 12, fontWeight: FontWeight.bold),
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
}
