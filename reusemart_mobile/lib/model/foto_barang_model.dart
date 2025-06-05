class FotoBarang {
  final int id_foto;
  final int id_barang;
  final String path;

  FotoBarang({
    required this.id_foto,
    required this.id_barang,
    required this.path,
  });

  factory FotoBarang.fromJson(Map<String, dynamic> json) {
    return FotoBarang(
      id_foto: json['id_foto'],
      id_barang: json['id_barang'],
      path: json['path'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_foto': id_foto,
      'id_barang': id_barang,
      'path': path,
    };
  }
}
