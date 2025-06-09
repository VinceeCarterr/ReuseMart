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

    const handleSetTopSeller = async () => {
        try {
            const response = await api.post('/set-top-seller');

            if (response.status !== 200) {
                throw new Error(response.data.error || "Failed to set top seller");
            }

            setNotification({
                type: "success",
                message: response.data.message || "Top seller updated successfully",
            });
        } catch (error) {
            setNotification({
                type: "error",
                message: error.message || "Failed to set top seller",
            });
        }

        // Clear notification after 3 seconds
        setTimeout(() => setNotification(null), 3000);
    };

    return (
        <>
            <div className="py-3 navbar-Admin">
                <div className="container-fluid">
                    <div className="row align-items-center">
                        <div className="col-auto mx-3 logo-container">
                            <NavLink to="/adminPage" className="d-flex align-items-center text-decoration-none logo-link">
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
                                to="/admin"
                                className={({ isActive }) =>
                                    `text-decoration-none fs-5 me-3 nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                Pegawai
                            </NavLink>
                            <NavLink
                                to="/organisasi"
                                className={({ isActive }) =>
                                    `text-decoration-none fs-5 me-3 nav-link ${isActive ? 'active' : ''}`
                                }
                            >
                                Organisasi
                            </NavLink>
                            <Button
                                variant="outline-success"
                                className="text-decoration-none fs-5 me-3"
                                onClick={handleSetTopSeller}
                            >
                                Top Seller
                            </Button>
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