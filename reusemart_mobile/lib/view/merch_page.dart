import 'package:flutter/material.dart';
import 'package:reusemart_mobile/model/merch_model.dart';
import 'package:reusemart_mobile/services/merch_service.dart';

class MerchPage extends StatefulWidget {
  @override
  _MerchPageState createState() => _MerchPageState();
}

class _MerchPageState extends State<MerchPage> {
  List<Merch> _merchList = [];
  bool _loading = true;
  int _userPoints = 0;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _loading = true);
    try {
      final results = await Future.wait(
          [ApiService.getMerchList(), ApiService.getUserPoints()]);
      _merchList = results[0] as List<Merch>;
      _userPoints = results[1] as int;
    } catch (e) {
      print('Error loading data: $e');
    } finally {
      setState(() => _loading = false);
    }
  }

  Future<void> _redeemMerch(Merch merch) async {
    if (_userPoints < merch.poinMerch) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Not enough points to redeem.')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ApiService.redeemMerch(merch.id);
      await _loadData();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Redeemed "${merch.namaMerch}" successfully!')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Redeem failed: $e')),
      );
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return Center(child: CircularProgressIndicator());
    }
    return Scaffold(
      appBar: AppBar(
        title: Text('Merchandise Shop'),
        actions: [
          Padding(
            padding: EdgeInsets.symmetric(horizontal: 16),
            child: Center(child: Text('Points: $_userPoints')),
          ),
        ],
      ),
      body: ListView.builder(
        itemCount: _merchList.length,
        itemBuilder: (context, index) {
          final merch = _merchList[index];
          final imgName = merch.namaMerch.toLowerCase().replaceAll(' ', '-');
          final assetPath =
              "http://10.0.2.2:8000/storage/foto_merch/${imgName}.jpg";

          debugPrint('Loading image from: $assetPath');
          return Card(
            margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  assetPath,
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                  errorBuilder: (ctx, err, stack) =>
                      const Icon(Icons.broken_image),
                ),
              ),
              title: Text(merch.namaMerch),
              subtitle:
                  Text('Cost: ${merch.poinMerch} pts | Stock: ${merch.stock}'),
              trailing: ElevatedButton(
                onPressed: merch.stock > 0 ? () => _redeemMerch(merch) : null,
                child: const Text('Redeem'),
              ),
            ),
          );
        },
      ),
    );
  }
}
