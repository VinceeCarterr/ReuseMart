import React, { useEffect, useState } from "react";
import { Container, Row, Col, Table, Button, Form, Toast, Modal, Spinner } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import { Pencil, Trash } from 'lucide-react';
import api from "../../../api/api.js";
import NavbarGudang from "../../components/Navbar/navbarGudang.jsx";
import UpdateBarangModal from "../../components/gudang/updateBarangModal.jsx";
import DetailBarangModal from "../../components/gudang/detailBarangModal.jsx";

const GudangPage = () => {
    const [listBarang, setListBarang] = useState([]);
    const [listPenitipan, setListPenitipan] = useState([]);
    const [listUser, setListUser] = useState([]);
    const [listPegawai, setListPegawai] = useState([]);
    const [listFotoBarang, setListFotoBarang] = useState([]);
    const [kategori, setKategori] = useState([]);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [selectedBarangId, setSelectedBarangId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [pencarian, setPencarian] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [barangToDelete, setBarangToDelete] = useState(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedBarang, setSelectedBarang] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                await Promise.all([
                    fetchBarang(),
                    fetchPenitipan(),
                    fetchUser(),
                    fetchPegawai(),
                    fetchFotoBarang(),
                    fetchKategori(),
                ]);
            } catch (err) {
                console.error('Error fetching data:', err);
                showToastMessage('Failed to fetch data', 'danger');
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const fetchFotoBarang = async () => {
        try {
            const res = await api.get('/fotoGudang');
            setListFotoBarang(res.data);
        } catch (err) {
            console.error('Failed to fetch Foto Barang:', err);
            showToastMessage('Failed to fetch foto barang', 'danger');
        }
    };

    const fetchPegawai = async () => {
        try {
            const res = await api.get('/pegawaiGudang');
            setListPegawai(res.data);
        } catch (err) {
            console.error('Failed to fetch Pegawai:', err);
            showToastMessage('Failed to fetch Pegawai', 'danger');
        }
    };

    const fetchBarang = async () => {
        try {
            const res = await api.get('/barang');
            setListBarang(res.data);
        } catch (err) {
            console.error('Failed to fetch Barang:', err);
            showToastMessage('Failed to fetch items', 'danger');
        }
    };

    const fetchPenitipan = async () => {
        try {
            const res = await api.get('/penitipan');
            setListPenitipan(res.data);
        } catch (err) {
            console.error('Failed to fetch Penitipan:', err);
            showToastMessage('Failed to fetch penitipan', 'danger');
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/user/public');
            setListUser(res.data);
        } catch (err) {
            console.error('Failed to fetch User:', err);
            showToastMessage('Failed to fetch User', 'danger');
        }
    };

    const fetchKategori = async () => {
        try {
            const response = await api.get('/kategoriGudang');
            if (response.status === 200) {
                setKategori(response.data);
            } else {
                console.error("Failed to fetch categories: Status", response.status);
            }
        } catch (error) {
            console.error("Error fetching categories:", error.message);
        }
    };

    const showToastMessage = (message, variant = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setShowToast(true);
    };

    const handleDeleteBarang = async (id) => {
        if (barangToDelete) {
            try {
                const relatedFotos = listFotoBarang.filter(foto => foto.id_barang === id);
                for (const foto of relatedFotos) {
                    await api.delete(`/deleteFoto/${foto.id_foto}`);
                }
                await api.delete(`/deleteBarang/${id}`);
                fetchBarang();
                showToastMessage('Item and all associated photos deleted successfully');
            } catch (err) {
                console.error('Failed to delete Barang:', err);
                showToastMessage('Failed to delete item', 'danger');
            } finally {
                setShowDeleteModal(false);
                setBarangToDelete(null);
            }
        }
    };

    const confirmDelete = (id) => {
        setBarangToDelete(id);
        setShowDeleteModal(true);
    };

    const handleEditBarang = (id) => {
        setSelectedBarangId(id);
        setShowUpdateModal(true);
    };

    const handleCloseUpdateModal = () => {
        setShowUpdateModal(false);
        setSelectedBarangId(null);
    };

    const handleUpdateSuccess = ({ success, message }) => {
        if (success) {
            Promise.all([fetchBarang(), fetchFotoBarang()]).then(() => {
                showToastMessage(message);
            });
        } else {
            showToastMessage(message, 'danger');
        }
    };

    const handleShowDetail = (barang) => {
        setSelectedBarang(barang);
        setShowDetailModal(true);
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedBarang(null);
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

    const getKategoriName = (id) => {
        for (const categoryGroup of kategori) {
            const subKategoriMatch = categoryGroup.sub_kategori.find(sub => sub.id === id);
            if (subKategoriMatch) {
                return categoryGroup.nama_kategori || 'N/A';
            }
        }
        return 'N/A';
    };

    const filteredList = listBarang.filter(barang => {
        const searchTerm = pencarian.toLowerCase();

        // Barang fields
        const namaBarang = barang.nama_barang?.toLowerCase().includes(searchTerm) || false;
        const kodeBarang = barang.kode_barang?.toLowerCase().includes(searchTerm) || false;
        const harga = barang.harga?.toString().includes(searchTerm) || false;
        const status = barang.status?.toLowerCase().includes(searchTerm) || false;
        const statusPeriode = barang.status_periode?.toLowerCase().includes(searchTerm) || false;
        const subKategori = barang.sub_kategori?.toLowerCase().includes(searchTerm) || false;
        const tanggalTitip = barang.tanggal_titip
            ? new Date(barang.tanggal_titip).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            }).toLowerCase().includes(searchTerm)
            : false;

        // Related data
        const kategori = getKategoriName(barang.id_kategori)?.toLowerCase().includes(searchTerm) || false;
        const penitip = getUserByBarang(barang.id_barang);
        const namaLengkapPenitip = penitip
            ? `${penitip.first_name} ${penitip.last_name}`.toLowerCase().includes(searchTerm)
            : false;
        const pegawai = getPegawaiByBarang(barang.id_barang);
        const namaLengkapPegawai = pegawai
            ? `${pegawai.first_name} ${pegawai.last_name}`.toLowerCase().includes(searchTerm)
            : false;
        const tanggalSelesai = hitungTanggalSelesai(barang.id_barang)?.toLowerCase().includes(searchTerm) || false;

        // Return true if any field matches
        return (
            namaBarang ||
            kodeBarang ||
            harga ||
            status ||
            statusPeriode ||
            subKategori ||
            tanggalTitip ||
            kategori ||
            namaLengkapPenitip ||
            namaLengkapPegawai ||
            tanggalSelesai
        );
    });

    return (
        <div>
            <NavbarGudang />
            <Container className="mt-5" style={{ background: 'none' }}>
                <Row>
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={4}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar Barang</h2>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    type="search"
                                    placeholder="Nama Barang, Nama Pegawai, Nama Penitip, Kategori..."
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

            <Container className="mt-4" style={{ background: 'none' }}>
                <Row>
                    <Col md={12} className="mx-auto">
                        {isLoading ? (
                            <div className="text-center mt-4">
                                <Spinner animation="border" variant="success" />
                                <p className="mt-2">Loading data...</p>
                            </div>
                        ) : filteredList.length > 0 ? (
                            <Table striped bordered hover responsive>
                                <thead>
                                    <tr>
                                        <th>Nama Barang</th>
                                        <th>Kode Barang</th>
                                        <th>Harga</th>
                                        <th>Status</th>
                                        <th>Status Periode</th>
                                        <th>Kategori</th>
                                        <th>Tanggal Titip</th>
                                        <th>Tanggal Selesai</th>
                                        <th>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredList.map(barang => (
                                        <tr
                                            key={barang.id_barang}
                                            onClick={() => handleShowDetail(barang)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <td>{barang.nama_barang}</td>
                                            <td>{barang.kode_barang}</td>
                                            <td>Rp {barang.harga.toLocaleString()}</td>
                                            <td>{barang.status}</td>
                                            <td>{barang.status_periode}</td>
                                            <td>{getKategoriName(barang.id_kategori)}</td>
                                            <td>
                                                {barang.tanggal_titip
                                                    ? new Date(barang.tanggal_titip).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'long',
                                                        year: 'numeric',
                                                    })
                                                    : 'Unknown Date'}
                                            </td>
                                            <td>{hitungTanggalSelesai(barang.id_barang)}</td>
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <Button
                                                    variant="outline-primary"
                                                    className="me-2"
                                                    onClick={() => handleShowDetail(barang)}
                                                >
                                                    Detail
                                                </Button>
                                                <Button
                                                    variant="outline-primary"
                                                    className="me-2"
                                                    onClick={() => handleEditBarang(barang.id_barang)}
                                                >
                                                    <Pencil size={18} />
                                                </Button>
                                                <Button
                                                    variant="outline-danger"
                                                    onClick={() => confirmDelete(barang.id_barang)}
                                                >
                                                    <Trash size={18} />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        ) : (
                            <div className="text-center text-muted mt-4">
                                <p>Tidak ada barang ditemukan.</p>
                            </div>
                        )}
                    </Col>
                </Row>
            </Container>

            <UpdateBarangModal
                show={showUpdateModal}
                onHide={handleCloseUpdateModal}
                barangId={selectedBarangId}
                onUpdate={handleUpdateSuccess}
            />

            <DetailBarangModal
                show={showDetailModal}
                onHide={handleCloseDetailModal}
                barang={selectedBarang}
                penitipanUser={selectedBarang ? getUserByBarang(selectedBarang.id_barang) : null}
                barangPegawai={selectedBarang ? getPegawaiByBarang(selectedBarang.id_barang) : null}
                tanggalSelesai={selectedBarang ? hitungTanggalSelesai(selectedBarang.id_barang) : null}
                listFotoBarang={listFotoBarang}
            />

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Hapus</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Apakah Anda yakin ingin menghapus barang ini? Tindakan ini tidak dapat dibatalkan.
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Batal
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteBarang(barangToDelete)}>
                        Hapus
                    </Button>
                </Modal.Footer>
            </Modal>

            <Toast
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={3000}
                autohide
                bg={toastVariant}
                style={{
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    minWidth: '300px',
                    zIndex: 1050
                }}
            >
                <Toast.Header>
                    <strong className="me-auto">{toastVariant === 'success' ? 'Sukses' : 'Error'}</strong>
                </Toast.Header>
                <Toast.Body>{toastMessage}</Toast.Body>
            </Toast>
        </div>
    );
};

export default GudangPage;  