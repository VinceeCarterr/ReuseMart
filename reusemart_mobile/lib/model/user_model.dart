class UserModel {
  final String id;
  final String name;
  final String email;
  final String? no_telp;
  final String? poin_loyalitas;
  final String? profile_picture;
  final String? role;
  final String? jabatan;
  final String type;
  final String accessToken;
  final String tokenType;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    this.no_telp, // Make nullable and not required
    this.poin_loyalitas, // Make nullable and not required
    this.profile_picture, // Make nullable and not required
    this.role,
    this.jabatan,
    required this.type,
    required this.accessToken,
    required this.tokenType,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    print('JSON Data: $json');
    if (json['type'] == null) {
      throw Exception('Missing "type" in response');
    }

    Map<String, dynamic>? userData;
    if (json['type'] == 'user' && json['user'] != null) {
      userData = json['user'] as Map<String, dynamic>;
    } else if (json['type'] == 'pegawai' && json['pegawai'] != null) {
      userData = json['pegawai'] as Map<String, dynamic>;
    } else {
      throw Exception('Missing or invalid "user" or "pegawai" data in response');
    }

    print('User Data: $userData');

    if (userData['id'] == null || userData['name'] == null || userData['email'] == null) {
      throw Exception('Missing required fields (id, name, email) in response');
    }

    return UserModel(
      id: userData['id'].toString(),
      name: userData['name'],
      email: userData['email'],
      no_telp: userData['no_telp']?.toString(),
      poin_loyalitas: userData['poin_loyalitas']?.toString(),
      profile_picture: userData['profile_picture']?.toString(),
      role: json['type'] == 'user' ? userData['role']?.toString() : null,
      jabatan: json['type'] == 'pegawai' ? userData['jabatan']?.toString() : null,
      type: json['type'],
      accessToken: json['access_token'] ?? '',
      tokenType: json['token_type'] ?? 'Bearer',
    );
  }
}