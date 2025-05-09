import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from "../../../api/api.js";

const UbahOrganisasiModal = ({ show, onHide, organisasiData, onUpdateSuccess }) => {
    const [first_name, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    useEffect(() => {
        if (organisasiData) {
            setFirstName(organisasiData.first_name || "");
            setEmail(organisasiData.email || "");
            setPassword("");
            setConfirmPassword("");
        }
    }, [organisasiData]);

    const handleUpdate = async () => {
        if (password && password !== confirmPassword) {
            alert("Password dan konfirmasi password tidak sama.");
            return;
        }

        const updatedData = {
            first_name,
            email,
        };

        if (password) {
            updatedData.password = password;
        }

        try {
            await api.put(`/organisasi/${organisasiData.id_user}`, updatedData);
            alert("Data organisasi berhasil diperbarui!");
            onUpdateSuccess();
            onHide();
        } catch (err) {
            console.error("Gagal mengubah organisasi:", err);
            alert("Terjadi kesalahan saat mengubah organisasi.");
        }
    };



    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title className="w-100 text-center">Ubah Organisasi</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Nama Organisasi</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Masukkan Nama Organisasi"
                                    value={first_name}
                                    onChange={(e) => setFirstName(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control
                                    type="email"
                                    placeholder="Masukkan Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Password (Opsional)</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Masukkan Password Baru"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Konfirmasi Password</Form.Label>
                                <Form.Control
                                    type="password"
                                    placeholder="Masukkan Konfirmasi Password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </Form.Group>
                        </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-4">
                        <Button variant="secondary" onClick={onHide}>Batal</Button>
                        <Button variant="success" className="ms-2" onClick={handleUpdate}>Simpan</Button>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default UbahOrganisasiModal;
