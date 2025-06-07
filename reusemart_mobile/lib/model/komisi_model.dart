// lib/model/komisi_model.dart

class Komisi {
  final int id;
  final int idTransaksi;
  final int idDt;
  final double presentasePerusahaan;
  final double presentaseHunter;
  final double komisiPerusahaan;
  final double komisiHunter;

  // from Transaksi
  final String noNota;

  // from Barang
  final String namaBarang;
  final String kodeBarang;
  final double hargaBarang;

  Komisi({
    required this.id,
    required this.idTransaksi,
    required this.idDt,
    required this.presentasePerusahaan,
    required this.presentaseHunter,
    required this.komisiPerusahaan,
    required this.komisiHunter,
    required this.noNota,
    required this.namaBarang,
    required this.kodeBarang,
    required this.hargaBarang,
  });

  factory Komisi.fromJson(Map<String, dynamic> json) {
    final dt = (json['dt'] as Map<String, dynamic>?) ?? {};
    final barang = (dt['Barang'] as Map<String, dynamic>?) ?? {};
    final transaksi = (dt['Transaksi'] as Map<String, dynamic>?) ?? {};

    return Komisi(
      id: json['id_komisi'] as int,
      idDt: json['id_dt'] as int,
      idTransaksi: dt['id_transaksi'] as int? ?? 0,

      presentasePerusahaan: (json['presentase_perusahaan'] as num).toDouble(),
      presentaseHunter:   (json['presentase_hunter']   as num).toDouble(),
      komisiPerusahaan:   (json['komisi_perusahaan']   as num).toDouble(),
      komisiHunter:       (json['komisi_hunter']       as num).toDouble(),

      noNota:     transaksi['no_nota']      as String? ?? '',
      namaBarang: barang['nama_barang']     as String? ?? '',
      kodeBarang: barang['kode_barang']     as String? ?? '',
      hargaBarang:(barang['harga']          as num?)?.toDouble() ?? 0.0,
    );
  }
}