import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import api from "../../../api/api.js";
import "./navbarAdmin.css";

export default function NavbarAdmin() {
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [userName, setUserName] = useState("User");
  const [jabatan, setJabatan] = useState("");
  const [notification, setNotification] = useState(null);
  const [isTopSellerButtonEnabled, setIsTopSellerButtonEnabled] = useState(false);
  const [hasAttemptedThisMonth, setHasAttemptedThisMonth] = useState(false);

  useEffect(() => {
    // load profile
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
  };

  const handleSetTopSeller = async () => {
    try {
      const res = await api.post("/set-top-seller");
      if (res.status !== 200) {
        throw new Error(res.data.error || "Gagal mengatur Top Seller");
      }
      // mark attempt
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
  };

  return (
    <>
      <div className="navbar-Admin py-3">
        <div className="container-fluid d-flex justify-content-between align-items-center">
          {/* Logo + divider */}
          <div className="logo-container d-flex align-items-center">
            <NavLink to="/adminPage" className="logo-link d-flex align-items-center">
              <img
                src="/logo_ReuseMart.png"
                alt="ReuseMart"
                className="logo-img"
              />
              <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
            </NavLink>
          </div>

          {/* Center nav + Top Seller */}
          <div className="nav-container d-flex align-items-center">
            <NavLink to="/admin" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              Pegawai
            </NavLink>
            <NavLink to="/organisasi" className={({ isActive }) => `nav-link${isActive ? " active" : ""}`}>
              Organisasi
            </NavLink>
            <Button
              variant="outline-success"
              className="top-seller-btn"
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
          </div>

          {/* User info + logout */}
          <div className="user-container d-flex align-items-center">
            <div className="user-info text-end">
              <div className="username">{userName}</div>
              {jabatan && <div className="jabatan">{jabatan}</div>}
            </div>
            <Button variant="outline-danger" className="ms-3" onClick={openLogoutModal}>
              Logout
            </Button>
          </div>
        </div>
      </div>

      {/* Logout confirmation */}
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

      {/* Notification toast */}
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
