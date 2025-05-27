import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:reusemart_mobile/model/user_model.dart';

class UserService {
  static const String baseUrl = 'http://10.0.2.2:8000/api';

  Future<UserModel?> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: jsonEncode({
        'email': email,
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      return UserModel.fromJson(jsonDecode(response.body));
    } else {
      throw Exception(jsonDecode(response.body)['error'] ?? 'Failed to login');
    }
  }
}
