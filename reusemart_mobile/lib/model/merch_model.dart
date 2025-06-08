class Merch {
  final int id;
  final String namaMerch;
  final int poinMerch;
  final int stock;

  Merch({
    required this.id,
    required this.namaMerch,
    required this.poinMerch,
    required this.stock,
  });

  factory Merch.fromJson(Map<String, dynamic> json) {
    return Merch(
      id: json['id_merch'],
      namaMerch: json['nama_merch'],
      poinMerch: json['poin_merch'],
      stock: json['stock'],
    );
  }
}