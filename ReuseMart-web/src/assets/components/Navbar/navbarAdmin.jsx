import React, { useState, useEffect } from "react";
import { Button, Modal, Navbar, Nav, Container } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../../api/api.js";
import "./navbarAdmin.css";

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState("User");
  const [jabatan, setJabatan] = useState("");
  const [notification, setNotification] = useState(null);
  const [isTopSellerButtonEnabled, setIsTopSellerButtonEnabled] = useState(false);
  const [hasAttemptedThisMonth, setHasAttemptedThisMonth] = useState(false);

  useEffect(() => {
    // Load profile
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

    // Top Seller: only on June 11, 2025 and once per month
    const today = new Date();
    const isTargetDate =
      today.getFullYear() === 2025 &&
      today.getMonth() === 5 && // June is 5
      today.getDate() === 11;
    const lastAttempt = localStorage.getItem("topSellerLastAttempt");
    const currentMonthYear = `${today.getFullYear()}-${today.getMonth() + 1}`;
    const hasAttempted = lastAttempt === currentMonthYear;

    setIsTopSellerButtonEnabled(isTargetDate && !hasAttempted);
    setHasAttemptedThisMonth(hasAttempted);
  }, []);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
    setExpanded(false);
  };

  const handleSetTopSeller = async () => {
    try {
      const res = await api.post("/set-top-seller");
      if (res.status !== 200) {
        throw new Error(res.data.error || "Gagal mengatur Top Seller");
      }
      // Mark attempt
      const today = new Date();
      const key = `${today.getFullYear()}-${today.getMonth() + 1}`;
      localStorage.setItem("topSellerLastAttempt", key);
      setIsTopSellerButtonEnabled(false);
      setHasAttemptedThisMonth(true);

      setNotification({
        type: "success",
        message: res.data.message || "Top Seller berhasil diatur",
      });
    } catch (err) {
      setNotification({
        type: "error",
        message: err.message || "Gagal mengatur Top Seller",
      });
    }
    setTimeout(() => setNotification(null), 3000);
    setExpanded(false);
  };

  return (
    <>
      <Navbar expand="lg" className="navbar-Admin py-3" expanded={expanded}>
        <Container fluid>
          <Navbar.Brand as={NavLink} to="/adminPage" className="logo-link d-flex align-items-center">
            <img src="/logo_ReuseMart.png" alt="ReuseMart" className="logo-img" />
            <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="navbar-content"
            onClick={() => setExpanded(!expanded)}
          />
          <Navbar.Collapse id="navbar-content">
            <Nav className="nav-container mx-auto align-items-center">
              <NavLink
                to="/admin"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setExpanded(false)}
              >
                Pegawai
              </NavLink>
              <NavLink
                to="/organisasi"
                className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}
                onClick={() => setExpanded(false)}
              >
                Organisasi
              </NavLink>
              <Button
                variant="outline-success"
                className="top-seller-btn mt-2 mt-lg-0"
                onClick={handleSetTopSeller}
                disabled={!isTopSellerButtonEnabled}
                title={
                  hasAttemptedThisMonth
                    ? "Top Seller sudah diatur untuk bulan ini"
                    : "Hanya tersedia pada tanggal 11 Juni 2025"
                }
              >
                Top Seller
              </Button>
            </Nav>
            <div className="user-container d-flex align-items-center mt-2 mt-lg-0">
              <div className="user-info text-end">
                <div className="username">{userName}</div>
                {jabatan && <div className="jabatan">{jabatan}</div>}
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

      {notification && (
        <div
          className={`alert alert-${
            notification.type === "success" ? "success" : "danger"
          } position-fixed top-0 end-0 m-3`}
          style={{ zIndex: 1050 }}
        >
          {notification.message}
        </div>
      )}
    </>
  );
}