import { useState, useEffect } from "react";
import { Modal, Row, Col, Form, Button } from "react-bootstrap";
import api from "../../../api/api.js";

export default function ProfilePenitipModal({ show, onHide }) {
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

    useEffect(() => {
        if (!show) return;

        api
            .get("/user")
            .then(({ data }) => {
                setFormData({
                    firstName: data.first_name || "",
                    lastName: data.last_name || "",
                    email: data.email || "",
                    password: "********",
                    no_telp: data.no_telp || "",
                    profile_picture: data.profile_picture || null,
                    poin_loyalitas: data.poin_loyalitas || 0,
                    NIK: data.NIK || "",
                    rating: data.rating || 0,
                    saldo: data.saldo || 0,
                });
            })
            .catch((error) => {
                console.error("Failed to fetch user data:", error);
                setFormData({
                    firstName: "",
                    lastName: "",
                    email: "",
                    password: "********",
                    no_telp: "",
                    profile_picture: null,
                    poin_loyalitas: 0,
                    NIK: "",
                    rating: 0,
                    saldo: 0,
                });
            });
    }, [show]);

    return (
        <Modal show={show} onHide={onHide} size="lg" centered>
            <Modal.Body>
                <Form>
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
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Tutup
                </Button>
            </Modal.Footer>
        </Modal>
    );
}