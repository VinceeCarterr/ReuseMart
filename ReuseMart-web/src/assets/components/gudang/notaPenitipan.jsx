import { useEffect, useState } from 'react';
import api from "../../../api/api.js";
import { Modal, Button, Row, Col, Toast, ToastContainer } from 'react-bootstrap';

const cekGaransi = (garansi, today) => {
    if (!garansi) return '';
    const garansiDate = new Date(garansi);
    if (isNaN(garansiDate)) return '';
    return garansiDate >= new Date(today) ? `Garansi ON ${garansi}` : '';
};

const NotaPenitipan = ({ show, onHide, penitipanId }) => {
    const [barangList, setBarangList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [penitipanList, setPenitipanList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [alamatList, setAlamatList] = useState([]);
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const fetchData = async () => {
        try {
            const [tempPenitipan, tempBarang, tempUser, tempAlamat, tempPegawai] = await Promise.all([
                api.get('/penitipan'),
                api.get('/barangGudang'),
                api.get('/user/gudang'),
                api.get('/alamat/gudang'),
                api.get('/pegawaiGudang'),
            ]);
            setPenitipanList(tempPenitipan.data || []);
            setBarangList(tempBarang.data || []);
            setUserList(tempUser.data || []);
            setAlamatList(tempAlamat.data || []);
            setPegawaiList(tempPegawai.data || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            setToastMessage('Gagal memuat data: ' + (error.message || 'Unknown error'));
            setToastVariant('danger');
            setToastShow(true);
        }
    };

    useEffect(() => {
        if (show && penitipanId) fetchData();
    }, [show, penitipanId]);

    const showToast = (message, variant = "success") => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };

    const getPegawaiByBarang = (barang) => {
        if (!barang || !barang.id_pegawai) return null;
        return pegawaiList.find(p => p.id_pegawai === barang.id_pegawai) || null;
    };

    const getUserByPenitipan = (penitipan) => {
        if (!penitipan || !penitipan.id_user) return null;
        return userList.find(u => u.id_user === penitipan.id_user) || null;
    };

    const getAlamatByUser = (user) => {
        if (!user || !user.id_user) return null;
        const defaultAlamat = alamatList.find(a => a.id_user === user.id_user && a.isDefault === 1);
        return defaultAlamat || alamatList.find(a => a.id_user === user.id_user) || { alamat: 'Alamat tidak ditemukan' };
    };

    const getBarangByPenitipan = (penitipanId) => {
        return barangList.filter(b => b.id_penitipan === penitipanId) || [];
    };

    const currentPenitipan = penitipanList.find(p => p.id_penitipan === penitipanId);
    const currentUser = currentPenitipan ? getUserByPenitipan(currentPenitipan) : null;
    const currentAlamat = currentUser ? getAlamatByUser(currentUser) : null;
    const currentBarangList = getBarangByPenitipan(penitipanId);
    const currentPegawai = currentBarangList.length > 0 ? getPegawaiByBarang(currentBarangList[0]) : null;

    const today = new Date().toISOString().split('T')[0];
    const tanggalTitip = currentBarangList.length > 0 ? currentBarangList[0].tanggal_titip : today;
    const masaSampai = tanggalTitip 
        ? new Date(new Date(tanggalTitip).setDate(new Date(tanggalTitip).getDate() + 30)).toISOString().split('T')[0]
        : new Date(new Date(today).setDate(new Date(today).getDate() + 30)).toISOString().split('T')[0];

    return (
        <div>
            <Modal show={show} onHide={onHide} centered backdrop="static">
                <Modal.Header closeButton>
                    <Modal.Title>Rincian Nota</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div style={{ padding: '10px', border: '1px solid #000', borderRadius: '5px' }}>
                        <Row>
                            <strong>ReUse Mart</strong><br />
                            <small>Jl. Green Eco Park No. 456 Yogyakarta</small>
                        </Row>
                        <hr />
                        <Row>
                            <p>Tanggal Penitipan: {tanggalTitip}</p>
                            <p>Masa Sampai: {masaSampai}</p>
                        </Row>
                        <hr />
                        <Row>
                            <p>
                                <strong>Penitip:</strong> {currentUser ? `T${currentUser.id_user} - ${currentUser.first_name} ${currentUser.last_name}` : 'Unknown'}<br />
                                {currentAlamat ? currentAlamat.alamat : 'Tidak ada'}<br />
                                {(currentAlamat && currentAlamat.kecamatan && currentAlamat.kota) 
                                    ? `${currentAlamat.kecamatan}, ${currentAlamat.kota}` 
                                    : ''}
                            </p>
                        </Row>
                        <hr />
                        {currentBarangList.map((barang, index) => (
                            <Row key={index} className="mb-2">
                                <Col xs={8}>
                                    <p>{barang.nama_barang}<br />
                                    {cekGaransi(barang.garansi, today)}</p>
                                </Col>
                                <Col xs={4} className="text-end">
                                    <p>{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(barang.harga || 0)}</p>
                                </Col>
                            </Row>
                        ))}
                        <hr />
                        <Row>
                            <p>
                                <strong>Diterima dan QC Oleh:</strong> {currentPegawai ? `P${currentPegawai.id_pegawai} - ${currentPegawai.first_name} ${currentPegawai.last_name}` : 'Unknown'}
                            </p>
                        </Row>
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide}>Tutup</Button>
                </Modal.Footer>
            </Modal>
            <ToastContainer className="position-fixed top-50 start-50 translate-middle z-3" style={{ minWidth: '200px' }}>
                <Toast show={toastShow} onClose={() => setToastShow(false)} delay={3000} autohide bg={toastVariant}>
                    <Toast.Header><strong className="me-auto">{toastVariant === 'success' ? 'Sukses' : 'Error'}</strong></Toast.Header>
                    <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default NotaPenitipan;