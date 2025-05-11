import React, { useEffect, useState } from "react";
import api from "../../../api/api.js";
import NavbarOrganisasi from "../../components/Navbar/navbarOrgansiasi.jsx";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Image,
} from "react-bootstrap";

const ReqDonasi = () => {
  const [requests, setRequests] = useState([]);
  const [groupedCats, setGroupedCats] = useState([]);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [toEdit, setToEdit] = useState(null);
  const [toDelete, setToDelete] = useState(null);

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

  useEffect(() => {
    fetchRequests();
    fetchCategories();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get("/reqDonasi");
      setRequests(data);
    } catch (err) {
      console.error("Error loading requests:", err);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await api.get("/kategori");
      setGroupedCats(data);
    } catch (err) {
      console.error("Error loading categories:", err);
    }
  };

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
    try {
      const payload = new FormData();
      payload.append("nama_barangreq", formAdd.nama_barangreq);
      payload.append("kategori_barangreq", formAdd.kategori_barangreq);
      if (formAdd.deskripsi) payload.append("deskripsi", formAdd.deskripsi);
      if (formAdd.contoh_foto) payload.append("contoh_foto", formAdd.contoh_foto);

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
      fetchRequests();
    } catch (err) {
      console.error("Failed to add request:", err);
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
    console.log("Updating req:", toEdit?.id_reqdonasi, formEdit);
    if (!toEdit) return;
    try {
      const payload = new FormData();
      payload.append("nama_barangreq", formEdit.nama_barangreq);
      payload.append("kategori_barangreq", formEdit.kategori_barangreq);
      payload.append("deskripsi", formEdit.deskripsi);
      if (formEdit.contoh_foto)
        payload.append("contoh_foto", formEdit.contoh_foto);

      await api.put(
        `/updateReqDonasi/${toEdit.id_reqdonasi}`,
        payload,
      );

      setShowEdit(false);
      setToEdit(null);
      fetchRequests();
    } catch (err) {
      console.error("Failed to update request:", err);
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
      setToDelete(null);
      fetchRequests();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  return (
    <>
      <NavbarOrganisasi />

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
          {requests.length === 0 && (
            <Col>
              <p className="text-center text-muted">
                Belum ada permintaan donasi.
              </p>
            </Col>
          )}

          {requests.map((req) => (
            <Col md={6} key={req.id_reqdonasi} className="mb-4">
              <Card className="req-card h-100">
                <Card.Body>
                  <Row>
                    <Col xs={4}>
                      <Image
                        src={`http://127.0.0.1:8000/storage/${req.contoh_foto}`}
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
          ))}
        </Row>
      </Container>

      {/* Add Modal */}
      <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Tambah Permintaan Donasi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleAddSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nama Barang</Form.Label>
              <Form.Control
                name="nama_barangreq"
                value={formAdd.nama_barangreq}
                onChange={handleAddChange}
                required
              />
            </Form.Group>
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
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Deskripsi (opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deskripsi"
                value={formAdd.deskripsi}
                onChange={handleAddChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Contoh Foto (opsional)</Form.Label>
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

      {/* Edit Modal */}
      <Modal show={showEdit} onHide={() => setShowEdit(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Ubah Permintaan Donasi</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Nama Barang</Form.Label>
              <Form.Control
                name="nama_barangreq"
                value={formEdit.nama_barangreq}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
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
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Deskripsi (opsional)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="deskripsi"
                value={formEdit.deskripsi}
                onChange={handleEditChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label className="fw-bold">Ganti Foto (opsional)</Form.Label>
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

      {/* Delete Confirm Modal */}
      <Modal show={showDelete} onHide={() => setShowDelete(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Permintaan</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Yakin ingin menghapus permintaan "{toDelete?.nama_barangreq}"?
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
    </>
  );
};

export default ReqDonasi;
