import { useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col, Toast, ToastContainer, InputGroup } from 'react-bootstrap';
import { Eye, EyeSlash } from 'react-bootstrap-icons'; // Import eye icons

const PegawaiModal = ({ show, onHide, fetchPegawai }) => {
    const [selectedJabatan, setSelectedJabatan] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [password, setPassword] = useState("");
    const [tglLahir, setTglLahir] = useState("");
    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false); // New state for password visibility

    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    const validateForm = () => {
        const errors = {};
        const nameRegex = /^[A-Za-z\s]+$/;
        const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;

        if (!firstName.trim()) {
            errors.firstName = "Nama depan wajib diisi";
        } else if (!nameRegex.test(firstName)) {
            errors.firstName = "Nama depan hanya boleh berisi huruf";
        }

        if (!lastName.trim()) {
            errors.lastName = "Nama belakang wajib diisi";
        } else if (!nameRegex.test(lastName)) {
            errors.lastName = "Nama belakang hanya boleh berisi huruf";
        }

        if (!email.trim()) {
            errors.email = "Email wajib diisi";
        } else if (!email.includes('@')) {
            errors.email = "Email tidak valid (harus mengandung @)";
        }

        if (!noTelp.trim()) {
            errors.noTelp = "Nomor telepon wajib diisi";
        }

        if (!password.trim()) {
            errors.password = "Password wajib diisi";
        } else if (!passwordRegex.test(password)) {
            errors.password = "Password harus terdiri dari huruf, angka, dan simbol minimal 8 karakter";
        }

        if (!selectedJabatan.trim()) {
            errors.selectedJabatan = "Jabatan wajib dipilih";
        }

        if (!tglLahir) {
            errors.tglLahir = "Tanggal lahir wajib diisi";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleTambah = async () => {
        if (!validateForm()) return;

        let id_jabatan = null;

        switch (selectedJabatan) {
            case 'Admin': id_jabatan = 6; break;
            case 'Customer Service': id_jabatan = 2; break;
            case 'Pegawai Gudang': id_jabatan = 3; break;
            case 'Kurir': id_jabatan = 4; break;
            case 'Hunter': id_jabatan = 5; break;
            default:
                setFormErrors(prev => ({ ...prev, selectedJabatan: "Jabatan tidak valid" }));
                return;
        }

        let komisi = 0;

        try {
            const response = await api.post('/pegawai/register', {
                id_jabatan,
                first_name: firstName,
                last_name: lastName,
                email,
                password,
                no_telp: noTelp,
                tanggal_lahir: tglLahir,
                komisi,
            });

            // Reset form
            setFirstName('');
            setLastName('');
            setEmail('');
            setNoTelp('');
            setPassword('');
            setTglLahir('');
            setSelectedJabatan('');
            setFormErrors({});
            setShowPassword(false); // Reset password visibility

            showToast("Berhasil Menambah Pegawai", "success");
            onHide();
            fetchPegawai();

        } catch (err) {
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const validationErrors = err.response.data.errors;
                const formattedErrors = {};

                Object.keys(validationErrors).forEach(field => {
                    formattedErrors[field] = validationErrors[field][0];
                });

                setFormErrors(formattedErrors);

                if (formattedErrors.email) {
                    showToast(formattedErrors.email, "danger");
                }
            } else {
                const message = err.response?.data?.error || 'Gagal menambah pegawai';
                showToast(message, "danger");
            }
        };
    };

    const showToast = (message, variant) => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    // Toggle password visibility
    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    // Set max date to today
    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Tambah Pegawai</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate>
                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label><strong>First Name</strong></Form.Label>
                                    <Form.Control
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        type="text"
                                        placeholder="Masukkan nama depan"
                                        isInvalid={!!formErrors.firstName}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.firstName}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label><strong>Last Name</strong></Form.Label>
                                    <Form.Control
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        type="text"
                                        placeholder="Masukkan nama belakang"
                                        isInvalid={!!formErrors.lastName}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.lastName}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Email</strong></Form.Label>
                                    <Form.Control
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        type="email"
                                        placeholder="Masukkan Email"
                                        isInvalid={!!formErrors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Nomor Telepon</strong></Form.Label>
                                    <Form.Control
                                        value={noTelp}
                                        onChange={e => setNoTelp(e.target.value)}
                                        type="text"
                                        placeholder="Masukkan Nomor Telepon"
                                        isInvalid={!!formErrors.noTelp}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.noTelp}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label><strong>Password</strong></Form.Label>
                                    <InputGroup>
                                        <Form.Control
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Masukkan Password"
                                            isInvalid={!!formErrors.password}
                                        />
                                        <InputGroup.Text
                                            onClick={togglePasswordVisibility}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {showPassword ? <EyeSlash /> : <Eye />}
                                        </InputGroup.Text>
                                        <Form.Control.Feedback type="invalid">
                                            {formErrors.password}
                                        </Form.Control.Feedback>
                                    </InputGroup>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label><strong>Jabatan</strong></Form.Label>
                                    <Form.Select
                                        value={selectedJabatan}
                                        onChange={(e) => setSelectedJabatan(e.target.value)}
                                        isInvalid={!!formErrors.selectedJabatan}
                                    >
                                        <option value="">Pilih Jabatan</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Customer Service">Customer Service</option>
                                        <option value="Pegawai Gudang">Pegawai Gudang</option>
                                        <option value="Kurir">Kurir</option>
                                        <option value="Hunter">Hunter</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.selectedJabatan}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Col md={6}>
                            <Form.Group className="mt-3">
                                <Form.Label><strong>Tanggal Lahir</strong></Form.Label>
                                <Form.Control
                                    type='date'
                                    value={tglLahir}
                                    onChange={e => setTglLahir(e.target.value)}
                                    isInvalid={!!formErrors.tglLahir}
                                    max={today}
                                />
                                <Form.Control.Feedback type="invalid">
                                    {formErrors.tglLahir}
                                </Form.Control.Feedback>
                            </Form.Group>
                        </Col>

                        <br />
                        <Button className="mt-3" variant="success" onClick={handleTambah}>
                            Daftar
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>

            <ToastContainer className="position-fixed top-50 start-50 translate-middle z-3" style={{ minWidth: "300px" }}>
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
        </div>
    );
};

export default PegawaiModal;