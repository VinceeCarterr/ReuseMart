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
      final transaksiList = decoded.map((e) => Transaksi.fromJson(e as Map<String, dynamic>)).toList();

      // Fetch pengiriman for each transaksi
      final transaksiService = TransaksiService();
      List<Transaksi> updatedTransaksiList = []; // Create a new list
      for (var transaksi in transaksiList) {
        Transaksi updatedTransaksi = transaksi; // Start with the original
        if (transaksi.metodePengiriman.toLowerCase() == 'delivery') {
          final pengiriman = await transaksiService.fetchPengiriman(transaksi.id);
          updatedTransaksi = Transaksi(
            id: transaksi.id,
            noNota: transaksi.noNota,
            jumlahItem: transaksi.jumlahItem,
            tanggalTransaksi: transaksi.tanggalTransaksi,
            total: transaksi.total,
            status: transaksi.status,
            detilTransaksi: transaksi.detilTransaksi,
            metodePengiriman: transaksi.metodePengiriman,
            subtotal: transaksi.subtotal,
            biayaPengiriman: transaksi.biayaPengiriman,
            diskon: transaksi.diskon,
            statusPengiriman: transaksi.statusPengiriman,
            seller: transaksi.seller,
            pengiriman: pengiriman,
          );
        }
        updatedTransaksiList.add(updatedTransaksi); // Add to the new list
      }
      return updatedTransaksiList; // Return the updated list
    } catch (e) {
      throw Exception("Invalid JSON response: $e");
    }
  } else {
    throw Exception("Gagal mengambil daftar transaksi (${response.statusCode}): ${response.body}");
  }
}

Future<Pengiriman?> fetchPengiriman(int idTransaksi) async {
  final prefs = await SharedPreferences.getInstance();
  final token = prefs.getString('access_token') ?? '';
  if (token.isEmpty) {
    throw Exception('No access token found');
  }
  final url = Uri.parse("$_base/pengiriman/getByTransaksi/$idTransaksi"); // Fixed endpoint
  final response = await http.get(
    url,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Authorization": "Bearer $token",
    },
  );
  debugPrint("Pengiriman API response: ${response.body}");
  if (response.statusCode == 200) {
    final decoded = jsonDecode(response.body) as Map<String, dynamic>;
    return Pengiriman.fromJson(decoded);
  } else if (response.statusCode == 404) {
    return null;
  } else {
    throw Exception("Failed to fetch pengiriman (${response.statusCode}): ${response.body}");
  }
}
}
