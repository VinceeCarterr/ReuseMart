import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class PengirimanService {
  static const String baseUrl = "http://10.0.2.2:8000/api";

  Future<Map<String, String>> _getHeaders() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    return {
      "Content-Type": "application/json",
      "Accept": "application/json",
      if (token != null) "Authorization": "Bearer $token",
    };
  }

  Future<void> markAsArrived(int idPengiriman) async {
    try {
      final headers = await _getHeaders();
      final response = await http.patch(
        Uri.parse('$baseUrl/pengiriman/$idPengiriman/arrived'),
        headers: headers,
        body: jsonEncode({
          'status_pengiriman': 'Arrived',
        }),
      );

      if (response.statusCode != 200) {
        if (response.statusCode == 401) {
          throw Exception('Unauthenticated: Please log in again');
        }
        throw Exception('Failed to mark as arrived: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error marking arrived: $e');
    }
  }

  Future<List<dynamic>> fetchPengiriman() async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/pengiriman'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        if (response.statusCode == 401) {
          throw Exception('Unauthenticated: Please log in again');
        }
        throw Exception('Failed to fetch pengiriman: ${response.body}');
      }
    } catch (e) {
      throw Exception('Error fetching pengiriman: $e');
    }
  }

  Future<List<dynamic>> fetchDeliveryHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) {
      throw Exception('Unauthenticated');
    }

    final response = await http.get(
      Uri.parse('$baseUrl/history-kurir'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['data'];
    } else if (response.statusCode == 401) {
      throw Exception('Unauthenticated');
    } else {
      throw Exception(
          'Failed to load delivery history: ${response.statusCode}');
    }
  }
}
