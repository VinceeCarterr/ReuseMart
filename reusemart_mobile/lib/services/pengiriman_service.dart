import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:reusemart_mobile/view/login_screen.dart';

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

  Future<void> markAsArrived(BuildContext context, int idPengiriman) async {
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
        await _handleError(context, response, 'Failed to mark as arrived');
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Pengiriman marked as Arrived')),
          );
        }
      }
    } catch (e) {
      await _handleError(context, e, 'Error marking arrived');
    }
  }

  Future<List<dynamic>> fetchPengiriman(BuildContext context) async {
    try {
      final headers = await _getHeaders();
      final response = await http.get(
        Uri.parse('$baseUrl/pengiriman'),
        headers: headers,
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body);
      } else {
        await _handleError(context, response, 'Failed to fetch pengiriman');
        return [];
      }
    } catch (e) {
      await _handleError(context, e, 'Error fetching pengiriman');
      return [];
    }
  }

  Future<List<dynamic>> fetchDeliveryHistory(BuildContext context) async {
    try {
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
      } else {
        await _handleError(
            context, response, 'Failed to load delivery history');
        return [];
      }
    } catch (e) {
      await _handleError(context, e, 'Error fetching delivery history');
      return [];
    }
  }

  Future<void> _handleError(
      BuildContext context, dynamic error, String defaultMessage) async {
    if (error is http.Response && error.statusCode == 401 ||
        error.toString().contains('Unauthenticated')) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('access_token');
      await prefs.remove('remember_me');
      if (context.mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } else {
      final errorMessage = error is http.Response
          ? '$defaultMessage: ${error.body}'
          : '$defaultMessage: $error';
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(errorMessage)),
        );
      }
    }
  }
}
