import React, { useState } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import 'bootstrap-icons/font/bootstrap-icons.css';
import './authModal.css';

const AuthModal = ({ show, onHide, mode, onSwitch }) => {
  const isLogin = mode === "login";
  const [isOrg, setIsOrg] = useState(false);

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
                  <Form.Control type="text" placeholder="Bobby" />
                </div>
              </Col>
              <Col>
                <Form.Label className="fw-bold text-start d-block">Last Name</Form.Label>
                <div className="input-icon">
                  <i className="bi bi-person"></i>
                  <Form.Control type="text" placeholder="Suhartono" />
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
              <Form.Control type="email" placeholder="ReUseMart@gmail.com" />
            </div>
          </Form.Group>

          {!isLogin && (
            <Form.Group className="mb-3 text-start">
              <Form.Label className="fw-bold">Nomor Telepon</Form.Label>
              <div className="input-icon">
                <i className="bi bi-telephone"></i>
                <Form.Control type="text" placeholder="081234567890" />
              </div>
            </Form.Group>
          )}

          <Form.Group className="mb-3 text-start">
            <Form.Label className="fw-bold">Password</Form.Label>
            <div className="input-icon">
              <i className="bi bi-lock"></i>
              <Form.Control type="password" placeholder="********" />
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

          <Button variant="success" className="w-100">
            {isLogin ? "Masuk" : "Daftar"}
          </Button>
        </Form>
      </Modal.Body>
    </Modal >
  );
};

export default AuthModal;
