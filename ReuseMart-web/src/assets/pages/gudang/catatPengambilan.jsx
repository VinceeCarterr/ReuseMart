import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Modal,
  Form,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import { FiUsers } from "react-icons/fi";
import api from "../../../api/api.js";
import NavbarGudang from "../../components/Navbar/navbarGudang.jsx";
import "../penitip/historyPenitip.css";

const CatatPengambilan = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await api.get("/akan-ambil");
        const data = response.data.data ?? response.data;
        setItems(data);
      } catch (err) {
        console.error(
          "Error fetching items for pengambilan:",
          err.response ?? err
        );
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // filter by nama_barang, namaPenitip, NIK
  const filteredItems = items.filter((item) => {
    const q = search.toLowerCase();
    const name = item.nama_barang?.toLowerCase() || "";
    const penitipanRel = item.Penitipan || item.penitipan;
    const user = penitipanRel?.user;
    const namaPenitip = user
      ? `${user.first_name} ${user.last_name}`.toLowerCase()
      : "";
    const nikPenitip = (
      user?.nik ||
      user?.NIK ||
      user?.nik_user ||
      ""
    ).toLowerCase();
    return (
      name.includes(q) || namaPenitip.includes(q) || nikPenitip.includes(q)
    );
  });

  const openConfirm = (item) => {
    setCurrentItem(item);
    setShowConfirm(true);
  };
  const closeConfirm = () => {
    setCurrentItem(null);
    setShowConfirm(false);
  };
  const handlePengambilan = async () => {
    if (!currentItem) return;
    try {
      await api.patch(`/barang/${currentItem.id_barang}/ambil`);
      setItems((prev) =>
        prev.filter((i) => i.id_barang !== currentItem.id_barang)
      );
      setToastVariant("success");
      setToastMessage("Konfirmasi pengambilan berhasil!");
      setToastShow(true);
    } catch (err) {
      console.error("Error updating pengambilan:", err);
      alert("Gagal memperbarui status. Cek konsol untuk detail.");
      setToastVariant("danger");
      setToastMessage("Gagal konfirmasi pengambilan.");
      setToastShow(true);
    }
    closeConfirm();
  };

  return (
    <>
      <ToastContainer position="top-end" className="p-3">
        <Toast
          bg={toastVariant}
          onClose={() => setToastShow(false)}
          show={toastShow}
          delay={3000}
          autohide
        >
          <Toast.Body className={toastVariant === "danger" ? "text-white" : ""}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      <NavbarGudang />
      <Container className="mt-5 " style={{background:'none'}}>
        <Row className="align-items-center mb-2">
          <Col md={4}>
            <h2 className="text-success fw-bold">Daftar Barang Akan Diambil</h2>
          </Col>
          <Col md={4}>
            <Form.Control
              type="search"
              placeholder="Nama Barang, Nama Penitip, NIK..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={4} />
        </Row>
        <hr />

        {loading && <p className="text-center">Memuat...</p>}
        {!loading && filteredItems.length === 0 && (
          <p className="text-center text-muted">
            Tidak ada barang dengan status "Akan Ambil".
          </p>
        )}

        <Row>
          {filteredItems.map((item) => {
            const penitipanRel = item.Penitipan || item.penitipan;
            const user = penitipanRel?.user;
            const namaPenitip = user
              ? `${user.first_name} ${user.last_name}`
              : "-";
            const nikPenitip = user?.nik || user?.NIK || user?.nik_user || "-";
            const tanggalTitipDate = item.tanggal_titip
              ? new Date(item.tanggal_titip)
              : null;
            const akhirDate = tanggalTitipDate
              ? new Date(tanggalTitipDate.getTime() + 30 * 24 * 3600 * 1000)
              : null;
            const imgSrc = item.foto?.length
              ? `http://127.0.0.1:8000/storage/${
                  item.foto[0].path ?? item.foto[0]
                }`
              : "/placeholder.jpg";

            return (
              <Col md={6} key={item.id_barang} className="mb-4" >
                <Card className="history-card h-100 d-flex flex-column">
                  <Card.Header className="d-flex justify-content-between align-items-center py-3 px-4 fw-bold">
                    <strong>{item.nama_barang}</strong>
                    <div className="status-area d-flex align-items-center">
                      <FiUsers className="me-1 text-success" />
                      <span className="status-text text-success">
                        {item.status}
                      </span>
                    </div>
                  </Card.Header>

                  <Card.Body className="py-4 px-4 flex-grow-1">
                    <Row className="product-row align-items-center">
                      <Col xs={4}>
                        <Image src={imgSrc} thumbnail rounded />
                      </Col>
                      <Col xs={8}>
                        <p>
                          <strong>Nama Penitip: </strong>
                          {namaPenitip}
                        </p>
                        <p>
                          <strong>NIK: </strong>
                          {nikPenitip}
                        </p>
                        <p>
                          <strong>Tanggal Titip: </strong>
                          {tanggalTitipDate
                            ? tanggalTitipDate.toLocaleDateString("id-ID")
                            : "-"}
                        </p>
                        <p>
                          <strong>Akhir Penitipan: </strong>
                          {akhirDate
                            ? akhirDate.toLocaleDateString("id-ID")
                            : "-"}
                        </p>
                      </Col>
                    </Row>
                  </Card.Body>

                  <Card.Footer className="d-flex justify-content-end py-3 px-4">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => openConfirm(item)}
                    >
                      Konfirmasi Pengambilan
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>

        <Modal show={showConfirm} onHide={closeConfirm} centered>
          <Modal.Header closeButton>
            <Modal.Title>Konfirmasi Pengambilan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Apakah Anda yakin sudah melakukan pengambilan barang?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeConfirm}>
              Batal
            </Button>
            <Button variant="success" onClick={handlePengambilan}>
              Ya, Sudah Ambil
            </Button>
          </Modal.Footer>
        </Modal>
      </Container>
    </>
  );
};

export default CatatPengambilan;
