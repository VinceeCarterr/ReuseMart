import 'barang_model.dart';
import 'package:flutter/material.dart';

class Pengiriman {
  final int id;
  final int idTransaksi;
  final DateTime? tanggalPengiriman;
  final String statusPengiriman;
  final Pegawai? pegawai;

  Pengiriman({
    required this.id,
    required this.idTransaksi,
    this.tanggalPengiriman,
    required this.statusPengiriman,
    this.pegawai,
  });

factory Pengiriman.fromJson(Map<String, dynamic> json) {
  debugPrint("Pengiriman JSON: $json");
  return Pengiriman(
    id: json['id_pengiriman'] as int? ?? 0,
    idTransaksi: json['id_transaksi'] as int? ?? 0,
    tanggalPengiriman: json['tanggal_pengiriman'] != null
        ? DateTime.tryParse(json['tanggal_pengiriman'] as String)
        : null,
    statusPengiriman: json['status_pengiriman'] as String? ?? 'Disiapkan',
    pegawai: json['pegawai'] != null
        ? Pegawai.fromJson(json['pegawai'] as Map<String, dynamic>)
        : null,
  );
}
}

class Pegawai {
  final int id;
  final String? firstName;
  final String? lastName;
  final String? nama;

  Pegawai({
    required this.id,
    this.firstName,
    this.lastName,
    this.nama,
  });

  factory Pegawai.fromJson(Map<String, dynamic> json) {
    return Pegawai(
      id: json['id_pegawai'] as int? ?? 0,
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
      nama: json['nama'] as String?,
    );
  }

  String get fullName => nama ?? (firstName != null && lastName != null
      ? '$firstName $lastName'
      : firstName ?? lastName ?? 'N/A');
}

class Transaksi {
  final int id;
  final String noNota;
  final int jumlahItem;
  final DateTime tanggalTransaksi;
  final double total;
  final String status;
  final List<DetilTransaksi> detilTransaksi;
  final String metodePengiriman;
  final double subtotal;
  final double biayaPengiriman;
  final double diskon;
  final String? statusPengiriman;
  final User? seller;
  final Pengiriman? pengiriman;

  Transaksi({
    required this.id,
    required this.noNota,
    required this.jumlahItem,
    required this.tanggalTransaksi,
    required this.total,
    required this.status,
    required this.detilTransaksi,
    required this.metodePengiriman,
    required this.subtotal,
    required this.biayaPengiriman,
    required this.diskon,
    this.statusPengiriman,
    this.seller,
    this.pengiriman,
  });

  factory Transaksi.fromJson(Map<String, dynamic> json) {
    return Transaksi(
      id: json['id_transaksi'] as int,
      noNota: json['no_nota'] as String? ?? 'N/A',
      jumlahItem: json['jumlah_item'] as int? ?? 0,
      tanggalTransaksi: DateTime.tryParse(json['tanggal_transaksi'] as String? ?? '') ?? DateTime.now(),
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      status: json['status_transaksi'] as String? ?? 'Unknown',
      detilTransaksi: (json['detil_transaksi'] as List<dynamic>? ?? [])
          .map((e) => DetilTransaksi.fromJson(e as Map<String, dynamic>))
          .toList(),
      metodePengiriman: json['metode_pengiriman'] as String? ?? 'N/A',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      biayaPengiriman: (json['biaya_pengiriman'] as num?)?.toDouble() ?? 0.0,
      diskon: (json['diskon'] as num?)?.toDouble() ?? 0.0,
      statusPengiriman: json['pengiriman']?['status_pengiriman'] as String? ??
          json['pengambilan']?['status_pengambilan'] as String? ??
          'Disiapkan',
      seller: json['detil_transaksi'] != null && (json['detil_transaksi'] as List).isNotEmpty
          ? User.fromJson(json['detil_transaksi'][0]['barang']?['penitipan']?['user'] ?? {})
          : null,
      pengiriman: json['pengiriman'] != null
          ? Pengiriman.fromJson(json['pengiriman'] as Map<String, dynamic>)
          : null,
    );
  }
}

class DetilTransaksi {
  final int id;
  final Barang barang;
  final int? rating;

  DetilTransaksi({
    required this.id,
    required this.barang,
    this.rating,
  });

  factory DetilTransaksi.fromJson(Map<String, dynamic> json) {
    return DetilTransaksi(
      id: json['id_dt'] as int,
      barang: Barang.fromJson(json['barang'] as Map<String, dynamic>),
      rating: json['rating'] as int?,
    );
  }
}

class User {
  final String? firstName;
  final String? lastName;

  User({
    this.firstName,
    this.lastName,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      firstName: json['first_name'] as String?,
      lastName: json['last_name'] as String?,
    );
  }

  String get fullName => firstName != null && lastName != null
      ? '$firstName $lastName'
      : firstName ?? lastName ?? 'N/A';
}