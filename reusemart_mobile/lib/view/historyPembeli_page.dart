import 'dart:io';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:reusemart_mobile/model/user_model.dart';
import 'package:reusemart_mobile/services/user_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:reusemart_mobile/services/transaksi_service.dart' as ts;
import 'package:reusemart_mobile/model/barang_model.dart';
import 'package:reusemart_mobile/model/transaksi_model.dart' as tm;

class HistoryPembeliPage extends StatefulWidget {
  const HistoryPembeliPage({Key? key}) : super(key: key);

  @override
  State<HistoryPembeliPage> createState() => _HistoryPembeliPageState();
}

class _HistoryPembeliPageState extends State<HistoryPembeliPage> {
  List<tm.Transaksi> _transaksiList = [];
  bool _isLoading = true;
  String? _error;
  UserModel? _user;
  final UserService _userService = UserService();
  DateTime? _fromDate;
  DateTime? _toDate;

  @override
  void initState() {
    super.initState();
    _fetchAllData();
  }

  Future<void> _loadUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('access_token');
      debugPrint("HistoryPage - Access token: $token");
      if (token == null || token.isEmpty) {
        throw Exception("No access token found");
      }
      final user = await _userService.validateToken();
      debugPrint(
          "HistoryPage - User loaded: ${user?.name}, id: ${user?.id}, role: ${user?.role}");
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
          _error = "Failed to load user: $e";
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
      await _loadUser(); // Load user first

      if (_user == null) {
        // If user is not logged in, set loading to false and return
        setState(() {
          _isLoading = false;
        });
        return; // Exit early if user is not logged in
      }

      if (_user!.role != 'Pembeli') {
        throw Exception(
            "Access denied: User is not a Pembeli (role: ${_user!.role})");
      }

      debugPrint("HistoryPage - Fetching transactions for Pembeli");
      final transaksiList = await ts.TransaksiService.fetchAllTransaksi();
      debugPrint(
          "HistoryPage - Transactions fetched: ${transaksiList.length} items");

      if (mounted) {
        setState(() {
          _transaksiList = transaksiList.map((t) => t as tm.Transaksi).toList();
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint("HistoryPage - Error fetching transaction history: $e");
      if (mounted) {
        setState(() {
          _error = e.toString().contains("401")
              ? "Unauthorized: Please log in again"
              : e.toString().contains("403")
                  ? "Access denied: Invalid user role"
                  : e is HttpException
                      ? "Network error: Unable to connect to server"
                      : "Gagal mengambil data transaksi: $e";
          _isLoading = false;
        });
      }
    }
  }

  void _showDateRangeModal() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        DateTime? tempFromDate = _fromDate;
        DateTime? tempToDate = _toDate;
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: const Text(
            'Pilih Rentang Tanggal',
            style:
                TextStyle(fontWeight: FontWeight.bold, color: Colors.black87),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('Dari', style: TextStyle(fontSize: 14)),
                subtitle: Text(
                  tempFromDate != null
                      ? DateFormat('dd/MM/yyyy').format(tempFromDate)
                      : 'Pilih tanggal',
                  style: const TextStyle(color: Colors.grey),
                ),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: tempFromDate ?? DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() {
                      tempFromDate = picked;
                    });
                  }
                },
              ),
              ListTile(
                title: const Text('Sampai', style: TextStyle(fontSize: 14)),
                subtitle: Text(
                  tempToDate != null
                      ? DateFormat('dd/MM/yyyy').format(tempToDate)
                      : 'Pilih tanggal',
                  style: const TextStyle(color: Colors.grey),
                ),
                onTap: () async {
                  final picked = await showDatePicker(
                    context: context,
                    initialDate: tempToDate ?? DateTime.now(),
                    firstDate: DateTime(2000),
                    lastDate: DateTime.now(),
                  );
                  if (picked != null) {
                    setState(() {
                      tempToDate = picked;
                    });
                  }
                },
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                setState(() {
                  _fromDate = null;
                  _toDate = null;
                });
                Navigator.of(context).pop();
              },
              child: const Text('Reset', style: TextStyle(color: Colors.red)),
            ),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Batal', style: TextStyle(color: Colors.grey)),
            ),
            TextButton(
              onPressed: () {
                setState(() {
                  _fromDate = tempFromDate;
                  _toDate = tempToDate;
                });
                Navigator.of(context).pop();
              },
              child:
                  const Text('Terapkan', style: TextStyle(color: Colors.green)),
            ),
          ],
        );
      },
    );
  }

  void _showTransactionDetailsModal(tm.Transaksi transaksi) {
    debugPrint(
        "Showing details for Transaksi: ${transaksi.noNota}, Detil items: ${transaksi.detilTransaksi.length}");
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          title: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'No. Nota: ${transaksi.noNota}',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Colors.green,
                ),
              ),
            ],
          ),
          content: SizedBox(
            width: double.maxFinite,
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'Penjual: ${transaksi.seller?.fullName ?? 'N/A'}',
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Tanggal: ${DateFormat('dd/MM/yyyy').format(transaksi.tanggalTransaksi)}',
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'Daftar Barang:',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                  const SizedBox(height: 8),
                  transaksi.detilTransaksi.isEmpty
                      ? const Text(
                          'Tidak ada barang dalam transaksi ini.',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        )
                      : Table(
                          border: TableBorder.all(color: Colors.grey.shade300),
                          columnWidths: const {
                            0: FlexColumnWidth(2),
                            1: FlexColumnWidth(1),
                            2: FixedColumnWidth(80),
                          },
                          children: [
                            TableRow(
                              decoration:
                                  BoxDecoration(color: Colors.grey.shade200),
                              children: [
                                const Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text(
                                    'Nama Produk',
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14),
                                  ),
                                ),
                                const Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text(
                                    'Harga',
                                    textAlign: TextAlign.end,
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14),
                                  ),
                                ),
                                const Padding(
                                  padding: EdgeInsets.all(8.0),
                                  child: Text(
                                    'Rating',
                                    textAlign: TextAlign.end,
                                    style: TextStyle(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14),
                                  ),
                                ),
                              ],
                            ),
                            ...transaksi.detilTransaksi.map((detil) {
                              final barang = detil.barang;
                              final rating = detil.rating ?? barang.rating ?? 0;
                              return TableRow(
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Text(
                                      barang.nama_barang ?? 'N/A',
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Text(
                                      barang.formattedHarga,
                                      textAlign: TextAlign.end,
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                  Padding(
                                    padding: const EdgeInsets.all(8.0),
                                    child: Text(
                                      rating > 0
                                          ? '$rating ★'
                                          : 'Belum dinilai',
                                      textAlign: TextAlign.end,
                                      style: const TextStyle(fontSize: 14),
                                    ),
                                  ),
                                ],
                              );
                            }),
                          ],
                        ),
                  const SizedBox(height: 16),
                  Text(
                    'Metode Pengiriman: ${transaksi.metodePengiriman}',
                    style: const TextStyle(fontSize: 14, color: Colors.black87),
                  ),
                  const SizedBox(height: 16),
                  Table(
                    border: TableBorder.all(color: Colors.grey.shade300),
                    columnWidths: const {
                      0: FlexColumnWidth(3),
                      1: FlexColumnWidth(2),
                    },
                    children: [
                      TableRow(
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Text(
                              'Subtotal',
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              NumberFormat.currency(
                                      locale: 'id_ID', symbol: 'Rp ')
                                  .format(transaksi.subtotal),
                              textAlign: TextAlign.end,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      TableRow(
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Text(
                              'Biaya Pengiriman',
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              NumberFormat.currency(
                                      locale: 'id_ID', symbol: 'Rp ')
                                  .format(transaksi.biayaPengiriman),
                              textAlign: TextAlign.end,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      TableRow(
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Text(
                              'Diskon',
                              style: TextStyle(fontSize: 14),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              NumberFormat.currency(
                                      locale: 'id_ID', symbol: 'Rp ')
                                  .format(transaksi.diskon),
                              textAlign: TextAlign.end,
                              style: const TextStyle(fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                      TableRow(
                        decoration: const BoxDecoration(color: Colors.green),
                        children: [
                          const Padding(
                            padding: EdgeInsets.all(8.0),
                            child: Text(
                              'Total',
                              style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontSize: 14),
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(8.0),
                            child: Text(
                              NumberFormat.currency(
                                      locale: 'id_ID', symbol: 'Rp ')
                                  .format(transaksi.total),
                              textAlign: TextAlign.end,
                              style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                  fontSize: 14),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              style: TextButton.styleFrom(foregroundColor: Colors.green),
              child: const Text('Tutup', style: TextStyle(fontSize: 14)),
            ),
          ],
        );
      },
    );
  }

  Widget _buildTransactionItem(tm.Transaksi transaksi) {
    final dateFormat = DateFormat('dd/MM/yyyy');
    final formattedDate = dateFormat.format(transaksi.tanggalTransaksi);
    final status = transaksi.status;
    final itemCount = transaksi.jumlahItem;
    final total = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ')
        .format(transaksi.total);

    return Card(
      margin: const EdgeInsets.symmetric(vertical: 4.0, horizontal: 16.0),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => _showTransactionDetailsModal(transaksi),
        child: ListTile(
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
          title: Text(
            'No. ${transaksi.noNota}',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: Colors.black87,
            ),
          ),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Text(
                'Tanggal: $formattedDate',
                style: const TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                'Status: $status',
                style: const TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                'Jumlah Barang: $itemCount',
                style: const TextStyle(fontSize: 14, color: Colors.grey),
              ),
              Text(
                'Total: $total',
                style: const TextStyle(fontSize: 14, color: Colors.grey),
              ),
            ],
          ),
          trailing:
              const Icon(Icons.arrow_forward_ios, color: Colors.grey, size: 16),
        ),
      ),
    );
  }

  Widget _buildPageContent() {
    if (_isLoading) {
      return const Center(
          child: CircularProgressIndicator(color: Colors.green));
    }

    if (_user == null) {
      return Center(
        child: const Text(
          "Silahkan Login Terlebih Dahulu",
          style: TextStyle(
              fontSize: 24, fontWeight: FontWeight.bold, color: Colors.black87),
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              _error!,
              style: const TextStyle(color: Colors.red, fontSize: 16),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchAllData,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.green,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                textStyle: const TextStyle(fontSize: 16),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8)),
              ),
              child: const Text("Coba Lagi"),
            ),
          ],
        ),
      );
    }

    final filteredTransaksi = _transaksiList.where((tx) {
      if (_fromDate == null || _toDate == null) return true;
      final from =
          _fromDate!.copyWith(hour: 0, minute: 0, second: 0, millisecond: 0);
      final to =
          _toDate!.copyWith(hour: 23, minute: 59, second: 59, millisecond: 999);
      final txDate = tx.tanggalTransaksi
          .copyWith(hour: 0, minute: 0, second: 0, millisecond: 0);
      return txDate.isAfter(from.subtract(const Duration(days: 1))) &&
          txDate.isBefore(to.add(const Duration(days: 1))) &&
          tx.status != 'Batal' &&
          tx.status != 'Gagal' &&
          !tx.detilTransaksi.any((dt) => dt.barang.status == 'On Hold');
    }).toList();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Riwayat Pembelian',
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.calendar_today,
                    color: Colors.grey, size: 24),
                onPressed: _showDateRangeModal,
                tooltip: 'Pilih Rentang Tanggal',
              ),
            ],
          ),
        ),
        if (_fromDate != null && _toDate != null)
          Padding(
            padding:
                const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Periode: ${DateFormat('dd/MM/yyyy').format(_fromDate!)} - ${DateFormat('dd/MM/yyyy').format(_toDate!)}',
                  style: const TextStyle(fontSize: 14, color: Colors.grey),
                ),
                TextButton(
                  onPressed: () => setState(() {
                    _fromDate = null;
                    _toDate = null;
                  }),
                  child: const Text(
                    'Reset',
                    style: TextStyle(color: Colors.red, fontSize: 14),
                  ),
                ),
              ],
            ),
          ),
        filteredTransaksi.isEmpty
            ? const Center(
                child: Padding(
                  padding: EdgeInsets.all(16.0),
                  child: Text(
                    'Tidak ada riwayat untuk periode ini.',
                    style: TextStyle(color: Colors.grey, fontSize: 16),
                  ),
                ),
              )
            : Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 16.0, vertical: 8.0),
                  itemCount: filteredTransaksi.length,
                  itemBuilder: (context, index) =>
                      _buildTransactionItem(filteredTransaksi[index]),
                ),
              ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _buildPageContent(),
    );
  }
}
