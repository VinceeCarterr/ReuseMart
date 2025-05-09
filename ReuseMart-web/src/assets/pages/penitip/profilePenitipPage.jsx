import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, Button, Card } from "react-bootstrap";
import NavbarPenitip from "../../components/Navbar/navbarPenitip";
import api from "../../../api/api.js";

const ProfilePenitipPage = () => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        no_telp: "",
        profile_picture: null,
        poin_loyalitas: 0,
        NIK: "",
        rating: 0,
        saldo: 0,
    });

    const [show, setShow] = useState(true);
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (!show) return;
        setProfile(null);

        api
            .get("user")
            .then(({ data }) => {
                setProfile(data);
                setFormData({
                    firstName: data.first_name,
                    lastName: data.last_name,
                    email: data.email,
                    password: "********",
                    no_telp: data.no_telp,
                    profile_picture: data.profile_picture,
                    poin_loyalitas: data.poin_loyalitas,
                    NIK: data.NIK,
                    rating: data.rating,
                    saldo: data.saldo,
                });
            })
            .catch(() => setProfile({}));
    }, [show]);

    const handleSubmit = (e) => {
        e.preventDefault();
        alert("Profil berhasil diperbarui!");
    };

    return (
        <>
            <NavbarPenitip />
            <Container fluid className="d-flex justify-content-center pt-5">
                <Row className="w-100">
                    <Col md={{ span: 8, offset: 2 }}>
                        <Row>
                            <Col md={4}>
                                <Card className="text-center p-3 shadow-sm">
                                    <h6 className="fw-bold">Gambar Profil</h6>
                                    <div className="mb-3">
                                        {profile?.profile_picture ? (
                                            <img
                                                src={profile.profile_picture}
                                                alt="Profile"
                                                className="img-fluid rounded-circle"
                                                style={{
                                                    width: "120px",
                                                    height: "120px",
                                                    objectFit: "cover",
                                                }}
                                            />
                                        ) : (
                                            <div
                                                className="bg-secondary rounded-circle mx-auto"
                                                style={{ width: "120px", height: "120px" }}
                                            />
                                        )}
                                    </div>
                                </Card>
                            </Col>

                            <Col md={8}>
                                <Card className="p-4 shadow-sm">
                                    <h5 className="fw-bold mb-3">Informasi Akun</h5>
                                    <Form onSubmit={handleSubmit}>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Nama Depan</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="firstName"
                                                        value={formData.firstName}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Nama Belakang</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="lastName"
                                                        value={formData.lastName}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Email</Form.Label>
                                                    <Form.Control
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Kata Sandi</Form.Label>
                                                    <Form.Control
                                                        type="password"
                                                        name="password"
                                                        value={formData.password}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>No. Telepon</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="no_telp"
                                                        value={formData.no_telp}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>NIK</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        name="NIK"
                                                        value={formData.NIK}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>

                                        <Row>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Saldo</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name="saldo"
                                                        value={formData.saldo}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Poin Loyalitas</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name="poin_loyalitas"
                                                        value={formData.poin_loyalitas}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={4}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Rating</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        name="rating"
                                                        value={formData.rating}
                                                        disabled
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                    </Form>
                                </Card>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default ProfilePenitipPage;
