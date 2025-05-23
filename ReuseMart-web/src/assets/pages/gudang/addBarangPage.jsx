import { useState, useEffect } from 'react';
import { Tabs, Tab, Button, Form, Row, Col, Toast, ToastContainer, Container } from 'react-bootstrap';
import api from '../../../api/api.js';
import NavbarGudang from '../../components/Navbar/navbarGudang.jsx';

const AddBarangPage = () => {
    const [numBarangs, setNumBarangs] = useState(1);
    const [formData, setFormData] = useState([]);
    const [userList, setUserList] = useState([]);
    const [kategoriList, setKategoriList] = useState([]);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const initialFormData = Array.from({ length: numBarangs }, () => ({
            namaBarang: '',
            mainKategoriIdx: '',
            kategoriBarang: '',
            selectedPegawai: '',
            selectedUser: '',
            deskripsi: '',
            harga: '',
            garansi: '',
            tanggalTitip: '',
            jumlahFoto: '2',
            files: new Array(2).fill(null),
        }));
        setFormData(initialFormData);
        fetchData();
    }, [numBarangs]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [tempUser, tempKategori, tempPegawai] = await Promise.all([
                api.get('/user/gudang'),
                api.get('/kategori'),
                api.get('/pegawaiGudang'),
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

    useEffect(() => {
        setFormData((prev) =>
            prev.map((form) => {
                const isElektronik = kategoriList[form.mainKategoriIdx]?.nama_kategori === 'Elektronik & Gadget';
                return { ...form, garansi: isElektronik ? form.garansi : '' };
            })
        );
    }, [kategoriList]);

    const handleInputChange = (index, field, value) => {
        setFormData((prev) => {
            const newFormData = [...prev];
            newFormData[index] = { ...newFormData[index], [field]: value };
            return newFormData;
        });
    };

    const handleFileChange = (tabIndex, fileIndex, event) => {
        const newFiles = [...formData[tabIndex].files];
        newFiles[fileIndex] = event.target.files[0];
        handleInputChange(tabIndex, 'files', newFiles);
    };

    const handleSubmit = async () => {
    setLoading(true);
    let hasError = false;

    // Validasi form
    for (let i = 0; i < formData.length; i++) {
        const form = formData[i];
        if (!form.namaBarang || !form.harga || !form.selectedUser || !form.mainKategoriIdx || !form.selectedPegawai || !form.kategoriBarang) {
            setToastMessage(`Mohon lengkapi semua field yang wajib diisi pada tab ${i + 1}.`);
            setToastVariant('danger');
            setShowToast(true);
            hasError = true;
            break;
        }
    }

    if (hasError) {
        setLoading(false);
        return;
    }

    try {
        // Buat entri penitipan
        const penitipanPayload = {
            id_user: formData[0].selectedUser,
            jumlah_barang: formData.length,

        };

        console.log('penitipanPayload:', penitipanPayload);
        const penitipanRes = await api.post('/penitipan/addPenitipan', penitipanPayload);
        console.log('penitipanRes:', penitipanRes.data);

        // Pastikan id_penitipan ada di respons
        const idPenitipan = penitipanRes.data.id_penitipan || penitipanRes.data.id;
        if (!idPenitipan) {
            throw new Error('ID penitipan tidak ditemukan di respons API.');
        }

        // Buat entri barang untuk setiap form
        for (let i = 0; i < formData.length; i++) {
            const form = formData[i];

            // Cari subkategori di dalam array sub_kategori berdasarkan mainKategoriIdx
            const selectedMainKategori = kategoriList[form.mainKategoriIdx];
            if (!selectedMainKategori || !selectedMainKategori.sub_kategori) {
                setToastMessage(`Kategori utama pada tab ${i + 1} tidak valid atau tidak memiliki subkategori.`);
                setToastVariant('danger');
                setShowToast(true);
                setLoading(false);
                return;
            }

            const selectedSubKategori = selectedMainKategori.sub_kategori.find(
                (sub) => sub.nama === form.kategoriBarang
            );

            if (!selectedSubKategori) {
                setToastMessage(`Subkategori ${form.kategoriBarang} pada tab ${i + 1} tidak ditemukan di database.`);
                setToastVariant('danger');
                setShowToast(true);
                setLoading(false);
                return;
            }

            const barangPayload = {
                nama_barang: form.namaBarang,
                id_kategori: selectedSubKategori.id,
                id_penitipan: idPenitipan, 
                deskripsi: form.deskripsi,
                harga: parseFloat(form.harga),
                tanggal_titip: formData[0].tanggalTitip || today,
                garansi: form.garansi || null,
            };

            console.log(`barangPayload for tab ${i + 1}:`, barangPayload);
            const barangRes = await api.post('/barang/addBarang', barangPayload);
            console.log(`barangRes for tab ${i + 1}:`, barangRes.data);

            const idBarang = barangRes.data.id_barang;
            if (!idBarang) {
                throw new Error(`ID barang tidak ditemukan untuk barang pada tab ${i + 1}.`);
            }

            // Unggah foto
            const photoUploadPromises = form.files
                .filter((file) => file !== null)
                .map((file) => {
                    const fd = new FormData();
                    fd.append('foto', file);
                    fd.append('id_barang', idBarang);
                    return api.post('/foto', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    });
                });

            await Promise.all(photoUploadPromises);
        }

        setToastMessage('Semua barang berhasil ditambahkan.');
        setToastVariant('success');
        setShowToast(true);

        setFormData(
            Array.from({ length: numBarangs }, () => ({
                namaBarang: '',
                mainKategoriIdx: '',
                kategoriBarang: '',
                selectedPegawai: '',
                selectedUser: '',
                deskripsi: '',
                harga: '',
                garansi: '',
                tanggalTitip: '',
                jumlahFoto: '2',
                files: new Array(2).fill(null),
            }))
        );
    } catch (error) {
        console.error('Error saat menyimpan data:', error.response?.data || error.message);
        setToastMessage(`Terjadi kesalahan saat menyimpan data: ${error.response?.data?.message || error.message}`);
        setToastVariant('danger');
        setShowToast(true);
    } finally {
        setLoading(false);
    }
};

    return (
        <div>
            <NavbarGudang />
            <Container className="mt-5">
                <h2>Tambah Barang</h2>

                <Form.Group controlId="formNumBarangs" className="mb-3">
                    <Form.Label>Jumlah Barang</Form.Label>
                    <Form.Control
                        type="number"
                        min="1"
                        max="10"
                        value={numBarangs}
                        onChange={(e) => setNumBarangs(Math.max(1, parseInt(e.target.value)))}
                    />
                </Form.Group>

                <Tabs defaultActiveKey={0} id="barang-tabs" className="mb-3">
                    {formData.map((form, index) => (
                        <Tab eventKey={index} title={`Barang ${index + 1}`} key={index}>
                            <Form>
                                <Row className="mt-3">
                                    <Col>
                                        <Form.Group controlId={`formNamaBarang${index}`}>
                                            <Form.Label>Nama Barang *</Form.Label>
                                            <Form.Control
                                                type="text"
                                                value={form.namaBarang}
                                                onChange={(e) => handleInputChange(index, 'namaBarang', e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId={`formHarga${index}`}>
                                            <Form.Label>Harga Barang *</Form.Label>
                                            <Form.Control
                                                type="number"
                                                step="0.01"
                                                value={form.harga}
                                                onChange={(e) => handleInputChange(index, 'harga', e.target.value)}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId={`formPenitip${index}`}>
                                            <Form.Label>Pilih Nama Penitip *</Form.Label>
                                            <Form.Select
                                                value={form.selectedUser}
                                                onChange={(e) => handleInputChange(index, 'selectedUser', e.target.value)}
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
                                </Row>

                                <Row className="mt-3">
                                    <Col>
                                        <Form.Group controlId={`formMainKategori${index}`}>
                                            <Form.Label>Kategori Utama *</Form.Label>
                                            <Form.Select
                                                value={form.mainKategoriIdx}
                                                onChange={(e) => {
                                                    handleInputChange(index, 'mainKategoriIdx', e.target.value);
                                                    handleInputChange(index, 'kategoriBarang', '');
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
                                        <Form.Group controlId={`formSubKategori${index}`}>
                                            <Form.Label>Sub Kategori *</Form.Label>
                                            <Form.Select
                                                value={form.kategoriBarang}
                                                onChange={(e) => handleInputChange(index, 'kategoriBarang', e.target.value)}
                                                disabled={form.mainKategoriIdx === ''}
                                                required
                                            >
                                                <option value="">Pilih Sub Kategori</option>
                                                {form.mainKategoriIdx !== '' &&
                                                    kategoriList[form.mainKategoriIdx]?.sub_kategori.map((sub) => (
                                                        <option key={sub.id} value={sub.nama}>
                                                            {sub.nama}
                                                        </option>
                                                    ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId={`formPegawai${index}`}>
                                            <Form.Label>Pilih Pegawai *</Form.Label>
                                            <Form.Select
                                                value={form.selectedPegawai}
                                                onChange={(e) => handleInputChange(index, 'selectedPegawai', e.target.value)}
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
                                        <Form.Group controlId={`formGaransi${index}`}>
                                            <Form.Label>Garansi</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={form.garansi}
                                                onChange={(e) => handleInputChange(index, 'garansi', e.target.value)}
                                                disabled={kategoriList[form.mainKategoriIdx]?.nama_kategori !== 'Elektronik & Gadget'}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId={`formTanggalTitip${index}`}>
                                            <Form.Label>Tanggal Titip</Form.Label>
                                            <Form.Control
                                                type="date"
                                                value={form.tanggalTitip}
                                                onChange={(e) => handleInputChange(index, 'tanggalTitip', e.target.value)}
                                                max={today}
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col>
                                        <Form.Group controlId={`formJumlahFoto${index}`}>
                                            <Form.Label>Jumlah Foto</Form.Label>
                                            <Form.Select
                                                value={form.jumlahFoto}
                                                onChange={(e) => {
                                                    const jumlah = parseInt(e.target.value);
                                                    handleInputChange(index, 'jumlahFoto', jumlah);
                                                    handleInputChange(index, 'files', new Array(jumlah).fill(null));
                                                }}
                                            >
                                                {[2, 3, 4, 5].map((num) => (
                                                    <option key={num} value={num}>
                                                        {num}
                                                    </option>
                                                ))}
                                            </Form.Select>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mt-3">
                                    {[...Array(parseInt(form.jumlahFoto))].map((_, fileIndex) => (
                                        <Col
                                            key={fileIndex}
                                            xs={12}
                                            sm={6}
                                            md={Math.floor(12 / parseInt(form.jumlahFoto))}
                                        >
                                            <Form.Group controlId={`formFile${index}${fileIndex}`} className="mb-3">
                                                <Form.Label>Foto {fileIndex + 1}</Form.Label>
                                                <Form.Control
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(index, fileIndex, e)}
                                                />
                                            </Form.Group>
                                        </Col>
                                    ))}
                                </Row>

                                <Row className="mt-3">
                                    <Col>
                                        <Form.Group controlId={`formDeskripsi${index}`}>
                                            <Form.Label>Deskripsi</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                value={form.deskripsi}
                                                onChange={(e) => handleInputChange(index, 'deskripsi', e.target.value)}
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>
                        </Tab>
                    ))}
                </Tabs>

                <div className="mt-3">
                    <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                        Simpan Semua
                    </Button>
                </div>

                <ToastContainer position="top-end" className="p-3">
                    <Toast
                        show={showToast}
                        onClose={() => setShowToast(false)}
                        delay={3000}
                        autohide
                        bg={toastVariant}
                    >
                        <Toast.Header>
                            <strong className="me-auto">{toastVariant === 'success' ? 'Sukses' : 'Error'}</strong>
                        </Toast.Header>
                        <Toast.Body>{toastMessage}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </Container>
        </div>
    );
};

export default AddBarangPage;   