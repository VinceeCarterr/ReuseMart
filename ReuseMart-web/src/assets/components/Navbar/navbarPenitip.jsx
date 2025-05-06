import React from "react";
import { Form, Dropdown } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaShoppingCart, FaClock, FaUserCircle } from "react-icons/fa";
import "./navbarPenitip.css";

const NavbarPenitip = () => {
    const userName = "John Doe";

    return (
        <div className="py-3 navbar-penitip">
            <div className="container-fluid">
                <div className="row align-items-center">
                    <div className="col text-center fw-bold text-success">
                        <Link to="/" className="text-decoration-none d-flex align-items-center justify-content-center">
                            <img src="/logo_ReuseMart.png" alt="ReuseMart Logo" style={{ height: "60px" }} />
                            <span className="ms-2 fs-4 fw-bold text-success logo-text">ReuseMart</span>
                        </Link>
                    </div>

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

                        <Link to="/history" className="text-dark fs-5 icon-link">
                            <FaClock />
                        </Link>

                        <Dropdown className="me-5">
                            <Dropdown.Toggle variant="light" className="d-flex align-items-center border rounded px-2">
                                <FaUserCircle className="me-2" />
                                <span className="fw-bold">{userName}</span>
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                                <Dropdown.Item as={Link} to="/profilePenitip">Profil</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/orders">Pesanan Saya</Dropdown.Item>
                                <Dropdown.Item as={Link} to="/logout">Keluar</Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NavbarPenitip;
