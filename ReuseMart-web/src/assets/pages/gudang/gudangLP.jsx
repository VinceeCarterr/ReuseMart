import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Form, Toast, ToastContainer, Image } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { Pencil, Trash } from 'lucide-react';
import api from "../../../api/api.js";
import NavbarGudang from "../../components/Navbar/navbarGudang.jsx";
import UpdateBarangModal from "../../components/gudang/updateBarangModal.jsx";

const BarangCard = ({ barang, penitipanUser, barangPegawai, tanggalSelesai, onDelete, onEdit }) => {
    return (
        <Col md={6} className="mx-auto mb-4">
            <Card className="req-card h-100">
                <Card.Body>
                    <Row>
                        <Col xs={4}>
                            <Image
                                src={`http://127.0.0.1:8000/storage/${barang.foto?.[0]?.path ?? 'defaults/no-image.png'}`}
                                thumbnail
                            />
                        </Col>
                        <Col xs={8}>
                            <div>
                                <h5 className="mb-2"> {barang.nama_barang}</h5>
                            </div>
                            <div>
                                <strong>Harga:</strong> Rp {barang.harga.toLocaleString()}
                            </div>
                            <div>
                                <strong>Status:</strong> {barang.status}
                            </div>
                            <div>
                                <strong>Status Periode:</strong> {barang.status_periode}
                            </div>
                            <div>
                                <strong>Nama Penitip:</strong> {penitipanUser
                                    ? `${penitipanUser.first_name} ${penitipanUser.last_name}`.trim()
                                    : 'Unknown User'}
                            </div>
                            <div>
                                <strong>Nama Pegawai:</strong> {barangPegawai
                                    ? `${barangPegawai.first_name} ${barangPegawai.last_name}`.trim()
                                    : 'Unknown User'}
                            </div>
                            <div>
                                <strong>Tanggal Titip:</strong> {new Date(barang.tanggal_titip).toLocaleDateString('id-ID', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </div>
                            <div>
                                <strong>Tanggal Selesai:</strong> {tanggalSelesai ? tanggalSelesai : 'Unknown Date'}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
                <Card.Footer className="text-end">
                    <Button variant="outline-primary" className="me-2" onClick={() => onEdit(barang.id_barang)}>
                        <Pencil size={18} /> Edit
                    </Button>
                    <Button variant="outline-danger" onClick={() => onDelete(barang.id_barang)}>
                        <Trash size={18} /> Delete
                    </Button>
                </Card.Footer>
            </Card>
        </Col>
    );
};

const GudangPage = () => {
    const [listBarang, setListBarang] = useState([]);
    const [listPenitipan, setListPenitipan] = useState([]);
    const [listUser, setListUser] = useState([]);
    const [listPegawai, setListPegawai] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBarangId, setSelectedBarangId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [pencarian, setPencarian] = useState("");

    useEffect(() => {
        fetchBarang();
        fetchPenitipan();
        fetchUser();
        fetchPegawai();
    }, []);

    const fetchPegawai = async () => {
        try {
            const res = await api.get('/pegawaiGudang');
            setListPegawai(res.data);
        } catch (err) {
            console.error('Failed to fetch Pegawai:', err);
            showToastMessage('Failed to fetch Pegawai');
        }
    };

    const fetchBarang = async () => {
        try {
            const res = await api.get('/barang');
            setListBarang(res.data);
        } catch (err) {
            console.error('Failed to fetch Barang:', err);
            showToastMessage('Failed to fetch items');
        }
    };

    const fetchPenitipan = async () => {
        try {
            const res = await api.get('/penitipan');
            setListPenitipan(res.data);
        } catch (err) {
            console.error('Failed to fetch Penitipan:', err);
            showToastMessage('Failed to fetch penitipan');
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/user/public');
            setListUser(res.data);
        } catch (err) {
            console.error('Failed to fetch User:', err);
            showToastMessage('Failed to fetch User');
        }
    };

    const showToastMessage = (message) => {
        setToastMessage(message);
        setShowToast(true);
    };

    const handleDeleteBarang = async (id) => {
        if (window.confirm('Are you sure you want to delete this item?')) {
            try {
                await api.delete(`/barang/${id}`);
                fetchBarang();
                showToastMessage('Item deleted successfully');
            } catch (err) {
                console.error('Failed to delete Barang:', err);
                showToastMessage('Failed to delete item');
            }
        }
    };

    const handleEditBarang = (id) => {
        setSelectedBarangId(id);
        setShowUpdateModal(true);
    };

    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false);
        setSelectedBarangId(null);
    };

    const handleUpdateSuccess = () => {
        fetchBarang(); // Refresh barang list
    };

    const getPegawaiByBarang = (barangId) => {
        const barang = listBarang.find(b => b.id_barang === barangId);
        if (!barang) return null;
        return listPegawai.find(p => p.id_pegawai === barang.id_pegawai) || null;
    };

    const getUserByBarang = (barangId) => {
        const barang = listBarang.find(b => b.id_barang === barangId);
        if (!barang || !barang.id_penitipan) return null;
        const penitipan = listPenitipan.find(p => p.id_penitipan === barang.id_penitipan);
        return penitipan ? listUser.find(u => u.id_user === penitipan.id_user) : null;
    };

    const hitungTanggalSelesai = (barangId) => {
        const barang = listBarang.find(b => b.id_barang === barangId);
        if (!barang) return null;
        const tanggalMasuk = new Date(barang.tanggal_titip);
        const tanggalSelesai = new Date(tanggalMasuk);

        if (barang.status_periode === 'Periode 1') {
            tanggalSelesai.setDate(tanggalSelesai.getDate() + 30);
        } else if (barang.status_periode === 'Periode 2') {
            tanggalSelesai.setDate(tanggalSelesai.getDate() + 60);
        }

        return tanggalSelesai.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const filteredList = listBarang.filter(barang => {
        const namabarang = barang.nama_barang.toLowerCase().includes(pencarian.toLowerCase());
        const status = barang.status.toLowerCase().includes(pencarian.toLowerCase());
        const status_periode = barang.status_periode.toLowerCase().includes(pencarian.toLowerCase());

        const penitip = getUserByBarang(barang.id_barang);
        const pegawai = getPegawaiByBarang(barang.id_barang);

        const namaLengkapPenitip = penitip
            ? `${penitip.first_name} ${penitip.last_name}`.toLowerCase()
            : '';
        const namaLengkapPegawai = pegawai
            ? `${pegawai.first_name} ${pegawai.last_name}`.toLowerCase()
            : '';

        const cocokPenitip = namaLengkapPenitip.includes(pencarian.toLowerCase());
        const cocokPegawai = namaLengkapPegawai.includes(pencarian.toLowerCase());

        return namabarang || status || status_periode || cocokPenitip || cocokPegawai;
    });

    return (
        <div>
            <NavbarGudang />
            <Container className="mt-5">
                <Row>
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={4}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar Barang</h2>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    type="search"
                                    placeholder="Nama Barang, Nama Pegawai, Nama Penitip . . ."
                                    className="me-2"
                                    value={pencarian}
                                    onChange={(e) => setPencarian(e.target.value)}
                                />
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                                <NavLink to="/tambahBarang">
                                    <Button variant="success">Tambah Barang</Button>
                                </NavLink>
                            </Col>
                        </Row>
                        <hr />
                    </Col>
                </Row>
            </Container>

            <Container className="mt-4">
                <Row>
                    {filteredList.length > 0 ? (
                        filteredList.map(barang => (
                            <BarangCard
                                key={barang.id_barang}
                                barang={barang}
                                penitipanUser={getUserByBarang(barang.id_barang)}
                                barangPegawai={getPegawaiByBarang(barang.id_barang)}
                                tanggalSelesai={hitungTanggalSelesai(barang.id_barang)}
                                onDelete={handleDeleteBarang}
                                onEdit={handleEditBarang}
                            />
                        ))
                    ) : (
                        <Col className="text-center text-muted mt-4">
                            <p>Tidak ada barang ditemukan.</p>
                        </Col>
                    )}
                </Row>
            </Container>

            <UpdateBarangModal
                show={showUpdateModal}
                onHide={handleCloseUpdateModal}
                barangId={selectedBarangId}
                onUpdate={handleUpdateSuccess}
            />

            <ToastContainer position="top-end" className="p-3">
                <Toast show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
                    <Toast.Header>
                        <strong className="me-auto">Notification</strong>
                    </Toast.Header>
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default GudangPage;