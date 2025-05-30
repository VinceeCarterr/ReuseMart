import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Table, Modal, Button } from 'react-bootstrap';
import api from "../../../api/api.js";

const VerifPembayaranPage = () => {
    const { id } = useParams();
    const [payments, setPayments] = useState([]);
    const [selectedPayment, setSelectedPayment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const response = await api.get('/pembayaran');
                setPayments(response.data);
                setLoading(false);
                if (id) {
                    fetchPaymentDetails(id);
                }
            } catch (err) {
                setError('Failed to fetch pending payments');
                setLoading(false);
            }
        };
        fetchPayments();
    }, [id]);

    const fetchPaymentDetails = async (paymentId) => {
        try {
            const response = await api.get(`/pembayaran/${paymentId}`);
            setSelectedPayment(response.data);
            setModalOpen(true);
        } catch (err) {
            setError('Failed to fetch payment details');
        }
    };

    const handleVerify = async (status) => {
        try {
            const newStatus = status === 'Berhasil' ? 'Berhasil' : 'Tidak Valid';
            await api.post(`/pembayaran/verify/${selectedPayment.id_pembayaran}`, { status: newStatus });
            setSelectedPayment({ ...selectedPayment, status_pembayaran: newStatus });
            // Remove the payment from the list since it's no longer "Menunggu Verifikasi"
            setPayments(payments.filter(p => p.id_pembayaran !== selectedPayment.id_pembayaran));
            setModalOpen(false);
            alert(`Payment marked as ${newStatus}`);
        } catch (err) {
            setError('Failed to update payment status');
        }
    };

    const closeModal = () => {
        setModalOpen(false);
        setSelectedPayment(null);
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div>{error}</div>;

    return (
        <div className="container my-4">
            <h1 className="mb-4 fs-2 fw-bold">Payment Verification</h1>

            {payments.length === 0 ? (
                <div className="alert alert-info">No pending payments found</div>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Payment ID</th>
                            <th>User</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {payments.map((payment) => (
                            <tr key={payment.id_pembayaran}>
                                <td>{payment.id_pembayaran}</td>
                                <td>
                                    {payment.transaksi?.user?.first_name} {payment.transaksi?.user?.last_name}
                                </td>
                                <td>{payment.status_pembayaran}</td>
                                <td>
                                    <Button
                                        variant="primary"
                                        onClick={() => fetchPaymentDetails(payment.id_pembayaran)}
                                    >
                                        View Details
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}

            <Modal show={modalOpen} onHide={closeModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Payment Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedPayment && (
                        <>
                            <div className="mb-4">
                                <p><strong>User:</strong> {selectedPayment.transaksi?.user?.first_name} {selectedPayment.transaksi?.user?.last_name}</p>
                                <p><strong>Payment Status:</strong> {selectedPayment.status_pembayaran}</p>
                            </div>

                            <div className="mb-4">
                                <h3 className="fs-5 fw-semibold">Proof of Payment</h3>
                                {selectedPayment.ss_pembayaran ? (
                                    <img
                                        src={`/storage/${selectedPayment.ss_pembayaran}`}
                                        alt="Payment Proof"
                                        className="img-fluid rounded"
                                        style={{ maxWidth: '100%' }}
                                    />
                                ) : (
                                    <p>No proof uploaded</p>
                                )}
                            </div>

                            <div className="mb-4">
                                <h3 className="fs-5 fw-semibold">Items</h3>
                                {selectedPayment.transaksi?.detiltransaksi?.length > 0 ? (
                                    selectedPayment.transaksi.detiltransaksi.map((detail) => (
                                        <div key={detail.id_dt} className="border-bottom py-2">
                                            <p><strong>Item Name:</strong> {detail.barang?.nama_barang}</p>
                                            <p><strong>Item Code:</strong> {detail.barang?.kode_barang || 'N/A'}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p>No items associated with this payment</p>
                                )}
                            </div>
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="success"
                        className="text-black"
                        onClick={() => handleVerify('Berhasil')}
                        disabled={selectedPayment?.status_pembayaran !== 'Menunggu Verifikasi'}
                    >
                        Mark as Berhasil
                    </Button>
                    <Button
                        variant="success"
                        className="text-black"
                        onClick={() => handleVerify('Tidak Valid')}
                        disabled={selectedPayment?.status_pembayaran !== 'Menunggu Verifikasi'}
                    >
                        Mark as Tidak Valid
                    </Button>
                    <Button variant="secondary" onClick={closeModal}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default VerifPembayaranPage;