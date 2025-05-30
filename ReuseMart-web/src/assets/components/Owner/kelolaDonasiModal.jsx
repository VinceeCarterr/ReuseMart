import { useEffect, useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';

const KelolaDonasiModal = ({ show, onHide }) => {
    const [reqDonasiList, setReqDonasiList] = useState([]);
    const [barangList, setBarangList] = useState([]);
    const [donasiList, setDonasiList] = useState([]);
    const [selectedReqId, setSelectedReqId] = useState('');
    const [selectedBarangId, setSelectedBarangId] = useState('');
    const [namaPenerima, setNamaPenerima] = useState(''); // New state for nama penerima
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    const fetchData = async () => {
        try {
            const tempReq = await api.get('/reqDonasi/all');
            const tempBarang = await api.get('/barang');
            const tempDonasi = await api.get('/donasi');
            setReqDonasiList(tempReq.data);
            setBarangList(tempBarang.data);
            setDonasiList(tempDonasi.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        if (show) fetchData();
    }, [show]);

    const handleSubmit = async () => {
        try {
            await api.post('/donasi/tambah', {
                id_reqdonasi: selectedReqId,
                id_barang: selectedBarangId,
                nama_penerima: namaPenerima, // Include nama penerima in the payload
                tanggal_donasi: new Date().toISOString().slice(0, 10)
            });

            await api.put(`/barang/${selectedBarangId}/updateStatus`);
            await api.put(`/user/add-point-by-barang/${selectedBarangId}`);

            onHide();
            setSelectedReqId('');
            setSelectedBarangId('');
            setNamaPenerima(''); // Reset nama penerima
            showToast("Berhasil Melakukan Donasi");
        } catch (error) {
            console.error("Gagal daftar transaksi:", error);
            showToast("Gagal membuat transaksi.", "danger");
        }
    };

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const isReqDonasiDone = (idReq) => {
        return donasiList.some(donasi => donasi.id_reqdonasi === idReq);
    };

    const filteredReqDonasiList = reqDonasiList.filter(req => !isReqDonasiDone(req.id_reqdonasi));

    return (
        <div>
            <Modal show={show} onHide={onHide} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Kelola Donasi</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label>Pilih Request Donasi</Form.Label>
                                    <Form.Select
                                        value={selectedReqId}
                                        onChange={(e) => setSelectedReqId(e.target.value)}
                                    >
                                        <option value="">Pilih</option>
                                        {filteredReqDonasiList.map((req) => (
                                            <option key={req.id_reqdonasi} value={req.id_reqdonasi}>
                                                {req.nama_barangreq}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label>Pilih Barang</Form.Label>
                                    <Form.Select
                                        value={selectedBarangId}
                                        onChange={(e) => setSelectedBarangId(e.target.value)}
                                    >
                                        <option value="">Pilih</option>
                                        {barangList.filter((barang) => barang.status === "Untuk Donasi")
                                            .map((barang) => (
                                                <option key={barang.id_barang} value={barang.id_barang}>
                                                    {barang.nama_barang}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Form.Group className="mt-3">
                                <Form.Label>Nama Penerima</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder="Masukkan nama penerima"
                                    value={namaPenerima}
                                    onChange={(e) => setNamaPenerima(e.target.value)}
                                />
                            </Form.Group>
                        </Row>
                        <br />
                        <Button 
                            variant="success" 
                            onClick={handleSubmit}
                            disabled={!selectedReqId || !selectedBarangId || !namaPenerima} // Disable button if fields are empty
                        >
                            Daftarkan Donasi
                        </Button>
                    </Form>
                </Modal.Body>
            </Modal>
            <ToastContainer className="position-fixed top-50 start-50 translate-middle z-3"
                style={{ minWidth: "300px" }}>
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

export default KelolaDonasiModal;