import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Image,
  Modal,
  Table,
  Form,
  Dropdown,
  Toast,
  ToastContainer,
} from "react-bootstrap";
import {
  FiShoppingCart,
  FiClock,
  FiUser,
  FiCalendar,
  FiStar,
} from "react-icons/fi";
import { Truck } from "react-bootstrap-icons";
import api from "../../../api/api.js";
import ProfileModal from "../../components/Pembeli/profileModal.jsx";
import "./historyPembeli.css";

const HistoryPembeli = () => {
  const navigate = useNavigate();

  // — USER PROFILE —
  let profile = {};
  try {
    profile = JSON.parse(localStorage.getItem("profile") || "{}");
  } catch {}
  const first = profile.first_name ?? profile.firstName ?? profile.name;
  const last = profile.last_name ?? profile.lastName;
  const userName = first && last ? `${first} ${last}` : first ? first : "User";

  // — NAVBAR STATE —
  const [groupedCats, setGroupedCats] = useState([]);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [showMega, setShowMega] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // — TOAST STATE —
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    api
      .get("/kategori")
      .then(({ data }) => setGroupedCats(data))
      .catch(console.error);
  }, []);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const openProfileModal = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  // — HISTORY STATE & FILTERS —
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("Delivery");
  const [showDetail, setShowDetail] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);
  const [showSSInline, setShowSSInline] = useState(false);

  // — RATING STATE —
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rating, setRating] = useState(0);

  // date-range
  const [showDateModal, setShowDateModal] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    api
      .get("transaksi/history")

      .then(({ data }) => {
        console.log("🔍 transaksi/history response:", data);
        setOrders(data);
      })
      .catch(console.error);
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

  const openRatingModal = (item) => {
    setSelectedItem(item);
    setRating(item.rating || 0);
    setShowRatingModal(true);
  };

  const closeRatingModal = () => {
    setShowRatingModal(false);
    setSelectedItem(null);
    setRating(0);
  };

  const updateRatingAllUser = async () => {
    try {
      await api.post("/updateAllUserRatings");
    } catch (error) {
      console.error("Failed to update User Rating:", error);
    }
  };

  const handleRatingSubmit = async () => {
    if (!selectedItem || rating < 1 || rating > 5) {
      alert("Please select a valid rating (1-5).");
      return;
    }

    try {
      await api.put(`/barang/${selectedItem.barang.id_barang}/updateRating`, {
        rating: rating,
      });

      // Update local orders state to reflect the new rating
      setOrders((prevOrders) =>
        prevOrders.map((tx) => ({
          ...tx,
          detil_transaksi: tx.detil_transaksi.map((dt) =>
            dt.barang.id_barang === selectedItem.barang.id_barang
              ? { ...dt, rating: rating }
              : dt
          ),
        }))
      );

      await updateRatingAllUser();
      console.log("Setting showToast to true"); // Debug log
      setShowToast(true); // Show toast on successful rating submission
      setTimeout(() => closeRatingModal(), 100); // Slight delay to ensure toast renders
    } catch (error) {
      console.error(
        "Failed to submit rating:",
        error.response?.data || error.message
      );
      alert("Failed to submit rating. Please try again.");
    }
  };

  useEffect(() => {
    console.log("showToast state:", showToast); // Debug toast state changes
  }, [showToast]);

  let filtered = orders.filter((tx) => {
    const statusPengiriman =
      tx.pengiriman?.status_pengiriman ||
      tx.pengambilan?.status_pengambilan ||
      "—";
    const hasOnHoldItem =
      tx.detil_transaksi?.some((dt) => dt.barang?.status === "On Hold") || false;
    return (
      tx.metode_pengiriman === filter &&
      statusPengiriman !== "On Hold" &&
      !hasOnHoldItem
    );
  });

  if (searchTerm) {
    filtered = filtered.filter((tx) => {
      const nama = tx.detil_transaksi?.[0]?.barang?.nama_barang ?? "";
      return nama.toLowerCase().includes(searchTerm.toLowerCase());
    });
  }

  // inclusive date-range filter
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    filtered = filtered.filter((tx) => {
      const d = new Date(tx.tanggal_transaksi);
      d.setHours(0, 0, 0, 0);
      return d >= from && d <= to;
    });
  }

  const handleResetDates = () => {
    setFromDate("");
    setToDate("");
  };

  return (
    <>
      {/* ========== TOAST NOTIFICATION ========== */}
      <ToastContainer position="middle-center" className="p-3" style={{ zIndex: 1050 }}>
        <Toast
          onClose={() => setShowToast(false)}
          show={showToast}
          delay={3000}
          autohide
          variant="success"
        >
          <Toast.Header>
            <strong className="me-auto">Berhasil!</strong>
          </Toast.Header>
          <Toast.Body>Rating untuk produk berhasil dikirim.</Toast.Body>
        </Toast>
      </ToastContainer>

      {/* ========== NAVBAR ========== */}
      <div className="py-3 navbar-pembeli">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-between">
            <div className="col-auto logo-container">
              <Link
                to="/pembeliLP"
                className="d-flex align-items-center text-decoration-none logo-link"
              >
                <img
                  src="/logo_ReuseMart.png"
                  alt="ReuseMart"
                  className="logo-img"
                />
                <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
              </Link>
            </div>
            <div className="col-md-6 px-2">
              <Form.Control
                type="search"
                placeholder="Cari produk..."
                className="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-auto d-flex align-items-center gap-4 action-group pe-5">
              <div
                className="mega-dropdown"
                onMouseEnter={() => setShowMega(true)}
                onMouseLeave={() => setShowMega(false)}
              >
                <button className="category-toggle">Kategori</button>
                {showMega && (
                  <div className="mega-menu">
                    <div className="mega-menu-sidebar">
                      {groupedCats.map((cat, idx) => (
                        <div
                          key={idx}
                          className={`mega-menu-item ${
                            idx === activeCatIdx ? "active" : ""
                          }`}
                          onMouseEnter={() => setActiveCatIdx(idx)}
                        >
                          {cat.nama_kategori}
                        </div>
                      ))}
                    </div>
                    <div className="mega-menu-content">
                      {groupedCats[activeCatIdx]?.sub_kategori.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/kategori/${sub.id}`}
                          className="mega-menu-link"
                        >
                          {sub.nama}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <Link to="/cart" className="text-dark fs-3 icon-link">
                <FiShoppingCart />
              </Link>
              <Link to="/historyPembeli" className="text-dark fs-3 icon-link">
                <FiClock />
              </Link>
              <Dropdown>
                <Dropdown.Toggle variant="light" className="profile-toggle">
                  <FiUser className="me-2 fs-3" />
                  <span className="fw-bold">{userName}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item onClick={openProfileModal}>
                    Profil
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/orders">
                    Pesanan Saya
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/alamat">
                    Atur Alamat
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={openLogoutModal}>
                    Keluar
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation */}
      <Modal show={showLogoutModal} onHide={closeLogoutModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>Apakah Anda yakin ingin keluar?</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={closeLogoutModal}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleConfirmLogout}>
            Keluar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Profile Modal */}
      <ProfileModal show={showProfileModal} onHide={closeProfileModal} />

      {/* Rating Modal */}
      <Modal show={showRatingModal} onHide={closeRatingModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Beri Penilaian</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>
                Berikan rating untuk{" "}
                <strong>{selectedItem?.barang?.nama_barang || "produk"}</strong>
              </Form.Label>
              <div className="d-flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FiStar
                    key={star}
                    size={30}
                    fill={star <= rating ? "gold" : "none"}
                    stroke={star <= rating ? "gold" : "black"}
                    style={{ cursor: "pointer" }}
                    onClick={() => setRating(star)}
                  />
                ))}
              </div>
            </Form.Group>
          </Form>
          <Row>
            <Col>
              <Button
                variant="secondary"
                onClick={closeRatingModal}
                className="me-2"
              >
                Batal
              </Button>
              <Button
                variant="success"
                onClick={handleRatingSubmit}
                disabled={rating < 1 || rating > 5}
              >
                Kirim
              </Button>
            </Col>
          </Row>
        </Modal.Body>
      </Modal>

      {/* ========== PAGE CONTENT ========== */}
      <Container className="mt-5" style={{ background: "none" }}>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Riwayat Pembelian</h2>
          <div className="d-flex align-items-center">
            <FiCalendar
              className="me-3 fs-4 text-secondary"
              style={{ cursor: "pointer" }}
              onClick={() => setShowDateModal(true)}
            />
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
          <p className="text-center text-muted">
            Tidak ada riwayat untuk “{filter}”
            {fromDate && toDate ? ` dari ${fromDate} sampai ${toDate}` : ""}.
          </p>
        )}

        <Row>
          {filtered.map((tx) => {
            const dt = tx.detil_transaksi?.[0] || {};
            const br = dt.barang || {};
            const imgPath = br.foto?.[0]?.path || "defaults/no-image.png";
            const seller = br.penitipan?.user;
            const sellerName = seller
              ? `${seller.first_name} ${seller.last_name}`
              : "—";
            const status =
              tx.pengiriman?.status_pengiriman ||
              tx.pengambilan?.status_pengambilan ||
              "Disiapkan";
            const alreadyRated = (br.rating ?? 0) > 0 || (dt.rating ?? 0) > 0;
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
                          src={`http://127.0.0.1:8000/storage/${imgPath}`}
                          thumbnail
                          rounded
                        />
                      </Col>
                      <Col xs={8}>
                        <div className="product-name">{br.nama_barang}</div>
                        <div className="product-price">
                          Rp{(br.harga || 0).toLocaleString("id-ID")}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="d-flex justify-content-between align-items-center py-3 px-4">
                    <small className="tanggal-text">
                      {new Date(tx.tanggal_transaksi).toLocaleDateString(
                        "id-ID"
                      )}
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
                      <Button
                        size="sm"
                        variant="success"
                        className="me-3"
                        onClick={() => openRatingModal(dt)}
                        disabled={
                          (dt.barang?.rating ?? 0) > 0 || (dt.rating ?? 0) > 0
                        }
                      >
                        {(br.rating ?? 0) > 0
                          ? `Rated: ${br.rating}`
                          : "Beri Rating"}
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

      {/* Date-Range Modal */}
      <Modal
        show={showDateModal}
        onHide={() => setShowDateModal(false)}
        centered
      >
        <Modal.Body>
          <Form.Group className="mb-3">
            <Form.Label className="fw-bold">Dari</Form.Label>
            <Form.Control
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label className="fw-bold">Sampai</Form.Label>
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleResetDates}>
            Reset
          </Button>
          <Button variant="danger" onClick={() => setShowDateModal(false)}>
            Batal
          </Button>
          <Button variant="success" onClick={() => setShowDateModal(false)}>
            Terapkan
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Detail Modal */}
      <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
        <Modal.Body>
          {selectedTx && (
            <>
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
                    "Disiapkan"}
                </div>
              </div>
              <Table borderless responsive className="mb-4">
                <thead>
                  <tr>
                    <th>Foto</th>
                    <th>Nama Produk</th>
                    <th className="text-end">Harga</th>
                    <th className="text-end">Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTx.detil_transaksi?.map((dt) => {
                    const br = dt.barang || {};
                    const fp = br.foto?.[0]?.path || "defaults/no-image.png";
                    const currentRating = dt.rating ?? br.rating ?? 0;
                    const hasRated = currentRating > 0;

                    return (
                      <tr key={dt.id_dt}>
                        <td>
                          <Image
                            src={`http://127.0.0.1:8000/storage/${fp}`}
                            thumbnail
                            style={{ width: 150 }}
                          />
                        </td>
                        <td>{br.nama_barang ?? "–"}</td>
                        <td className="text-end">
                          Rp{(br.harga || 0).toLocaleString("id-ID")}
                        </td>
                        <td className="text-end">
                          {hasRated ? (
                            <span>
                              {currentRating}{" "}
                              <FiStar fill="gold" stroke="gold" />
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="success"
                              onClick={() => openRatingModal(dt)}
                            >
                              Nilai
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </Table>
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
                      Rp
                      {(selectedTx.biaya_pengiriman || 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td>Diskon</td>
                    <td className="text-end">
                      Rp{(selectedTx.diskon || 0).toLocaleString("id-ID")}
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