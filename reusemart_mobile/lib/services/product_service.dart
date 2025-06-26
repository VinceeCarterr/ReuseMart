import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';

import '../model/barang_model.dart';
import '../model/foto_barang_model.dart';
import '../model/komentar_model.dart';

class ProductService {
  static const String _baseUrl = "https://mediumvioletred-newt-905266.hostingersite.com/api";

  static Future<String?> _getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString("token");
  }

  static Future<List<Barang>> fetchAllBarang() async {
    final url = Uri.parse("$_baseUrl/barang");
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    );
    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body) as List<dynamic>;
      return decoded.map((e) => Barang.fromJson(e as Map<String, dynamic>)).toList();
    } else {
      throw Exception("Gagal mengambil daftar barang (${response.statusCode})");
    }
  }

  
  static Future<Barang> fetchBarangById(int id) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/barang/$id"),
      headers: {
        "Content-Type": "application/json",
      },
    );
    if (response.statusCode == 200) {
      final data = json.decode(response.body);
      return Barang.fromJson(data);
    } else {
      throw Exception("Gagal mengambil data barang (${response.statusCode})");
    }
  }

  static Future<List<dynamic>> fetchPenitipanPublic() async {
    final url = Uri.parse("$_baseUrl/penitipan/public");
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    } else {
      throw Exception("Gagal mengambil penitipan_public (${response.statusCode})");
    }
  }

  static Future<List<dynamic>> fetchUserPublic() async {
    final url = Uri.parse("$_baseUrl/user/public");
    final response = await http.get(
      url,
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body) as List<dynamic>;
    } else {
      throw Exception("Gagal mengambil user_public (${response.statusCode})");
    }
  }

  static Future<List<FotoBarang>> fetchFotos(int barangId) async {
    final response = await http.get(
      Uri.parse("$_baseUrl/foto-barang/$barangId"),
      headers: {
        "Content-Type": "application/json",
      },
    );
    if (response.statusCode == 200) {
      final List<dynamic> arr = json.decode(response.body);
      return arr.map((e) => FotoBarang.fromJson(e)).toList();
    } else {
      throw Exception("Gagal mengambil foto barang (${response.statusCode})");
    }
  }

  static Future<List<Komentar>> fetchKomentar(int barangId) async {
    final url = Uri.parse("$_baseUrl/barang/$barangId/komentar");
    final response = await http.get(url, headers: {
      "Content-Type": "application/json",
    });

    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body) as Map<String, dynamic>;
      final listJson = decoded['data'] as List<dynamic>;

      return listJson
          .map((e) => Komentar.fromJson(e as Map<String, dynamic>))
          .toList();
    } else {
      throw Exception("Gagal mengambil komentar (${response.statusCode})");
    }
  }

  static Future<String> addToCart(int barangId) async {
    final token = await _getToken();
    final response = await http.post(
      Uri.parse("$_baseUrl/cart/add"),
      headers: {
        "Content-Type": "application/json",
        if (token != null) "Authorization": "Bearer $token",
      },
      body: json.encode({"id_barang": barangId}),
    );
    if (response.statusCode == 200) {
      final decoded = json.decode(response.body);
      return decoded['message'] ?? "Berhasil menambahkan ke keranjang";
    } else if (response.statusCode == 401) {
      throw Exception("401");
    } else if (response.statusCode == 400) {
      final decoded = json.decode(response.body);
      throw Exception(decoded['error'] ?? "Barang sudah di keranjang");
    } else {
      final decoded = json.decode(response.body);
      throw Exception(decoded['error'] ?? "Gagal menambahkan barang ke keranjang");
    }
  }
}
