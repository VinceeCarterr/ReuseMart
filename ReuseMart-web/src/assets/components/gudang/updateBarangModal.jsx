import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import api from '../../../api/api.js';

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
    const [pendingToast, setPendingToast] = useState(null);

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

    // Fetch barang and kategori data when modal opens
    useEffect(() => {
        if (show && barangId) {
            fetchKategoriData();
            fetchBarangData();
        }
    }, [show, barangId]);

    const fetchBarangData = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/barang/${barangId}`);
            const barang = res.data;

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
                jumlahFoto: barang.foto?.length.toString() || '2',
                files: new Array(barang.foto?.length || 2).fill(null),
                existingPhotos: barang.foto || [],
            });
        } catch (error) {
            console.error('Error fetching barang data:', error);
            setPendingToast({
                message: 'Gagal memuat data barang: ' + (error.response?.data?.message || error.message),
                variant: 'danger',
            });
        } finally {
            setLoading(false);
        }
    };

    const fetchKategoriData = async () => {
        try {
            const res = await api.get('/kategori');
            setKategoriList(res.data || []);
        } catch (error) {
            console.error('Error fetching kategori data:', error);
            setPendingToast({
                message: 'Gagal memuat data kategori: ' + (error.response?.data?.message || error.message),
                variant: 'danger',
            });
        }
    };

    // Update kode_barang when kategori changes
    useEffect(() => {
        if (formData.mainKategoriIdx !== '' && formData.kategoriBarang) {
            const selectedMainKategori = kategoriList[formData.mainKategoriIdx];
            if (selectedMainKategori && selectedMainKategori.sub_kategori) {
                const selectedSubKategori = selectedMainKategori.sub_kategori.find(
                    (sub) => sub.nama === formData.kategoriBarang
                );
                if (selectedSubKategori) {
                    const categoryCode = categoryCodeMap[selectedMainKategori.nama_kategori];
                    if (categoryCode) {
                        const newKodeBarang = `${categoryCode}${selectedSubKategori.id}${barangId}`;
                        setFormData((prev) => ({ ...prev, kodeBarang: newKodeBarang }));
                    }
                }
            }
        }
    }, [formData.mainKategoriIdx, formData.kategoriBarang, kategoriList, barangId]);

    // Update garansi field based on kategori
    useEffect(() => {
        setFormData((prev) => {
            const isElektronik = kategoriList[prev.mainKategoriIdx]?.nama_kategori === 'Elektronik & Gadget';
            return { ...prev, garansi: isElektronik ? prev.garansi : '' };
        });
    }, [formData.mainKategoriIdx, kategoriList]);

    // Show pending toast after modal closes
    useEffect(() => {
        if (!show && pendingToast) {
            setToastMessage(pendingToast.message);
            setToastVariant(pendingToast.variant);
            setShowToast(true);
            setPendingToast(null);
        }
    }, [show, pendingToast]);

    const handleInputChange = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (fileIndex, event) => {
        const newFiles = [...formData.files];
        newFiles[fileIndex] = event.target.files[0];
        setFormData((prev) => ({ ...prev, files: newFiles }));
    };

    const handleSubmit = async () => {
        const confirmUpdate = window.confirm('Apakah Anda yakin ingin mengupdate data barang ini?');
        if (!confirmUpdate) {
            return;
        }

        setLoading(true);

        // Validate required fields
        if (
            !formData.namaBarang.trim() ||
            !formData.harga.trim() ||
            !formData.berat.trim() ||
            formData.mainKategoriIdx === '' ||
            !formData.kategoriBarang.trim()
        ) {
            setPendingToast({
                message: 'Mohon lengkapi semua field wajib: Nama Barang, Harga, Berat, Kategori Utama, dan Sub Kategori.',
                variant: 'danger',
            });
            setLoading(false);
            onHide();
            return;
        }

        if (isNaN(parseFloat(formData.harga)) || parseFloat(formData.harga) <= 0) {
            setPendingToast({
                message: 'Harga Barang harus berupa angka positif.',
                variant: 'danger',
            });
            setLoading(false);
            onHide();
            return;
        }

        if (isNaN(parseFloat(formData.berat)) || parseFloat(formData.berat) <= 0) {
            setPendingToast({
                message: 'Berat Barang harus berupa angka positif.',
                variant: 'danger',
            });
            setLoading(false);
            onHide();
            return;
        }

        try {
            const selectedMainKategori = kategoriList[formData.mainKategoriIdx];
            if (!selectedMainKategori || !selectedMainKategori.sub_kategori) {
                setPendingToast({
                    message: 'Kategori utama tidak valid atau tidak memiliki subkategori.',
                    variant: 'danger',
                });
                setLoading(false);
                onHide();
                return;
            }

            const selectedSubKategori = selectedMainKategori.sub_kategori.find(
                (sub) => sub.nama === formData.kategoriBarang
            );
            if (!selectedSubKategori) {
                setPendingToast({
                    message: `Subkategori ${formData.kategoriBarang} tidak ditemukan.`,
                    variant: 'danger',
                });
                setLoading(false);
                onHide();
                return;
            }

            const categoryCode = categoryCodeMap[selectedMainKategori.nama_kategori];
            if (!categoryCode) {
                setPendingToast({
                    message: `Kode kategori untuk ${selectedMainKategori.nama_kategori} tidak ditemukan.`,
                    variant: 'danger',
                });
                setLoading(false);
                onHide();
                return;
            }

            // Prepare payload for updating barang
            const barangPayload = {
                nama_barang: formData.namaBarang,
                kode_barang: formData.kodeBarang,
                id_kategori: parseInt(selectedSubKategori.id),
                deskripsi: formData.deskripsi || null,
                harga: parseFloat(formData.harga),
                garansi: formData.garansi || null,
                berat: parseFloat(formData.berat),
                kategori: selectedMainKategori.nama_kategori,
            };

            // Update barang
            await api.put(`/barang/${barangId}`, barangPayload);

            // Handle photo updates: Replace specific photos
            const deletePhotoPromises = [];
            const photoUploadPromises = [];
            const newPhotos = [...formData.existingPhotos];

            formData.files.forEach((file, index) => {
                if (file) {
                    // If there's an existing photo at this index, mark it for deletion
                    if (formData.existingPhotos[index]?.id) {
                        deletePhotoPromises.push(
                            api.delete(`/deleteFoto/${formData.existingPhotos[index].id}`).then(() => {
                                console.log(`Foto ${index + 1} berhasil dihapus.`);
                            }).catch((error) => {
                                console.error(`Gagal menghapus foto ${formData.existingPhotos[index].id}:`, error);
                            })
                        );
                    }
                    // Prepare new photo for upload
                    const fileName = file.name;
                    const path = `Foto_Barang/${fileName}`;
                    const fd = new FormData();
                    fd.append('file', file);
                    fd.append('path', path);
                    fd.append('id_barang', barangId);
                    photoUploadPromises.push(
                        api.post('/foto/addFoto', fd, {
                            headers: { 'Content-Type': 'multipart/form-data' },
                        }).then((response) => {
                            // Update newPhotos with the actual photo data from backend
                            newPhotos[index] = response.data.data; // Assuming backend returns { message, data: { id, path, id_barang } }
                        }).catch((error) => {
                            console.error(`Gagal mengunggah foto ${index + 1}:`, error);
                        })
                    );
                }
            });

            // Execute deletions and uploads
            await Promise.all(deletePhotoPromises);
            await Promise.all(photoUploadPromises);

            // Update existingPhotos with new photos
            setFormData((prev) => ({
                ...prev,
                existingPhotos: newPhotos.filter((photo) => photo !== null),
                files: new Array(parseInt(formData.jumlahFoto)).fill(null),
            }));

            setPendingToast({
                message: 'Barang berhasil diperbarui.',
                variant: 'success',
            });

            // Reset form and close modal
            setFormData({
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
            onUpdate();
            onHide();
        } catch (error) {
            console.error('Error during submit:', error);
            setPendingToast({
                message: `Terjadi kesalahan: ${error.response?.data?.message || error.message}`,
                variant: 'danger',
            });
            setLoading(false);
            onHide();
        }
    };


    return (
        <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
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
                                        onChange={(e) => handleInputChange('kodeBarang', e.target.value)}
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
                                        min="0"
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
                                        onChange={(e) => {
                                            const jumlah = parseInt(e.target.value);
                                            handleInputChange('jumlahFoto', jumlah);
                                            handleInputChange('files', new Array(jumlah).fill(null));
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

                        <Row className="mb-3">
                            {[...Array(parseInt(formData.jumlahFoto))].map((_, fileIndex) => (
                                <Col
                                    key={fileIndex}
                                    xs={12}
                                    sm={6}
                                    md={Math.floor(12 / parseInt(formData.jumlahFoto))}
                                >
                                    <Form.Group controlId={`formFile${fileIndex}`} className="mb-3">
                                        <Form.Label>
                                            Foto {fileIndex + 1} {formData.existingPhotos[fileIndex] ? '(Current)' : ''}
                                        </Form.Label>
                                        {formData.existingPhotos[fileIndex] && (
                                            <div className="mb-2">
                                                <img
                                                    src={`http://127.0.0.1:8000/storage/${formData.existingPhotos[fileIndex].path}`}
                                                    alt={`Foto ${fileIndex + 1}`}
                                                    style={{ maxWidth: '100px', maxHeight: '100px' }}
                                                />
                                            </div>
                                        )}
                                        <Form.Control
                                            type="file"
                                            accept="image/*"
                                            onChange={(e) => handleFileChange(fileIndex, e)}
                                        />
                                    </Form.Group>
                                </Col>
                            ))}
                        </Row>
                    </Form>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide} disabled={loading}>
                    Batal
                </Button>
                <Button variant="primary" onClick={handleSubmit} disabled={loading}>
                    Simpan Perubahan
                </Button>
            </Modal.Footer>

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
        </Modal>
    );
};

export default UpdateBarangModal;   