import { useEffect, useState } from 'react';
import {
    Container,
    Alert,
    Spinner,
    ListGroup,
    Button,
    Form,
    Modal,
    Toast,
    ToastContainer,
} from 'react-bootstrap';
import { ShoppingCart, Trash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../api/api.js';
import NavbarPembeliPage from '../../components/Navbar/navbarPembeli.jsx';

const KeranjangPage = () => {
    const [cart, setCart] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCart = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get('/cart');
                console.log('Cart Response:', response.data);
                setCart(response.data.data);
                setSelectedItems([]);
            } catch (error) {
                console.error('Cart Error:', error.response);
                setError(error.response?.data.message || 'Gagal mengambil keranjang');
                setToastVariant('danger');
                setToastMessage(error.response?.data.message || 'Gagal mengambil keranjang');
                setShowToast(true);
            } finally {
                setLoading(false);
            }
        };
        fetchCart();
    }, []);

    const handleRemoveItem = async (id_keranjang) => {
        setLoading(true);
        setError(null);
        try {
            await api.delete('/cart/remove', { data: { id_keranjang } });
            const response = await api.get('/cart');
            setCart(response.data.data);
            setSelectedItems(selectedItems.filter((id) => id !== id_keranjang));
            setShowDeleteModal(false);
            setItemToDelete(null);
            setToastVariant('success');
            setToastMessage('Barang berhasil dihapus dari keranjang');
            setShowToast(true);
        } catch (error) {
            setError(error.response?.data.message || 'Gagal menghapus barang dari keranjang');
            setToastVariant('danger');
            setToastMessage(error.response?.data.message || 'Gagal menghapus barang dari keranjang');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleShowDeleteModal = (id_keranjang) => {
        setItemToDelete(id_keranjang);
        setShowDeleteModal(true);
    };

    const handleSelectItem = (id_keranjang) => {
        setSelectedItems((prev) =>
            prev.includes(id_keranjang)
                ? prev.filter((id) => id !== id_keranjang)
                : [...prev, id_keranjang]
        );
    };

    const handleProceedToCheckoutOptions = () => {
        if (selectedItems.length === 0) {
            setError('Pilih setidaknya satu barang untuk melanjutkan ke pembayaran');
            setToastVariant('danger');
            setToastMessage('Pilih setidaknya satu barang untuk melanjutkan ke pembayaran');
            setShowToast(true);
            return;
        }

        navigate('/checkout-options', { state: { selectedItems, cart } });
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

            <Container className="my-5">
                {loading && (
                    <div className="text-center">
                        <Spinner animation="border" />
                    </div>
                )}
                {error && (
                    <Alert variant="danger" className="text-center">
                        {error}
                    </Alert>
                )}
                {!loading && !error && (!cart || cart.length === 0) && (
                    <div
                        className="d-flex justify-content-center align-items-center flex-column"
                        style={{ height: '50vh' }}
                    >
                        <div className="bg-light p-4 rounded shadow-sm text-center" style={{ maxWidth: '500px', width: '100%' }}>
                            <ShoppingCart size={48} className="text-muted mb-3" style={{ opacity: 0.7 }} />
                            <h4 className="text-muted mb-3">Keranjang Anda Kosong</h4>
                            <p className="text-muted mb-4">Tambahkan barang ke keranjang untuk memulai belanja!</p>
                            <Button
                                variant="success"
                                size="lg"
                                className="w-100"
                                onClick={() => navigate('/pembeliLP')}
                            >
                                Mulai Berbelanja
                            </Button>
                        </div>
                    </div>
                )}
                {!loading && !error && cart && cart.length > 0 && (
                    <>
                        <h2>Keranjang Belanja</h2>
                        <ListGroup>
                            {cart.map((item) => (
                                <ListGroup.Item key={item.id_keranjang} className="d-flex align-items-center">
                                    <Form.Check
                                        type="checkbox"
                                        checked={selectedItems.includes(item.id_keranjang)}
                                        onChange={() => handleSelectItem(item.id_keranjang)}
                                        className="me-3"
                                        style={{ transform: 'scale(1.5)' }}
                                    />
                                    <div className="d-flex">
                                        <img
                                            src={item.barang.foto || '/assets/placeholder.jpg'}
                                            alt={item.barang.nama_barang}
                                            style={{
                                                width: '70px',
                                                height: '70px',
                                                objectFit: 'cover',
                                                borderRadius: '8px',
                                                marginRight: '15px',
                                            }}
                                            onError={(e) => (e.target.src = '/assets/placeholder.jpg')}
                                        />
                                        <div>
                                            <div className="fw-bold">{item.barang.nama_barang}</div>
                                            <div className="text-muted">
                                                Rp. {item.barang.harga.toLocaleString('id-ID')}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ms-auto d-flex align-items-center">
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => handleShowDeleteModal(item.id_keranjang)}
                                            disabled={loading}
                                        >
                                            <Trash size={25} />
                                        </Button>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                        <Button
                            variant="success"
                            className="mt-3"
                            onClick={handleProceedToCheckoutOptions}
                            disabled={loading || selectedItems.length === 0}
                        >
                            Lanjutkan ke Pembayaran ({selectedItems.length} barang dipilih)
                        </Button>
                    </>
                )}
            </Container>

            <Modal
                show={showDeleteModal}
                onHide={() => {
                    setShowDeleteModal(false);
                    setItemToDelete(null);
                }}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Hapus</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Apakah Anda yakin ingin menghapus barang dari keranjang?</p>
                    <div className="text-end">
                        <Button
                            variant="outline-secondary"
                            onClick={() => {
                                setShowDeleteModal(false);
                                setItemToDelete(null);
                            }}
                            className="me-2"
                        >
                            Batal
                        </Button>
                        <Button
                            variant="outline-danger"
                            onClick={() => handleRemoveItem(itemToDelete)}
                            disabled={loading}
                            className="me-2"
                        >
                            Hapus
                        </Button>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default KeranjangPage;