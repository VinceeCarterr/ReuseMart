import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../model/transaksi_model.dart';

class TransaksiService {
  static const String _base = 'http://10.0.2.2:8000/api';

  static Future<List<Transaksi>> fetchAllTransaksi() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';
    if (token.isEmpty) {
      throw Exception('No access token found');
    }
    final url = Uri.parse("$_base/transaksi/history");
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": "Bearer $token",
      },
    );
    debugPrint("HistoryPage - Raw API response: ${response.body}");
    if (response.statusCode == 200) {
      if (response.body == null || response.body.isEmpty) {
        return [];
      }
      try {
        final decoded = jsonDecode(response.body) as List<dynamic>;
        return decoded
            .map((e) => Transaksi.fromJson(e as Map<String, dynamic>))
            .toList();
      } catch (e) {
        throw Exception("Invalid JSON response: $e");
      }
    } else {
      throw Exception(
          "Gagal mengambil daftar transaksi (${response.statusCode}): ${response.body}");
    }
  }
}
