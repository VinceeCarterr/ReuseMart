// lib/view/hunter/history_hunter_page.dart

import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../model/transaction_line.dart';
import '../../services/transaction_service.dart';
import '../../components/simple_bottom_navigation.dart';
import '../hunter/profile_hunter_page.dart';

class HistoryHunterPage extends StatefulWidget {
  final int hunterId;
  const HistoryHunterPage({super.key, required this.hunterId});

  @override
  State<HistoryHunterPage> createState() => _HistoryHunterPageState();
}

class _HistoryHunterPageState extends State<HistoryHunterPage> {
  int _currentIndex = 0;
  final _service = TransactionService();
  late Future<Map<String, List<TransactionLine>>> _futureGroups;
  final NumberFormat _fmt = NumberFormat('#,##0', 'id_ID');
  final Color _successGreen = const Color(0xFF28A745);
  final Color _bgColor = const Color.fromARGB(255, 255, 252, 247);

  @override
  void initState() {
    super.initState();
    _futureGroups = _service.fetchHunterTransactions(widget.hunterId);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bgColor,
      appBar: AppBar(
        title: const Text('Hi, Hunter!'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 1,
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: [
          _buildHistoryTab(),
          _buildProfileTab(),
        ],
      ),
      bottomNavigationBar: SimpleBottomNavigation(
        navBarItems: const [
          BottomNavigationBarItem(icon: Icon(Icons.history), label: 'History'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
        initialIndex: _currentIndex,
        onIndexChanged: (i) => setState(() => _currentIndex = i),
      ),
    );
  }

  Widget _buildHistoryTab() {
    return FutureBuilder<Map<String, List<TransactionLine>>>(
      future: _futureGroups,
      builder: (ctx, snap) {
        if (snap.connectionState != ConnectionState.done) {
          return const Center(child: CircularProgressIndicator());
        }
        if (snap.hasError) {
          return Center(child: Text('Error: ${snap.error}'));
        }
        final groups = snap.data!;
        if (groups.isEmpty) {
          return const Center(child: Text('No transactions found.'));
        }

        final entries = groups.entries.toList();
        return ListView.builder(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 16),
          itemCount: entries.length,
          itemBuilder: (ctx, i) {
            final lines = entries[i].value;
            final nota = lines.first.transaksi.noNota;
            final totalItems = lines.length;
            final totalPrice = lines.fold<double>(0, (sum, l) => sum + l.barang.harga);
            final totalKomisi = lines.fold<double>(0, (sum, l) => sum + (l.komisi?.hunter ?? 0));

            final photoUrl = lines.first.barang.imageUrl;

            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              child: Row(
                children: [
                  Container(
                    width: 4,
                    height: 120,
                    decoration: BoxDecoration(
                      color: _successGreen,
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Card(
                      color: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      elevation: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Transaksi $nota',
                              style: const TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                Text('Rp${_fmt.format(totalPrice)}'),
                                const Spacer(),
                                Chip(
                                  backgroundColor: Colors.grey[200],
                                  label: Text(
                                    '$totalItems Items',
                                    style: const TextStyle(fontSize: 12),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                Text(
                                  'Rp${_fmt.format(totalKomisi)}',
                                  style: TextStyle(
                                      color: _successGreen,
                                      fontWeight: FontWeight.bold),
                                ),
                                const Spacer(),
                                TextButton(
                                  style: TextButton.styleFrom(
                                    foregroundColor: _successGreen,
                                  ),
                                  child: const Text('Detail'),
                                  onPressed: () => _showDetail(context, lines),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _showDetail(BuildContext ctx, List<TransactionLine> lines) {
    final totalPrice = lines.fold<double>(0, (sum, l) => sum + l.barang.harga);
    final totalKomisi = lines.fold<double>(0, (sum, l) => sum + (l.komisi?.hunter ?? 0));

    showModalBottomSheet(
      context: ctx,
      backgroundColor: _bgColor,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) {
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Detail Items',
                style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.black87),
              ),
              const SizedBox(height: 12),
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: lines.length,
                  separatorBuilder: (_, __) => const Divider(),
                  itemBuilder: (c, idx) {
                    final l = lines[idx];
                    return ListTile(
                      leading: ClipOval(
                        child: Image.network(
                          l.barang.imageUrl,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 48,
                            height: 48,
                            color: Colors.grey[200],
                            child: const Icon(Icons.broken_image),
                          ),
                        ),
                      ),
                      title: Text(l.barang.nama,
                          style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text(l.barang.kode,
                          style: const TextStyle(color: Colors.grey)),
                      trailing: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('Rp${_fmt.format(l.barang.harga)}'),
                          const SizedBox(height: 4),
                        ],
                      ),
                    );
                  },
                ),
              ),
              const SizedBox(height: 16),
              Divider(color: Colors.grey[300]),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Price',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Text('Rp${_fmt.format(totalPrice)}'),
                ],
              ),
              const SizedBox(height: 4),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Total Komisi',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  Text('Rp${_fmt.format(totalKomisi)}',
                      style: TextStyle(
                          color: _successGreen, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 16),
            ],
          ),
        );
      },
    );
  }

  _buildProfileTab() {
    return ProfileHunterPage(
      key: ValueKey(_currentIndex),
      hunterId: widget.hunterId,
    );
  }
}
