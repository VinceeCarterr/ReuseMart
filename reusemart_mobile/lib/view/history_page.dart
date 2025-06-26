import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/barang_model.dart';
import 'package:reusemart_mobile/model/foto_barang_model.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/product_service.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class HistoryPage extends StatefulWidget {
  const HistoryPage({Key? key}) : super(key: key);

  @override
  State<HistoryPage> createState() => _HistoryPageState();
}

class _HistoryPageState extends State<HistoryPage> {
  List<Barang> _barangList = [];
  List<dynamic> _penitipanList = [];
  List<dynamic> _userList = [];
  bool _isLoading = true;
  String? _error;
  UserModel? _user;
  final UserService _userService = UserService();
  bool _isAscending = true; // New state variable for sort order

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
      debugPrint("HistoryPage - Access token: $token");
      final user = await _userService.validateToken();
      debugPrint("HistoryPage - User loaded: ${user?.name}, id: ${user?.id}");
      if (mounted) {
        setState(() {
          _user = user;
        });
      }
    } catch (e) {
      debugPrint("HistoryPage - Error loading user: $e");
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
            ">> BARANG #${b.id_barang}: id_penitipan=${b.id_penitipan}, status='${b.status}', status_periode='${b.status_periode}'");
      }
      for (var p in penitipan) {
        debugPrint(
            ">> PENITIPAN #${p['id_penitipan']}: id_user=${p['id_user']}");
      }
      debugPrint(">> USERS: ${users.map((u) => u['id_user']).toList()}");

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
      debugPrint("Error fetching history data: $e");
      setState(() {
        _error = "Gagal mengambil data. Silakan coba lagi.";
        _isLoading = false;
      });
    }
  }

  List<Barang> _filteredList() {
    if (_user == null) {
      debugPrint("HistoryPage - No user logged in, returning empty list");
      return [];
    }
    final filtered = _barangList.where((b) {
      final p = _penitipanList.firstWhere(
        (p) => p['id_penitipan'] == b.id_penitipan,
        orElse: () => <String, dynamic>{},
      );
      if (p.isEmpty) {
        debugPrint(
            "HistoryPage - No penitipan found for barang #${b.id_barang}");
        return false;
      }
      final penitipanUserId = p['id_user'].toString();
      final matches = penitipanUserId == _user!.id;
      debugPrint(
          "HistoryPage - Barang #${b.id_barang}: penitipan id_user=$penitipanUserId, user id=${_user!.id}, matches=$matches");
      return matches;
    }).toList();

    filtered.sort((a, b) {
      return _isAscending
          ? a.nama_barang.compareTo(b.nama_barang)
          : b.nama_barang.compareTo(a.nama_barang);
    });

    debugPrint("HistoryPage - Filtered list length: ${filtered.length}");
    return filtered;
  }

  Widget _buildProductCard(Barang barang) {
    return Card(
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
                        "https://mediumvioletred-newt-905266.hostingersite.com/storage/${fotos.first.path}";
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
                    const SizedBox(height: 2),
                    Text(
                      barang.formattedHarga,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: Colors.green,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      barang.kategori,
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      barang.kode_barang,
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Colors.black),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      barang.tanggal_titip,
                      style: const TextStyle(fontSize: 12, color: Colors.black),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      barang.status,
                      style: const TextStyle(fontSize: 12, color: Colors.black),
                    ),
                    const SizedBox(height: 2),
                    if (barang.status_periode == 'Periode 2')
                      const Text(
                        'Perpanjangan',
                        style: TextStyle(fontSize: 12, color: Colors.black),
                      ),
                  ],
                )),
          ),
        ],
      ),
    );
  }

  Widget _buildPageContent() {
    if (_user == null) {
      return const Center(
        child: Text(
          "Silahkan Login Terlebih Dahulu",
          style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
      );
    }
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            "Riwayat Penitipan",
                            style: TextStyle(
                              fontSize: 18,
                              color: Colors.green,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          DropdownButton<bool>(
                            value: _isAscending,
                            onChanged: (bool? newValue) {
                              if (newValue != null) {
                                setState(() {
                                  _isAscending = newValue;
                                });
                              }
                            },
                            items: const [
                              DropdownMenuItem(
                                value: true,
                                child: Text("Asc"),
                              ),
                              DropdownMenuItem(
                                value: false,
                                child: Text("Desc"),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 24),
                      _filteredList().isEmpty
                          ? const Padding(
                              padding: EdgeInsets.symmetric(vertical: 12.0),
                              child: Text(
                                "Tidak ada riwayat penitipan saat ini.",
                                style: TextStyle(color: Colors.grey),
                              ),
                            )
                          : GridView.builder(
                              shrinkWrap: true,
                              physics: const NeverScrollableScrollPhysics(),
                              itemCount: _filteredList().length,
                              gridDelegate:
                                  const SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: 2,
                                childAspectRatio: 0.7,
                                crossAxisSpacing: 12,
                                mainAxisSpacing: 12,
                              ),
                              itemBuilder: (ctx, idx){
                                final barang = _filteredList()[idx];
                                return _buildProductCard(barang);
                              },
                            ),
                      const SizedBox(height: 24),
                    ],
                  ),
                ),
              );
  }

  @override
  Widget build(BuildContext context) {
    return _buildPageContent();
  }
}