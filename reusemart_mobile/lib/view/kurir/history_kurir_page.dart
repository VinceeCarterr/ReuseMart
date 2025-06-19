import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:reusemart_mobile/services/pengiriman_service.dart';

class DeliveryHistoryPage extends StatefulWidget {
  const DeliveryHistoryPage({super.key});

  @override
  _DeliveryHistoryPageState createState() => _DeliveryHistoryPageState();
}

class _DeliveryHistoryPageState extends State<DeliveryHistoryPage> {
  final PengirimanService _service = PengirimanService();
  List<dynamic> _deliveries = [];
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchDeliveryHistory();
  }

  Future<void> _fetchDeliveryHistory() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final deliveries = await _service.fetchDeliveryHistory(context);
      setState(() {
        _deliveries = deliveries;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Error: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return _isLoading
        ? const Center(child: CircularProgressIndicator())
        : _errorMessage != null
            ? Center(
                child: Text(
                  _errorMessage!,
                  style: const TextStyle(color: Colors.red),
                ),
              )
            : _deliveries.isEmpty
                ? const Center(child: Text('No delivery history found'))
                : ListView.builder(
                    padding: const EdgeInsets.all(8.0),
                    itemCount: _deliveries.length,
                    itemBuilder: (context, index) {
                      final delivery = _deliveries[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 8.0),
                        elevation: 4,
                        child: ExpansionTile(
                          title: Text(
                            'Transaction #${delivery['no_nota']}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
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
                                  ),
                                  const SizedBox(height: 8),
                                  Text('Address: ${delivery['alamat']}'),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Shipping Cost: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['biaya_pengiriman'])}',
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Total: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['total'])}',
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                      'Status: ${delivery['status_transaksi']}'),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Items:',
                                    style:
                                        TextStyle(fontWeight: FontWeight.bold),
                                  ),
                                  ...delivery['detil_transaksi']
                                      .map<Widget>((item) => Padding(
                                            padding: const EdgeInsets.only(
                                                left: 16.0, top: 4.0),
                                            child: Text(
                                              '- ${item['barang']['nama_barang']} (Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(item['barang']['harga'])})',
                                            ),
                                          ))
                                      .toList(),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  );
  }
}
