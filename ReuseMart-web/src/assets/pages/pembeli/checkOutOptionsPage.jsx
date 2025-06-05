import { useEffect, useState } from 'react';
import {
    Container,
    Row,
    Col,
    Form,
    Button,
    Modal,
    ListGroup,
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
    const { selectedItems, cart } = state || { selectedItems: [], cart: [] };
    const [shippingMethod, setShippingMethod] = useState('Delivery');
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
                setToastMessage('Gagal mengambil data alamat atau poin.');
                setShowToast(true);
            }
        };
        fetchData();
    }, []);

    const calculateTotal = () => {
        if (!cart) return 0;
        return cart
            .filter((item) => selectedItems.includes(item.id_keranjang))
            .reduce((total, item) => total + item.barang.harga, 0);
    };

    const calculateShippingCost = () => {
        const total = calculateTotal();
        return total >= 1500000 ? 0 : 100000;
    };

    const calculateEarnedPoints = () => {
        const totalPrice = calculateTotal() +
            (shippingMethod === 'Delivery' ? calculateShippingCost() : 0) -
            discountAmount;

        let basePoints = Math.floor(totalPrice / 10000);

        if (totalPrice >= 500000) {
            basePoints += Math.floor(basePoints * 0.2);
        }

        return basePoints;
    };

    const handleSelectAddress = () => {
        if (!selectedAddress) {
            setToastVariant('danger');
            setToastMessage('Pilih alamat pengiriman.');
            setShowToast(true);
            return;
        }
        setShowAddressModal(false);
    };

    const handleApplyPoints = () => {
        const points = parseInt(pointsToRedeem, 10) || 0;
        if (isNaN(points) || points < 0) {
            setToastVariant('danger');
            setToastMessage('Masukkan jumlah poin yang valid (angka positif).');
            setShowToast(true);
            return;
        }
        if (points > (userData?.poin_loyalitas || 0)) {
            setToastVariant('danger');
            setToastMessage('Poin yang ditukar melebihi poin yang dimiliki.');
            setShowToast(true);
            return;
        }

        const totalPrice = calculateTotal() + (shippingMethod === 'Delivery' ? calculateShippingCost() : 0);
        let newDiscount = (points / 100) * 10000;
        let adjustedPoints = points;

        if (newDiscount > totalPrice) {
            newDiscount = totalPrice;
            adjustedPoints = Math.ceil(totalPrice / 10000) * 100;
            setPointsToRedeem(adjustedPoints.toString());
            setToastVariant('warning');
            setToastMessage(
                `Poin disesuaikan menjadi ${adjustedPoints} agar diskon tidak melebihi total harga.`
            );
            setShowToast(true);
        } else {
            setToastVariant('success');
            setToastMessage(`Diskon Rp ${newDiscount.toLocaleString('id-ID')} akan diterapkan.`);
            setShowToast(true);
        }

        setDiscountAmount(newDiscount);
    };

    const handleProceedToCheckout = async () => {
        if (selectedItems.length === 0) {
            setToastVariant('danger');
            setToastMessage('Pilih setidaknya satu barang untuk checkout.');
            setShowToast(true);
            return;
        }

        if (shippingMethod === 'Delivery' && !selectedAddress) {
            setToastVariant('danger');
            setToastMessage('Pilih alamat pengiriman untuk metode Delivery.');
            setShowToast(true);
            return;
        }

        try {
            const selectedAddressData = addresses.find(
                (addr) => addr.id_alamat === selectedAddress
            );
            const payload = {
                metode_pengiriman: shippingMethod === 'Delivery' ? 'Delivery' : 'Pick Up',
                alamat: shippingMethod === 'Delivery' && selectedAddressData
                    ? `${selectedAddressData.alamat}, ${selectedAddressData.kecamatan}, ${selectedAddressData.kota}, ${selectedAddressData.kode_pos}${selectedAddressData.catatan ? ', ' + selectedAddressData.catatan : ''}`
                    : '',
                biaya_pengiriman: shippingMethod === 'Delivery' ? calculateShippingCost() : 0,
                diskon: discountAmount,
                points_redeemed: parseInt(pointsToRedeem, 10) || 0,
                selected_items: cart
                    .filter((item) => selectedItems.includes(item.id_keranjang))
                    .map((item) => item.id_keranjang),
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
                    shipping_cost: shippingMethod === 'Delivery' ? calculateShippingCost() : 0,
                    discount_amount: discountAmount,
                    total: calculateTotal() +
                        (shippingMethod === 'Delivery' ? calculateShippingCost() : 0) -
                        discountAmount,
                },
            });
        } catch (error) {
            setToastVariant('danger');
            setToastMessage(
                error.response?.data?.message || 'Gagal melakukan checkout. Coba lagi.'
            );
            setShowToast(true);

            if (error.response?.data?.message?.includes('tidak tersedia')) {
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
        setToastMessage('Penukaran poin dibatalkan.');
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

            <Container className="container-checkout">
                <Row>
                    <Col md={8}>
                        <h3 className="checkout-title">Rincian Pesanan</h3>
                        {selectedItems.length === 0 ? (
                            <Alert variant="warning">Tidak ada barang yang dipilih untuk checkout.</Alert>
                        ) : (
                            <ListGroup>
                                {cart
                                    .filter((item) => selectedItems.includes(item.id_keranjang))
                                    .map((item) => (
                                        <ListGroup.Item key={item.id_keranjang} className="d-flex align-items-center">
                                            <img
                                                src={item.barang.foto || 'https://picsum.photos/60'}
                                                alt={item.barang.nama_barang}
                                                className="item-image"
                                                onError={(e) => (e.target.src = '/assets/placeholder.jpg')}
                                            />
                                            <div>
                                                <div className="item-name">{item.barang.nama_barang}</div>
                                                <div className="item-price">
                                                    Rp. {item.barang.harga.toLocaleString('id-ID')}
                                                </div>
                                            </div>
                                        </ListGroup.Item>
                                    ))}
                            </ListGroup>
                        )}

                        <hr className="section-divider" />

                        <h3 className="checkout-title">Metode Pengiriman</h3>
                        <Form>
                            <Form.Check
                                type="radio"
                                label="Delivery (Kota Yogyakarta)"
                                name="shippingMethod"
                                value="Delivery"
                                checked={shippingMethod === 'Delivery'}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="shipping-option mb-2"
                            />
                            <Form.Check
                                type="radio"
                                label="Pick Up"
                                name="shippingMethod"
                                value="Pick Up"
                                checked={shippingMethod === 'Pick Up'}
                                onChange={(e) => setShippingMethod(e.target.value)}
                                className="shipping-option"
                            />
                        </Form>

                        {shippingMethod === 'Delivery' && (
                            <>
                                <hr className="section-divider" />
                                <h3 className="checkout-title">Alamat Pengiriman</h3>
                                {defaultAddress ? (
                                    <div className="address-box">
                                        <div className="fw-bold">
                                            {defaultAddress.label}
                                            {defaultAddress.isdefault && (
                                                <span className="badge bg-success ms-2">Utama</span>
                                            )}
                                        </div>
                                        <div>
                                            {defaultAddress.alamat}, {defaultAddress.kecamatan}, {defaultAddress.kota},{' '}
                                            {defaultAddress.kode_pos}
                                            {defaultAddress.catatan && `, ${defaultAddress.catatan}`}
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
                                        Tidak ada alamat default.{' '}
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => setShowAddressModal(true)}
                                        >
                                            Pilih Alamat
                                        </Button>
                                    </Alert>
                                )}
                            </>
                        )}
                    </Col>

                    <Col md={4}>
                        <h3 className="checkout-title">Penukaran Poin & Rincian Harga</h3>
                        <div className="points-section">
                            <p>
                                Poin Tersedia: <strong>{userData?.poin_loyalitas || 0} poin</strong>
                            </p>
                            <InputGroup size="sm" className="mb-2">
                                <Form.Control
                                    type="text"
                                    placeholder="Masukkan poin"
                                    value={pointsToRedeem}
                                    onChange={handlePointsInputChange}
                                    className="points-input"
                                />
                                <Button
                                    variant="primary"
                                    onClick={handleApplyPoints}
                                    disabled={!pointsToRedeem || parseInt(pointsToRedeem, 10) <= 0}
                                    className="btn-apply-points"
                                >
                                    Terapkan
                                </Button>
                                {pointsToRedeem && (
                                    <Button
                                        variant="outline-danger"
                                        onClick={handleClearPoints}
                                        className="btn-clear-points"
                                    >
                                        Batal
                                    </Button>
                                )}
                            </InputGroup>
                            <p>
                                Sisa Poin: <strong>{remainingPoints >= 0 ? remainingPoints : 0} poin</strong>
                                {tempDiscount > 0 && (
                                    <span> (Diskon: Rp {tempDiscount.toLocaleString('id-ID')})</span>
                                )}
                            </p>
                        </div>

                        <hr className="section-divider" />

                        <ListGroup className="price-details">
                            <ListGroup.Item className="d-flex justify-content-between">
                                <span>Subtotal</span>
                                <span>Rp. {calculateTotal().toLocaleString('id-ID')}</span>
                            </ListGroup.Item>
                            <ListGroup.Item className="d-flex justify-content-between">
                                <span>Ongkos Kirim</span>
                                <span>
                                    {shippingMethod === 'Delivery'
                                        ? `Rp. ${calculateShippingCost().toLocaleString('id-ID')}`
                                        : 'Gratis'}
                                </span>
                            </ListGroup.Item>
                            {discountAmount > 0 && (
                                <ListGroup.Item className="d-flex justify-content-between text-success">
                                    <span>Diskon Poin</span>
                                    <span>- Rp. {discountAmount.toLocaleString('id-ID')}</span>
                                </ListGroup.Item>
                            )}
                            <ListGroup.Item className="d-flex justify-content-between fw-bold">
                                <span>Total</span>
                                <span>
                                    Rp.{' '}
                                    {(calculateTotal() +
                                        (shippingMethod === 'Delivery' ? calculateShippingCost() : 0) -
                                        discountAmount).toLocaleString('id-ID')}
                                </span>
                            </ListGroup.Item>
                        </ListGroup>
                        <p className="mt-2">
                            Poin Didapat: <strong>{calculateEarnedPoints()} poin</strong>
                        </p>

                        <Button
                            variant="success"
                            className="btn-checkout w-100 mt-3"
                            onClick={handleProceedToCheckout}
                            disabled={
                                selectedItems.length === 0 ||
                                (shippingMethod === 'Delivery' && !selectedAddress)
                            }
                        >
                            Lanjutkan ke Pembayaran
                        </Button>
                    </Col>
                </Row>
            </Container>

            <Modal show={showAddressModal} onHide={() => setShowAddressModal(false)} centered>
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
                                <ListGroup.Item key={address.id_alamat} className="d-flex align-items-center">
                                    <Form.Check
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
                                            {address.alamat}, {address.kecamatan}, {address.kota}, {address.kode_pos}
                                            {address.catatan && `, ${address.catatan}`}
                                        </div>
                                    </div>
                                </ListGroup.Item>
                            ))}
                        </ListGroup>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={() => setShowAddressModal(false)}>
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