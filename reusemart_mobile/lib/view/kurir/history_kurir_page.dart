import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:intl/intl.dart';

class DeliveryHistoryPage extends StatefulWidget {
  const DeliveryHistoryPage({super.key});

  @override
  _DeliveryHistoryPageState createState() => _DeliveryHistoryPageState();
}

class _DeliveryHistoryPageState extends State<DeliveryHistoryPage> {
  List<dynamic> deliveries = [];
  bool isLoading = true;
  String? errorMessage;

  @override
  void initState() {
    super.initState();
    fetchDeliveryHistory();
  }

  Future<void> fetchDeliveryHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('pegawai_token');

      if (token == null) {
        setState(() {
          errorMessage = 'No authentication token found';
          isLoading = false;
        });
        return;
      }

      final response = await http.get(
        Uri.parse('http://127.0.0.1:8000/api/history-kurir'),
        headers: {
          'Authorization': 'Bearer $token',
          'Accept': 'application/json',
        },
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        setState(() {
          deliveries = data['data'];
          isLoading = false;
        });
      } else {
        setState(() {
          errorMessage =
              'Failed to fetch delivery history: ${response.statusCode}';
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        errorMessage = 'Error: $e';
        isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Delivery History'),
        backgroundColor: Colors.blue,
      ),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : errorMessage != null
              ? Center(
                  child: Text(errorMessage!,
                      style: const TextStyle(color: Colors.red)))
              : deliveries.isEmpty
                  ? const Center(child: Text('No delivery history found.'))
                  : ListView.builder(
                      padding: const EdgeInsets.all(8.0),
                      itemCount: deliveries.length,
                      itemBuilder: (context, index) {
                        final delivery = deliveries[index];
                        return Card(
                          margin: const EdgeInsets.symmetric(vertical: 8.0),
                          elevation: 4,
                          child: ExpansionTile(
                            title: Text(
                              'Transaction #${delivery['no_nota']}',
                              style:
                                  const TextStyle(fontWeight: FontWeight.bold),
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
                                        'Customer: ${delivery['user_first_name']} ${delivery['user_last_name']}'),
                                    const SizedBox(height: 8),
                                    Text('Address: ${delivery['alamat']}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Shipping Cost: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['biaya_pengiriman'])}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Total: Rp ${NumberFormat.currency(locale: 'id_ID', symbol: '', decimalDigits: 0).format(delivery['total'])}'),
                                    const SizedBox(height: 8),
                                    Text(
                                        'Status: ${delivery['status_transaksi']}'),
                                    const SizedBox(height: 8),
                                    const Text('Items:',
                                        style: TextStyle(
                                            fontWeight: FontWeight.bold)),
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
                    ),
    );
  }
}
