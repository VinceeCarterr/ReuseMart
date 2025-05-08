import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "./navbarCS.css";

export default function NavbarCS() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState("User");
  const [jabatan, setJabatan] = useState("");

  useEffect(() => {
    try {
      const prof = JSON.parse(localStorage.getItem("profile") || "{}");
      const fn = prof.first_name ?? prof.firstName ?? prof.name;
      const ln = prof.last_name ?? prof.lastName;
      setUserName(fn && ln ? `${fn} ${ln}` : fn || "User");
      setJabatan(prof.jabatan || "");
    } catch {
      setUserName("User");
      setJabatan("");
    }
  }, []);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <div className="py-3 navbar-CS">
        <div className="container-fluid">
          <div className="row align-items-center justify-content-center">
            <div className="col-auto mx-3 logo-container">
              <Link to="/" className="d-flex align-items-center text-decoration-none logo-link">
                <img src="/logo_ReuseMart.png" alt="ReuseMart" className="logo-img" />
                <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
              </Link>
            </div>

            <div className="col-auto text-center mx-3">
              <span className="fw-bold fs-4">{userName}</span>
              {jabatan && <span className="ms-2 fs-5 text-success">: {jabatan}</span>}
            </div>

            <div className="col-auto mx-1">
              <Button variant="outline-danger" onClick={openLogoutModal}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

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
    </>
  );
}
