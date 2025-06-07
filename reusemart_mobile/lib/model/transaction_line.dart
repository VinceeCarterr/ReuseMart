// lib/model/transaction_line.dart

class TransactionLine {
  final int idDt;
  final int idTransaksi;
  final Barang barang;
  final Transaksi transaksi;
  final Komisi? komisi;

  TransactionLine({
    required this.idDt,
    required this.idTransaksi,
    required this.barang,
    required this.transaksi,
    this.komisi,
  });

  factory TransactionLine.fromJson(Map<String, dynamic> json) {
    return TransactionLine(
      idDt: json['id_dt'] as int,
      idTransaksi: json['id_transaksi'] as int,
      barang: Barang.fromJson(json['barang'] as Map<String, dynamic>),
      transaksi:
          Transaksi.fromJson(json['transaksi'] as Map<String, dynamic>),
      komisi: json['komisi'] != null
          ? Komisi.fromJson(json['komisi'] as Map<String, dynamic>)
          : null,
    );
  }
}

class Barang {
  final int id;
  final String nama;
  final String kode;
  final double harga;
  final List<Foto> foto;

  Barang({
    required this.id,
    required this.nama,
    required this.kode,
    required this.harga,
    required this.foto,
  });

  /// Full URL to the first photo, or a default if none.
  String get imageUrl {
    if (foto.isNotEmpty) {
      return "http://10.0.2.2:8000/storage/${foto.first.path}";
    }
    return "http://10.0.2.2:8000/storage/defaults/no-image.png";
  }

  factory Barang.fromJson(Map<String, dynamic> json) => Barang(
        id: json['id_barang'] as int,
        nama: json['nama_barang'] as String,
        kode: json['kode_barang'] as String,
        harga: (json['harga'] as num).toDouble(),
        foto: (json['foto'] as List<dynamic>? ?? [])
            .map((j) => Foto.fromJson(j as Map<String, dynamic>))
            .toList(),
      );
}

class Foto {
  final String path;
  Foto({required this.path});
  factory Foto.fromJson(Map<String, dynamic> json) =>
      Foto(path: json['path'] as String);
}

class Transaksi {
  final int id;
  final String noNota;
  Transaksi({required this.id, required this.noNota});
  factory Transaksi.fromJson(Map<String, dynamic> json) => Transaksi(
        id: json['id_transaksi'] as int,
        noNota: json['no_nota'] as String,
      );
}

class Komisi {
  final int id;
  final double hunter;
  Komisi({required this.id, required this.hunter});
  factory Komisi.fromJson(Map<String, dynamic> json) => Komisi(
        id: json['id_komisi'] as int,
        hunter: (json['komisi_hunter'] as num).toDouble(),
      );
}
