import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:reusemart_mobile/model/pegawai_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

class PegawaiService {
  final String baseUrl = 'http://10.0.2.2:8000/api';

  Future<PegawaiModel> fetchPegawai(int idPegawai) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) {
      throw Exception('No access token found');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/pegawai-kurir/$idPegawai'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return PegawaiModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch pegawai: ${response.body}');
    }
  }
}
