import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';

const UpdatePegawaiModal = ({ show, onHide, pegawai, fetchPegawai }) => {
    const [selectedJabatan, setSelectedJabatan] = useState("Pilih Jabatan");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [noTelp, setNoTelp] = useState("");
    const [password, setPassword] = useState("");
    const [tglLahir, setTglLahir] = useState("");
    const [error, setError] = useState("");
    const [formErrors, setFormErrors] = useState({});

    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    useEffect(() => {
        if (pegawai) {
            setFirstName(pegawai.first_name || "");
            setLastName(pegawai.last_name || "");
            setPassword(pegawai.password || "")
            setEmail(pegawai.email || "");
            setNoTelp(pegawai.no_telp || "");
            setTglLahir(pegawai.tanggal_lahir || "");
            const jabatanLabel = {
                2: 'Customer Service',
                3: 'Pegawai Gudang',
                4: 'Kurir',
                5: 'Hunter',
                6: 'Admin',
            }[pegawai.id_jabatan] || "Pilih Jabatan";

            setSelectedJabatan(jabatanLabel);
        }
    }, [pegawai]);

    const validateForm = () => {
        const errors = {};
        const nameRegex = /^[A-Za-z\s]+$/;

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

        if (!selectedJabatan.trim()) {
            errors.selectedJabatan = "Jabatan wajib dipilih";
        }

        if (!tglLahir) {
            errors.tglLahir = "Tanggal lahir wajib diisi";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSelect = (eventKey) => {
        setSelectedJabatan(eventKey);
    };

    const handleUpdate = async () => {
        setError('');
        setFormErrors({});

        if (!validateForm()) {
            return;
        }

        let id_jabatan = null;

        if (selectedJabatan === 'Admin') {
            id_jabatan = 6;
        } else if (selectedJabatan === 'Customer Service') {
            id_jabatan = 2;
        } else if (selectedJabatan === 'Pegawai Gudang') {
            id_jabatan = 3;
        } else if (selectedJabatan === 'Kurir') {
            id_jabatan = 4;
        } else if (selectedJabatan === 'Hunter') {
            id_jabatan = 5;
        } else {
            setFormErrors({ selectedJabatan: 'Jabatan tidak valid' });
            showToast('Jabatan tidak valid', 'danger');
            return;
        }

        let komisi = 0;

        try {
            const response = await api.put(`/pegawai/${pegawai.id_pegawai}`, {
                id_jabatan,
                first_name: firstName,
                last_name: lastName,
                email,
                password: password || undefined, // Only send password if provided
                no_telp: noTelp,
                tanggal_lahir: tglLahir,
                komisi,
            });

            console.log('Update success:', response.data);
            onHide();
            showToast('Berhasil mengupdate pegawai', 'success');
            fetchPegawai();
        } catch (err) {
            console.error('Update error:', err.response?.data); // Log error for debugging
            if (err.response?.status === 422 && err.response?.data?.errors) {
                const validationErrors = err.response.data.errors;
                setFormErrors(validationErrors);

                // Display specific validation errors in toast
                const errorMessages = Object.values(validationErrors).flat();
                showToast(errorMessages.join(', '), 'danger');
            } else {
                const message = err.response?.data?.error || 'Gagal mengupdate pegawai';
                showToast(message, 'danger');
            }
        }
    };

    const handleResetPassword = async () => {
        setError('');
        try {
            const response = await api.put(`/pegawai/${pegawai.id_pegawai}/reset-password`);
            alert('Password berhasil direset ke tanggal lahir.');
        } catch (err) {
            const message = err.response?.data?.error || 'Gagal reset password';
            setError(message);
        }
    };

    const showToast = (message, variant) => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    }

    return (
        <div>
                <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Pegawai</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row >
                            <Col>
                                <Form.Group>
                                    <Form.Label>First Name</Form.Label>
                                    <Form.Control value={firstName} onChange={e => setFirstName(e.target.value)} type="text" placeholder="Masukkan nama depan" />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Last Name</Form.Label>
                                    <Form.Control value={lastName} onChange={e => setLastName(e.target.value)} type="text" placeholder="Masukkan nama belakang" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Masukkan Email" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Nomor Telepon</Form.Label>
                                    <Form.Control value={noTelp} onChange={e => setNoTelp(e.target.value)} type="text" placeholder="Masukkan Nomor Telepon" />
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group >
                                    <Form.Label>Tanggal Lahir </Form.Label>
                                    <Form.Control type='date' value={tglLahir} onChange={e => setTglLahir(e.target.value)} ></Form.Control>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label>Jabatan</Form.Label>
                                    <Form.Select
                                        value={selectedJabatan}
                                        onChange={(e) => setSelectedJabatan(e.target.value)}
                                    >
                                        <option value="">Pilih Jabatan</option>
                                        <option value="Admin">Admin</option>
                                        <option value="Customer Service">Customer Service</option>
                                        <option value="Pegawai Gudang">Pegawai Gudang</option>
                                        <option value="Kurir">Kurir</option>
                                        <option value="Hunter">Hunter</option>
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className='mt-4 mb-3'>
                            <Col md={6}>
                                <Button variant='outline-danger' onClick={handleResetPassword}>
                                    Reset Password
                                </Button>
                            </Col>
                            <Col md={6} >
                                <Button variant="success" onClick={handleUpdate}>
                                    Simpan Perubahan
                                </Button>
                            </Col>
                        </Row>
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

export default UpdatePegawaiModal;
