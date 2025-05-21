import { useEffect, useState } from 'react';
import {
    Container,
    Form,
    Button,
    Modal,
    ListGroup,
    FormCheck,
    Alert,
    Toast,
    ToastContainer,
} from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/api.js';
import NavbarPembeliPage from '../../components/Navbar/navbarPembeli.jsx';

const CheckoutOptionsPage = () => {
    const { state } = useLocation();
    const { selectedItems, cart } = state || { selectedItems: [], cart: { items: [] } };
    const [shippingMethod, setShippingMethod] = useState('Kurir');
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressModal, setShowAddressModal] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('danger');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAddresses = async () => {
            try {
                const response = await api.get('/alamat');
                const normalized = response.data.map((item) => ({
                    ...item,
                    isdefault: Number(item.isdefault) === 1,
                }));
                setAddresses(normalized);
                const defaultAddress = normalized.find((addr) => addr.isdefault);
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress.id_alamat);
                }
            } catch (error) {
                setToastVariant('danger');
                setToastMessage('Gagal mengambil daftar alamat');
                setShowToast(true);
            }
        };
        fetchAddresses();
    }, []);

    const calculateTotal = () => {
        if (!cart.items) return 0;
        return cart.items
            .filter((item) => selectedItems.includes(item.id_barang))
            .reduce((total, item) => total + item.harga, 0);
    };

    const calculateShippingCost = () => {
        const total = calculateTotal();
        return total >= 1500000 ? 0 : 100000;
    };

    const handleSelectAddress = () => {
        if (!selectedAddress) {
            setToastVariant('danger');
            setToastMessage('Pilih alamat pengiriman');
            setShowToast(true);
            return;
        }
        setShowAddressModal(false);
    };

    const handleProceedToCheckout = () => {
        if (shippingMethod === 'Kurir' && !selectedAddress) {
            setToastVariant('danger');
            setToastMessage('Pilih alamat pengiriman untuk metode Kurir');
            setShowToast(true);
            return;
        }
        navigate('/checkout', {
            state: {
                selectedItems,
                shippingMethod,
                selectedAddress: shippingMethod === 'Kurir' ? selectedAddress : null,
                shippingCost: calculateShippingCost(),
                subtotal: calculateTotal(),
            },
        });
    };

    const defaultAddress = addresses.find((addr) => addr.id_alamat === selectedAddress);

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
                <h2>Rincian Pesanan</h2>
                {selectedItems.length === 0 ? (
                    <Alert variant="warning" className="text-center">
                        Tidak ada barang yang dipilih untuk checkout.
                    </Alert>
                ) : (
                    <ListGroup className="mb-4">
                        {cart.items
                            .filter((item) => selectedItems.includes(item.id_barang))
                            .map((item) => (
                                <ListGroup.Item
                                    key={item.id_barang}
                                    className="d-flex align-items-center"
                                >
                                    <img
                                        src={item.foto || 'https://via.placeholder.com/70'}
                                        alt={item.nama_barang}
                                        style={{
                                            width: '70px',
                                            height: '70px',
                                            objectFit: 'cover',
                                            borderRadius: '8px',
                                            marginRight: '15px',
                                        }}
                                    />
                                    <div>
                                        <div className="fw-bold">{item.nama_barang}</div>
                                        <div className="text-muted">
                                            Rp. {item.harga.toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                    </ListGroup>
                )}

                <h2>Pilih Metode Pengiriman</h2>
                <Form>
                    <Form.Group className="mb-4">
                        <Form.Check
                            type="radio"
                            label="Kurir (Kota Yogyakarta)"
                            name="shippingMethod"
                            value="Kurir"
                            checked={shippingMethod === 'Kurir'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mb-2"
                        />
                        <Form.Check
                            type="radio"
                            label="Pengambilan Sendiri"
                            name="shippingMethod"
                            value="Pengambilan Sendiri"
                            checked={shippingMethod === 'Pengambilan Sendiri'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                        />
                    </Form.Group>

                    {shippingMethod === 'Kurir' && (
                        <div className="mb-4">
                            <h4>Alamat Pengiriman</h4>
                            {defaultAddress ? (
                                <div className="border p-3 rounded">
                                    <div className="fw-bold">
                                        {defaultAddress.label}
                                        {defaultAddress.isdefault && (
                                            <span className="badge bg-success ms-2">Utama</span>
                                        )}
                                    </div>
                                    <div>
                                        {defaultAddress.alamat}, {defaultAddress.kota}, {defaultAddress.kode_pos}
                                    </div>
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="mt-2"
                                        onClick={() => setShowAddressModal(true)}
                                    >
                                        Ubah Alamat
                                    </Button>
                                </div>
                            ) : (
                                <Alert variant="warning">
                                    Tidak ada alamat default. Silakan pilih alamat.
                                    <Button
                                        variant="outline-primary"
                                        size="sm"
                                        className="ms-2"
                                        onClick={() => setShowAddressModal(true)}
                                    >
                                        Pilih Alamat
                                    </Button>
                                </Alert>
                            )}
                        </div>
                    )}

                    <h4>Rincian Harga</h4>
                    <ListGroup className="mb-4">
                        <ListGroup.Item className="d-flex justify-content-between">
                            <span>Subtotal</span>
                            <span>Rp. {calculateTotal().toLocaleString('id-ID')}</span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between">
                            <span>Ongkos Kirim</span>
                            <span>
                                {shippingMethod === 'Kurir'
                                    ? `Rp. ${calculateShippingCost().toLocaleString('id-ID')}`
                                    : 'Gratis'}
                            </span>
                        </ListGroup.Item>
                        <ListGroup.Item className="d-flex justify-content-between fw-bold">
                            <span>Total</span>
                            <span>
                                Rp. {(calculateTotal() + (shippingMethod === 'Kurir' ? calculateShippingCost() : 0)).toLocaleString('id-ID')}
                            </span>
                        </ListGroup.Item>
                    </ListGroup>

                    <Button
                        variant="success"
                        onClick={handleProceedToCheckout}
                        disabled={shippingMethod === 'Kurir' && !selectedAddress}
                    >
                        Lanjutkan ke Pembayaran
                    </Button>
                </Form>
            </Container>

            <Modal
                show={showAddressModal}
                onHide={() => setShowAddressModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Pilih Alamat Pengiriman</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {addresses.length === 0 ? (
                        <p>
                            Tidak ada alamat tersedia.{' '}
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => navigate('/alamat')}
                            >
                                Tambah Alamat
                            </Button>
                        </p>
                    ) : (
                        <ListGroup>
                            {addresses.map((address) => (
                                <ListGroup.Item
                                    key={address.id_alamat}
                                    className="d-flex align-items-center"
                                >
                                    <FormCheck
                                        type="radio"
                                        name="address"
                                        checked={selectedAddress === address.id_alamat}
                                        onChange={() => setSelectedAddress(address.id_alamat)}
                                        className="me-3"
                                    />
                                    <div>
                                        <div className="fw-bold">
                                            {address.label}
                                            {address.isdefault && (
                                                <span className="badge bg-success ms-2">Utama</span>
                                            )}
                                        </div>
                                        <div>
                                            {address.alamat}, {address.kota}, {address.kode_pos}
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowAddressModal(false)}
                        className="me-2"
                    >
                        Batal
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSelectAddress}
                        disabled={!selectedAddress}
                    >
                        Pilih Alamat
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default CheckoutOptionsPage;