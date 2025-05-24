import { useEffect, useState } from 'react';
import { Container, Form, Button, ListGroup, Alert, Toast, ToastContainer } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/api.js';
import NavbarPembeliPage from '../../components/Navbar/navbarPembeli.jsx';

const UploadProofPage = () => {
    const { state } = useLocation();
    const { transaksi_id, pembayaran_id, subtotal, shippingCost, discountAmount, total } = state || {};
    const [file, setFile] = useState(null);
    const [timeLeft, setTimeLeft] = useState(60);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('danger');
    const navigate = useNavigate();

    useEffect(() => {
        if (!transaksi_id || !pembayaran_id) {
            setToastVariant('danger');
            setToastMessage('Data transaksi tidak valid. Kembali ke halaman sebelumnya.');
            setShowToast(true);
            setTimeout(() => navigate('/cart'), 2000);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    setToastVariant('danger');
                    setToastMessage('Waktu habis! Transaksi dibatalkan, barang tersedia kembali.');
                    setShowToast(true);
                    setTimeout(() => navigate('/cart'), 2000);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [transaksi_id, pembayaran_id, navigate]);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile && ['image/jpeg', 'image/png', 'image/jpg'].includes(selectedFile.type)) {
            setFile(selectedFile);
        } else {
            setToastVariant('danger');
            setToastMessage('Pilih file gambar (JPEG, PNG, atau JPG) dengan ukuran maksimal 2MB.');
            setShowToast(true);
            setFile(null);
        }
    };

    const handleUploadProof = async () => {
        if (!file) {
            setToastVariant('danger');
            setToastMessage('Pilih file bukti pembayaran terlebih dahulu.');
            setShowToast(true);
            return;
        }

        const formData = new FormData();
        formData.append('transaksi_id', transaksi_id);
        formData.append('pembayaran_id', pembayaran_id);
        formData.append('proof', file);

        try {
            const response = await api.post('/upload-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            setToastVariant('success');
            setToastMessage(response.data.message);
            setShowToast(true);

            setTimeout(() => navigate('/historyPembeli'), 2000);
        } catch (error) {
            setToastVariant('danger');
            setToastMessage(
                error.response?.data?.error || 'Gagal mengunggah bukti pembayaran. Coba lagi.'
            );
            setShowToast(true);
        }
    };

    return (
        <>
            <NavbarPembeliPage />
            <ToastContainer
                className="position-fixed top-50 start-50 translate-middle z-3"
                style={{ minWidth: '300px' }}
            >
                <Toast
                    onClose={() => setShowToast(false)}
                    show={showToast}
                    bg={toastVariant}
                    delay={2000}
                    autohide
                >
                    <Toast.Header closeButton>
                        <strong className="me-auto">
                            {toastVariant === 'success' ? 'Sukses' : 'Gagal'}
                        </strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            <Container className="my-5 p-4 shadow-sm rounded bg-white">
                <h3 className="mb-4">
                    <i className="bi bi-receipt me-2 text-success"></i>
                    Unggah Bukti Pembayaran
                </h3>
                <Alert variant="warning" className="text-center">
                    Sisa waktu untuk mengunggah bukti pembayaran: <strong>{timeLeft} detik</strong>
                </Alert>

                <h4 className="mb-3">Rincian Transaksi</h4>
                <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between py-3">
                        <span>Subtotal</span>
                        <span>Rp. {subtotal?.toLocaleString('id-ID')}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between py-3">
                        <span>Ongkos Kirim</span>
                        <span>Rp. {shippingCost?.toLocaleString('id-ID')}</span>
                    </ListGroup.Item>
                    {discountAmount > 0 && (
                        <ListGroup.Item className="d-flex justify-content-between py-3 text-success">
                            <span>Diskon Poin</span>
                            <span>- Rp. {discountAmount?.toLocaleString('id-ID')}</span>
                        </ListGroup.Item>
                    )}
                    <ListGroup.Item className="d-flex justify-content-between py-3 fw-bold">
                        <span>Total</span>
                        <span>Rp. {total?.toLocaleString('id-ID')}</span>
                    </ListGroup.Item>
                </ListGroup>

                <hr className="my-4" />

                <Form.Group controlId="formFile" className="mb-4">
                    <Form.Label>Pilih Bukti Pembayaran</Form.Label>
                    <Form.Control
                        type="file"
                        accept="image/jpeg,image/png,image/jpg"
                        onChange={handleFileChange}
                    />
                    <Form.Text className="text-muted">
                        File harus berupa gambar (JPEG, PNG, JPG) dengan ukuran maksimal 20MB.
                    </Form.Text>
                </Form.Group>

                <Button
                    variant="success"
                    size="lg"
                    className="w-100"
                    onClick={handleUploadProof}
                    disabled={!file || timeLeft <= 0}
                >
                    Unggah Bukti
                </Button>
            </Container>
        </>
    );
};

export default UploadProofPage;