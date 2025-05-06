import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import 'bootstrap-icons/font/bootstrap-icons.css';
import './authModal.css';

const AuthModal = ({ show, onHide, mode, onSwitch }) => {
  const isLogin = mode === "login";
  const [isOrg, setIsOrg] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/login', {
        email,
        password
      });

      const { access_token, type, user, pegawai } = response.data;

      localStorage.setItem('token', access_token);
      localStorage.setItem('type', type);
      localStorage.setItem('profile', JSON.stringify(user || pegawai));

      if (type === 'pegawai' && pegawai?.jabatan === 'Admin') {
        navigate('/produk');
      } else {
        navigate('/');
      }

      setTimeout(() => {
        onHide();
      }, 100);
    } catch (err) {
      const message = err.response?.data?.error || 'Login failed';
      setError(message);
    }
  };

  const handleRegister = async () => {
    setError('');
    try {
      const response = await axios.post('http://127.0.0.1:8000/api/register', {
        first_name: firstName,
        last_name: lastName,
        email,
        password,
        no_telp: phone,
        id_role: isOrg ? 3 : 1,
      });

      console.log('Register success:', response.data);
      onSwitch("login");
    } catch (err) {
      const message = err.response?.data?.error || 'Register failed';
      setError(message);
    }
  };

  return (
    <Modal show={show} onHide={onHide} centered backdrop={true} className="auth-modal">
      <Modal.Body className="p-4 text-center">
        <h2 className="fw-bold text-success">
          {isLogin ? "Masuk" : <span className="underline-green">Daftar Sekarang</span>}
        </h2>

        {!isLogin && (
          <p className="text-muted mb-4">
            Sudah ada akun? klik disini{" "}
            <span className="text-primary" role="button" onClick={() => {
              onSwitch("login");
              setIsOrg(false);
            }}>
              Masuk
            </span>
          </p>
        )}

        <Form>
          {!isLogin && !isOrg && (
            <Row className="mb-3">
              <Col>
                <Form.Label className="fw-bold text-start d-block">First Name</Form.Label>
                <div className="input-icon">
                  <i className="bi bi-person"></i>
                  <Form.Control
                    type="text"
                    placeholder=""
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
              </Col>
              <Col>
                <Form.Label className="fw-bold text-start d-block">Last Name</Form.Label>
                <div className="input-icon">
                  <Form.Control
                    type="text"
                    placeholder=""
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </Col>
            </Row>
          )}

          {!isLogin && isOrg && (
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold">Organization Name</Form.Label>
              <div className="input-icon">
                <i className="bi bi-building"></i>
                <Form.Control type="text" placeholder="Bobby" />
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3 text-start">
            <Form.Label className="fw-bold">Email</Form.Label>
            <div className="input-icon">
              <i className="bi bi-envelope"></i>
              <Form.Control
                type="email"
                placeholder="ReUseMart@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </Form.Group>

          {!isLogin && (
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold">Nomor Telepon</Form.Label>
              <div className="input-icon">
                <i className="bi bi-telephone"></i>
                <Form.Control
                  type="text"
                  placeholder=""
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3 text-start">
            <Form.Label className="fw-bold">Password</Form.Label>
            <div className="input-icon">
              <i className="bi bi-lock"></i>
              <Form.Control
                type="password"
                placeholder="********"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </Form.Group>

          {!isLogin && (
            <Form.Group className="mb-3 text-start pt-2 pb-2">
              <Form.Check
                type="checkbox"
                label="Daftar sebagai organisasi"
                checked={isOrg}
                onChange={(e) => setIsOrg(e.target.checked)}
                className="custom-checkbox"
              />
            </Form.Group>
          )}

          {isLogin && (
            <p className="auth-switch-text">
              Belum ada akun? Klik di sini{" "}
              <span className="text-primary" role="button" onClick={() => onSwitch("register")}>
                Daftar
              </span>
            </p>
          )}

          {error && <p className="text-danger">{error}</p>}

          <Button
            variant="success"
            className="w-100"
            onClick={isLogin ? handleLogin : handleRegister}
          >
            {isLogin ? "Masuk" : "Daftar"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AuthModal;
