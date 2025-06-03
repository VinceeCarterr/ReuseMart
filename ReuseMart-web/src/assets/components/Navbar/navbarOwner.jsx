import React, { useState, useEffect } from "react";
import { Button, Modal } from "react-bootstrap";
import { NavLink, useNavigate } from "react-router-dom";
import "./navbarOwner.css";

export default function NavbarOwner() {
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
            <div className="py-3 navbar-Owner">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-auto mx-3 logo-container">
                            <NavLink to="/ownerLP" className="d-flex align-items-center text-decoration-none logo-link">
                                <img src="/logo_ReuseMart.png" alt="ReuseMart" className="logo-img" />
                                <span className="ms-2 fs-4 fw-bold logo-text">ReuseMart</span>
                            </NavLink>
                        </div>

                        <div className="col text-center">
                            <span className="fw-bold fs-4">{userName}</span>
                            {jabatan && <span className="ms-2 fs-5 text-success">: {jabatan}</span>}
                        </div>

                        <div className="col-auto mx-3 d-flex align-items-center">
                            <NavLink
                                to="/ownerLP"
                                className={({ isActive }) =>
                                    `text-decoration-none fs-5 me-4 nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                Daftar Request Donasi
                            </NavLink>

                            <NavLink
                                to="/HistoryDonasi"
                                className={({ isActive }) =>
                                    `text-decoration-none fs-5 me-4 nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                History Donasi
                            </NavLink>
                            <NavLink
                                to="/pelaporan"
                                className={({ isActive }) =>
                                    `text-decoration-none fs-5 me-4 nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                Pelaporan
                            </NavLink>
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