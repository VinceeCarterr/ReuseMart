// lib/model/barang_model.dart
import 'package:intl/intl.dart';

class Barang {
  final int id_barang;
  final int id_kategori;
  final int id_penitipan;
  final String nama_barang;
  final String kode_barang;
  final String kategori;
  final String deskripsi;
  final int harga;
  final String status;
  final String? garansi;
  final String tanggal_titip;
  final String status_periode;
  int? rating; // mutable because we’ll set it after fetching
  bool? isTopSeller; // Added to store Top Seller status derived from User

  Barang({
    required this.id_barang,
    required this.id_kategori,
    required this.id_penitipan,
    required this.nama_barang,
    required this.kode_barang,
    required this.kategori,
    required this.deskripsi,
    required this.harga,
    required this.status,
    this.garansi,
    required this.tanggal_titip,
    required this.status_periode,
    this.rating,
    this.isTopSeller, // Added as nullable
  });

  factory Barang.fromJson(Map<String, dynamic> json) {
    return Barang(
      id_barang: json['id_barang'] as int,
      id_kategori: json['id_kategori'] as int,
      id_penitipan: json['id_penitipan'] as int,
      nama_barang: json['nama_barang'] as String,
      kode_barang: json['kode_barang'] as String,
      kategori: json['kategori'] as String,
      deskripsi: json['deskripsi'] as String,
      harga: json['harga'] as int,
      status: json['status'] as String,
      garansi: json['garansi'] as String?, // nullable
      tanggal_titip: json['tanggal_titip'] as String,
      status_periode: json['status_periode'] as String,
      rating: json['rating'] as int?, // might be null initially
      isTopSeller: json['isTopSeller'] as bool?, // Optional, can be null or set later
    );
  }

  /// A helper to format `harga` into Indonesian Rupiah:
  String get formattedHarga {
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ');
    return formatter.format(harga);
  }
}