import React from "react";
import { Form, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./navbar.css";

const NavbarLandingPage = ({ onLoginClick, onRegisterClick }) => {
  return (
    <div className="py-3 navbar-landingPage">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col text-center fw-bold text-success">
            <Link to="/">
              <img src="/logo_ReuseMart.png" alt="ReuseMart Logo" style={{ height: "60px" }} />
              <span className="ms-2 fs-4 fw-bold text-success logo-text">ReuseMart</span>
            </Link>
          </div>

          <div className="col-6">
            <Form className="d-flex">
              <Form.Control
                type="search"
                placeholder="Mau cari apa hari ini?"
                className="me-2"
              />
            </Form>
          </div>

          <div className="col text-center">
            <Button variant="outline-success" className="me-2" onClick={onLoginClick}>Masuk</Button>
            <Button variant="success" onClick={onRegisterClick}>Daftar</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavbarLandingPage;
