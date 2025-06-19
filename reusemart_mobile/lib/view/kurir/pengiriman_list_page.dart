import 'package:flutter/material.dart';
import 'package:reusemart_mobile/services/pengiriman_service.dart';
import 'package:reusemart_mobile/view/kurir/history_kurir_page.dart';
import 'package:reusemart_mobile/view/kurir/profile_kurir_page.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PengirimanListPage extends StatefulWidget {
  const PengirimanListPage({super.key});

  @override
  _PengirimanListPageState createState() => _PengirimanListPageState();
}

class _PengirimanListPageState extends State<PengirimanListPage> {
  final PengirimanService _service = PengirimanService();
  List<dynamic> _pengirimanList = [];
  bool _isLoading = false;
  int _currentIndex = 0;
  int? _kurirId;

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
    _loadKurirId();
    _fetchPengiriman();
  }

  Future<void> _loadKurirId() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _kurirId = prefs.getInt('kurir_id');
    });
  }

  Future<void> _fetchPengiriman() async {
    setState(() {
      _isLoading = true;
    });
    try {
      final pengiriman = await _service.fetchPengiriman(context);
      setState(() {
        _pengirimanList = pengiriman;
      });
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
      await _service.markAsArrived(context, pengiriman['id_pengiriman']);
      await _fetchPengiriman();
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
                                  'No Transaksi: ${pengiriman['id_transaksi']}',
                                ),
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

  Widget _buildBody() {
    return IndexedStack(
      index: _currentIndex,
      children: [
        _buildPengirimanList(),
        const DeliveryHistoryPage(),
        _kurirId != null
            ? ProfileKurirPage(kurirId: _kurirId!)
            : const Center(child: Text('Kurir ID not found')),
      ],
    );
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
        backgroundColor: Colors.green,
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
          });
        },
      ),
    );
  }
}
