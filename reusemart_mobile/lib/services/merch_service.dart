import 'package:http/http.dart' as http;
import 'package:reusemart_mobile/model/merch_model.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';

class ApiService {
  static const _baseUrl = 'http://10.0.2.2:8000/api';

  static Future<List<Merch>> getMerchList() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) {
      throw Exception('No access token found');
    }

    final resp = await http.get(Uri.parse('$_baseUrl/merch'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },);

    if (resp.statusCode == 200) {
      final List data = json.decode(resp.body);
      return data.map((item) => Merch.fromJson(item)).toList();
    }
    throw Exception('Failed to load merch');
  }

  static Future<int> getUserPoints() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) {
      throw Exception('No access token found');
    }

    final resp = await http.get(Uri.parse('$_baseUrl/user/points'),
      headers: {
        'Authorization': 'Bearer $token',
        'Accept': 'application/json',
      },);

    if (resp.statusCode == 200) {
      final data = json.decode(resp.body);
      return data['poin_loyalitas'];
    }
    throw Exception('Failed to load user points');
  }

  static Future<void> redeemMerch(int merchId) async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    if (token == null) {
      throw Exception('No access token found');
    }

    final uri = Uri.parse('$_baseUrl/redeem');
    final resp = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: json.encode({
        'id_merch': merchId,
      }),
    );

    print('Redeem POST → ${resp.statusCode}: ${resp.body}');
    if (resp.statusCode != 201) {
      throw Exception('Redeem failed: ${resp.body}');
    }
  }
}
