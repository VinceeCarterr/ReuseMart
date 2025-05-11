import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner } from "react-bootstrap";
import api from "../../../api/api.js";
import "./TambahPenitipModal.css";

export default function DetailPenitipModal({
  show,
  onHide,
  penitip,
  fetchPenitip,
}) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    no_telp: "",
    NIK: "",
    poin_loyalitas: "",
    saldo: "",
    rating: "",
    profile_picture: "",
  });
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (show && penitip) {
      setForm({
        first_name:       penitip.first_name || "",
        last_name:        penitip.last_name  || "",
        email:            penitip.email      || "",
        no_telp:          penitip.no_telp    || "",
        NIK:              penitip.NIK        || "",
        poin_loyalitas:   penitip.poin_loyalitas ?? "",
        saldo:            penitip.saldo       ?? "",
        rating:           penitip.rating      ?? "",
        profile_picture:  penitip.profile_picture || "",
      });
      setEditing(false);
      setError("");
      setEmailError("");
      setPhoneError("");
      setShowDeleteConfirm(false);
    }
  }, [show, penitip]);

  const handleChange = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const validate = () => {
    let valid = true;
    if (!form.email.trim() || !form.email.includes("@")) {
      setEmailError("Format email tidak valid");
      valid = false;
    } else {
      setEmailError("");
    }
    if (!/^\d{11,13}$/.test(form.no_telp)) {
      setPhoneError("Nomor telepon harus terdiri dari 11–13 angka");
      valid = false;
    } else {
      setPhoneError("");
    }
    return valid;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    setError("");
    try {
      const payload = {
        first_name: form.first_name,
        email:      form.email,
        no_telp:    form.no_telp,
        ...(form.last_name.trim() ? { last_name: form.last_name } : {}),
        ...(form.poin_loyalitas !== "" 
          ? { poin_loyalitas: form.poin_loyalitas } 
          : {}),
      };
      await api.put(`/penitip/${penitip.id_user}`, payload);
      fetchPenitip?.();
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error || "Gagal memperbarui data.");
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const doDelete = async () => {
    setShowDeleteConfirm(false);
    setLoading(true);
    try {
      await api.delete(`/penitip/${penitip.id_user}`);
      fetchPenitip?.();
      onHide();
    } catch {
      setError("Gagal menghapus penitip.");
    } finally {
      setLoading(false);
    }
  };

  const alwaysDisabled = new Set([
    "first_name",
    "last_name",
    "NIK",
    "saldo",
    "rating",
    "poin_loyalitas",
  ]);
  const isDisabled = (field) =>
    alwaysDisabled.has(field) || editing === false;

  const baseURL = api.defaults.baseURL.replace(/\/api\/?$/, "");

  return (
    <>
      <Modal
        show={show}
        onHide={() => !loading && onHide()}
        centered
        backdrop="static"
        className="penitip-modal"
      >
        <Modal.Body>
          {error && <div className="alert alert-danger">{error}</div>}

          {form.profile_picture && (
            <div className="text-center mb-3">
              <img
                src={`${baseURL}/storage/${form.profile_picture}`}
                alt="Foto KTP"
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: 8,
                }}
              />
            </div>
          )}

          <Form>
            {/* First / Last */}
            <Row className="mt-2">
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">First Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.first_name}
                    onChange={handleChange("first_name")}
                    disabled={isDisabled("first_name")}
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.last_name}
                    onChange={handleChange("last_name")}
                    disabled={isDisabled("last_name")}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Email / Phone */}
            <Row className="mt-3">
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">Email</Form.Label>
                  <Form.Control
                    type="email"
                    value={form.email}
                    onChange={handleChange("email")}
                    disabled={isDisabled("email")}
                    isInvalid={!!emailError}
                  />
                  {emailError && (
                    <div className="invalid-text text-danger text-start">
                      {emailError}
                    </div>
                  )}
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">No. Telepon</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.no_telp}
                    onChange={handleChange("no_telp")}
                    disabled={isDisabled("no_telp")}
                    isInvalid={!!phoneError}
                  />
                  {phoneError && (
                    <div className="invalid-text text-danger text-start">
                      {phoneError}
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>

            {/* NIK / Poin Loyalitas */}
            <Row className="mt-3">
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">NIK</Form.Label>
                  <Form.Control
                    type="text"
                    value={form.NIK}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">
                    Poin Loyalitas
                  </Form.Label>
                  <Form.Control
                    type="number"
                    value={form.poin_loyalitas}
                    onChange={handleChange("poin_loyalitas")}
                    disabled={isDisabled("poin_loyalitas")}
                  />
                </Form.Group>
              </Col>
            </Row>

            {/* Saldo / Rating */}
            <Row className="mt-3">
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">Saldo</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.saldo}
                    disabled
                  />
                </Form.Group>
              </Col>
              <Col>
                <Form.Group className="text-start">
                  <Form.Label className="form-label">Rating</Form.Label>
                  <Form.Control
                    type="number"
                    value={form.rating}
                    disabled
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>

        <Modal.Footer className="d-flex justify-content-between">
          <div>
            {editing ? (
              <>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditing(false)}
                  disabled={loading}
                >
                  Batal
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="ms-2"
                  onClick={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Simpan"
                  )}
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setEditing(true)}
                  disabled={loading}
                >
                  Edit
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="ms-2"
                  onClick={confirmDelete}
                  disabled={loading}
                >
                  {loading ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    "Hapus"
                  )}
                </Button>
              </>
            )}
          </div>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={onHide}
            disabled={loading}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Hapus</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Apakah Anda yakin ingin menghapus penitip{" "}
          <strong>
            {penitip?.first_name} {penitip?.last_name}
          </strong>
          ?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={doDelete}
            disabled={loading}
          >
            {loading ? (
              <Spinner animation="border" size="sm" />
            ) : (
              "Hapus"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
