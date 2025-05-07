import React, { useEffect, useState } from "react";
import api from "../../../api/api.js";
import NavbarPembeli from "../../components/Navbar/navbarPembeli";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Modal,
  Table,
} from "react-bootstrap";
import { Truck } from "react-bootstrap-icons";
import "./historyPembeli.css";

const HistoryPembeli = () => {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Delivery");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showSSInline, setShowSSInline] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("transaksi/history");
        setOrders(data);
      } catch (err) {
        console.error("Error loading history:", err);
      }
    })();
  }, []);

  const openDetail = (tx) => {
    setSelectedTx(tx);
    setShowDetail(true);
    setShowSSInline(false);
  };
  const closeDetail = () => {
    setShowDetail(false);
    setSelectedTx(null);
    setShowSSInline(false);
  };

  const filtered = orders.filter(
    (tx) => tx.metode_pengiriman === filter
  );

  return (
    <>
      <NavbarPembeli />

      <Container className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Riwayat Pembelian</h2>
            <div>
                {["Delivery", "Pick Up"].map((m) => (
                <span
                    key={m}
                    className={`filter-option ${filter === m ? "active" : ""}`}
                    onClick={() => setFilter(m)}
                >
                    {m}
                </span>
                ))}
            </div>
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-muted">Tidak ada riwayat untuk "{filter}".</p>
        )}

        <Row>
          {filtered.map((tx) => {
            const dt = tx.detil_transaksi?.[0] || {};
            const barang = dt.barang || {};
            const seller = barang.penitipan?.user;
            const sellerName = seller
              ? `${seller.first_name} ${seller.last_name}`
              : "—";
            const status =
              tx.pengiriman?.status_pengiriman ||
              tx.pengambilan?.status_pengambilan ||
              "—";

            return (
              <Col md={6} key={tx.id_transaksi} className="mb-4">
                <Card className="history-card h-100">
                  <Card.Header className="d-flex justify-content-between align-items-center py-3 px-4">
                    <div className="store-name">{sellerName}</div>
                    <div className="status-area text-success">
                      <Truck className="me-1" />
                      <span className="status-text">{status}</span>
                    </div>
                  </Card.Header>

                  <Card.Body className="py-4 px-4">
                    <Row className="product-row align-items-center">
                      <Col xs={4}>
                        <Image
                          src={`http://127.0.0.1:8000/storage/${barang.kode_barang}.jpeg`}
                          thumbnail
                          rounded
                        />
                      </Col>
                      <Col xs={8}>
                        <div className="product-name">{barang.nama_barang}</div>
                        <div className="product-price">
                          Rp{(barang.harga || 0).toLocaleString("id-ID")}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>

                  <Card.Footer className="d-flex justify-content-between align-items-center py-3 px-4">
                    <small className="tanggal-text">
                      {new Date(tx.tanggal_transaksi).toLocaleDateString("id-ID")}
                    </small>
                    <div className="d-flex align-items-center">
                      <Button
                        size="sm"
                        variant="outline-success"
                        className="me-2"
                        onClick={() => openDetail(tx)}
                      >
                        Lihat Detail
                      </Button>
                      <Button size="sm" variant="success" className="me-3">
                        Nilai
                      </Button>
                      <div className="fw-bold">
                        Total: Rp{(tx.total || 0).toLocaleString("id-ID")}
                      </div>
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>

      <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Detail Transaksi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedTx && (
            <>
              {/* Header */}
              <div className="d-flex justify-content-between mb-4">
                <h5>
                  {selectedTx.detil_transaksi?.[0]?.barang?.penitipan?.user
                    ? `${selectedTx.detil_transaksi[0].barang.penitipan.user.first_name} ${selectedTx.detil_transaksi[0].barang.penitipan.user.last_name}`
                    : "—"}
                </h5>
                <div className="status-area text-success">
                  <Truck className="me-1" />
                  {selectedTx.pengiriman?.status_pengiriman ||
                    selectedTx.pengambilan?.status_pengambilan ||
                    "—"}
                </div>
              </div>

              <Table borderless responsive className="mb-4">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th className="text-end">Harga</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.detil_transaksi?.map((dt) => (
                    <tr key={dt.id_dt}>
                      <td>
                        <Image
                          src={`http://127.0.0.1:8000/storage/${dt.barang.kode_barang}.jpeg`}
                          thumbnail
                          style={{ width: 150 }}
                        />
                      </td>
                      <td>{dt.barang.nama_barang}</td>
                      <td className="text-end">
                        Rp{(dt.barang.harga || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {/* SS Pembayaran & Metode Pengiriman */}
              <Row className="mb-4 align-items-center">
                <Col md={6} className="d-flex align-items-center">
                  <strong className="me-2">SS Pembayaran:</strong>
                  {selectedTx.pembayaran?.ss_pembayaran ? (
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setShowSSInline(!showSSInline)}
                    >
                      {showSSInline ? "Sembunyikan" : "Lihat"}
                    </Button>
                  ) : (
                    <span className="text-muted">
                      Belum ada bukti pembayaran.
                    </span>
                  )}
                </Col>
                <Col md={6} className="d-flex align-items-center">
                  <strong className="me-2">Metode Pengiriman:</strong>
                  <span>{selectedTx.metode_pengiriman ?? "–"}</span>
                </Col>
              </Row>

              {showSSInline && selectedTx.pembayaran?.ss_pembayaran && (
                <div className="text-center mb-4">
                  <Image
                    src={`http://127.0.0.1:8000/storage/${selectedTx.pembayaran.ss_pembayaran}`}
                    fluid
                    style={{ maxWidth: "100%", maxHeight: 400 }}
                  />
                </div>
              )}

              <Table borderless className="summary-table">
                <tbody>
                  <tr>
                    <td>Subtotal Produk</td>
                    <td className="text-end">
                      Rp{(selectedTx.subtotal || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr>
                    <td>Biaya Pengiriman</td>
                    <td className="text-end">
                      Rp{(selectedTx.biaya_pengiriman || 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Diskon</td>
                    <td className="text-end">
                      –Rp{(selectedTx.diskon || 0).toLocaleString("id-ID")}
                    </td>
                  </tr>
                  <tr className="total-row">
                    <td>
                      <strong>Total</strong>
                    </td>
                    <td className="text-end">
                      <strong>
                        Rp{(selectedTx.total || 0).toLocaleString("id-ID")}
                      </strong>
                    </td>
                  </tr>
                </tbody>
              </Table>
            </>
          )}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default HistoryPembeli;
