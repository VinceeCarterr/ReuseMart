import React, { useState, useEffect, useRef } from "react";
import { Form, Dropdown, Modal, Button, Navbar, Nav, Container } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { FiShoppingCart, FiClock, FiUser } from "react-icons/fi";
import api from "../../../api/api.js";
import ProfileModal from "../Pembeli/profileModal.jsx";
import "./navbarPembeli.css";

const NavbarPembeli = ({ searchQuery, onSearchChange, onCategorySelect }) => {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [groupedCats, setGroupedCats] = useState([]);
  const [activeCatIdx, setActiveCatIdx] = useState(0);
  const [showMega, setShowMega] = useState(false);

  let userName = "User";
  try {
    const prof = JSON.parse(localStorage.getItem("profile") || "{}");
    const fn = prof.first_name ?? prof.firstName ?? prof.name;
    const ln = prof.last_name ?? prof.lastName;
    userName = fn && ln ? `${fn} ${ln}` : fn || "User";
  } catch {}

  useEffect(() => {
    api
      .get("kategori")
      .then(({ data }) => {
        setGroupedCats(data);
      })
      .catch(console.error);
  }, []);

  const openLogoutModal = () => setShowLogoutModal(true);
  const closeLogoutModal = () => setShowLogoutModal(false);
  const handleConfirmLogout = () => {
    localStorage.clear();
    navigate("/");
    setExpanded(false);
  };

  const openProfileModal = () => setShowProfileModal(true);
  const closeProfileModal = () => setShowProfileModal(false);

  return (
    <>
      <Navbar expand="lg" className="py-3 navbar-pembeli" expanded={expanded}>
        <Container fluid>
          <Navbar.Brand as={Link} to="/pembeliLP" className="d-flex align-items-center text-decoration-none logo-link">
            <img src="/logo_ReuseMart.png" alt="ReuseMart" className="logo-img" />
            <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
          </Navbar.Brand>
          <Navbar.Toggle
            aria-controls="navbar-content"
            onClick={() => setExpanded(!expanded)}
          />
          <Navbar.Collapse id="navbar-content">
            <Nav className="ms-auto align-items-center w-100">
              <Form className="d-flex mx-auto my-2 my-lg-0" style={{ maxWidth: "600px", width: "100%" }}>
                <Form.Control
                  type="search"
                  placeholder="Mau cari apa hari ini?"
                  className="search-input"
                  value={searchQuery}
                  onChange={(e) => {
                    onSearchChange(e.target.value);
                    setExpanded(false);
                  }}
                />
              </Form>
              <div className="d-flex align-items-center gap-4 action-group pe-lg-5 flex-wrap">
                <div
                  className="mega-dropdown"
                  onMouseEnter={() => setShowMega(true)}
                  onMouseLeave={() => setShowMega(false)}
                >
                  <button className="category-toggle">Kategori</button>
                  {showMega && (
                    <div className="mega-menu">
                      <div className="mega-menu-sidebar">
                        {groupedCats.map((cat, idx) => (
                          <div
                            key={cat.nama_kategori}
                            className={`mega-menu-item ${idx === activeCatIdx ? "active" : ""}`}
                            onMouseEnter={() => setActiveCatIdx(idx)}
                            onClick={() => {
                              onCategorySelect({
                                type: "category",
                                id: cat.id,
                                name: cat.nama_kategori,
                              });
                              setShowMega(false);
                              setExpanded(false);
                            }}
                          >
                            {cat.nama_kategori}
                          </div>
                        ))}
                      </div>
                      <div className="mega-menu-content">
                        {groupedCats[activeCatIdx]?.sub_kategori.map((sub) => (
                          <button
                            key={sub.id}
                            className="mega-menu-link btn btn-link"
                            onClick={() => {
                              onCategorySelect({
                                type: "subCategory",
                                id: sub.id,
                                name: sub.name,
                              });
                              setShowMega(false);
                              setExpanded(false);
                            }}
                          >
                            {sub.nama}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <Nav.Link as={Link} to="/cart" className="text-dark fs-3 icon-link" onClick={() => setExpanded(false)}>
                  <FiShoppingCart />
                </Nav.Link>
                <Nav.Link as={Link} to="/historyPembeli" className="text-dark fs-3 icon-link" onClick={() => setExpanded(false)}>
                  <FiClock />
                </Nav.Link>
                <Dropdown>
                  <Dropdown.Toggle variant="light" className="profile-toggle">
                    <FiUser className="me-2 fs-3" />
                    <span className="fw-bold">{userName}</span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => {
                      openProfileModal();
                      setExpanded(false);
                    }}>
                      Profil
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/alamat" onClick={() => setExpanded(false)}>
                      Atur Alamat
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={() => {
                      openLogoutModal();
                      setExpanded(false);
                    }}>
                      Keluar
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </Nav>
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

      <ProfileModal show={showProfileModal} onHide={closeProfileModal} />
    </>
  );
};

export default NavbarPembeli;