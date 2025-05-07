import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Row, Col, Toast } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import api from "../../api/api.js";
import 'bootstrap-icons/font/bootstrap-icons.css';
import './authModal.css';

const AuthModal = ({ show, onHide, mode, onSwitch }) => {
  const isLogin = mode === "login";
  const [isOrg, setIsOrg] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [firstNameError, setFirstNameError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [toastMsg, setToastMsg] = useState("");
  const [toastVariant, setToastVariant] = useState("success");
  const [showToast, setShowToast] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!show) {
      setEmailError("");
      setError("");
      setFirstNameError("");
      setPhoneError("");
      setPasswordError("");
    }
  }, [show]);

  const validateEmail = () => {
    if (!email.includes('@')) {
      setEmailError("Format email tidak valid");
      return false;
    }
    setEmailError("");
    return true;
  };

  // Form validity flags (still here but not gating submit)
  const isEmailValid = email.includes("@");
  const loginFormValid =
    isLogin && email.trim() && password.trim() && isEmailValid;
  const registerFormValid =
    !isLogin &&
    firstName.trim() &&
    /^\d{11,15}$/.test(phone) &&
    /(?=.*[A-Za-z])(?=.*\d)(?=.*\W)/.test(password) &&
    isEmailValid;
  const isFormValid = isLogin ? loginFormValid : registerFormValid;

  const handleLogin = async () => {
    setError("");
    if (!validateEmail()) return;
    try {
      const { data } = await api.post("login", { email, password });
      const { access_token, type, user, pegawai } = data;

      localStorage.setItem("token", access_token);
      localStorage.setItem("type", type);
      localStorage.setItem("profile", JSON.stringify(user || pegawai));

      setToastVariant("success");
      setToastMsg("Login berhasil!");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      if (type === "pegawai") {
        if (pegawai?.jabatan?.toLowerCase() === "admin") {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else if (type === "user") {
        if (user?.role === "Pembeli") {
          navigate("/pembeliLP");
        } else {
          navigate("/");
        }
      }

      setTimeout(onHide, 100);
    } catch (err) {
      const message = err.response?.data?.error || "Data Invalid!";
      setToastVariant("danger");
      setToastMsg(message);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  const handleRegister = async () => {
    setError("");
    setEmailError("");
    setFirstNameError("");
    setPhoneError("");
    setPasswordError("");

    let valid = true;

    if (!firstName.trim()) {
      setFirstNameError("Tidak boleh kosong!");
      valid = false;
    }

    if (!/^\d{11,15}$/.test(phone)) {
      setPhoneError("Nomor telepon harus terdiri dari 11-15 angka");
      valid = false;
    }

    if (!/(?=.*[A-Za-z])(?=.*\d)(?=.*\W)/.test(password)) {
      setPasswordError("Password harus terdiri dari huruf, angka, dan simbol");
      valid = false;
    }

    if (!validateEmail()) valid = false;

    // show field errors first, then bail if invalid
    if (!valid) return;

    try {
      await api.post("/register", {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        no_telp: phone,
        id_role: isOrg ? 3 : 1,
      });
      setToastVariant("success");
      setToastMsg("Registrasi berhasil! Silakan login.");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      setTimeout(() => {
        onSwitch("login");
        setIsOrg(false);
        setEmail("");
        setPassword("");
        setFirstName("");
        setLastName("");
        setPhone("");
      }, 2000);
    } catch (err) {
      const errors = err.response?.data?.errors;
      console.error("Validation errors:", errors);
      setToastVariant("danger");
      setToastMsg(
        errors
          ? Object.values(errors).flat().join(" | ")
          : "Data Invalid!"
      );
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <>
      <div className="auth-toast-container">
        <Toast
          className={`auth-toast slide-down-toast ${toastVariant}`}
          show={showToast}
          onClose={() => setShowToast(false)}
          autohide
          delay={3000}
        >
          <Toast.Body className="fw-bold">{toastMsg}</Toast.Body>
        </Toast>
      </div>

      <Modal
        show={show}
        onHide={onHide}
        centered
        backdrop
        className="auth-modal"
        size="md"
        dialogClassName="modal-custom"
      >
        <Modal.Body className="p-4 text-center" style={{ position: "relative" }}>
          <h2 className="fw-bold text-success mb-3">
            {isLogin ? "Masuk" : "Daftar Sekarang"}
          </h2>

          {isLogin ? (
            <p className="text-muted mb-4">
              Belum punya akun?{" "}
              <span
                className="text-primary"
                role="button"
                onClick={() => {
                  setEmailError("");
                  onSwitch("register");
                }}
              >
                Daftar
              </span>
            </p>
          ) : (
            <p className="text-muted mb-4">
              Sudah punya akun?{" "}
              <span
                className="text-primary"
                role="button"
                onClick={() => {
                  setEmailError("");
                  setPasswordError("");
                  onSwitch("login");
                  setIsOrg(false);
                }}
              >
                Masuk
              </span>
            </p>
          )}

          <Form
            onSubmit={e => {
              e.preventDefault();
              // always run validation and display errors
              isLogin ? handleLogin() : handleRegister();
            }}
          >
            {!isLogin && (
              isOrg ? (
                <Form.Group className="mb-3 text-start">
                  <Form.Label className="fw-bold">Nama Organisasi</Form.Label>
                  <div className="input-icon">
                    <i className="bi bi-building-fill"></i>
                    <Form.Control
                      type="text"
                      placeholder="Nama Organisasi"
                      value={firstName}
                      isInvalid={!!firstNameError}
                      onChange={e => setFirstName(e.target.value)}
                    />
                  </div>
                  {firstNameError && (
                    <div className="invalid-text text-danger text-start">
                      {firstNameError}
                    </div>
                  )}
                </Form.Group>
              ) : (
                <Row className="mb-3">
                  <Col>
                    <Form.Label className="fw-bold">Nama Depan</Form.Label>
                    <div className="input-icon">
                      <i className="bi bi-person-fill"></i>
                      <Form.Control
                        type="text"
                        value={firstName}
                        isInvalid={!!firstNameError}
                        onChange={e => setFirstName(e.target.value)}
                      />
                    </div>
                    {firstNameError && (
                      <div className="invalid-text text-danger text-start">
                        {firstNameError}
                      </div>
                    )}
                  </Col>
                  <Col>
                    <Form.Label className="fw-bold">Nama Belakang</Form.Label>
                    <div className="input-icon">
                      <Form.Control
                        type="text"
                        value={lastName}
                        onChange={e => setLastName(e.target.value)}
                      />
                    </div>
                  </Col>
                </Row>
              )
            )}

            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold">Email</Form.Label>
              <div className="input-icon email-field">
                <i className="bi bi-envelope-fill"></i>
                <Form.Control
                  type="email"
                  placeholder="ReUseMart@example.com"
                  value={email}
                  isInvalid={!!emailError}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              {emailError && (
                <div className="invalid-text text-danger text-start">
                  {emailError}
                </div>
              )}
            </Form.Group>

            {!isLogin && (
              <Form.Group className="mb-3 text-start">
                <Form.Label className="fw-bold">Nomor Telepon</Form.Label>
                <div className="input-icon">
                  <i className="bi bi-telephone-fill"></i>
                  <Form.Control
                    value={phone}
                    isInvalid={!!phoneError}
                    onChange={e => setPhone(e.target.value)}
                  />
                </div>
                {phoneError && (
                  <div className="invalid-text text-danger text-start">
                    {phoneError}
                  </div>
                )}
              </Form.Group>
            )}

            <Form.Group className="mb-4 text-start">
              <Form.Label className="fw-bold">Password</Form.Label>
              <div className="password-field d-flex align-items-center mb-2">
                <i className="bi bi-lock-fill lock-icon me-2"></i>
                <div className="position-relative flex-grow-1">
                  <Form.Control
                    type={showPassword ? "text" : "password"}
                    placeholder="********"
                    autoComplete="current-password"
                    value={password}
                    isInvalid={!!passwordError}
                    onChange={e => setPassword(e.target.value)}
                    className="ps-2 pe-5"
                  />
                  <i
                    className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} password-toggler position-absolute top-50 end-0 translate-middle-y me-2`}
                    onClick={() => setShowPassword(!showPassword)}
                  />
                </div>
              </div>
              {passwordError && (
                <div className="invalid-text text-danger text-start">
                  {passwordError}
                </div>
              )}
              {isLogin && (
                <div className="text-end">
                  <span className="text-primary small">Lupa password?</span>
                </div>
              )}
            </Form.Group>

            {!isLogin && (
              <Form.Group className="mb-4 text-start">
                <Form.Check
                  type="checkbox"
                  label="Daftar sebagai organisasi"
                  checked={isOrg}
                  onChange={e => setIsOrg(e.target.checked)}
                />
              </Form.Group>
            )}

            {isLogin && error && (
              <p className="text-danger mb-3">{error}</p>
            )}

            <Button
              type="submit"
              variant="success"
              className="w-100"
            >
              {isLogin ? "Masuk" : "Daftar"}
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </>
  );
};

export default AuthModal;
