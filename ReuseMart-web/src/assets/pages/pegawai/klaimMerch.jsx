import React, { useState, useEffect } from "react";
import {
    Container,
    Row,
    Col,
    Button,
    Spinner,
    Table,
    Modal,
    Form,
    Toast,
    ToastContainer,
} from "react-bootstrap";
import {
    FiUser,
    FiHash,
    FiMail,
    FiPhone,
    FiGift,
    FiStar,
} from "react-icons/fi";
import api from "../../../api/api.js";
import NavbarCS from "../../components/Navbar/navbarCS.jsx";
import { useNavigate } from "react-router-dom";

const KlaimMerch = () => {
    const [userList, setUserList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [merchList, setMerchList] = useState([]);
    const [redeemList, setRedeemList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedRedeemId, setSelectedRedeemId] = useState(null);
    const [tanggalAmbil, setTanggalAmbil] = useState("");
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");
    const navigate = useNavigate();

    const profile = JSON.parse(localStorage.getItem("profile") || "{}");
    const type = localStorage.getItem("type");
    const currentPegawaiId = type === "pegawai" ? profile.id : null;

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [tempUser, tempPegawai, tempMerch, tempRedeem] = await Promise.all([
                api.get('/userCS'),
                api.get('/pegawaiCS'),
                api.get('/merchCS'),
                api.get('/redeemCS'),
            ]);

            setUserList(tempUser.data);
            setPegawaiList(tempPegawai.data);
            setMerchList(tempMerch.data);
            setRedeemList(tempRedeem.data);
            setError(null);
        } catch (err) {
            console.error('Fetch All Data Gagal', err);
            setError('Gagal memuat data. Silakan coba lagi nanti.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!currentPegawaiId || type !== "pegawai") {
            setError("Anda harus login sebagai pegawai terlebih dahulu.");
            setLoading(false);
            navigate("/login");
            return;
        }
        fetchAllData();
    }, [navigate]);

    const getUserByRedeem = (userId) => {
        const redeem = redeemList.find(r => r.id_user === userId);
        if (!redeem) return null;
        return userList.find(u => u.id_user === userId) || null;
    };

    const getMerchByRedeem = (merchID) => {
        const redeem = redeemList.find(r => r.id_merch === merchID);
        if (!redeem) return null;
        return merchList.find(m => m.id_merch === merchID) || null;
    };

    const getPegawaiByRedeem = (pegawaiID) => {
        const redeem = redeemList.find(p => p.id_pegawai === pegawaiID);
        if (!redeem) return null;
        return pegawaiList.find(p => p.id_pegawai === pegawaiID) || null;
    };

    const handleShowConfirmModal = (redeemId) => {
        setSelectedRedeemId(redeemId);
        setTanggalAmbil(new Date().toISOString().slice(0, 10));
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setShowConfirmModal(false);
        setSelectedRedeemId(null);
        setTanggalAmbil("");
    };

    const handleConfirmClaim = async () => {
        if (!currentPegawaiId) {
            setToastMessage("Pegawai tidak terautentikasi.");
            setToastVariant("danger");
            setToastShow(true);
            return;
        }
        try {
            await api.put(`/redeemCS/${selectedRedeemId}`, {
                tanggal_ambil: tanggalAmbil,
                id_pegawai: parseInt(currentPegawaiId), 
            });
            setToastMessage("Berhasil mengkonfirmasi claim.");
            setToastVariant("success");
            setToastShow(true);
            handleCloseConfirmModal();
            await fetchAllData();
        } catch (err) {
            console.error('Gagal mengkonfirmasi claim:', err);
            setToastMessage("Gagal mengkonfirmasi claim.");
            setToastVariant("danger");
            setToastShow(true);
        }
    };

    return (
        <>
            <div>
                <NavbarCS />
                <Container className="mt-5" style={{ background: 'none' }}>
                    <Row className="align-items-center mb-2">
                        <Col md={6}>
                            <h2 className="text-success fw-bold">Daftar Klaim Merch</h2>
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
                        <Container className="mt-4 text-center" style={{ background: 'none' }}>
                            <Col md={12} className="mx-auto">
                                {redeemList.length > 0 ? (
                                    <Table striped bordered hover responsive>
                                        <thead>
                                            <tr>
                                                <th>ID Redeem</th>
                                                <th>Nama User</th>
                                                <th>Nama Merchandise</th>
                                                <th>Tanggal Redeem</th>
                                                <th>Tanggal Ambil</th>
                                                <th>Nama CS</th>
                                                <th>Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {redeemList.map(redeem => {
                                                const user = getUserByRedeem(redeem.id_user);
                                                const merch = getMerchByRedeem(redeem.id_merch);
                                                const pegawai = getPegawaiByRedeem(redeem.id_pegawai);
                                                return (
                                                    <tr
                                                        key={redeem.id_redeem}
                                                        style={{ cursor: 'pointer' }}
                                                    >
                                                        <td>{redeem.id_redeem}</td>
                                                        <td>{user ? `${user.first_name} ${user.last_name}` : 'Unknown User'}</td>
                                                        <td>{merch ? merch.nama_merch : 'Unknown Merch'}</td>
                                                        <td>{redeem.tanggal_redeem || 'N/A'}</td>
                                                        <td>{redeem.tanggal_ambil || 'Belum Diambil'}</td>
                                                        <td>{pegawai ? `${pegawai.first_name} ${pegawai.last_name}` : 'Belum Diambil'}</td>
                                                        <td>
                                                            <Button
                                                                variant="outline-success"
                                                                onClick={() => handleShowConfirmModal(redeem.id_redeem)}
                                                                disabled={redeem.tanggal_ambil}
                                                            >
                                                                Konfirmasi Claim
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <div className="text-center text-muted mt-4">
                                        <p>Tidak ada barang ditemukan.</p>
                                    </div>
                                )}
                            </Col>
                        </Container>
                    )}
                </Container>

                {/* Modal for Confirming Claim */}
                <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered backdrop="static">
                    <Modal.Header closeButton>
                        <Modal.Title>Konfirmasi Claim Merch</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form>
                            <Form.Group>
                                <Form.Label>Tanggal Ambil</Form.Label>
                                <Form.Control
                                    type="date"
                                    value={tanggalAmbil}
                                    onChange={(e) => setTanggalAmbil(e.target.value)}
                                    required
                                />
                            </Form.Group>
                            <br />
                            <Button
                                variant="success"
                                onClick={handleConfirmClaim}
                                disabled={!tanggalAmbil}
                            >
                                Konfirmasi
                            </Button>
                        </Form>
                    </Modal.Body>
                </Modal>

                {/* Toast for Feedback */}
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
        </>
    );
};

export default KlaimMerch;