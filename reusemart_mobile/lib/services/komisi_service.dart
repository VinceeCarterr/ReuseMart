import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../model/komisi_model.dart';

class KomisiService {
  final String baseUrl = 'http://10.0.2.2:8000/api';

  Future<List<Komisi>> fetchKomisiByHunter(int hunterId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token') ?? '';

    final url = Uri.parse('$baseUrl/komisi/hunter/$hunterId');
    final resp = await http.get(
      url,
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (resp.statusCode == 200) {
      final List data = json.decode(resp.body);
      return data.map((j) => Komisi.fromJson(j)).toList();
    } else {
      throw Exception('Failed to load komisi (HTTP ${resp.statusCode})');
    }
  }
}
