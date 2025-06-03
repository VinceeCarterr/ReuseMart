import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:reusemart_mobile/model/user_model.dart';

class UserService {
  static const String baseUrl = 'http://10.0.2.2:8000/api';

  Future<UserModel> login(String email, String password) async {
    final url = Uri.parse('$baseUrl/login');
    final response = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({'email': email, 'password': password}),
    );

    print('🔍 login response → ${response.body}');

    if (response.statusCode != 200) {
      final error = jsonDecode(response.body)['error'] ?? 'Login failed';
      throw Exception(error);
    }

    final data = jsonDecode(response.body) as Map<String, dynamic>;

    final payload = (data['user'] ?? data['pegawai']) as Map<String, dynamic>?;
    if (payload == null) {
      throw Exception(
          'No user/pegawai key in response, only found: ${data.keys.toList()}');
    }

    String? role = payload['role'] as String?;
    if (role == null && data.containsKey('pegawai')) {
      final jabatan = payload['jabatan'] as String?;
      switch (jabatan?.toLowerCase()) {
        case 'kurir':
          role = 'Kurir';
          break;
        case 'hunter':
          role = 'Hunter';
          break;
        default:
          role = null;
      }
    }

    // Check if the role is one of the allowed roles
    const allowedRoles = ['Pembeli', 'Penitip', 'Kurir', 'Hunter'];
    if (role == null || !allowedRoles.contains(role)) {
      throw Exception('Access denied: Role is not allowed to login.');
    }

    // Print payload for debugging
    print('⚙️ Payload before fromJson → $payload');

    // Save the token
    final token = data['access_token'] as String;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('access_token', token);

    // Build and return the model
    return UserModel.fromJson(data);
  }

  // Rest of the UserService class remains unchanged
  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('access_token');
  }

  Future<void> registerFcmToken(String fcmToken) async {
    final apiToken = await getToken();
    if (apiToken == null) throw Exception('Not authenticated');

    final url = Uri.parse('$baseUrl/register-token');
    final resp = await http.post(
      url,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $apiToken',
      },
      body: jsonEncode({'device_token': fcmToken}),
    );

    if (resp.statusCode != 200) {
      throw Exception('Failed to register FCM token: ${resp.body}');
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');

    if (token == null) {
      throw Exception('No token found');
    }

    final response = await http.post(
      Uri.parse('$baseUrl/logout'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      await prefs.remove('access_token');
      await prefs.remove('remember_me');
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to logout');
    }
  }

  Future<UserModel?> validateToken() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('access_token');
    final rememberMe = prefs.getBool('remember_me') ?? false;

    if (token == null || !rememberMe) {
      return null;
    }

    final response = await http.get(
      Uri.parse('$baseUrl/getUserPegawai'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      await prefs.remove('access_token');
      await prefs.remove('remember_me');
      return null;
    }
  }
}
