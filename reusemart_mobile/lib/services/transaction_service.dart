// lib/services/transaction_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../model/transaction_line.dart';

class TransactionService {
  final _base = 'http://10.0.2.2:8000/api';

  Future<Map<String, List<TransactionLine>>> fetchHunterTransactions(
      int hunterId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    final url = Uri.parse('$_base/hunter/$hunterId/transactions');
    final resp = await http.get(url, headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    });
    if (resp.statusCode != 200) {
      throw Exception('Failed to load transactions (${resp.statusCode})');
    }
    final Map<String, dynamic> data = json.decode(resp.body);
    final Map<String, List<TransactionLine>> out = {};
    data.forEach((key, arr) {
      final list = (arr as List)
          .map((j) => TransactionLine.fromJson(j as Map<String, dynamic>))
          .toList();
      out[key] = list;
    });
    return out;
  }
}
