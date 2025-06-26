import React, { useState, useEffect } from "react";
import { Button, Modal, Navbar, Nav, Container } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import "./navbarCS.css";

export default function NavbarCS() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
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
    setExpanded(false);
  };

  return (
    <>
      <Navbar expand="lg" className="navbar-CS py-3" expanded={expanded}>
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/CSLP" className="logo-link d-flex align-items-center">
            <img src="/logo_ReuseMart.png" alt="ReuseMart" className="logo-img" />
            <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="navbar-content"
            onClick={() => setExpanded(!expanded)}
          />
          <Navbar.Collapse id="navbar-content">
            <Nav className="nav-container mx-auto align-items-center">
              {[
                ["Penitip", "/CSLP"],
                ["Klaim Merchandise", "/klaimMerch"],
                ["Verifikasi Pembayaran", "/verif-pembayaran"],
              ].map(([label, to]) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                  onClick={() => setExpanded(false)}
                >
                  {label}
                </NavLink>
              ))}
            </Nav>
            <div className="user-container d-flex align-items-center mt-2 mt-lg-0">
              <div className="user-info text-end">
                <div className="username">{userName}</div>
                {jabatan && <small className="jabatan">{jabatan}</small>}
              </div>
              <Button
                variant="outline-danger"
                className="ms-3"
                onClick={() => {
                  openLogoutModal();
                  setExpanded(false);
                }}
              >
                Logout
              </Button>
            </div>
          </Navbar.Collapse>
        </Container>
      </Navbar>

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