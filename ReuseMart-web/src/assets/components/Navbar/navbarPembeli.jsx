import React, { useState } from "react";
import { Form, Dropdown, Modal, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FaShoppingCart, FaClock, FaUserCircle } from "react-icons/fa";
import "./navbarPembeli.css";

const NavbarPembeli = () => {
  const userName = "John Doe";
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);

  const handleConfirmLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('type');
    localStorage.removeItem('profile');
    navigate('/');
  };

  return (
    <>
      <div className="py-3 navbar-pembeli">
        <div className="container-fluid">
          <div className="row align-items-center">
            {/* Logo */}
            <div className="col text-center fw-bold text-success">
              <Link to="/" className="text-decoration-none d-flex align-items-center justify-content-center">
                <img src="/logo_ReuseMart.png" alt="ReuseMart Logo" style={{ height: "60px" }} />
                <span className="ms-2 fs-4 fw-bold text-success logo-text">ReuseMart</span>
              </Link>
            </div>

            {/* Search Bar */}
            <div className="col-6">
              <Form className="d-flex">
                <Form.Control
                  type="search"
                  placeholder="Mau cari apa hari ini ?"
                  className="me-2"
                />
              </Form>
            </div>

            <div className="col d-flex align-items-center justify-content-end gap-3 pe-4">
              <Link to="/kategori" className="text-dark text-decoration-none fs-5">
                Kategori
              </Link>

              <Link to="/cart" className="text-dark fs-5 icon-link">
                <FaShoppingCart />
              </Link>

              <Link to="/historyPembeli" className="text-dark fs-5 icon-link">
                <FaClock />
              </Link>

              <Dropdown className="me-5">
                <Dropdown.Toggle variant="light" className="d-flex align-items-center border rounded px-2">
                  <FaUserCircle className="me-2" />
                  <span className="fw-bold">{userName}</span>
                </Dropdown.Toggle>

                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">Profil</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/orders">Pesanan Saya</Dropdown.Item>
                  <Dropdown.Item as={Link} to="/alamat">Atur Alamat</Dropdown.Item>
                  {/* Replace direct link with modal trigger */}
                  <Dropdown.Item onClick={openLogoutModal}>Keluar</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      <Modal show={showLogoutModal} onHide={closeLogoutModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>Konfirmasi Logout</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Apakah Anda yakin ingin keluar?
        </Modal.Body>
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
};

export default NavbarPembeli;
