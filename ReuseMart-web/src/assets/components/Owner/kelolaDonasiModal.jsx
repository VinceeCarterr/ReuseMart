import { useEffect, useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';

const KelolaDonasiModal = ({ show, onHide }) => {
    const [reqDonasiList, setReqDonasiList] = useState([]);
    const [barangList, setBarangList] = useState([]);

    const [selectedReqId, setSelectedReqId] = useState('');
    const [selectedBarangId, setSelectedBarangId] = useState('');

    const fetchData = async () => {
        try {
            const tempReq = await api.get('/reqDonasi/all');
            const tempBarang = await api.get('/barang'); 
            setReqDonasiList(tempReq.data);
            setBarangList(tempBarang.data);
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
                tanggal_donasi: new Date().toISOString().slice(0, 10)
            });


            await api.put(`/barang/${selectedBarangId}/updateStatus`);


            await api.put(`/user/add-point-by-barang/${selectedBarangId}`);

            onHide();
            setSelectedReqId('');
            setSelectedBarangId('');
        } catch (error) {
            console.error("Gagal daftar transaksi:", error);
            alert("Gagal membuat transaksi.");
        }
    };

    return (
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
                                    {reqDonasiList.map((req) => (
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
                                    {barangList.filter((barang) => barang.status_periode === "Barang untuk Donasi")
                                    .map((barang) => (
                                        <option key={barang.id_barang} value={barang.id_barang}>
                                            {barang.nama_barang}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <br />
                    <Button variant="success" onClick={handleSubmit}>
                        Daftarkan Donasi
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default KelolaDonasiModal;
