class UserModel {
  final String id;
  final String name;
  final String email;
  final String? role;
  final String? jabatan;
  final String type;
  final String accessToken;
  final String tokenType;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.role,
    this.jabatan,
    required this.type,
    required this.accessToken,
    required this.tokenType,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['user'] != null
          ? json['user']['id'].toString()
          : json['pegawai']['id'].toString(),
      name:
          json['user'] != null ? json['user']['name'] : json['pegawai']['name'],
      email: json['user'] != null
          ? json['user']['email']
          : json['pegawai']['email'],
      role: json['user'] != null ? json['user']['role'] : null,
      jabatan: json['pegawai'] != null ? json['pegawai']['jabatan'] : null,
      type: json['type'],
      accessToken: json['access_token'],
      tokenType: json['token_type'],
    );
  }
}
