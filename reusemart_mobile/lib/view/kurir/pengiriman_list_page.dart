import 'package:flutter/material.dart';
import 'package:reusemart_mobile/services/pengiriman_service.dart';
import 'package:reusemart_mobile/view/kurir/profile_kurir_page.dart';
import 'package:reusemart_mobile/view/login_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class PengirimanListPage extends StatefulWidget {
  const PengirimanListPage({Key? key}) : super(key: key);

  @override
  _PengirimanListPageState createState() => _PengirimanListPageState();
}

class _PengirimanListPageState extends State<PengirimanListPage> {
  final PengirimanService _service = PengirimanService();
  List<dynamic> _pengirimanList = [];
  List<dynamic> _historyList = [];
  bool _isLoading = false;
  int _currentIndex = 0;

  static const _navBarItems = [
    BottomNavigationBarItem(
      icon: Icon(Icons.local_shipping_outlined),
      activeIcon: Icon(Icons.local_shipping_rounded),
      label: 'Pengiriman',
    ),
    BottomNavigationBarItem(
      icon: Icon(Icons.history_outlined),
      activeIcon: Icon(Icons.history_rounded),
      label: 'History',
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
    if (_currentIndex == 0) {
      _fetchPengiriman();
    } else if (_currentIndex == 1) {
      _fetchHistory();
    }
  }

  Future<void> _fetchPengiriman() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final pengiriman = await _service.fetchPengiriman();
      setState(() {
        _pengirimanList = pengiriman;
      });
    } catch (e) {
      if (e.toString().contains('Unauthenticated')) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('access_token');
        await prefs.remove('remember_me');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading pengiriman: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _fetchHistory() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final history = await _service.fetchDeliveryHistory();
      setState(() {
        _historyList = history;
      });
    } catch (e) {
      if (e.toString().contains('Unauthenticated')) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('access_token');
        await prefs.remove('remember_me');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error loading history: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _handleArrived(Map<String, dynamic> pengiriman) async {
    setState(() {
      _isLoading = true;
    });

    try {
      await _service.markAsArrived(pengiriman['id_pengiriman']);
      await _fetchPengiriman();

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Pengiriman marked as Arrived')),
      );
    } catch (e) {
      if (e.toString().contains('Unauthenticated')) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.remove('access_token');
        await prefs.remove('remember_me');
        if (mounted) {
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Gagal menandai pengiriman Arrived: $e')),
        );
      }
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Widget _buildPengirimanList() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _pengirimanList.isEmpty
            ? const Center(child: Text('No pengiriman found'))
            : ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: _pengirimanList.length,
                itemBuilder: (context, index) {
                  final pengiriman = _pengirimanList[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.green.shade300,
                            width: 1,
                          ),
                        ),
                        child: ListTile(
                          contentPadding: const EdgeInsets.all(16.0),
                          title: Text(
                            'Pengiriman #${pengiriman['id_pengiriman']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          subtitle: Padding(
                            padding: const EdgeInsets.only(top: 8.0),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Status: ${pengiriman['status_pengiriman']}',
                                  style: TextStyle(
                                    color: pengiriman['status_pengiriman'] ==
                                            'Arrived'
                                        ? Colors.green.shade700
                                        : Colors.black87,
                                  ),
                                ),
                                Text(
                                  'Tanggal: ${pengiriman['tanggal_pengiriman'].toString().split(' ')[0]}',
                                ),
                                Text(
                                    'No Transaksi: ${pengiriman['id_transaksi']}'),
                                if (pengiriman['transaksi'] != null)
                                  Text(
                                    'Metode: ${pengiriman['transaksi']['metode_pengiriman'] ?? 'N/A'}',
                                  ),
                              ],
                            ),
                          ),
                          trailing: ElevatedButton(
                            onPressed:
                                pengiriman['status_pengiriman'] == 'Arrived' ||
                                        _isLoading
                                    ? null
                                    : () => _handleArrived(pengiriman),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.green.shade600,
                              foregroundColor: Colors.white,
                              minimumSize: const Size(100, 36),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8),
                              ),
                            ),
                            child: const Text('Mark Arrived'),
                          ),
                        ),
                      ),
                    ),
                  );
                },
              );
  }

  Widget _buildHistoryPage() {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _historyList.isEmpty
            ? const Center(child: Text('No delivery history found'))
            : ListView.builder(
                padding: const EdgeInsets.all(16.0),
                itemCount: _historyList.length,
                itemBuilder: (context, index) {
                  final delivery = _historyList[index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 16.0),
                    child: Card(
                      elevation: 4,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: Colors.blue.shade300,
                            width: 1,
                          ),
                        ),
                        child: ExpansionTile(
                          title: Text(
                            'Transaction #${delivery['no_nota']}',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 18,
                            ),
                          ),
                          subtitle: Text(
                            'Date: ${DateFormat('dd MMM yyyy').format(DateTime.parse(delivery['tanggal_transaksi']))}',
                          ),
                          children: [
                            Padding(
                              padding: const EdgeInsets.all(16.0),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Customer: ${delivery['user_first_name']} ${delivery['user_last_name']}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Address: ${delivery['alamat']}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Shipping Cost: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['biaya_pengiriman'])}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Total: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['total'])}',
                                    style: const TextStyle(fontSize: 16),
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Status: ${delivery['status_transaksi']}',
                                    style: TextStyle(
                                      fontSize: 16,
                                      color: delivery['status_transaksi'] ==
                                              'Menunggu Verifikasi'
                                          ? Colors.orange
                                          : Colors.green.shade700,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Items:',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16,
                                    ),
                                  ),
                                  ...delivery['detil_transaksi']
                                      .map<Widget>((item) {
                                    return Padding(
                                      padding: const EdgeInsets.only(
                                          left: 16.0, top: 4.0),
                                      child: Text(
                                        '- ${item['barang']['nama_barang']} (Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(item['barang']['harga'])})',
                                        style: const TextStyle(fontSize: 14),
                                      ),
                                    );
                                  }).toList(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  );
                },
              );
  }

  Widget _buildProfilePage() {
    return FutureBuilder<SharedPreferences>(
      future: SharedPreferences.getInstance(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        } else if (snapshot.hasError || !snapshot.hasData) {
          return const Center(child: Text('Failed to load profile'));
        }

        final prefs = snapshot.data!;
        final kurirId = prefs.getInt('kurir_id');

        if (kurirId == null) {
          return const Center(child: Text('Kurir ID not found'));
        }

        return ProfileKurirPage(kurirId: kurirId);
      },
    );
  }

  Widget _buildBody() {
    switch (_currentIndex) {
      case 0:
        return _buildPengirimanList();
      case 1:
        return _buildHistoryPage();
      case 2:
        return _buildProfilePage();
      default:
        return _buildPengirimanList();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          _currentIndex == 0
              ? 'Daftar Pengiriman'
              : _currentIndex == 1
                  ? 'History'
                  : 'Profile',
        ),
      ),
      body: _buildBody(),
      bottomNavigationBar: BottomNavigationBar(
        items: _navBarItems,
        currentIndex: _currentIndex,
        selectedItemColor: Colors.blue,
        unselectedItemColor: Colors.grey,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
            if (index == 0) {
              _fetchPengiriman();
            } else if (index == 1) {
              _fetchHistory();
            }
          });
        },
      ),
    );
  }
}
