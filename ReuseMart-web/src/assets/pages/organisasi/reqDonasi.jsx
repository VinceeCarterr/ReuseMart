import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Image,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FiUser } from "react-icons/fi";
import api from "../../../api/api.js";
import ProfileModal from "../../components/Pembeli/profileModal.jsx";
import "../../components/Navbar/navbarPembeli.css";

const ReqDonasi = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState("Organisasi");
  // ** NAVBAR STATE **
  const [groupedCats, setGroupedCats] = useState([]);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [showMega, setShowMega] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // ** SEARCH STATE **
  const [searchTerm, setSearchTerm] = useState("");

  // ** PAGE STATE **
  const [requests, setRequests] = useState([]);
  const [visibleRequests, setVisibleRequests] = useState([]);

  // ** ADD / EDIT STATE **
  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [toEdit, setToEdit] = useState(null);
  const [formAdd, setFormAdd] = useState({
    nama_barangreq: "",
    mainKategoriIdx: "",
    kategori_barangreq: "",
    deskripsi: "",
    contoh_foto: null,
  });

  const [formEdit, setFormEdit] = useState({
    nama_barangreq: "",
    mainKategoriIdx: "",
    kategori_barangreq: "",
    deskripsi: "",
    contoh_foto: null,
  });

  // ** DELETE STATE **
  const [showDelete, setShowDelete] = useState(false);
  const [toDelete, setToDelete] = useState(null);

  useEffect(() => {
    const raw = localStorage.getItem("profile");
    if (!raw) return;
    try {
      const prof = JSON.parse(raw);
      const first = prof.first_name ?? prof.firstName ?? prof.name;
      const last  = prof.last_name  ?? prof.lastName;
      if (first && last) setUserName(`${first} ${last}`);
      else if (first)    setUserName(first);
    } catch (e) {
      console.error("Failed to parse profile from localStorage", e);
    }
  }, []);

  // load categories & requests
  useEffect(() => {
    api.get("/kategori")
      .then(({ data }) => setGroupedCats(data))
      .catch(console.error);

    api.get("/reqDonasi")
      .then(({ data }) => {
        setRequests(data);
        setVisibleRequests(data);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const filtered = requests.filter((r) =>
      r.nama_barangreq.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setVisibleRequests(filtered);
  }, [searchTerm, requests]);

  // NAVBAR handlers
  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };
  const openProfileModal = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  // ADD handlers
  const handleAddChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "contoh_foto") {
      setFormAdd((f) => ({ ...f, contoh_foto: files[0] }));
    } else if (name === "mainKategoriIdx") {
      setFormAdd((f) => ({
        ...f,
        mainKategoriIdx: value,
        kategori_barangreq: "",
      }));
    } else {
      setFormAdd((f) => ({ ...f, [name]: value }));
    }
  };
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const payload = new FormData();
    payload.append("nama_barangreq", formAdd.nama_barangreq);
    payload.append("kategori_barangreq", formAdd.kategori_barangreq);
    if (formAdd.deskripsi) payload.append("deskripsi", formAdd.deskripsi);
    if (formAdd.contoh_foto) payload.append("contoh_foto", formAdd.contoh_foto);

    try {
      await api.post("/addReqDonasi", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setShowAdd(false);
      setFormAdd({
        nama_barangreq: "",
        mainKategoriIdx: "",
        kategori_barangreq: "",
        deskripsi: "",
        contoh_foto: null,
      });
      const { data } = await api.get("/reqDonasi");
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  // EDIT handlers
  const handleEditClick = (req) => {
    const idx = groupedCats.findIndex((g) =>
      g.sub_kategori.some((s) => s.nama === req.kategori_barangreq)
    );
    setToEdit(req);
    setFormEdit({
      nama_barangreq: req.nama_barangreq,
      mainKategoriIdx: idx >= 0 ? String(idx) : "",
      kategori_barangreq: req.kategori_barangreq,
      deskripsi: req.deskripsi || "",
      contoh_foto: null,
    });
    setShowEdit(true);
  };

  const handleEditChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "contoh_foto") {
      setFormEdit((f) => ({ ...f, contoh_foto: files[0] }));
    } else if (name === "mainKategoriIdx") {
      setFormEdit((f) => ({
        ...f,
        mainKategoriIdx: value,
        kategori_barangreq: "",
      }));
    } else {
      setFormEdit((f) => ({ ...f, [name]: value }));
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!toEdit) return;
    const payload = new FormData();
    payload.append("_method", "PUT");
    payload.append("nama_barangreq", formEdit.nama_barangreq);
    payload.append("kategori_barangreq", formEdit.kategori_barangreq);
    payload.append("deskripsi", formEdit.deskripsi);
    if (formEdit.contoh_foto)
      payload.append("contoh_foto", formEdit.contoh_foto);

    try {
      await api.post(`/updateReqDonasi/${toEdit.id_reqdonasi}`, payload);
      setShowEdit(false);
      const { data } = await api.get("/reqDonasi");
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  // DELETE handlers
  const handleDeleteClick = (req) => {
    setToDelete(req);
    setShowDelete(true);
  };
  const confirmDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/deleteReqDonasi/${toDelete.id_reqdonasi}`);
      setShowDelete(false);
      const { data } = await api.get("/reqDonasi");
      setRequests(data);
    } catch (err) {
      console.error(err);
    }
  };

  // *** RENDER ***
  return (
    <>
      {/* ========== NAVBAR ========== */}
      <div className="py-3 navbar-pembeli">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-between">
            {/* Logo */}
            <div className="col-auto logo-container">
              <Link
                to="/organisasiLP"
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

            {/* Live Search */}
            <div className="col-md-4 px-2">
              <Form.Control
                type="text"
                placeholder="Cari permintaan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Profile & Kategori */}
            <div className="col-auto d-flex align-items-center gap-4 action-group pe-5">
              {/* Mega-menu */}
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
                          to={`/kategori/${sub.id}`}
                          key={sub.id}
                          className="mega-menu-link"
                        >
                          {sub.nama}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <Dropdown>
                <Dropdown.Toggle variant="light" className="profile-toggle">
                  <FiUser className="me-2 fs-3" />
                  <span className="fw-bold">{userName}</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/alamat">
                    Atur Alamat
                  </Dropdown.Item>
                  <Dropdown.Item as={Link} to="/request-donasi">
                    Request Donasi
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

      {/* ========== PAGE CONTENT ========== */}
      <Container className="mt-5">
        <Row className="mb-4 align-items-center">
          <Col>
            <h2 className="fw-bold">Permintaan Donasi</h2>
          </Col>
          <Col className="text-end">
            <Button variant="success" onClick={() => setShowAdd(true)}>
              Tambah Donasi
            </Button>
          </Col>
        </Row>

        <Row>
          {visibleRequests.length === 0 ? (
            <Col>
              <p className="text-center text-muted">
                {searchTerm
                  ? `Tidak ada permintaan untuk “${searchTerm}”.`
                  : "Belum ada permintaan donasi."}
              </p>
            </Col>
          ) : (
            visibleRequests.map((req) => (
              <Col md={6} key={req.id_reqdonasi} className="mb-4">
                <Card className="req-card h-100">
                  <Card.Body>
                    <Row>
                      <Col xs={4}>
                        <Image
                          src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${req.contoh_foto}`}
                          thumbnail
                        />
                      </Col>
                      <Col xs={8}>
                        <div>
                          <strong>{req.nama_barangreq}</strong>
                        </div>
                        <div className="text-muted mb-2">
                          {req.kategori_barangreq}
                        </div>
                        {req.deskripsi && (
                          <div>
                            <strong>Deskripsi:</strong> {req.deskripsi}
                          </div>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                  <Card.Footer className="text-end">
                    <Button
                      variant="outline-success"
                      size="sm"
                      className="me-2"
                      onClick={() => handleEditClick(req)}
                    >
                      Ubah
                    </Button>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handleDeleteClick(req)}
                    >
                      Hapus
                    </Button>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          )}
        </Row>
      </Container>

      {/* ========== ADD MODAL ========== */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Permintaan Donasi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSubmit}>
            {/* Nama Barang */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nama Barang</Form.Label>
              <Form.Control
                name="nama_barangreq"
                value={formAdd.nama_barangreq}
                onChange={handleAddChange}
                required
              />
            </Form.Group>
            {/* Kategori Utama */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Kategori Utama</Form.Label>
              <Form.Select
                name="mainKategoriIdx"
                value={formAdd.mainKategoriIdx}
                onChange={handleAddChange}
                required
              >
                <option value="">Pilih Kategori</option>
                {groupedCats.map((g, i) => (
                  <option key={i} value={i}>
                    {g.nama_kategori}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {/* Sub Kategori */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Sub Kategori</Form.Label>
              <Form.Select
                name="kategori_barangreq"
                value={formAdd.kategori_barangreq}
                onChange={handleAddChange}
                required
                disabled={!formAdd.mainKategoriIdx}
              >
                <option value="">Pilih Sub Kategori</option>
                {formAdd.mainKategoriIdx !== "" &&
                  groupedCats[formAdd.mainKategoriIdx].sub_kategori.map(
                    (sub) => (
                      <option key={sub.id} value={sub.nama}>
                        {sub.nama}
                      </option>
                    )
                  )}
              </Form.Select>
            </Form.Group>
            {/* Deskripsi */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Deskripsi (opsional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deskripsi"
                value={formAdd.deskripsi}
                onChange={handleAddChange}
              />
            </Form.Group>
            {/* Foto */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Contoh Foto (opsional)
              </Form.Label>
              <Form.Control
                type="file"
                name="contoh_foto"
                accept="image/*"
                onChange={handleAddChange}
              />
            </Form.Group>

            <div className="text-end">
              <Button
                variant="secondary"
                onClick={() => setShowAdd(false)}
                className="me-2"
              >
                Batal
              </Button>
              <Button variant="success" type="submit">
                Simpan
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ========== EDIT MODAL ========== */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ubah Permintaan Donasi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            {/* Nama Barang */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nama Barang</Form.Label>
              <Form.Control
                name="nama_barangreq"
                value={formEdit.nama_barangreq}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            {/* Kategori Utama */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Kategori Utama</Form.Label>
              <Form.Select
                name="mainKategoriIdx"
                value={formEdit.mainKategoriIdx}
                onChange={handleEditChange}
                required
              >
                <option value="">Pilih Kategori</option>
                {groupedCats.map((g, i) => (
                  <option key={i} value={i}>
                    {g.nama_kategori}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
            {/* Sub Kategori */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Sub Kategori</Form.Label>
              <Form.Select
                name="kategori_barangreq"
                value={formEdit.kategori_barangreq}
                onChange={handleEditChange}
                required
                disabled={!formEdit.mainKategoriIdx}
              >
                <option value="">Pilih Sub Kategori</option>
                {formEdit.mainKategoriIdx !== "" &&
                  groupedCats[formEdit.mainKategoriIdx].sub_kategori.map(
                    (sub) => (
                      <option key={sub.id} value={sub.nama}>
                        {sub.nama}
                      </option>
                    )
                  )}
              </Form.Select>
            </Form.Group>
            {/* Deskripsi */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Deskripsi (opsional)
              </Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deskripsi"
                value={formEdit.deskripsi}
                onChange={handleEditChange}
              />
            </Form.Group>
            {/* Foto */}
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">
                Ganti Foto (opsional)
              </Form.Label>
              <Form.Control
                type="file"
                name="contoh_foto"
                accept="image/*"
                onChange={handleEditChange}
              />
            </Form.Group>

            <div className="text-end">
              <Button
                variant="secondary"
                onClick={() => setShowEdit(false)}
                className="me-2"
              >
                Batal
              </Button>
              <Button variant="success" type="submit">
                Simpan Perubahan
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* ========== DELETE CONFIRM ========== */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Permintaan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Yakin ingin menghapus permintaan "
            {toDelete?.nama_barangreq}"?
          </p>
          <div className="text-end">
            <Button
              variant="secondary"
              onClick={() => setShowDelete(false)}
              className="me-2"
            >
              Batal
            </Button>
            <Button variant="danger" onClick={confirmDelete}>
              Hapus
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ========== LOGOUT MODAL ========== */}
      <Modal
        show={showLogoutModal}
        onHide={closeLogoutModal}
        centered
      >
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

      {/* ========== PROFILE MODAL ========== */}
      <ProfileModal
        show={showProfileModal}
        onHide={closeProfileModal}
      />
    </>
  );
};

export default ReqDonasi;
