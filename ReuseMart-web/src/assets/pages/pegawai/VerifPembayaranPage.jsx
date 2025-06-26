import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
    Container,
    Row,
    Col,
    Button,
    Spinner,
    Table,
    Modal,
    Toast,
    ToastContainer,
} from "react-bootstrap";
import { FiHash, FiUser, FiCheckCircle, FiXCircle } from "react-icons/fi";
import api from "../../../api/api.js";
import NavbarCS from "../../components/Navbar/navbarCS.jsx";

const VerifPembayaranPage = () => {
    const { id } = useParams();
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");
    const navigate = useNavigate();

    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    const type = localStorage.getItem("type");
    const currentPegawaiId = type === "pegawai" ? profile.id : null;

    useEffect(() => {
        if (!currentPegawaiId || type !== "pegawai") {
            setError("Anda harus login sebagai pegawai terlebih dahulu.");
            setLoading(false);
            navigate("/login");
            return;
        }

        const fetchPayments = async () => {
            try {
                setLoading(true);
                const response = await api.get('/pembayaran');
                setPayments(response.data);
                setLoading(false);
                if (id) {
                    fetchPaymentDetails(id);
                }
            } catch (err) {
                setError("Gagal memuat data pembayaran. Silakan coba lagi nanti.");
                setLoading(false);
            }
        };
        fetchPayments();
    }, [id, navigate, currentPegawaiId]);

    const fetchPaymentDetails = async (paymentId) => {
        try {
            const response = await api.get(`/pembayaran/${paymentId}`);
            console.log("Payment details:", response.data); // Debug API response
            setSelectedPayment(response.data);
            setShowModal(true);
        } catch (err) {
            setToastMessage("Gagal memuat detail pembayaran.");
            setToastVariant("danger");
            setToastShow(true);
        }
    };

    const handleVerify = async (status) => {
        try {
            const newStatus = status === "Berhasil" ? "Berhasil" : "Tidak Valid";
            await api.post(`/pembayaran/verify/${selectedPayment.id_pembayaran}`, { status: newStatus });
            setPayments(payments.filter((p) => p.id_pembayaran !== selectedPayment.id_pembayaran));
            setShowModal(false);
            setToastMessage(`Pembayaran ditandai sebagai ${newStatus}`);
            setToastVariant("success");
            setToastShow(true);
        } catch (err) {
            setToastMessage("Gagal memperbarui status pembayaran.");
            setToastVariant("danger");
            setToastShow(true);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedPayment(null);
    };

    return (
        <>
            <NavbarCS />
            <Container className="mt-5" style={{ background: "none" }}>
                <Row className="align-items-center mb-2">
                    <Col md={6}>
                        <h2 className="text-success fw-bold">Verifikasi Pembayaran</h2>
                    </Col>
                </Row>
                <hr />
                {loading ? (
                    <div className="text-center">
                        <Spinner animation="border" variant="success" />
                        <p>Memuat data...</p>
                    </div>
                ) : error ? (
                    <p className="text-danger text-center">{error}</p>
                ) : (
                    <Container className="mt-4 text-center" style={{ background: "none" }}>
                        <Col md={12} className="mx-auto">
                            {payments.length > 0 ? (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>
                                                <FiHash /> ID Pembayaran
                                            </th>
                                            <th>
                                                <FiUser /> Nama Pengguna
                                            </th>
                                            <th>
                                                <FiCheckCircle /> Status
                                            </th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {payments.map((payment) => (
                                            <tr key={payment.id_pembayaran} style={{ cursor: "pointer" }}>
                                                <td>{payment.id_pembayaran}</td>
                                                <td>
                                                    {payment.transaksi?.user?.first_name}{" "}
                                                    {payment.transaksi?.user?.last_name}
                                                </td>
                                                <td>{payment.status_pembayaran}</td>
                                                <td>
                                                    <Button
                                                        variant="outline-success"
                                                        onClick={() => fetchPaymentDetails(payment.id_pembayaran)}
                                                    >
                                                        Lihat Detail
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted mt-4">
                                    <p>Tidak ada pembayaran yang ditemukan.</p>
                                </div>
                            )}
                        </Col>
                    </Container>
                )}

                {/* Modal for Payment Details */}
                <Modal show={showModal} onHide={handleCloseModal} centered backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Detail Pembayaran</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedPayment && (
                            <>
                                <div className="mb-4">
                                    <p>
                                        <strong>
                                            <FiUser /> Pengguna:
                                        </strong>{" "}
                                        {selectedPayment.transaksi?.user?.first_name}{" "}
                                        {selectedPayment.transaksi?.user?.last_name}
                                    </p>
                                    <p>
                                        <strong>
                                            <FiCheckCircle /> Status Pembayaran:
                                        </strong>{" "}
                                        {selectedPayment.status_pembayaran}
                                    </p>
                                </div>

                                <div className="mb-4">
                                    <h3 className="fs-5 fw-semibold">Bukti Pembayaran</h3>
                                    {selectedPayment.ss_pembayaran ? (
                                        <>
                                            <img
                                                src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${selectedPayment.ss_pembayaran}`}
                                                alt="Bukti Pembayaran"
                                                className="img-fluid rounded"
                                                style={{ maxWidth: "100%" }}
                                                onError={(e) => {
                                                    console.log("Failed to load image:", e.target.src);
                                                    e.target.src = "/placeholder-image.jpg";
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <p>Tidak ada bukti yang diunggah</p>
                                    )}
                                </div>

                                <div className="mb-4">
                                    <h3 className="fs-5 fw-semibold">Item</h3>
                                    {selectedPayment.transaksi?.detiltransaksi?.length > 0 ? (
                                        selectedPayment.transaksi.detiltransaksi.map((detail) => (
                                            <div key={detail.id_dt} className="border-bottom py-2">
                                                <p>
                                                    <strong>Nama Item:</strong> {detail.barang?.nama_barang}
                                                </p>
                                                <p>
                                                    <strong>Kode Item:</strong> {detail.barang?.kode_barang || "N/A"}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p>Tidak ada item yang terkait dengan pembayaran ini</p>
                                    )}
                                </div>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button
                            variant="success"
                            onClick={() => handleVerify("Berhasil")}
                            disabled={selectedPayment?.status_pembayaran !== "Menunggu Verifikasi"}
                        >
                            <FiCheckCircle /> Tandai Berhasil
                        </Button>
                        <Button
                            variant="outline-danger"
                            onClick={() => handleVerify("Tidak Valid")}
                            disabled={selectedPayment?.status_pembayaran !== "Menunggu Verifikasi"}
                        >
                            <FiXCircle /> Tandai Tidak Valid
                        </Button>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Tutup
                        </Button>
                    </Modal.Footer>
                </Modal>

                <ToastContainer
                    className="position-fixed top-50 start-50 translate-middle z-3"
                    style={{ minWidth: "300px" }}
                >
                    <Toast
                        show={toastShow}
                        onClose={() => setToastShow(false)}
                        delay={3000}
                        autohide
                        bg={toastVariant}
                    >
                        <Toast.Header>
                            <strong className="me-auto">
                                {toastVariant === "success" ? "Sukses" : "Error"}
                            </strong>
                        </Toast.Header>
                        <Toast.Body className={toastVariant === "success" ? "text-white" : ""}>
                            {toastMessage}
                        </Toast.Body>
                    </Toast>
                </ToastContainer>
            </Container>
        </>
    );
};

export default VerifPembayaranPage;