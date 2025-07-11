import { useState, useEffect } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import api from "../../../api/api.js";

const kecamatanToKodePos = {
    Danurejan: ["55211", "55212", "55213"],
    GedongTengen: ["55271", "55272"],
    Gondokusuman: ["55221", "55222", "55223", "55224", "55225"],
    Gondomanan: ["55121", "55122"],
    Jetis: ["55231", "55232", "55233"],
    Kotagede: ["55171", "55172", "55173"],
    Kraton: ["55131", "55132", "55133"],
    Mantrijeron: ["55141", "55142", "55143"],
    Mergangsan: ["55151", "55152", "55153"],
    Ngampilan: ["55261", "55262"],
    Pakualaman: ["55111", "55112"],
    Tegalrejo: ["55241", "55242", "55243", "55244"],
    Umbulharjo: ["55161", "55162", "55163", "55164", "55165", "55166", "55167"],
    Wirobrajan: ["55251", "55252", "55253"],
};

const UbahAlamatModal = ({ show, onHide, alamatData, onUpdateSuccess }) => {
    const [label, setLabel] = useState("");
    const [alamat, setAlamat] = useState("");
    const [catatan, setCatatan] = useState("");
    const [selectedKecamatan, setSelectedKecamatan] = useState("");
    const [selectedKodePos, setSelectedKodePos] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (alamatData) {
            setLabel(alamatData.label);
            setAlamat(alamatData.alamat);
            setCatatan(alamatData.catatan);
            setSelectedKecamatan(alamatData.kecamatan);
            setSelectedKodePos(alamatData.kode_pos);
        }
    }, [alamatData]);

    const handleKecamatanChange = (e) => {
        const kecamatan = e.target.value;
        setSelectedKecamatan(kecamatan);
        setSelectedKodePos("");
    };

    const handleSubmitClick = () => {
        onHide(); // Tutup modal form ubah
        setShowConfirmModal(true); // Tampilkan modal konfirmasi
    };

    const handleConfirmUpdate = async () => {
        try {
            await api.put(`/alamat/${alamatData.id_alamat}`, {
                ...alamatData,
                label,
                alamat,
                catatan,
                kecamatan: selectedKecamatan,
                kode_pos: selectedKodePos,
            });
            onUpdateSuccess(); // Refresh data parent
        } catch (err) {
            console.error("Gagal mengubah alamat:", err);
        } finally {
            setShowConfirmModal(false); // Tutup modal konfirmasi
        }
    };

    const kodePosOptions = kecamatanToKodePos[selectedKecamatan] || [];

    return (
        <>
            {/* Modal Ubah Alamat */}
            <Modal show={show} onHide={onHide} centered size="lg">
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Ubah Alamat</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Label</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Masukkan Label"
                                        value={label}
                                        onChange={(e) => setLabel(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Kota</Form.Label>
                                    <Form.Control type="text" value="Yogyakarta" disabled />
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Kecamatan</Form.Label>
                                    <Form.Select
                                        value={selectedKecamatan}
                                        onChange={handleKecamatanChange}
                                    >
                                        <option value="">Pilih Kecamatan</option>
                                        {Object.keys(kecamatanToKodePos).map((kec) => (
                                            <option key={kec} value={kec}>{kec}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Kode Pos</Form.Label>
                                    <Form.Select
                                        value={selectedKodePos}
                                        onChange={(e) => setSelectedKodePos(e.target.value)}
                                        disabled={!selectedKecamatan}
                                    >
                                        <option value="">Pilih Kode Pos</option>
                                        {kodePosOptions.map((kode) => (
                                            <option key={kode} value={kode}>{kode}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row className="mt-3">
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Alamat Lengkap</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Masukkan alamat lengkap"
                                        value={alamat}
                                        onChange={(e) => setAlamat(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Catatan</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Masukkan Catatan"
                                        value={catatan}
                                        onChange={(e) => setCatatan(e.target.value)}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        <br />
                        <div className="d-flex justify-content-end">
                            <Button variant="secondary" onClick={onHide}>Batal</Button>
                            <Button variant="success" className="ms-2" onClick={handleSubmitClick}>
                                Simpan
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* Modal Konfirmasi Simpan */}
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Perubahan</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Apakah Anda yakin ingin menyimpan perubahan alamat ini?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
                        Batal
                    </Button>
                    <Button variant="success" onClick={handleConfirmUpdate}>
                        Ya, Simpan
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default UbahAlamatModal;
