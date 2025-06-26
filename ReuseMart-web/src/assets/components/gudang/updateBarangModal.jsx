import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Toast } from 'react-bootstrap';
import api from '../../../api/api.js';
import {  Trash } from 'lucide-react';

const UpdateBarangModal = ({ show, onHide, barangId, onUpdate }) => {
    const [formData, setFormData] = useState({
        namaBarang: '',
        kodeBarang: '',
        mainKategoriIdx: '',
        kategoriBarang: '',
        deskripsi: '',
        harga: '',
        garansi: '',
        berat: '',
        jumlahFoto: '2',
        files: new Array(2).fill(null),
        existingPhotos: [],
    });
    const [kategoriList, setKategoriList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');

    const categoryCodeMap = {
        'Elektronik & Gadget': 'EG',
        'Pakaian & Aksesoris': 'PA',
        'Perabotan Rumah Tangga': 'PRT',
        'Buku, Alat Tulis, & Peralatan Sekolah': 'BAP',
        'Hobi, Mainan, & Koleksi': 'HMK',
        'Perlengkapan Bayi & Anak': 'PBA',
        'Otomotif & Aksesoris': 'OA',
        'Perlengkapan Taman & Outdoor': 'PTO',
        'Peralatan Kantor & Industri': 'PKI',
        'Kosmetik & Perawatan Diri': 'KPD',
    };

    useEffect(() => {
        if (show && barangId) {
            setLoading(true);
            Promise.all([fetchKategoriData(), fetchBarangData()])
                .finally(() => setLoading(false));
        }
    }, [show, barangId]);

    const fetchBarangData = async () => {
        try {
            const res = await api.get(`/barangShow/${barangId}`);
            const barang = res.data;
            console.log('Raw API response:', res.data);

            const fotos = Array.isArray(barang.foto) ? barang.foto : [];
            console.log('Foto data:', fotos);

            const mainKategoriIdx = kategoriList.findIndex(
                (cat) => cat.nama_kategori === barang.kategori
            );
            const subKategori = mainKategoriIdx >= 0 && kategoriList[mainKategoriIdx]?.sub_kategori
                ? kategoriList[mainKategoriIdx].sub_kategori.find((sub) => sub.id === barang.id_kategori)?.nama
                : '';

            setFormData({
                namaBarang: barang.nama_barang || '',
                kodeBarang: barang.kode_barang || '',
                mainKategoriIdx: mainKategoriIdx >= 0 ? mainKategoriIdx.toString() : '',
                kategoriBarang: subKategori || '',
                deskripsi: barang.deskripsi || '',
                harga: barang.harga ? barang.harga.toString() : '',
                garansi: barang.garansi || '',
                berat: barang.berat ? barang.berat.toString() : '',
                jumlahFoto: Math.max(2, fotos.length).toString(),
                files: new Array(Math.max(2, fotos.length)).fill(null),
                existingPhotos: fotos.map(photo => ({
                    id: photo.id_foto,
                    path: photo.path,
                    id_barang: photo.id_barang
                })),
            });
        } catch (error) {
            console.error('Error fetching barang data:', error, error.response?.data);
            setToastMessage(`Gagal memuat data barang: ${error.message || 'Unknown error'}`);
            setToastVariant('danger');
            setShowToast(true);
        }
    };

    const fetchKategoriData = async () => {
        try {
            const res = await api.get('/kategori');
            setKategoriList(res.data || []);
        } catch (error) {
            console.error('Error fetching kategori data:', error);
            setToastMessage('Gagal memuat data kategori: ' + (error.response?.data?.message || error.message));
            setToastVariant('danger');
            setShowToast(true);
        }
    };

    useEffect(() => {
        if (formData.mainKategoriIdx !== '' && formData.kategoriBarang && kategoriList.length > 0) {
            const selectedMainKategori = kategoriList[formData.mainKategoriIdx];
            if (selectedMainKategori?.sub_kategori) {
                const selectedSubKategori = selectedMainKategori.sub_kategori.find(
                    (sub) => sub.nama === formData.kategoriBarang
                );
                if (selectedSubKategori) {
                    const categoryCode = categoryCodeMap[selectedMainKategori.nama_kategori];
                    if (categoryCode) {
                        setFormData((prev) => ({
                            ...prev,
                            kodeBarang: `${categoryCode}${selectedSubKategori.id}${barangId}`,
                        }));
                    }
                }
            }
        }
    }, [formData.mainKategoriIdx, formData.kategoriBarang, kategoriList, barangId]);

    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            garansi: kategoriList[prev.mainKategoriIdx]?.nama_kategori === 'Elektronik & Gadget' ? prev.garansi : '',
        }));
    }, [formData.mainKategoriIdx, kategoriList]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (fileIndex, event) => {
        const newFiles = [...formData.files];
        newFiles[fileIndex] = event.target.files[0] || null;
        setFormData((prev) => ({ ...prev, files: newFiles }));
    };

    const handleJumlahFotoChange = (jumlah) => {
        setFormData((prev) => ({
            ...prev,
            jumlahFoto: Math.max(2, jumlah).toString(),
            files: new Array(Math.max(2, jumlah)).fill(null),
            existingPhotos: prev.existingPhotos.slice(0, Math.max(2, jumlah)),
        }));
    };

    const handleDeletePhoto = async (fileIndex, photoId) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus foto ini?')) {
            return;
        }

        try {
            setLoading(true);
            await api.delete(`/deleteFoto/${photoId}`);
            setFormData((prev) => {
                const newPhotos = prev.existingPhotos.filter((_, idx) => idx !== fileIndex);
                return {
                    ...prev,
                    existingPhotos: newPhotos,
                    jumlahFoto: Math.max(2, newPhotos.length).toString(),
                    files: new Array(Math.max(2, newPhotos.length)).fill(null),
                };
            });
            setToastMessage('Foto berhasil dihapus.');
            setToastVariant('success');
            setShowToast(true);
        } catch (error) {
            console.error('Error deleting photo:', error);
            setToastMessage('Gagal menghapus foto: ' + (error.response?.data?.message || error.message));
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!window.confirm('Apakah Anda yakin ingin mengupdate data barang ini?')) {
            return;
        }

        setLoading(true);

        if (
            !formData.namaBarang.trim() ||
            !formData.harga.trim() ||
            !formData.berat.trim() ||
            formData.mainKategoriIdx === '' ||
            !formData.kategoriBarang.trim()
        ) {
            setToastMessage('Mohon lengkapi semua field wajib: Nama Barang, Harga, Berat, Kategori Utama, dan Sub Kategori.');
            setToastVariant('danger');
            setShowToast(true);
            setLoading(false);
            return;
        }

        if (isNaN(parseFloat(formData.harga)) || parseFloat(formData.harga) <= 0) {
            setToastMessage('Harga Barang harus berupa angka positif.');
            setToastVariant('danger');
            setShowToast(true);
            setLoading(false);
            return;
        }

        if (isNaN(parseFloat(formData.berat)) || parseFloat(formData.berat) <= 0) {
            setToastMessage('Berat Barang harus berupa angka positif.');
            setToastVariant('danger');
            setShowToast(true);
            setLoading(false);
            return;
        }

        let selectedMainKategori = null;
        let selectedSubKategori = null;

        try {
            selectedMainKategori = kategoriList[formData.mainKategoriIdx];
            if (!selectedMainKategori || !selectedMainKategori.sub_kategori) {
                setToastMessage('Kategori utama tidak valid atau tidak memiliki subkategori.');
                setToastVariant('danger');
                setShowToast(true);
                setLoading(false);
                return;
            }

            selectedSubKategori = selectedMainKategori.sub_kategori.find(
                (sub) => sub.nama === formData.kategoriBarang
            );
            if (!selectedSubKategori) {
                setToastMessage(`Subkategori ${formData.kategoriBarang} tidak ditemukan.`);
                setToastVariant('danger');
                setShowToast(true);
                setLoading(false);
                return;
            }

            const categoryCode = categoryCodeMap[selectedMainKategori.nama_kategori];
            if (!categoryCode) {
                setToastMessage(`Kode kategori untuk ${selectedMainKategori.nama_kategori} tidak ditemukan.`);
                setToastVariant('danger');
                setShowToast(true);
                setLoading(false);
                return;
            }

            const barangPayload = {
                nama_barang: formData.namaBarang,
                kode_barang: formData.kodeBarang,
                id_kategori: parseInt(selectedSubKategori.id),
                deskripsi: formData.deskripsi || null,
                harga: parseFloat(formData.harga),
                garansi: formData.garansi || '',
                berat: parseFloat(formData.berat),
                kategori: selectedMainKategori.nama_kategori,
            };

            await api.put(`/barang/${barangId}`, barangPayload);

            let newPhotos = [...formData.existingPhotos];
            const photoPromises = [];

            formData.files.forEach((file, index) => {
                if (!file) return;
                if (!file.type.startsWith('image/')) {
                    setToastMessage('File harus berupa gambar.');
                    setToastVariant('danger');
                    setShowToast(true);
                    return;
                }

                const fd = new FormData();
                fd.append('id_barang', barangId);
                fd.append('file', file);

                const existingPhoto = formData.existingPhotos[index];

                if (existingPhoto && existingPhoto.id) {
                    photoPromises.push(
                        api.delete(`/deleteFoto/${existingPhoto.id}`)
                            .then(() => {
                                console.log(`Deleted photo at index ${index} with id ${existingPhoto.id}`);
                            })
                            .catch((error) => {
                                console.error(`Failed to delete photo at index ${index}:`, error.response ? error.response.data : error);
                                throw error;
                            })
                    );
                }

                photoPromises.push(
                    api.post('/foto/addFoto', fd, {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }).then((response) => {
                        newPhotos[index] = response.data.data;
                        console.log(`Added new photo at index ${index}`, response.data.data);
                    }).catch((error) => {
                        console.error(`Failed to upload new photo at index ${index}:`, error.response ? error.response.data : error);
                        throw error;
                    })
                );
            });

            await Promise.all(photoPromises);
            await fetchBarangData();
            onUpdate({ success: true, message: 'Barang berhasil diperbarui.' });
            setTimeout(() => {
                onHide();
            }, 500);
        } catch (error) {
            console.error('Error during submit:', error.response ? error.response.data : error);
            setToastMessage(`Terjadi kesalahan: ${error.response?.data?.message || error.message}`);
            setToastVariant('danger');
            setShowToast(true);
            onUpdate({ success: false, message: `Terjadi kesalahan: ${error.response?.data?.message || error.message}` });
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        onHide();
    };

    return (
        <Modal show={show} onHide={handleClose} centered backdrop="static" size="lg">
            <style>
                {`
                    .photo-container {
                        border: 1px solid #e9ecef;
                        border-radius: 8px;
                        padding: 15px;
                        background-color: #f8f9fa;
                        margin-bottom: 15px;
                        transition: all 0.2s ease;
                    }
                    .photo-container:hover {
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }
                    .photo-preview {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 10px;
                    }
                    .photo-preview img {
                        border-radius: 6px;
                        object-fit: cover;
                    }
                    .photo-actions {
                        display: flex;
                        gap: 10px;
                        align-items: center;
                    }
                    .delete-photo-btn {
                        transition: background-color 0.2s ease;
                    }
                    .delete-photo-btn:hover {
                        background-color: #dc3545;
                        border-color: #dc3545;
                    }
                    .delete-photo-btn:disabled {
                        opacity: 0.6;
                        cursor: not-allowed;
                    }
                    .form-control-file {
                        padding: 6px;
                    }
                    .centered-toast {
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        min-width: 300px;
                        z-index: 1050;
                    }
                `}
            </style>
            <Modal.Header closeButton>
                <Modal.Title>Update Barang</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <Form>
                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formNamaBarang">
                                    <Form.Label>Nama Barang *</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.namaBarang}
                                        onChange={(e) => handleInputChange('namaBarang', e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formKodeBarang">
                                    <Form.Label>Kode Barang</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={formData.kodeBarang}
                                        readOnly
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formMainKategori">
                                    <Form.Label>Kategori Utama *</Form.Label>
                                    <Form.Select
                                        value={formData.mainKategoriIdx}
                                        onChange={(e) => {
                                            handleInputChange('mainKategoriIdx', e.target.value);
                                            handleInputChange('kategoriBarang', '');
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
                                    <Form.Label>Sub Kategori *</Form.Label>
                                    <Form.Select
                                        value={formData.kategoriBarang}
                                        onChange={(e) => handleInputChange('kategoriBarang', e.target.value)}
                                        disabled={formData.mainKategoriIdx === ''}
                                        required
                                    >
                                        <option value="">Pilih Sub Kategori</option>
                                        {formData.mainKategoriIdx !== '' &&
                                            kategoriList[formData.mainKategoriIdx]?.sub_kategori?.map((sub) => (
                                                <option key={sub.id} value={sub.nama}>
                                                    {sub.nama}
                                                </option>
                                            ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formHarga">
                                    <Form.Label>Harga Barang *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.harga}
                                        onChange={(e) => handleInputChange('harga', e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group controlId="formBerat">
                                    <Form.Label>Berat Barang (kg) *</Form.Label>
                                    <Form.Control
                                        type="number"
                                        step="0.01"
                                        min="0.01"
                                        value={formData.berat}
                                        onChange={(e) => handleInputChange('berat', e.target.value)}
                                        required
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formGaransi">
                                    <Form.Label>Garansi</Form.Label>
                                    <Form.Control
                                        type="date"
                                        value={formData.garansi}
                                        onChange={(e) => handleInputChange('garansi', e.target.value)}
                                        disabled={kategoriList[formData.mainKategoriIdx]?.nama_kategori !== 'Elektronik & Gadget'}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formDeskripsi">
                                    <Form.Label>Deskripsi</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={formData.deskripsi}
                                        onChange={(e) => handleInputChange('deskripsi', e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mb-3">
                            <Col>
                                <Form.Group controlId="formJumlahFoto">
                                    <Form.Label>Jumlah Foto</Form.Label>
                                    <Form.Select
                                        value={formData.jumlahFoto}
                                        onChange={(e) => handleJumlahFotoChange(parseInt(e.target.value))}
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

                        <Row className="mb-3">
                            {[...Array(parseInt(formData.jumlahFoto))].map((_, fileIndex) => (
                                <Col
                                    key={fileIndex}
                                    xs={12}
                                    sm={6}
                                    md={Math.floor(12 / parseInt(formData.jumlahFoto))}
                                    className="mb-3"
                                >
                                    <div className="photo-container">
                                        <Form.Group controlId={`formFile${fileIndex}`}>
                                            <Form.Label>
                                                Foto {fileIndex + 1} {formData.existingPhotos[fileIndex] ? '(Current)' : ''}
                                            </Form.Label>
                                            {formData.existingPhotos[fileIndex]?.path ? (
                                                <div className="photo-preview">
                                                    <img
                                                        src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${formData.existingPhotos[fileIndex].path}`}
                                                        alt={`Foto ${fileIndex + 1}`}
                                                        style={{ maxWidth: '150px', maxHeight: '150px' }}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="photo-preview" style={{ minHeight: '150px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#e9ecef', borderRadius: '6px' }}>
                                                    <span>Tidak ada foto</span>
                                                </div>
                                            )}
                                            <div className="photo-actions">
                                                <Form.Control
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(fileIndex, e)}
                                                    className="form-control-file"
                                                />
                                                {formData.existingPhotos[fileIndex]?.path && (
                                                    <Button
                                                        variant="danger"
                                                        size="sm"
                                                        className="delete-photo-btn"
                                                        onClick={() => handleDeletePhoto(fileIndex, formData.existingPhotos[fileIndex].id)}
                                                        disabled={loading}
                                                    >
                                                        <Trash/>
                                                    </Button>
                                                )}
                                            </div>
                                        </Form.Group>
                                    </div>
                                </Col>
                            ))}
                        </Row>
                    </Form>
                )}
                <Toast
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                    className="centered-toast"
                >
                    <Toast.Header>
                        <strong className="me-auto">{toastVariant === 'success' ? 'Sukses' : 'Error'}</strong>
                    </Toast.Header>
                    <Toast.Body>{toastMessage}</Toast.Body>
                </Toast>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose} disabled={loading}>
                    Batal
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    Simpan Perubahan
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateBarangModal;