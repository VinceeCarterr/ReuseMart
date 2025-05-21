import { useState, useEffect } from 'react';
import api from '../../../api/api.js';
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';

const AddBarangModal = ({ show, onHide }) => {
    const [userList, setUserList] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [namaBarang, setNamaBarang] = useState('');
    const [mainKategoriIdx, setMainKategoriIdx] = useState('');
    const [kategoriBarang, setKategoriBarang] = useState('');
    const [selectedPegawai, setSelectedPegawai] = useState('');
    const [selectedUser, setSelectedUser] = useState('');
    const [deskripsi, setDeskripsi] = useState('');
    const [harga, setHarga] = useState('');
    const [garansi, setGaransi] = useState('');
    const [tanggalTitip, setTanggalTitip] = useState('');
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (show) {
            setNamaBarang('');
            setMainKategoriIdx('');
            setKategoriBarang('');
            setSelectedPegawai('');
            setSelectedUser('');
            setDeskripsi('');
            setHarga('');
            setGaransi('');
            setTanggalTitip('');
            fetchData();
        }
    }, [show]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tempUser, tempKategori, tempPegawai] = await Promise.all([
                api.get('/user/gudang'),
                api.get('/kategori'),
                api.get('/pegawai'),
            ]);
            setUserList(tempUser.data);
            setKategoriList(tempKategori.data);
            setPegawaiList(tempPegawai.data);
        } catch (error) {
            setToastMessage('Gagal memuat data: ' + error.message);
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!namaBarang || !harga || !selectedUser || !selectedPegawai || !mainKategoriIdx) {
            setToastMessage('Harap isi semua kolom wajib!');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        setLoading(true);
        const payload = new FormData();
        payload.append('nama_barang', namaBarang);
        payload.append('harga', harga);
        payload.append('id_user', selectedUser);
        payload.append('id_pegawai', selectedPegawai);
        payload.append('kategori_barang', kategoriBarang);
        if (deskripsi) payload.append('deskripsi', deskripsi);
        if (garansi) payload.append('garansi', garansi);
        if (tanggalTitip) payload.append('tanggal_titip', tanggalTitip);

        try {
            await api.post('/barang', payload, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setToastMessage('Barang berhasil ditambahkan!');
            setToastVariant('success');
            setShowToast(true);
            onHide();
        } catch (error) {
            setToastMessage('Gagal menambahkan barang: ' + error.message);
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Modal show={show} onHide={onHide} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Tambah Barang</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="mt-3">
                            <Col>
                                <Form.Group controlId="formNamaBarang">
                                    <Form.Label>Nama Barang *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Masukkan nama barang"
                                        value={namaBarang}
                                        onChange={(e) => setNamaBarang(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formHarga">
                                    <Form.Label>Harga Barang *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        placeholder="Masukkan harga barang"
                                        value={harga}
                                        onChange={(e) => setHarga(e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group controlId="formPenitip">
                                    <Form.Label>Pilih Nama Penitip *</Form.Label>
                                    <Form.Select
                                        value={selectedUser}
                                        onChange={(e) => setSelectedUser(e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih</option>
                                        {userList
                                            .filter((user) => user.id_role === 2)
                                            .map((user) => (
                                                <option key={user.id_user} value={user.id_user}>
                                                    {user.first_name} {user.last_name}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formPegawai">
                                    <Form.Label>Pilih Pegawai *</Form.Label>
                                    <Form.Select
                                        value={selectedPegawai}
                                        onChange={(e) => setSelectedPegawai(e.target.value)}
                                        required
                                    >
                                        <option value="">Pilih</option>
                                        {pegawaiList
                                            .filter((pegawai) => pegawai.id_jabatan === 3)
                                            .map((pegawai) => (
                                                <option key={pegawai.id_pegawai} value={pegawai.id_pegawai}>
                                                    {pegawai.first_name} {pegawai.last_name}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group controlId="formMainKategori">
                                    <Form.Label>Kategori Utama *</Form.Label>
                                    <Form.Select
                                        name="mainKategoriIdx"
                                        value={mainKategoriIdx}
                                        onChange={(e) => {
                                            setMainKategoriIdx(e.target.value);
                                            setKategoriBarang('');
                                        }}
                                        required
                                    >
                                        <option value="">Pilih Kategori</option>
                                        {kategoriList.map((cat, idx) => (
                                            <option key={cat.nama_kategori} value={idx}>
                                                {cat.nama_kategori}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formSubKategori">
                                    <Form.Label>Sub Kategori</Form.Label>
                                    <Form.Select
                                        name="kategori_barang"
                                        value={kategoriBarang}
                                        onChange={(e) => setKategoriBarang(e.target.value)}
                                        disabled={mainKategoriIdx === ''}
                                    >
                                        <option value="">Pilih Sub Kategori</option>
                                        {mainKategoriIdx !== '' &&
                                            kategoriList[mainKategoriIdx]?.sub_kategori.map((sub) => (
                                                <option key={sub.id} value={sub.nama}>
                                                    {sub.nama}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group controlId="formGaransi">
                                    <Form.Label>Garansi (opsional)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={garansi}
                                        onChange={(e) => setGaransi(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formTanggalTitip">
                                    <Form.Label>Tanggal Titip (opsional)</Form.Label>
                                    <Form.Control
                                        type="date"
                                        placeholder="Masukkan tanggal barang dititipkan"
                                        value={tanggalTitip}
                                        onChange={(e) => setTanggalTitip(e.target.value)}
                                        max={today}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group controlId="formDeskripsi">
                                    <Form.Label>Deskripsi (opsional)</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        placeholder="Masukkan deskripsi barang"
                                        value={deskripsi}
                                        onChange={(e) => setDeskripsi(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={onHide} disabled={loading}>
                        Batal
                    </Button>
                    <Button variant="primary" type="submit" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </Modal.Footer>
            </Modal>

            <ToastContainer position="top-end" className="p-3">
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Header>
                        <strong className="me-auto">
                            {toastVariant === 'success' ? 'Sukses' : 'Error'}
                        </strong>
                    </Toast.Header>
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </>
    );
};

export default AddBarangModal;
