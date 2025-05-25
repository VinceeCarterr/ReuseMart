import { useState, useEffect, useRef } from "react";
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
  Carousel,
  Dropdown,
  Toast, 
  ToastContainer
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FiCalendar, FiShoppingCart, FiClock, FiUser } from "react-icons/fi";
import { Truck } from "react-bootstrap-icons";
import api from "../../../api/api.js";
import ProfilePenitipModal from "../../components/Penitip/profilePenitipModal.jsx";
import "./historyPenitip.css";

const HistoryPenitip = () => {
  const navigate = useNavigate();

  let userName = "Penitip";
  try {
    const prof = JSON.parse(localStorage.getItem("profile") || "{}");
    const fn = prof.first_name ?? prof.firstName ?? prof.name;
    const ln = prof.last_name ?? prof.lastName;
    userName = fn && ln ? `${fn} ${ln}` : fn || "Penitip";
  } catch {}

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const expiredPatched = useRef(new Set());

  const [groupedCats, setGroupedCats] = useState([]);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [showMega, setShowMega] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [items, setItems] = useState([]);
  const [filterStatus, setFilterStatus] = useState("Available");
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDateModal, setShowDateModal] = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmItem, setConfirmItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showAmbilConfirm, setShowAmbilConfirm] = useState(false);
  const [showDonasiConfirm, setShowDonasiConfirm] = useState(false);
  const [actionItem, setActionItem] = useState(null);
  const [toastShow, setToastShow] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastVariant, setToastVariant] = useState("success");

  const statuses = ["Available", "Sold", "Expired", "Donated"];

  useEffect(() => {
    api
      .get("/kategori")
      .then(({ data }) => setGroupedCats(data))
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchHistory();
  }, [filterStatus, search, startDate, endDate]);

  const fetchHistory = async () => {
    setLoading(true);

    const params = {
      ...(filterStatus === "Expired"
        ? { status_periode: "Expired" }
        : { status: filterStatus }),
      ...(search && { search }),
      ...(startDate && { start_date: startDate }),
      ...(endDate && { end_date: endDate }),
    };

    try {
      const response = await api.get("/transaksi/historyPenitip", { params });
      let data = response.data.data;

      if (filterStatus === "Available") {
        data = data.filter((item) => item.status_periode !== "Expired");
      }

      if (filterStatus === "Expired") {
        data = data.filter(
          (item) =>
            item.status_periode === "Expired" &&
            item.status !== "Sold" &&
            item.status !== "Donated"
        );
      }

      setItems(data);
    } catch (err) {
      console.error("Fetch error:", err.response ?? err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    items.forEach((item) => {
      const due =
        new Date(item.tanggal_titip).getTime() + 30 * 24 * 3600 * 1000;

      if (
        now >= due &&
        item.status === "Available" &&
        item.status_periode === "Periode 1" &&
        !expiredPatched.current.has(item.id_barang)
      ) {
        expiredPatched.current.add(item.id_barang);

        api
          .patch(`/transaksi/historyPenitip/${item.id_barang}`, {
            status: "Bisa Perpanjang",
            status_periode: "Expired",
          })
          .then(() => fetchHistory())
          .catch(console.error);
      }
      if (
        now >= due &&
        item.status_periode !== "Expired" &&
        !expiredPatched.current.has(item.id_barang)
      ) {
        expiredPatched.current.add(item.id_barang);

        api
          .patch(`/transaksi/historyPenitip/${item.id_barang}`, {
            status_periode: "Expired",
          })
          .then(() => fetchHistory())
          .catch(console.error);
      }
    });
  }, [now, items]);

  // open / close confirm modal
  const openConfirm = (item) => {
    setConfirmItem(item);
    setShowConfirm(true);
  };
  const closeConfirm = () => {
    setConfirmItem(null);
    setShowConfirm(false);
  };

  // handle perpanjang after confirmation
  const handlePerpanjang = async () => {
    if (!confirmItem) return;

    // set today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];

    try {
      await api.patch(`/transaksi/historyPenitip/${confirmItem.id_barang}`, {
        tanggal_titip: today,
        status_periode: "Periode 2",
        status: "Available",
      });
      setToastVariant("success");
      setToastMessage("Perpanjangan berhasil!");
      setToastShow(true);
      closeConfirm();
      fetchHistory();
    } catch (err) {
      console.error("Perpanjang error:", err.response ?? err);
      setToastVariant("danger");
      setToastMessage("Perpanjangan gagal.");
      setToastShow(true);
    }
  };

  const openAmbilConfirm = (item) => {
    setActionItem(item);
    setShowAmbilConfirm(true);
  };
  const closeAmbilConfirm = () => {
    setActionItem(null);
    setShowAmbilConfirm(false);
  };
  const openDonasiConfirm = (item) => {
    setActionItem(item);
    setShowDonasiConfirm(true);
  };
  const closeDonasiConfirm = () => {
    setActionItem(null);
    setShowDonasiConfirm(false);
  };

  const handleAmbil = async () => {
    if (!actionItem) return;
    const today = new Date().toISOString().split("T")[0];
    try {
      await api.patch(`/transaksi/historyPenitip/${actionItem.id_barang}`, {
        status: "Akan Ambil",
        tanggal_titip: today,
      });
      setToastVariant("success");
      setToastMessage("Permintaan ambil berhasil!");
      setToastShow(true);
      closeAmbilConfirm();
      fetchHistory();
    } catch (err) {
      console.error("Ambil error:", err.response ?? err);
      setToastVariant("danger");
      setToastMessage("Ambil gagal.");
      setToastShow(true);
    }
  };

  const handleDonasi = async () => {
    if (!actionItem) return;
    try {
      await api.patch(`/transaksi/historyPenitip/${actionItem.id_barang}`, {
        status: "Untuk Donasi",
      });
      setToastVariant("success");
      setToastMessage("Donasi berhasil!");
      setToastShow(true);
      closeDonasiConfirm();
      fetchHistory();
    } catch (err) {
      console.error("Donasi error:", err.response ?? err);
      setToastVariant("danger");
      setToastMessage("Donasi gagal.");
    }
  };

  const getCountdown = (tanggalTitip, nowTs = now) => {
    const due = new Date(tanggalTitip).getTime() + 30 * 24 * 3600 * 1000;
    const diff = due - nowTs;
    if (diff <= 0)
      return {
        text: "Perpanjangan tersedia",
        expired: true,
        extendable: false,
      };
    const totalSec = Math.floor(diff / 1000);
    const hh = Math.floor(totalSec / 3600);
    const mm = Math.floor((totalSec % 3600) / 60);
    const ss = totalSec % 60;
    if (hh < 24)
      return {
        text: `${String(hh).padStart(2, "0")}j ${String(mm).padStart(
          2,
          "0"
        )}m ${String(ss).padStart(2, "0")}s`,
        expired: false,
        extendable: true,
      };
    const days = Math.ceil(hh / 24);
    return { text: `${days} hari tersisa`, expired: false, extendable: false };
  };

  // logout & profile handlers
  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const openProfileModal = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  // detail modal handlers
  const openDetail = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
  };
  const closeDetail = () => {
    setSelectedItem(null);
    setShowDetail(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchHistory();
  };
  const handleResetDates = () => {
    setStartDate("");
    setEndDate("");
    setShowDateModal(false);
  };

  const donatedPatched = useRef(new Set());
  useEffect(() => {
    items.forEach((item) => {
      const donateDeadline =
        new Date(item.tanggal_titip).getTime() + (30 + 7) * 24 * 3600 * 1000;
      if (
        now >= donateDeadline &&
        item.status_periode === "Expired" &&
        item.status === "Available" &&
        !donatedPatched.current.has(item.id_barang)
      ) {
        donatedPatched.current.add(item.id_barang);
        api
          .patch(`/transaksi/historyPenitip/${item.id_barang}`, {
            status: "Untuk Donasi",
          })
          .then(() => fetchHistory())
          .catch(console.error);
      }
    });
  }, [now, items]);
  return (
    <>
    <ToastContainer
  position="top-end"
  className="p-3"
>
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
      {/* NAVBAR */}
      <div className="py-3 navbar-penitip">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-between">
            {/* Logo */}
            <div className="col-auto logo-container">
              <Link
                to="/penitipLP"
                className="d-flex align-items-center logo-link"
              >
                <img
                  src="/logo_ReuseMart.png"
                  alt="ReuseMart"
                  className="logo-img"
                />
                <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
              </Link>
            </div>
            {/* Search */}
            <div className="col-md-6 px-2">
              <Form onSubmit={handleSearch}>
                <Form.Control
                  type="search"
                  placeholder="Cari nama/kode barang..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="search-input"
                />
              </Form>
            </div>
            {/* Actions */}
            <div className="col-auto d-flex align-items-center gap-4 pe-5">
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
                          key={cat.nama_kategori}
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
              <Link to="/historyPenitip" className="text-dark fs-3 icon-link">
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

      {/* LOGOUT MODAL */}
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

      {/* PROFILE MODAL */}
      <ProfilePenitipModal show={showProfileModal} onHide={closeProfileModal} />

      {/* CONTENT */}
      <Container className="mt-5">
        {/* FILTER BAR */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="fw-bold">Riwayat Penitipan</h2>
          <div className="d-flex align-items-center">
            <FiCalendar
              className="me-3 fs-4 text-secondary"
              style={{ cursor: "pointer" }}
              onClick={() => setShowDateModal(true)}
            />
            <div>
              {statuses.map((status) => (
                <span
                  key={status}
                  className={`filter-option ${
                    filterStatus === status ? "active" : ""
                  }`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status}
                </span>
              ))}
            </div>
          </div>
        </div>

        {loading && <p className="text-center">Memuat...</p>}
        {!loading && items.length === 0 && (
          <p className="text-center text-muted">
            Tidak ada riwayat dengan status "{filterStatus}".
          </p>
        )}

        {/* ITEM CARDS */}
        <Row>
          {items.map((item) => {
            const { text, expired, extendable } = getCountdown(
              item.tanggal_titip
            );
            const [val, unit, ...rest] = text.split(" ");

            return (
              <Col md={6} key={item.id_barang} className="mb-4">
                <Card className="history-card h-100 d-flex flex-column">
                  <Card.Header className="d-flex justify-content-between align-items-center py-3 px-4 fw-bold">
                    <div>
                      {item.nama_barang}
                      {item.status_periode === "Periode 2" &&
                        item.status === "Available" && (
                          <span className="ms-2 text-warning">
                            (Perpanjang)
                          </span>
                        )}
                    </div>
                    <div className="status-area">
                      {item.status === "Available" &&
                      item.status_periode === "Expired" ? (
                        <span className="text-danger fw-bold">
                          Masa Penitipan Habis
                        </span>
                      ) : (
                        <>
                          <Truck className="me-1 text-success" />
                          <span className="status-text text-success">
                            {item.status}
                          </span>
                        </>
                      )}
                    </div>
                  </Card.Header>

                  {/* make body flex-grow so footer is pushed down */}
                  <Card.Body className="py-4 px-4 flex-grow-1">
                    <Row className="product-row align-items-center">
                      <Col xs={4}>
                        <Image
                          src={
                            item.foto?.length
                              ? `http://127.0.0.1:8000/storage/${item.foto[0]}`
                              : "/placeholder.jpg"
                          }
                          thumbnail
                          rounded
                        />
                      </Col>
                      <Col xs={8}>
                        <div className="product-name">{item.nama_barang}</div>
                        <div className="product-price">
                          Rp{(item.harga || 0).toLocaleString("id-ID")}
                        </div>
                        <div className="product-category">
                          {item.kategori?.nama_kategori}
                          {item.kategori?.sub_kategori &&
                            ` - ${item.kategori.sub_kategori}`}
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>

                  <Card.Footer className="d-flex justify-content-between align-items-end py-3 px-4">
                    <div>
                      {item.status_periode === "Expired" &&
                      item.status === "Akan Ambil" ? (
                        <small className="d-block mb-1">
                          <strong>
                            Tanggal Konfirmasi Pengambilan:{" "}
                            {new Date(item.tanggal_titip).toLocaleDateString(
                              "id-ID"
                            )}
                          </strong>
                        </small>
                      ) : item.status_periode === "Expired" ? (
                        (() => {
                          const titipTs = new Date(
                            item.tanggal_titip
                          ).getTime();
                          const akhirTs = titipTs + 30 * 24 * 3600 * 1000;
                          const akhirDate = new Date(akhirTs);

                          return (
                            <small className="d-block mb-1">
                              <strong>
                                Akhir Penitipan:{" "}
                                {akhirDate.toLocaleDateString("id-ID")}
                              </strong>
                            </small>
                          );
                        })()
                      ) : (
                        <small className="d-block mb-1">
                          Dititipkan:{" "}
                          {item.tanggal_titip
                            ? new Date(item.tanggal_titip).toLocaleDateString(
                                "id-ID"
                              )
                            : "–"}
                        </small>
                      )}

                      {item.status_periode === "Expired" &&
                        item.status === "Akan Ambil" && (
                          <small className="d-block">
                            Batas waktu pengambilan:{" "}
                            {(() => {
                              // deadline = tanggal_titip + 2 hari
                              const titipTs = new Date(
                                item.tanggal_titip
                              ).getTime();
                              const pickupDeadline =
                                titipTs + 2 * 24 * 3600 * 1000;
                              const diff = pickupDeadline - now;

                              if (diff <= 0) {
                                // sudah lewat → ubah status ke Untuk Donasi
                                api
                                  .patch(
                                    `/transaksi/historyPenitip/${item.id_barang}`,
                                    { status: "Untuk Donasi" }
                                  )
                                  .then(fetchHistory)
                                  .catch(console.error);
                                return "Waktu pengambilan habis";
                              }

                              // hitung jam, menit, detik tersisa
                              const sec = Math.floor(diff / 1000);
                              const h = Math.floor(sec / 3600);
                              const m = Math.floor((sec % 3600) / 60);
                              const s = sec % 60;

                              // tampilkan countdown
                              return h < 24 ? (
                                <>
                                  <strong>{h}</strong>j <strong>{m}</strong>m{" "}
                                  <strong>{s}</strong>s
                                </>
                              ) : (
                                <>
                                  <strong>{Math.ceil(h / 24)}</strong> hari
                                </>
                              );
                            })()}
                          </small>
                        )}

                      {item.status_periode === "Expired" &&
                        (item.status === "Available" ||
                          item.status === "Bisa Perpanjang") && (
                          <small className="d-block">
                            Batas sebelum barang didonasikan:{" "}
                            {(() => {
                              const donateDeadline =
                                new Date(item.tanggal_titip).getTime() +
                                (30 + 7) * 24 * 3600 * 1000;
                              const diff = donateDeadline - now;
                              if (diff <= 0) return "Sudah didonasikan";

                              const sec = Math.floor(diff / 1000);
                              const h = Math.floor(sec / 3600);
                              const days = Math.ceil(h / 24);

                              return h < 24 ? (
                                `${h}j ${Math.floor((sec % 3600) / 60)}m ${
                                  sec % 60
                                }s`
                              ) : (
                                <>
                                  <strong>{days}</strong> hari
                                </>
                              );
                            })()}
                          </small>
                        )}

                      {item.status === "Available" &&
                        item.status_periode !== "Expired" && (
                          <small className="d-block">
                            Masa penitipan: <strong>{val}</strong> {unit}{" "}
                            {rest.join(" ")}
                          </small>
                        )}
                    </div>

                    <div className="d-flex">
                      <Button
                        size="sm"
                        variant="outline-success"
                        onClick={() => openDetail(item)}
                      >
                        Lihat Detail
                      </Button>
                      {item.status === "Bisa Perpanjang" && (
                        <>
                          <Button
                            size="sm"
                            variant="warning"
                            className="ms-2"
                            onClick={() => openAmbilConfirm(item)}
                          >
                            Ambil
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            className="ms-2"
                            onClick={() => openConfirm(item)}
                          >
                            Perpanjang
                          </Button>
                        </>
                      )}
                      {item.status === "Available" &&
                        item.status_periode === "Expired" && (
                          <>
                            <Button
                              size="sm"
                              variant="warning"
                              className="ms-2"
                              onClick={() => openAmbilConfirm(item)}
                            >
                              Ambil
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              className="ms-2"
                              onClick={() => openDonasiConfirm(item)}
                            >
                              Donasikan
                            </Button>
                          </>
                        )}
                    </div>
                  </Card.Footer>
                </Card>
              </Col>
            );
          })}
        </Row>

        {/* CONFIRM PERPANJANG MODAL */}
        <Modal show={showConfirm} onHide={closeConfirm} centered>
          <Modal.Header closeButton>
            <Modal.Title>Konfirmasi Perpanjangan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            Apakah Anda yakin ingin memperpanjang periode?
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeConfirm}>
              Batal
            </Button>
            <Button variant="primary" onClick={handlePerpanjang}>
              Ya, Perpanjang
            </Button>
          </Modal.Footer>
        </Modal>

        <Modal show={showAmbilConfirm} onHide={closeAmbilConfirm} centered>
          <Modal.Header closeButton>
            <Modal.Title>Konfirmasi Ambil</Modal.Title>
          </Modal.Header>
          <Modal.Body>Apakah Anda yakin ingin mengambil barang?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeAmbilConfirm}>
              Batal
            </Button>
            <Button variant="primary" onClick={handleAmbil}>
              Ya, Ambil
            </Button>
          </Modal.Footer>
        </Modal>

        {/* CONFIRM DONASI MODAL */}
        <Modal show={showDonasiConfirm} onHide={closeDonasiConfirm} centered>
          <Modal.Header closeButton>
            <Modal.Title>Konfirmasi Donasi</Modal.Title>
          </Modal.Header>
          <Modal.Body>Apakah Anda yakin ingin mendonasikan barang?</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={closeDonasiConfirm}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDonasi}>
              Ya, Donasikan
            </Button>
          </Modal.Footer>
        </Modal>

        {/* DATE RANGE MODAL */}
        <Modal
          show={showDateModal}
          onHide={() => setShowDateModal(false)}
          centered
        >
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Dari</Form.Label>
              <Form.Control
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Sampai</Form.Label>
              <Form.Control
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="primary" onClick={handleResetDates}>
              Reset
            </Button>
            <Button variant="secondary" onClick={() => setShowDateModal(false)}>
              Batal
            </Button>
            <Button variant="success" onClick={() => setShowDateModal(false)}>
              Terapkan
            </Button>
          </Modal.Footer>
        </Modal>

        {/* DETAIL MODAL */}
        <Modal show={showDetail} onHide={closeDetail} size="lg" centered>
          <Modal.Header closeButton>
            <Modal.Title>Detail Penitipan</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedItem && (
              <>
                <div className="d-flex justify-content-between mb-4">
                  <h5>{selectedItem.nama_barang}</h5>
                  <div className="status-area text-success">
                    <Truck className="me-1" />
                    {selectedItem.status}
                  </div>
                </div>

                <Row className="mb-4">
                  <Col md={4}>
                    {selectedItem.foto?.length ? (
                      <Carousel variant="dark">
                        {selectedItem.foto.map((path, i) => (
                          <Carousel.Item key={i}>
                            <img
                              className="d-block w-100"
                              src={`http://127.0.0.1:8000/storage/${path}`}
                              alt={`Slide ${i + 1}`}
                              style={{ maxHeight: 300, objectFit: "contain" }}
                            />
                          </Carousel.Item>
                        ))}
                      </Carousel>
                    ) : (
                      <Image
                        src="/placeholder.jpg"
                        thumbnail
                        style={{ width: "100%" }}
                      />
                    )}
                  </Col>
                  <Col md={8}>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Kode Barang</strong>
                          </td>
                          <td>{selectedItem.kode_barang}</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Kategori</strong>
                          </td>
                          <td>
                            {selectedItem.kategori?.nama_kategori}
                            {selectedItem.kategori?.sub_kategori &&
                              ` - ${selectedItem.kategori.sub_kategori}`}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Deskripsi</strong>
                          </td>
                          <td>{selectedItem.deskripsi || "–"}</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Harga</strong>
                          </td>
                          <td>
                            Rp
                            {(selectedItem.harga || 0).toLocaleString("id-ID")}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Garansi</strong>
                          </td>
                          <td>{selectedItem.garansi || "Tidak ada"}</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Tanggal Penitipan</strong>
                          </td>
                          <td>
                            {selectedItem.tanggal_titip
                              ? new Date(
                                  selectedItem.tanggal_titip
                                ).toLocaleDateString("id-ID")
                              : "–"}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Akhir Penitipan</strong>
                          </td>
                          <td>
                            {selectedItem.akhir_penitipan
                              ? new Date(
                                  selectedItem.akhir_penitipan
                                ).toLocaleDateString("id-ID")
                              : "–"}
                          </td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Status Periode</strong>
                          </td>
                          <td>{selectedItem.status_periode || "–"}</td>
                        </tr>
                      </tbody>
                    </Table>
                  </Col>
                </Row>

                {selectedItem.transaksi && (
                  <>
                    <h5 className="mt-4">Detail Transaksi</h5>
                    <Table borderless responsive className="mb-4">
                      <thead>
                        <tr>
                          <th>Detail</th>
                          <th>Informasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td>Tanggal Transaksi</td>
                          <td>
                            {new Date(
                              selectedItem.transaksi.tanggal_transaksi
                            ).toLocaleDateString("id-ID")}
                          </td>
                        </tr>
                        <tr>
                          <td>Subtotal</td>
                          <td>
                            Rp
                            {(
                              selectedItem.transaksi.subtotal || 0
                            ).toLocaleString("id-ID")}
                          </td>
                        </tr>
                        <tr>
                          <td>Metode Pengiriman</td>
                          <td>{selectedItem.transaksi.metode_pengiriman}</td>
                        </tr>
                        <tr>
                          <td>Alamat Pengiriman</td>
                          <td>{selectedItem.transaksi.alamat || "–"}</td>
                        </tr>
                        <tr>
                          <td>Status Pembayaran</td>
                          <td>
                            {selectedItem.transaksi.status_pembayaran || "–"}
                          </td>
                        </tr>
                        {selectedItem.transaksi.pengiriman && (
                          <tr>
                            <td>Status Pengiriman</td>
                            <td>
                              {
                                selectedItem.transaksi.pengiriman
                                  .status_pengiriman
                              }
                            </td>
                          </tr>
                        )}
                        {selectedItem.transaksi.pengambilan && (
                          <tr>
                            <td>Status Pengambilan</td>
                            <td>
                              {
                                selectedItem.transaksi.pengambilan
                                  .status_pengambilan
                              }
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td>Komisi Perusahaan</td>
                          <td>
                            Rp
                            {(
                              selectedItem.transaksi.komisi_perusahaan || 0
                            ).toLocaleString("id-ID")}
                          </td>
                        </tr>
                        <tr>
                          <td>Komisi Hunter</td>
                          <td>
                            Rp
                            {(
                              selectedItem.transaksi.komisi_hunter || 0
                            ).toLocaleString("id-ID")}
                          </td>
                        </tr>
                        <tr>
                          <td>Saldo Diterima</td>
                          <td>
                            Rp
                            {(
                              selectedItem.transaksi.saldo_penitip || 0
                            ).toLocaleString("id-ID")}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </>
                )}

                {selectedItem.donasi && (
                  <>
                    <h5 className="mt-4">Detail Donasi</h5>
                    <Table borderless>
                      <tbody>
                        <tr>
                          <td>
                            <strong>Organisasi Penerima</strong>
                          </td>
                          <td>{selectedItem.donasi.organisasi}</td>
                        </tr>
                        <tr>
                          <td>
                            <strong>Tanggal Donasi</strong>
                          </td>
                          <td>
                            {new Date(
                              selectedItem.donasi.tanggal_donasi
                            ).toLocaleDateString("id-ID")}
                          </td>
                        </tr>
                      </tbody>
                    </Table>
                  </>
                )}
              </>
            )}
          </Modal.Body>
        </Modal>
      </Container>
    </>
  );
};

export default HistoryPenitip;
