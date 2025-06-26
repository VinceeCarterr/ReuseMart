import React, { useState } from "react";
import { Form, Button, Navbar, Nav, Container } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./navbar.css";

const NavbarLandingPage = ({ onLoginClick, onRegisterClick, searchQuery, onSearchChange }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Navbar expand="lg" className="py-3 navbar-landingPage" expanded={expanded}>
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="d-flex align-items-center">
          <img src="/logo_ReuseMart.png" alt="ReuseMart Logo" style={{ height: "60px" }} />
          <span className="ms-2 fs-4 fw-bold text-success logo-text">ReuseMart</span>
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
                className="me-2"
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setExpanded(false);
                }}
              />
            </Form>
            <div className="d-flex justify-content-center justify-content-lg-end">
              <Button 
                variant="outline-success" 
                className="me-2 my-1" 
                onClick={() => {
                  onLoginClick();
                  setExpanded(false);
                }}
              >
                Masuk
              </Button>
              <Button 
                variant="success" 
                className="my-1" 
                onClick={() => {
                  onRegisterClick();
                  setExpanded(false);
                }}
              >
                Daftar
              </Button>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default NavbarLandingPage;