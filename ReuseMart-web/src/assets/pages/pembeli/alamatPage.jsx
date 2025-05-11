import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Dropdown,
} from "react-bootstrap";
import { FiShoppingCart, FiClock, FiUser } from "react-icons/fi";
import { Pencil, Trash } from "lucide-react";

import AlamatModal from "../../components/Pembeli/alamatModal";
import UbahAlamatModal from "../../components/Pembeli/ubahAlamatModal";
import ProfileModal from "../../components/Pembeli/profileModal.jsx";

import api from "../../../api/api.js";
import "../../components/Navbar/navbarOrgansiasi.jsx";

const AlamatPage = () => {
  const navigate = useNavigate();

  // ————— USER PROFILE & ROLE —————
  let profile = {};
  try {
    profile = JSON.parse(localStorage.getItem("profile") || "{}");
  } catch {}
  const role = profile.role.trim().toLowerCase() || "";
  const first = profile.first_name ?? profile.firstName ?? profile.name;
  const last  = profile.last_name  ?? profile.lastName;
  const userName =
    first && last
      ? `${first} ${last}`
      : first
      ? first
      : role === "pembeli"
      ? "User"
      : "Organisasi";

  // ————— NAVBAR STATE —————
  const [groupedCats, setGroupedCats]     = useState([]);
  const [activeCatIdx, setActiveCatIdx]   = useState(0);
  const [showMega, setShowMega]           = useState(false);
  const [showLogoutModal, setShowLogoutModal]   = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    api
      .get("/kategori")
      .then(({ data }) => setGroupedCats(data))
      .catch(console.error);
  }, []);

  const openLogoutModal     = () => setShowLogoutModal(true);
  const closeLogoutModal    = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const openProfileModal  = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  // ————— ALAMAT PAGE STATE —————
  const [alamatList, setAlamatList]         = useState([]);
  const [showAddModal, setShowAddModal]     = useState(false);
  const [showEditModal, setShowEditModal]   = useState(false);
  const [alamatToEdit, setAlamatToEdit]     = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alamatToDelete, setAlamatToDelete]   = useState(null);

  useEffect(() => {
    api
      .get("/alamat")
      .then(({ data }) => setAlamatList(data))
      .catch(console.error);
  }, []);

  const filtered = alamatList.filter((a) =>
    (a.label + a.alamat)
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const handleSetDefault = (sel) =>
    setAlamatList((prev) =>
      prev.map((a) =>
        a.id_alamat === sel.id_alamat
          ? { ...a, isDefault: true }
          : { ...a, isDefault: false }
      )
    );

  const onDeleteClick = (a) => {
    setAlamatToDelete(a);
    setShowDeleteModal(true);
  };
  const handleDelete = async () => {
    if (!alamatToDelete) return;
    try {
      await api.delete(`/alamat/${alamatToDelete.id_alamat}`);
      setAlamatList((prev) =>
        prev.filter((x) => x.id_alamat !== alamatToDelete.id_alamat)
      );
    } catch (e) {
      console.error(e);
    } finally {
      setShowDeleteModal(false);
      setAlamatToDelete(null);
    }
  };

  const onEditClick = (a) => {
    setAlamatToEdit(a);
    setShowEditModal(true);
  };

  // ————— RENDER —————
  return (
    <>
      {/* ========== NAVBAR ========== */}
      <div className="py-3 navbar-pembeli">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-between">

            {/* Logo */}
            <div className="col-auto logo-container">
              <Link
                to={role === "pembeli" ? "/pembeliLP" : "/organisasiLP"}
                className="d-flex align-items-center text-decoration-none logo-link"
              >
                <img
                  src="/logo_ReuseMart.png"
                  alt="ReuseMart"
                  className="logo-img"
                />
                <span className="ms-2 fs-4 fw-bold logo-text">
                  ReuseMart
                </span>
              </Link>
            </div>

            {/* Search (moved into navbar) */}
            <div className="col-md-6 px-2">
              <Form.Control
                type="search"
                placeholder="Cari Alamat…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Mega‐menu + Profile */}
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

              {/* pembeli-only icons */}
              {role === "pembeli" && (
                <>
                  <Link to="/cart" className="text-dark fs-3 icon-link">
                    <FiShoppingCart />
                  </Link>
                  <Link to="/historyPembeli" className="text-dark fs-3 icon-link">
                    <FiClock />
                  </Link>
                </>
              )}

              <Dropdown>
                <Dropdown.Toggle variant="light" className="profile-toggle">
                  <FiUser className="me-2 fs-3" />
                  <span className="fw-bold">{userName}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  {role === "pembeli" || "penitip" ? (
                    <>
                      <Dropdown.Item onClick={openProfileModal}>
                        Profil
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/orders">
                        Pesanan Saya
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/alamat">
                        Atur Alamat
                      </Dropdown.Item>
                    </>
                  ) : (
                    <>
                      <Dropdown.Item as={Link} to="/alamat">
                        Atur Alamat
                      </Dropdown.Item>
                      <Dropdown.Item as={Link} to="/request-donasi">
                        Request Donasi
                      </Dropdown.Item>
                    </>
                  )}
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

      {/* Add / Edit Address Modals */}
      <AlamatModal show={showAddModal} onHide={() => setShowAddModal(false)} />
      <UbahAlamatModal
        show={showEditModal}
        onHide={() => setShowEditModal(false)}
        alamatData={alamatToEdit}
        onUpdateSuccess={async () => {
          const { data } = await api.get("/alamat");
          setAlamatList(data);
        }}
      />

      {/* ========== PAGE BODY ========== */}
      <Container className="mt-5">
        <Row className="align-items-center mb-4">
          <Col>
            <h2 className="fw-bold">Alamat</h2>
          </Col>
          <Col className="text-end">
            <Button variant="success" onClick={() => setShowAddModal(true)}>
              Tambah alamat
            </Button>
          </Col>
        </Row>
      </Container>

      <Container className="mt-3">
        <Row>
          {filtered.length === 0 ? (
            <Col className="text-center">
              <p>Belum terdapat alamat yang dicari</p>
            </Col>
          ) : (
            filtered
              .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
              .map((alamat) => (
                <Col md={12} className="mb-2" key={alamat.id_alamat}>
                  <Card
                    className={
                      alamat.isDefault
                        ? "border border-2 border-success"
                        : ""
                    }
                  >
                    <Card.Body className="p-2">
                      <Row className="align-items-center flex-wrap">
                        <Col
                          md={2}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.label}</strong>
                          {alamat.isDefault && (
                            <div className="badge bg-success ms-2">
                              Utama
                            </div>
                          )}
                        </Col>
                        <Col
                          md={1}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.kota}</strong>
                        </Col>
                        <Col
                          md={2}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.kecamatan}</strong>
                        </Col>
                        <Col
                          md={1}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.kode_pos}</strong>
                        </Col>
                        <Col
                          md={2}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.alamat}</strong>
                        </Col>
                        <Col
                          md={2}
                          className="border-end d-flex align-items-center justify-content-center"
                        >
                          <strong>{alamat.catatan}</strong>
                        </Col>
                        <Col
                          md={2}
                          className="d-flex align-items-center justify-content-center"
                        >
                          <div className="d-flex gap-2 justify-content-end">
                            {!alamat.isDefault && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleSetDefault(alamat)}
                              >
                                Utama
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => onEditClick(alamat)}
                            >
                              <Pencil />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => onDeleteClick(alamat)}
                            >
                              <Trash />
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                </Col>
              ))
          )}
        </Row>
      </Container>

      {/* Delete Confirmation */}
      <Modal
        show={showDeleteModal}
        onHide={() => setShowDeleteModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Hapus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Apakah anda yakin ingin menghapus alamat?</p>
          <div className="text-end">
            <Button variant="outline-danger" onClick={handleDelete}>
              Hapus
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AlamatPage;
