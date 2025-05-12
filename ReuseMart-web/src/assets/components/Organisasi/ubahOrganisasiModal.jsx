import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import api from "../../../api/api.js";

const UbahOrganisasiModal = ({ show, onHide, organisasiData, onUpdateSuccess }) => {
    const [first_name, setFirstName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [errors, setErrors] = useState({ email: "", password: "" });
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    useEffect(() => {
        if (organisasiData) {
            setFirstName(organisasiData.first_name || "");
            setEmail(organisasiData.email || "");
            setPassword("");
            setConfirmPassword("");
            setErrors({ email: "", password: "" });
        }
    }, [organisasiData]);

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: "", password: "" };

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            newErrors.email = "Email harus dalam format yang valid.";
            isValid = false;
        }

        if (password) {
            const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{1,}$/;
            if (!passwordRegex.test(password)) {
                newErrors.password = "Password harus mengandung huruf, angka, dan simbol.";
                isValid = false;
            } else if (password !== confirmPassword) {
                newErrors.password = "Password dan konfirmasi password harus sama.";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const showToast = (message, variant) => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const handleUpdate = async () => {
        if (!validateForm()) {
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
            showToast("Data organisasi berhasil diperbarui!", "success");
            onUpdateSuccess();
            onHide();
        } catch (err) {
            console.error("Gagal mengubah organisasi:", err);
            showToast("Terjadi kesalahan saat mengubah organisasi.", "danger");
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} centered size="lg">
                <Modal.Body>
                    <Form>
                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Nama Organisasi</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={first_name}
                                        onChange={(e) => setFirstName(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        isInvalid={!!errors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Masukkan Password Baru"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        isInvalid={!!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Konfirmasi Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Masukkan Konfirmasi Password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        isInvalid={!!errors.password}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.password}
                                    </Form.Control.Feedback>
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

            <ToastContainer
                className="position-fixed top-50 start-50 translate-middle z-3"
                style={{ minWidth: "300px" }}>
                <Toast
                    show={toastShow}
                    onClose={() => setToastShow(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toastVariant === "success" ? "Sukses" : "Error"}</strong>
                    </Toast.Header>
                    <Toast.Body className={toastVariant === "success" ? "text-white" : ""}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default UbahOrganisasiModal;