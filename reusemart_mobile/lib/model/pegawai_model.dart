// pegawai_model.dart
class PegawaiModel {
  final int idPegawai;
  final int idJabatan;
  final String firstName;
  final String lastName;
  final String email;
  final String noTelp;
  final String tanggalLahir;
  final String namaJabatan;

  PegawaiModel({
    required this.idPegawai,
    required this.idJabatan,
    required this.firstName,
    required this.lastName,
    required this.email,
    required this.noTelp,
    required this.tanggalLahir,
    required this.namaJabatan,
  });

  factory PegawaiModel.fromJson(Map<String, dynamic> json) {
    return PegawaiModel(
      idPegawai: json['id_pegawai'] ?? 0,
      idJabatan: json['id_jabatan'] ?? 0,
      firstName: json['first_name'] ?? '',
      lastName: json['last_name'] ?? '',
      email: json['email'] ?? '',
      noTelp: json['no_telp'] ?? '',
      tanggalLahir: json['tanggal_lahir'] ?? '',
      namaJabatan: json['jabatan']['nama_jabatan'] ?? '',
    );
  }

  String get name => '$firstName $lastName';
}
