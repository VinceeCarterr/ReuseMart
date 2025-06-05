import 'package:intl/intl.dart';

class Komentar {
  final int id_komentar;
  final int? id_forum;        
  final int? id_user;      
  final int? id_pegawai;
  final String komentar;
  final String waktu_komentar;
  final String penulis_nama;

  Komentar({
    required this.id_komentar,
    this.id_forum,
    this.id_user,
    this.id_pegawai,
    required this.komentar,
    required this.waktu_komentar,
    required this.penulis_nama,
  });

  factory Komentar.fromJson(Map<String, dynamic> json) {
    String nama = 'Unknown';

    if (json['user'] != null) {
      final u = json['user'] as Map<String, dynamic>;
      final first = u['first_name'] as String? ?? '';
      final last = u['last_name'] as String? ?? '';
      nama = "$first $last".trim();
    }

    else if (json['pegawai'] != null) {
      final p = json['pegawai'] as Map<String, dynamic>;
      final first = p['first_name'] as String? ?? '';
      final last = p['last_name'] as String? ?? '';
      nama = "$first $last".trim() + " (CS)";
    }

    return Komentar(
      id_komentar: json['id_komentar'] as int,
      id_forum: json['id_forum'] as int?,
      id_user: json['id_user'] as int?,
      id_pegawai: json['id_pegawai'] as int?,
      komentar: json['komentar'] as String,
      waktu_komentar: json['waktu_komentar'] as String,
      penulis_nama: nama,
    );
  }

  String get formattedWaktu {
    try {
      final dt = DateTime.parse(waktu_komentar);
      final formatter = DateFormat("dd MMMM yyyy, HH:mm", "id_ID");
      return formatter.format(dt);
    } catch (_) {
      return waktu_komentar;
    }
  }
}
