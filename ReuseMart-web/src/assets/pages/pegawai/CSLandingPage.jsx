import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Spinner,
  Form,
} from "react-bootstrap";
import {
  FiUser,
  FiHash,
  FiMail,
  FiPhone,
  FiGift,
  FiStar,
} from "react-icons/fi";
import api from "../../../api/api.js";
import NavbarCS from "../../components/Navbar/navbarCS.jsx";
import TambahPenitipModal from "../../components/CS/tambahPenitipModal.jsx";
import DetailPenitipModal from "../../components/CS/detailPenitipModal.jsx";

const PenitipCard = ({ penitip, onDetailClick }) => (
  <Col md={12} className="justify-content-center mx-auto mb-2">
    <Card>
      <Card.Body className="p-2">
        <Row className="align-items-center">
          <Col
            md={2}
            className="border-end d-flex align-items-center justify-content-center"
          >
            <FiUser className="me-1" />
            <strong>
              {penitip.first_name} {penitip.last_name}
            </strong>
          </Col>

          <Col
            md={2}
            className="border-end d-flex align-items-center justify-content-center"
          >
            <FiHash className="me-1" />
            {penitip.NIK}
          </Col>

          <Col
            md={3}
            className="border-end d-flex align-items-center justify-content-center"
          >
            <FiMail className="me-1" />
            {penitip.email}
          </Col>

          <Col
            md={2}
            className="border-end d-flex align-items-center justify-content-center"
          >
            <FiPhone className="me-1" />
            {penitip.no_telp}
          </Col>

          <Col
            md={1}
            className="border-end d-flex align-items-center justify-content-center"
          >
            <FiGift className="me-1" />
            {penitip.poin_loyalitas ?? 0}
          </Col>

          <Col
            md={1}
            className="border-end d-flex align-items-center justify-content-center"
          >
            {penitip.rating ?? 0}
            <FiStar className="ms-1" />
          </Col>

          <Col
            md={1}
            className="d-flex align-items-center justify-content-center"
          >
            <Button
              variant="outline-success"
              size="sm"
              onClick={() => onDetailClick(penitip)}
            >
              Detail
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  </Col>
);

export default function CSLandingPage() {
  const [penitipList, setPenitipList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedPenitip, setSelectedPenitip] = useState(null);

  const fetchPenitip = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/penitip");
      setPenitipList(data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch penitip:", err);
      setError("Gagal memuat data penitip.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPenitip();
  }, []);

  const handleDetailClick = (p) => {
    setSelectedPenitip(p);
    setShowDetail(true);
  };

  const filtered = penitipList.filter((p) => {
    const fullName = [p.first_name, p.last_name]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const term = searchTerm.toLowerCase();
    return (
      fullName.includes(term) ||
      (p.NIK || "").toLowerCase().includes(term)
    );
  });

  return (
    <div>
      <NavbarCS />

      <TambahPenitipModal
        show={showAdd}
        onHide={() => setShowAdd(false)}
        fetchPenitip={fetchPenitip}
      />

      <DetailPenitipModal
        show={showDetail}
        onHide={() => setShowDetail(false)}
        penitip={selectedPenitip}
        fetchPenitip={fetchPenitip}
      />

      <Container className="mt-5" style={{background:'none'}}>
        <Row className="align-items-center mb-2">
          <Col md={4}>
            <h2 className="text-success fw-bold">Daftar Penitip</h2>
          </Col>
          <Col md={4}>
            <Form.Control
              type="search"
              placeholder="Cari Penitip…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Col>
          <Col md={4} className="d-flex justify-content-end">
            <Button variant="success" onClick={() => setShowAdd(true)}>
              Tambah Penitip
            </Button>
          </Col>
        </Row>

        <hr />

        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        ) : error ? (
          <div className="alert alert-danger">{error}</div>
        ) : (
          <Row>
            {filtered.length > 0 ? (
              filtered.map((p) => (
                <PenitipCard
                  key={p.id_user}
                  penitip={p}
                  onDetailClick={handleDetailClick}
                />
              ))
            ) : (
              <Col>
                <p className="text-center">Belum ada penitip terdaftar.</p>
              </Col>
            )}
          </Row>
        )}
      </Container>
    </div>
  );
}
