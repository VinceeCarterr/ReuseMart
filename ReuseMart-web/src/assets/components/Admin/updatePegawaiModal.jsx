import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom";
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';

const UpdatePegawaiModal = ({ show, onHide, pegawai, fetchPegawai }) => {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        noTelp: "",
        password: "",
        tglLahir: "",
        selectedJabatan: "Pilih Jabatan"
    });
    const [formErrors, setFormErrors] = useState({});
    const [toast, setToast] = useState({
        show: false,
        message: "",
        variant: "success"
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (pegawai) {
            const jabatanLabel = {
                2: 'Customer Service',
                3: 'Pegawai Gudang',
                4: 'Kurir',
                5: 'Hunter',
                6: 'Admin',
            }[pegawai.id_jabatan] || "Pilih Jabatan";

            setFormData({
                firstName: pegawai.first_name || "",
                lastName: pegawai.last_name || "",
                email: pegawai.email || "",
                noTelp: pegawai.no_telp || "",
                password: "",
                tglLahir: pegawai.tanggal_lahir || "",
                selectedJabatan: jabatanLabel
            });
            setFormErrors({});
        }
    }, [pegawai]);

    const validateForm = () => {
        const errors = {};
        const nameRegex = /^[A-Za-z\s]+$/;
        const phoneRegex = /^\d+$/;

        if (!formData.firstName.trim()) {
            errors.firstName = "Nama depan wajib diisi";
        } else if (!nameRegex.test(formData.firstName)) {
            errors.firstName = "Nama depan hanya boleh berisi huruf";
        }

        if (!formData.lastName.trim()) {
            errors.lastName = "Nama belakang wajib diisi";
        } else if (!nameRegex.test(formData.lastName)) {
            errors.lastName = "Nama belakang hanya boleh berisi huruf";
        }

        if (!formData.noTelp.trim()) {
            errors.noTelp = "Nomor telepon wajib diisi";
        } else if (!phoneRegex.test(formData.noTelp)) {
            errors.noTelp = "Nomor telepon hanya boleh berisi angka";
        } else if (formData.noTelp.length < 11 || formData.noTelp.length > 13) {
            errors.noTelp = "Nomor telepon harus memiliki panjang 11-13 digit";
        }

        if (formData.selectedJabatan === "Pilih Jabatan") {
            errors.selectedJabatan = "Jabatan wajib dipilih";
        }

        if (!formData.tglLahir) {
            errors.tglLahir = "Tanggal lahir wajib diisi";
        } else {
            const birthDate = new Date(formData.tglLahir);
            const today = new Date();
            if (birthDate > today) {
                errors.tglLahir = "Tanggal lahir tidak boleh di masa depan";
            }
        }

        if (formData.password && formData.password.length < 8) {
            errors.password = "Password harus minimal 8 karakter";
        }

        return errors;
    };

    const handleInputChange = (field) => (e) => {
        setFormData(prev => ({
            ...prev,
            [field]: e.target.value
        }));
        // Clear error for this field when user starts typing
        setFormErrors(prev => ({
            ...prev,
            [field]: undefined
        }));
    };

    const showToast = (message, variant) => {
        setToast({
            show: true,
            message,
            variant
        });
    };

    const handleUpdate = async () => {
        try {
            setIsSubmitting(true);
            const errors = validateForm();
            
            if (Object.keys(errors).length > 0) {
                setFormErrors(errors);
                showToast("Harap perbaiki kesalahan pada formulir", "danger");
                return;
            }

            const jabatanMap = {
                'Admin': 6,
                'Customer Service': 2,
                'Pegawai Gudang': 3,
                'Kurir': 4,
                'Hunter': 5
            };

            const id_jabatan = jabatanMap[formData.selectedJabatan];
            
            if (!id_jabatan) {
                setFormErrors({ selectedJabatan: 'Jabatan tidak valid' });
                showToast('Jabatan tidak valid', 'danger');
                return;
            }

            const payload = {
                id_jabatan,
                first_name: formData.firstName,
                last_name: formData.lastName,
                email: formData.email,
                no_telp: formData.noTelp,
                tanggal_lahir: formData.tglLahir,
                komisi: 0,
                ...(formData.password && { password: formData.password })
            };

            const response = await api.put(`/pegawai/${pegawai.id_pegawai}`, payload);
            
            onHide();
            showToast('Berhasil mengupdate pegawai', 'success');
            fetchPegawai();
        } catch (err) {
            console.error('Update error:', err);
            
            let errorMessage = 'Gagal mengupdate pegawai';
            
            if (err.response) {
                if (err.response.status === 422 && err.response.data?.errors) {
                    const validationErrors = err.response.data.errors;
                    setFormErrors(validationErrors);
                    errorMessage = Object.values(validationErrors).flat().join(', ');
                } else if (err.response.data?.error) {
                    errorMessage = err.response.data.error;
                }
            } else if (err.request) {
                errorMessage = 'Tidak dapat terhubung ke server';
            }

            showToast(errorMessage, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleResetPassword = async () => {
        try {
            setIsSubmitting(true);
            await api.put(`/pegawai/${pegawai.id_pegawai}/reset-password`);
            showToast('Password berhasil direset ke tanggal lahir', 'success');
        } catch (err) {
            console.error('Reset password error:', err);
            const errorMessage = err.response?.data?.error || 'Gagal reset password';
            showToast(errorMessage, 'danger');
        } finally {
            setIsSubmitting(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div>
            <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
                <Modal.Header closeButton>
                    <Modal.Title>Edit Pegawai</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form noValidate>
                        <Row>
                            <Col>
                                <Form.Group>
                                    <Form.Label><strong>Nama Depan</strong></Form.Label>
                                    <Form.Control
                                        value={formData.firstName}
                                        onChange={handleInputChange('firstName')}
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
                                    <Form.Label><strong>Nama Belakang</strong></Form.Label>
                                    <Form.Control
                                        value={formData.lastName}
                                        onChange={handleInputChange('lastName')}
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
                                    <Form.Label><strong>Jabatan</strong></Form.Label>
                                    <Form.Select
                                        value={formData.selectedJabatan}
                                        onChange={handleInputChange('selectedJabatan')}
                                        isInvalid={!!formErrors.selectedJabatan}
                                    >
                                        <option value="Pilih Jabatan">Pilih Jabatan</option>
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Nomor Telepon</strong></Form.Label>
                                    <Form.Control
                                        value={formData.noTelp}
                                        onChange={handleInputChange('noTelp')}
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
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label><strong>Tanggal Lahir</strong></Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.tglLahir}
                                        onChange={handleInputChange('tglLahir')}
                                        isInvalid={!!formErrors.tglLahir}
                                        max={new Date().toISOString().split('T')[0]}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.tglLahir}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row className="mt-4 mb-3">
                            <Col md={6}>
                                <Button 
                                    variant="outline-danger" 
                                    onClick={handleResetPassword}
                                    disabled={isSubmitting}
                                >
                                    Reset Password
                                </Button>
                            </Col>
                            <Col md={6}>
                                <Button 
                                    variant="success" 
                                    onClick={handleUpdate}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
            </Modal>
            <ToastContainer className="position-fixed top-50 start-50 translate-middle z-3" style={{ minWidth: "300px" }}>
                <Toast
                    show={toast.show}
                    onClose={() => setToast(prev => ({ ...prev, show: false }))}
                    delay={5000}
                    autohide
                    bg={toast.variant}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toast.variant === "success" ? "Sukses" : "Error"}</strong>
                    </Toast.Header>
                    <Toast.Body className={toast.variant === "success" ? "text-white" : ""}>
                        {toast.message}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default UpdatePegawaiModal;