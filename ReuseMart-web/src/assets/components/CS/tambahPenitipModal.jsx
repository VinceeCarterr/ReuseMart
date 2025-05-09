import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Spinner, InputGroup } from "react-bootstrap";
import 'bootstrap-icons/font/bootstrap-icons.css';
import api from "../../../api/api.js";
import "./TambahPenitipModal.css";

export default function TambahPenitipModal({ show, onHide, fetchPenitip }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName]   = useState("");
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [noTelp, setNoTelp]       = useState("");
  const [nik, setNik]             = useState("");
  const [fotoKTP, setFotoKTP]     = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");

  // per-field errors
  const [firstNameError, setFirstNameError] = useState("");
  const [emailError, setEmailError]         = useState("");
  const [phoneError, setPhoneError]         = useState("");
  const [passwordError, setPasswordError]   = useState("");
  const [nikError, setNikError]             = useState("");
  const [ktpError, setKtpError]             = useState("");

  // reset when modal opens
  useEffect(() => {
    if (show) {
      setFirstName("");
      setLastName("");
      setEmail("");
      setPassword("");
      setShowPassword(false);
      setNoTelp("");
      setNik("");
      setFotoKTP(null);
      setError("");
      setFirstNameError("");
      setEmailError("");
      setPhoneError("");
      setPasswordError("");
      setNikError("");
      setKtpError("");
    }
  }, [show]);

  const handleSubmit = async () => {
    // clear old errors
    setError("");
    setFirstNameError("");
    setEmailError("");
    setPhoneError("");
    setPasswordError("");
    setNikError("");
    setKtpError("");

    // client validation
    let valid = true;
    if (!firstName.trim()) {
      setFirstNameError("First name tidak boleh kosong");
      valid = false;
    }
    if (!email.includes("@")) {
      setEmailError("Format email tidak valid");
      valid = false;
    }
    if (!/^\d{11,13}$/.test(noTelp)) {
      setPhoneError("Nomor telepon harus terdiri dari 11–13 angka");
      valid = false;
    }
    if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*\W)/.test(password)) {
      setPasswordError("Password harus terdiri dari huruf, angka, dan simbol");
      valid = false;
    }
    if (!nik.trim()) {
      setNikError("NIK tidak boleh kosong");
      valid = false;
    }
    if (!fotoKTP) {
      setKtpError("Foto KTP wajib diunggah");
      valid = false;
    }
    if (!valid) return;

    setLoading(true);

    try {
      const { data: { unique } } = await api.post("/user/check-nik", { NIK: nik });
      if (!unique) {
        setNikError("NIK sudah terdaftar");
        setLoading(false);
        return;
      }

      //register
      const formData = new FormData();
      formData.append("first_name", firstName);
      formData.append("last_name",  lastName);
      formData.append("email",      email);
      formData.append("password",   password);
      formData.append("no_telp",    noTelp);
      formData.append("NIK",        nik);
      formData.append("id_role",    2);
      formData.append("profile_picture", fotoKTP);

      await api.post("register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      fetchPenitip?.();
      onHide();
    } catch (err) {
      // backend validation errors
      const respErrs = err.response?.data?.errors || {};
      if (respErrs.NIK) {
        setNikError(respErrs.NIK[0]);
      } else {
        setError(
          err.response?.data?.error ||
            Object.values(respErrs).flat()[0] ||
            "Gagal menambah penitip."
        );
      }
    } finally {
      setLoading(false);
    }
  };


  const disableSave = loading;

  return (
    <Modal
      show={show}
      onHide={() => !loading && onHide()}
      centered
      backdrop="static"
      className="penitip-modal"
    >
      <Modal.Header closeButton>
        <Modal.Title>Tambah Penitip</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <div className="alert alert-danger text-start">
            {error}
          </div>
        )}

        <Form>
          {/* First / Last */}
          <Row className="mt-3">
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">First Name</Form.Label>
                <Form.Control
                  type="text"
                  value={firstName}
                  onChange={e => { setFirstName(e.target.value); setFirstNameError(""); }}
                  isInvalid={!!firstNameError}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {firstNameError}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">Last Name</Form.Label>
                <Form.Control
                  type="text"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  disabled={loading}
                />
              </Form.Group>
            </Col>
          </Row>

          {/* Email / Phone */}
          <Row className="mt-3">
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">Email</Form.Label>
                <Form.Control
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailError(""); }}
                  isInvalid={!!emailError}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {emailError}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">No. Telepon</Form.Label>
                <Form.Control
                  type="text"
                  value={noTelp}
                  onChange={e => { setNoTelp(e.target.value); setPhoneError(""); }}
                  isInvalid={!!phoneError}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {phoneError}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Password / NIK */}
          <Row className="mt-3">
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">Password</Form.Label>
                <InputGroup hasValidation>
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setPasswordError(""); }}
                    isInvalid={!!passwordError}
                    disabled={loading}
                  />
                  <Button
                    variant="outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    <i className={showPassword ? "bi bi-eye-slash" : "bi bi-eye"}></i>
                  </Button>
                  <Form.Control.Feedback type="invalid">
                    {passwordError}
                  </Form.Control.Feedback>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">NIK</Form.Label>
                <Form.Control
                  type="text"
                  value={nik}
                  onChange={e => { setNik(e.target.value); setNikError(""); }}
                  isInvalid={!!nikError}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {nikError}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          {/* Foto KTP */}
          <Row className="mt-3">
            <Col>
              <Form.Group className="text-start">
                <Form.Label className="fw-bold">Foto KTP</Form.Label>
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={e => { setFotoKTP(e.target.files[0]); setKtpError(""); }}
                  isInvalid={!!ktpError}
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {ktpError}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button
          variant="secondary"
          onClick={onHide}
          disabled={loading}
        >
          Batal
        </Button>
        <Button
          variant="success"
          onClick={handleSubmit}
          disabled={disableSave}
        >
          {loading
            ? <Spinner animation="border" size="sm" />
            : "Simpan"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
