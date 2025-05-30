import NavbarGudang from '../../components/Navbar/navbarGudang.jsx';
import { useEffect, useState, Component } from 'react';
import { Container, Row, Col, Form, Button, Table } from 'react-bootstrap';
import { NavLink } from 'react-router-dom';
import NotaPenitipan from '../../components/gudang/notaPenitipan.jsx'; // Adjust the import path as needed
import api from '../../../api/api.js';

// Error Boundary to catch rendering errors
class ErrorBoundary extends Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    render() {
        if (this.state.error) {
            return (
                <div className="text-center text-danger">
                    <h3>Error Rendering Component</h3>
                    <p>{this.state.error.message}</p>
                </div>
            );
        }
        return this.props.children;
    }
}

const PenitipanBarang = () => {
    const [listBarang, setListBarang] = useState([]);
    const [listPenitipan, setListPenitipan] = useState([]);
    const [listUser, setListUser] = useState([]);
    const [listPegawai, setListPegawai] = useState([]);
    const [kategori, setKategori] = useState([]);
    const [pencarian, setPencarian] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showNota, setShowNota] = useState(false); // State for modal visibility
    const [selectedPenitipanId, setSelectedPenitipanId] = useState(null); // State for selected penitipan

    const showToastMessage = (message) => {
        alert(message); // Replace with react-toastify or similar
    };

    const handleShowDetail = (penitipanId) => {
        setSelectedPenitipanId(penitipanId);
        setShowNota(true);
    };

    const handleCloseNota = () => {
        setShowNota(false);
        setSelectedPenitipanId(null);
    };

    const fetchPegawai = async () => {
        try {
            const res = await api.get('/pegawaiGudang');
            setListPegawai(res.data);
        } catch (err) {
            console.error('Failed to fetch Pegawai:', err);
            setError('Failed to fetch Pegawai');
            showToastMessage('Failed to fetch Pegawai');
        }
    };

    const fetchBarang = async () => {
        try {
            const res = await api.get('/barang');
            setListBarang(res.data);
        } catch (err) {
            console.error('Failed to fetch Barang:', err);
            setError('Failed to fetch items');
            showToastMessage('Failed to fetch items');
        }
    };

    const fetchPenitipan = async () => {
        try {
            const res = await api.get('/penitipan');
            setListPenitipan(res.data);
        } catch (err) {
            console.error('Failed to fetch Penitipan:', err);
            setError('Failed to fetch penitipan');
            showToastMessage('Failed to fetch penitipan');
        }
    };

    const fetchUser = async () => {
        try {
            const res = await api.get('/user/public');
            setListUser(res.data);
        } catch (err) {
            console.error('Failed to fetch User:', err);
            setError('Failed to fetch User');
            showToastMessage('Failed to fetch User');
        }
    };

    const fetchKategori = async () => {
        try {
            const response = await api.get('/kategoriGudang');
            if (response.status === 200) {
                setKategori(response.data);
            } else {
                console.error('Failed to fetch categories: Status', response.status);
                setError('Failed to fetch categories');
            }
        } catch (error) {
            console.error('Error fetching categories:', error.message);
            setError('Error fetching categories');
        }
    };

    const getUserByPenitipan = (penitipanId) => {
        const penitipan = listPenitipan.find((p) => p.id_penitipan === penitipanId);
        if (!penitipan || !penitipan.id_user) return null;
        return listUser.find((u) => u.id_user === penitipan.id_user) || null;
    };

    const getBarangByPenitipan = (penitipanId) => {
        return listBarang.filter((b) => b.id_penitipan === penitipanId) || [];
    };

    const getPegawaiByPenitipan = (penitipanId) => {
        const barangList = getBarangByPenitipan(penitipanId);
        const pegawaiIds = [...new Set(barangList.map((b) => b.id_pegawai).filter((id) => id))];
        return pegawaiIds
            .map((id) => listPegawai.find((p) => p.id_pegawai === id))
            .filter((p) => p)
            .map((p) => `${p.first_name} ${p.last_name}`)
            .join(', ') || 'N/A';
    };

    const getEarliestTanggalTitip = (penitipanId) => {
        const barangList = getBarangByPenitipan(penitipanId);
        if (!barangList.length) return 'Unknown Date';
        const dates = barangList
            .filter((b) => b.tanggal_titip)
            .map((b) => new Date(b.tanggal_titip))
            .filter((d) => !isNaN(d.getTime()));
        if (!dates.length) return 'Unknown Date';
        const earliest = new Date(Math.min(...dates));
        return earliest.toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    const getKategoriName = (id) => {
        for (const categoryGroup of kategori) {
            const subKategoriMatch = categoryGroup.sub_kategori.find((sub) => sub.id === id);
            if (subKategoriMatch) {
                return categoryGroup.nama_kategori || 'N/A';
            }
        }
        return 'N/A';
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchBarang(),
                    fetchPenitipan(),
                    fetchUser(),
                    fetchPegawai(),
                    fetchKategori(),
                ]);
                console.log('Data fetched:', { listBarang, listPenitipan, listUser, listPegawai, kategori });
            } catch (err) {
                setError('Failed to load data');
                console.error('Fetch error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const filteredList = listPenitipan.filter((penitipan) => {
        const user = getUserByPenitipan(penitipan.id_penitipan);
        const namaPenitip = user
            ? `${user.first_name} ${user.last_name}`.toLowerCase()
            : '';
        const noNota = penitipan.no_nota?.toLowerCase().includes(pencarian.toLowerCase()) || false;
        const jumlahBarang = penitipan.jumlah_barang?.toString().includes(pencarian.toLowerCase()) || false;

        const barangList = getBarangByPenitipan(penitipan.id_penitipan);
        const namaBarang = barangList.some((b) =>
            b.nama_barang?.toLowerCase().includes(pencarian.toLowerCase())
        );
        const kategori = barangList.some((b) =>
            getKategoriName(b.id_kategori)?.toLowerCase().includes(pencarian.toLowerCase())
        );
        const subKategori = barangList.some((b) =>
            b.sub_kategori?.toLowerCase().includes(pencarian.toLowerCase())
        );
        const status = barangList.some((b) =>
            b.status?.toLowerCase().includes(pencarian.toLowerCase())
        );
        const statusPeriode = barangList.some((b) =>
            b.status_periode?.toLowerCase().includes(pencarian.toLowerCase())
        );
        const namaPegawai = getPegawaiByPenitipan(penitipan.id_penitipan)
            .toLowerCase()
            .includes(pencarian.toLowerCase());

        return (
            namaPenitip.includes(pencarian.toLowerCase()) ||
            noNota ||
            jumlahBarang ||
            namaBarang ||
            kategori ||
            subKategori ||
            status ||
            statusPeriode ||
            namaPegawai
        );
    });

    return (
        <ErrorBoundary>
            <div>
                <NavbarGudang />
                <Container className="mt-5" style={{ background: 'none' }}>
                    <Row>
                        <Col md={10} className="mx-auto">
                            <Row>
                                <Col md={6}>
                                    <h2 className="text-success fw-bold welcome-heading">Daftar Transaksi Penitipan</h2>
                                </Col>
                                <Col md={2}>
                                    <Form.Control
                                        type="search"
                                        placeholder="Nama Penitip, No Nota, Nama Pegawai, Kategori..."
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
                            {loading ? (
                                <div className="text-center">
                                    <p>Loading...</p>
                                </div>
                            ) : error ? (
                                <div className="text-center text-danger">
                                    <p>{error}</p>
                                </div>
                            ) : filteredList.length > 0 ? (
                                <Table striped bordered hover responsive>
                                    <thead>
                                        <tr>
                                            <th>Nama Penitip</th>
                                            <th>ID Penitipan</th>
                                            <th>No Nota</th>
                                            <th>Jumlah Barang</th>
                                            <th>Tanggal Titip</th>
                                            <th>Nama Pegawai</th>
                                            <th>Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredList.map((penitipan) => {
                                            const user = getUserByPenitipan(penitipan.id_penitipan);
                                            return (
                                                <tr
                                                    key={penitipan.id_penitipan}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <td>
                                                        {user
                                                            ? `${user.first_name} ${user.last_name}`
                                                            : 'N/A'}
                                                    </td>
                                                    <td>{penitipan.id_penitipan || 'N/A'}</td>
                                                    <td>{penitipan.no_nota || 'N/A'}</td>
                                                    <td>{penitipan.jumlah_barang || 'N/A'}</td>
                                                    <td>{getEarliestTanggalTitip(penitipan.id_penitipan)}</td>
                                                    <td>{getPegawaiByPenitipan(penitipan.id_penitipan)}</td>
                                                    <td onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                            variant="outline-primary"
                                                            className="me-2"
                                                            onClick={() => handleShowDetail(penitipan.id_penitipan)}
                                                        >
                                                            Detail
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </Table>
                            ) : (
                                <div className="text-center text-muted mt-4">
                                    <p>Tidak ada transaksi penitipan ditemukan.</p>
                                </div>
                            )}
                        </Col>
                    </Row>
                </Container>
                <NotaPenitipan
                    show={showNota}
                    onHide={handleCloseNota}
                    penitipanId={selectedPenitipanId}
                />
            </div>
        </ErrorBoundary>
    );
};

export default PenitipanBarang;