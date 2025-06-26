import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../model/barang_model.dart';
import '../model/foto_barang_model.dart';
import '../model/komentar_model.dart';
import '../services/product_service.dart';

class ProductPage extends StatefulWidget {
  final int barangId;
  const ProductPage({Key? key, required this.barangId}) : super(key: key);

  @override
  _ProductPageState createState() => _ProductPageState();
}

class _ProductPageState extends State<ProductPage> {
  bool _isLoading = true;

  Barang? _barang;
  List<FotoBarang> _fotos = [];
  String? _selectedPhotoPath;
  List<Komentar> _comments = [];
  String? _error;
  int? _userRating;

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
      // 1) Fetch barang data
      final barangData = await ProductService.fetchBarangById(widget.barangId);

      // 2) Resolve penitip’s rating
      final penitipanList = await ProductService.fetchPenitipanPublic();
      final userList = await ProductService.fetchUserPublic();
      final mapPenitipan = penitipanList.firstWhere(
        (p) => p['id_penitipan'] == barangData.id_penitipan,
        orElse: () => <String, dynamic>{},
      );
      if (mapPenitipan.isNotEmpty) {
        final userIdOfPenitip = mapPenitipan['id_user'];
        final userMap = userList.firstWhere(
          (u) => u['id_user'] == userIdOfPenitip,
          orElse: () => <String, dynamic>{},
        );
        if (userMap.isNotEmpty) {
          barangData.rating = userMap['rating'];
          _userRating = userMap['rating'];
        }
      }

      // 3) Fetch photos
      final fotos = await ProductService.fetchFotos(widget.barangId);

      // 4) Fetch comments (read only)
      final comments = await ProductService.fetchKomentar(widget.barangId);

      setState(() {
        _barang = barangData;
        _fotos = fotos;
        if (_fotos.isNotEmpty) _selectedPhotoPath = _fotos.first.path;
        _comments = comments;
        _isLoading = false;
      });
    } catch (e, stack) {
      debugPrint("❌ _fetchAllData error: $e");
      debugPrintStack(label: "_fetchAllData stack trace", stackTrace: stack);
      setState(() {
        _error = "Gagal mengambil data. Silakan coba lagi.";
        _isLoading = false;
      });
    }
  }

  /// “Garansi” helper
  String _cekGaransi(String? garansi) {
    if (garansi == null) return "Tidak ada garansi";
    try {
      final dt = DateTime.parse(garansi);
      if (dt.isBefore(DateTime.now())) return "Tidak ada garansi";
      return "${dt.day} ${_monthName(dt.month)} ${dt.year}";
    } catch (_) {
      return "Tidak ada garansi";
    }
  }

  String _monthName(int num) {
    const months = [
      "",
      "Januari",
      "Februari",
      "Maret",
      "April",
      "Mei",
      "Juni",
      "Juli",
      "Agustus",
      "September",
      "Oktober",
      "November",
      "Desember"
    ];
    return months[num];
  }

  /// Simply launch the web URL; no add‐to‐cart logic on mobile
  Future<void> _launchWebCart() async {
    // On Android emulator: use 10.0.2.2
    final Uri url = Uri.parse("https://reuse-mart.vercel.app/");
    if (!await launchUrl(url, mode: LaunchMode.externalApplication)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Gagal membuka browser')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        appBar: AppBar(
          title: const Text("Produk"),
          backgroundColor: Colors.green,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Colors.green),
        ),
      );
    }

    if (_error != null && _barang == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text(
            "Produk",
            style: TextStyle(color: Colors.white),
          ),
          backgroundColor: Colors.green,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => Navigator.of(context).pop(),
          ),
        ),
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontSize: 16),
            ),
          ),
        ),
      );
    }

    final barang = _barang!;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Produk"),
        backgroundColor: Colors.green,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => Navigator.of(context).pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12.0, horizontal: 16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // ─── IMAGE SECTION ───────────────────────────────────────────────
              if (_selectedPhotoPath != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    "https://mediumvioletred-newt-905266.hostingersite.com/storage/${_selectedPhotoPath!}",
                    height: 250,
                    width: double.infinity,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const SizedBox(
                      height: 250,
                      child: Center(child: Icon(Icons.broken_image)),
                    ),
                  ),
                ),

              if (_fotos.length > 1) ...[
                const SizedBox(height: 8),
                SizedBox(
                  height: 70,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: _fotos.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (ctx, idx) {
                      final f = _fotos[idx];
                      final isSelected = f.path == _selectedPhotoPath;
                      return GestureDetector(
                        onTap: () {
                          setState(() {
                            _selectedPhotoPath = f.path;
                          });
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            border: isSelected
                                ? Border.all(color: Colors.green, width: 2)
                                : null,
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: Image.network(
                              "https://mediumvioletred-newt-905266.hostingersite.com/storage/${f.path}",
                              width: 70,
                              height: 70,
                              fit: BoxFit.cover,
                              errorBuilder: (_, __, ___) => const SizedBox(
                                width: 70,
                                height: 70,
                                child: Icon(Icons.broken_image),
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],

              const SizedBox(height: 20),

              // ─── PRODUCT INFO ─────────────────────────────────────────────────
              Container(
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(10),
                ),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Name and Price Row
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            barang.nama_barang,
                            style: const TextStyle(
                              fontSize: 22,
                              color: Colors.black,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                        Text(
                          "Rp ${barang.harga}",
                          style: const TextStyle(
                            fontSize: 20,
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text(
                      "Deskripsi Produk:",
                      style: TextStyle(fontSize: 14, color: Colors.grey),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      barang.deskripsi,
                      style: const TextStyle(fontSize: 16, color: Colors.black87),
                    ),
                    const SizedBox(height: 12),
                    // Kategori & Garansi
                    Text(
                      "Kategori: ${barang.kategori}\n"
                      "Garansi: ${_cekGaransi(barang.garansi)}",
                      style: const TextStyle(fontSize: 14, color: Colors.black87),
                    ),
                    const SizedBox(height: 8),
                    // Rating under Garansi (Penitip {rating} ★)
                    Row(
                      children: [
                        const Text(
                          "Penitip ",
                          style: TextStyle(fontSize: 14, color: Colors.black87),
                        ),
                        if (_userRating != null && _userRating! > 0) ...[
                          Text(
                            _userRating!.toString(),
                            style: const TextStyle(
                                fontSize: 14, color: Colors.black87),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.star, color: Colors.yellow, size: 18),
                        ] else ...[
                          const Text(
                            "Belum memiliki rating",
                            style:
                                TextStyle(fontSize: 14, color: Colors.black87),
                          ),
                          const SizedBox(width: 4),
                          const Icon(Icons.star_outline,
                              color: Colors.grey, size: 18),
                        ],
                      ],
                    ),
                    const SizedBox(height: 12),
                    // “Tambah ke Keranjang” launches the web page
                    ElevatedButton(
                      onPressed: _launchWebCart,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.green,
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.green),
                      ),
                      child: const Text("Tambah ke Keranjang"),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // ─── FORUM DISKUSI (READ ONLY, fully scrollable) ───────────────────────
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: 12, horizontal: 16),
                      decoration: const BoxDecoration(
                        color: Colors.green,
                        borderRadius:
                            BorderRadius.vertical(top: Radius.circular(8)),
                      ),
                      child: const Text(
                        "Forum Diskusi",
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0),
                      child: _comments.isEmpty
                          ? const Padding(
                              padding: EdgeInsets.only(bottom: 16.0),
                              child: Text(
                                "Belum ada komentar.",
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : Column(
                              children: _comments.map((c) {
                                return Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 8),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        c.penulis_nama,
                                        style: const TextStyle(
                                            fontWeight: FontWeight.bold),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(c.komentar),
                                      const SizedBox(height: 4),
                                      Text(
                                        c.formattedWaktu,
                                        style: const TextStyle(
                                            color: Colors.grey, fontSize: 12),
                                      ),
                                      const Divider(),
                                    ],
                                  ),
                                );
                              }).toList(),
                            ),
                    ),
                    const SizedBox(height: 16),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
