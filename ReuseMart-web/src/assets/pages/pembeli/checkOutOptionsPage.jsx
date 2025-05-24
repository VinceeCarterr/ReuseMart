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
    InputGroup,
} from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../../api/api.js';
import NavbarPembeliPage from '../../components/Navbar/navbarPembeli.jsx';
import './CheckoutOptionsPage.css';

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
    const [userData, setUserData] = useState(null);
    const [pointsToRedeem, setPointsToRedeem] = useState('');
    const [discountAmount, setDiscountAmount] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [addressResponse, userResponse] = await Promise.all([
                    api.get('/alamat'),
                    api.get('/user'),
                ]);
                const normalizedAddresses = addressResponse.data.map((item) => ({
                    ...item,
                    isdefault: Number(item.isdefault) === 1,
                }));
                setAddresses(normalizedAddresses);
                const defaultAddress = normalizedAddresses.find((addr) => addr.isdefault);
                if (defaultAddress) {
                    setSelectedAddress(defaultAddress.id_alamat);
                }
                setUserData(userResponse.data);
            } catch (error) {
                setToastVariant('danger');
                setToastMessage('Gagal mengambil data alamat atau poin');
                setShowToast(true);
            }
        };
        fetchData();
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

    const calculateEarnedPoints = () => {
        const totalPrice = calculateTotal() + (shippingMethod === 'Kurir' ? calculateShippingCost() : 0);
        let points = totalPrice / 10000;
        if (totalPrice > 500000) {
            points *= 1.2;
        }
        return Math.floor(points);
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

    const handleApplyPoints = () => {
        const points = parseInt(pointsToRedeem, 10) || 0;
        if (isNaN(points) || points < 0) {
            setToastVariant('danger');
            setToastMessage('Masukkan jumlah poin yang valid (angka positif)');
            setShowToast(true);
            return;
        }
        if (points > (userData?.poin_loyalitas || 0)) {
            setToastVariant('danger');
            setToastMessage('Poin yang ditukar melebihi poin yang dimiliki');
            setShowToast(true);
            return;
        }

        const totalPrice = calculateTotal() + (shippingMethod === 'Kurir' ? calculateShippingCost() : 0);
        let newDiscount = (points / 100) * 10000;
        let adjustedPoints = points;

        if (newDiscount > totalPrice) {
            newDiscount = totalPrice;
            adjustedPoints = Math.ceil(totalPrice / 10000) * 100;
            setPointsToRedeem(adjustedPoints.toString());
            setToastVariant('warning');
            setToastMessage(
                `Poin disesuaikan menjadi ${adjustedPoints} agar diskon tidak melebihi total harga`
            );
            setShowToast(true);
        } else {
            setToastVariant('success');
            setToastMessage(`Diskon Rp ${newDiscount.toLocaleString('id-ID')} akan diterapkan`);
            setShowToast(true);
        }

        setDiscountAmount(newDiscount);
    };

    const handleProceedToCheckout = async () => {
        if (selectedItems.length === 0) {
            setToastVariant('danger');
            setToastMessage('Pilih setidaknya satu barang untuk checkout');
            setShowToast(true);
            return;
        }

        if (shippingMethod === 'Kurir' && !selectedAddress) {
            setToastVariant('danger');
            setToastMessage('Pilih alamat pengiriman untuk metode Kurir');
            setShowToast(true);
            return;
        }

        try {
            const selectedAddressData = addresses.find(
                (addr) => addr.id_alamat === selectedAddress
            );
            const payload = {
                metode_pengiriman: shippingMethod === 'Kurir' ? 'Delivery' : 'Pick Up',
                alamat:
                    shippingMethod === 'Kurir'
                        ? `${selectedAddressData.alamat}, ${selectedAddressData.kota}, ${selectedAddressData.kode_pos}`
                        : '',
                biaya_pengiriman: shippingMethod === 'Kurir' ? calculateShippingCost() : 0,
                diskon: discountAmount,
                points_redeemed: parseInt(pointsToRedeem, 10) || 0,
                selected_items: selectedItems, // Kirim selected_items ke backend
            };

            const response = await api.post('/checkout', payload);

            setToastVariant('success');
            setToastMessage(response.data.message);
            setShowToast(true);

            navigate('/upload-proof', {
                state: {
                    transaksi_id: response.data.transaksi_id,
                    pembayaran_id: response.data.pembayaran_id,
                    subtotal: calculateTotal(),
                    shippingCost: shippingMethod === 'Kurir' ? calculateShippingCost() : 0,
                    discountAmount,
                    total:
                        calculateTotal() +
                        (shippingMethod === 'Kurir' ? calculateShippingCost() : 0) -
                        discountAmount,
                },
            });
        } catch (error) {
            setToastVariant('danger');
            setToastMessage(
                error.response?.data?.error || 'Gagal melakukan checkout. Coba lagi.'
            );
            setShowToast(true);

            // Jika error karena barang tidak tersedia, arahkan kembali ke KeranjangPage
            if (error.response?.data?.error?.includes('tidak tersedia')) {
                setTimeout(() => {
                    navigate('/cart');
                }, 2000);
            }
        }
    };

    const handleClearPoints = () => {
        setPointsToRedeem('');
        setDiscountAmount(0);
        setToastVariant('success');
        setToastMessage('Penukaran poin dibatalkan');
        setShowToast(true);
    };

    const handlePointsInputChange = (e) => {
        const value = e.target.value;
        if (value === '' || /^[0-9]*$/.test(value)) {
            setPointsToRedeem(value);
        }
    };

    const defaultAddress = addresses.find((addr) => addr.id_alamat === selectedAddress);
    const remainingPoints = userData?.poin_loyalitas - (parseInt(pointsToRedeem, 10) || 0) || 0;
    const tempDiscount = pointsToRedeem ? (parseInt(pointsToRedeem, 10) / 100) * 10000 : 0;

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
                    <i className="bi bi-cart-fill me-2 text-success"></i>
                    Rincian Pesanan
                </h3>
                {selectedItems.length === 0 ? (
                    <Alert variant="warning" className="text-center">
                        Tidak ada barang yang dipilih untuk checkout.
                    </Alert>
                ) : (
                    <ListGroup variant="flush">
                        {cart.items
                            .filter((item) => selectedItems.includes(item.id_barang))
                            .map((item) => (
                                <ListGroup.Item
                                    key={item.id_barang}
                                    className="d-flex align-items-center py-3"
                                >
                                    <img
                                        src={item.foto || 'https://via.placeholder.com/80'}
                                        alt={item.nama_barang}
                                        className="rounded"
                                        style={{
                                            width: '80px',
                                            height: '80px',
                                            objectFit: 'cover',
                                            marginRight: '20px',
                                        }}
                                    />
                                    <div className="flex-grow-1">
                                        <h5 className="mb-1">{item.nama_barang}</h5>
                                        <p className="mb-0 text-muted">
                                            Rp. {item.harga.toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </ListGroup.Item>
                            ))}
                    </ListGroup>
                )}

                <hr className="section-divider" />

                <h3 className="mb-4">
                    <i className="bi bi-truck me-2 text-success"></i>
                    Pilih Metode Pengiriman
                </h3>
                <Form>
                    <Form.Group className="mb-4">
                        <FormCheck
                            type="radio"
                            label="Kurir (Kota Yogyakarta)"
                            name="shippingMethod"
                            value="Kurir"
                            checked={shippingMethod === 'Kurir'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                            className="mb-3"
                        />
                        <FormCheck
                            type="radio"
                            label="Pengambilan Sendiri"
                            name="shippingMethod"
                            value="Pengambilan Sendiri"
                            checked={shippingMethod === 'Pengambilan Sendiri'}
                            onChange={(e) => setShippingMethod(e.target.value)}
                        />
                    </Form.Group>
                </Form>

                {shippingMethod === 'Kurir' && (
                    <>
                        <hr className="section-divider" />
                        <h3 className="mb-4">
                            <i className="bi bi-geo-alt-fill me-2 text-success"></i>
                            Alamat Pengiriman
                        </h3>
                        {defaultAddress ? (
                            <div className="border p-3 rounded bg-light">
                                <div className="fw-bold">
                                    {defaultAddress.label}
                                    {defaultAddress.isdefault && (
                                        <span className="badge bg-success ms-2">Utama</span>
                                    )}
                                </div>
                                <div>
                                    {defaultAddress.alamat}, {defaultAddress.kota},{' '}
                                    {defaultAddress.kode_pos}
                                </div>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    className="mt-3"
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
                    </>
                )}

                <hr className="section-divider" />

                <h3 className="mb-4">
                    <i className="bi bi-coin me-2 text-success"></i>
                    Penukaran Poin
                </h3>
                <p className="text-muted">
                    Poin yang Dimiliki:{' '}
                    <strong>{userData?.poin_loyalitas || 0} poin</strong>
                </p>
                <InputGroup className="mb-3">
                    <Form.Control
                        type="text"
                        placeholder="Masukkan poin"
                        value={pointsToRedeem}
                        onChange={handlePointsInputChange}
                        maxLength="6"
                        className="points-input"
                    />
                    <Button
                        variant="primary"
                        onClick={handleApplyPoints}
                        disabled={!pointsToRedeem || parseInt(pointsToRedeem, 10) <= 0}
                    >
                        Terapkan Poin
                    </Button>
                    {pointsToRedeem && (
                        <Button
                            variant="outline-danger"
                            onClick={handleClearPoints}
                            className="ms-2"
                        >
                            Batal
                        </Button>
                    )}
                </InputGroup>
                <p className="text-muted">
                    Sisa Poin:{' '}
                    <strong>{remainingPoints >= 0 ? remainingPoints : 0} poin</strong>
                    {tempDiscount > 0 && (
                        <span> (Diskon: Rp {tempDiscount.toLocaleString('id-ID')})</span>
                    )}
                </p>

                <hr className="section-divider" />

                <h3 className="mb-4">
                    <i className="bi bi-wallet2 me-2 text-success"></i>
                    Rincian Harga
                </h3>
                <ListGroup variant="flush">
                    <ListGroup.Item className="d-flex justify-content-between py-3">
                        <span>Subtotal</span>
                        <span>Rp. {calculateTotal().toLocaleString('id-ID')}</span>
                    </ListGroup.Item>
                    <ListGroup.Item className="d-flex justify-content-between py-3">
                        <span>Ongkos Kirim</span>
                        <span>
                            {shippingMethod === 'Kurir'
                                ? `Rp. ${calculateShippingCost().toLocaleString('id-ID')}`
                                : 'Gratis'}
                        </span>
                    </ListGroup.Item>
                    {discountAmount > 0 && (
                        <ListGroup.Item className="d-flex justify-content-between py-3 text-success">
                            <span>Diskon Poin</span>
                            <span>- Rp. {discountAmount.toLocaleString('id-ID')}</span>
                        </ListGroup.Item>
                    )}
                    <ListGroup.Item className="d-flex justify-content-between py-3 fw-bold">
                        <span>Total</span>
                        <span>
                            Rp.{' '}
                            {(calculateTotal() +
                                (shippingMethod === 'Kurir' ? calculateShippingCost() : 0) -
                                discountAmount).toLocaleString('id-ID')}
                        </span>
                    </ListGroup.Item>
                </ListGroup>
                <p className="text-muted mt-3">
                    Poin yang akan diterima:{' '}
                    <strong>{calculateEarnedPoints()} poin</strong>
                </p>

                <Button
                    variant="success"
                    size="lg"
                    className="w-100 mt-5"
                    onClick={handleProceedToCheckout}
                    disabled={
                        selectedItems.length === 0 ||
                        (shippingMethod === 'Kurir' && !selectedAddress)
                    }
                >
                    Lanjutkan ke Pembayaran
                </Button>
            </Container>

            <Modal
                show={showAddressModal}
                onHide={() => setShowAddressModal(false)}
                centered
                animation
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
                        <ListGroup variant="flush">
                            {addresses.map((address) => (
                                <ListGroup.Item
                                    key={address.id_alamat}
                                    className="d-flex align-items-center py-3"
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
                                                <span className="badge bg-success ms-2">
                                                    Utama
                                                </span>
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