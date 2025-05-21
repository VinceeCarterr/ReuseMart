import { useState } from 'react';
import { Modal, Button, Form, Row, Col, Toast, ToastContainer } from 'react-bootstrap';
import api from "../../../api/api.js";
import "./alamatModal.css";

const AlamatModal = ({ show, onHide, onSuccess }) => {
    const [selectedKecamatan, setSelectedKecamatan] = useState("");
    const [selectedKodePos, setSelectedKodePos] = useState("");
    const [label, setLabel] = useState("");
    const [alamat, setAlamat] = useState("");
    const [catatan, setCatatan] = useState("");
    const [errors, setErrors] = useState({});
    const [showErrorToast, setShowErrorToast] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const userProfile = JSON.parse(localStorage.getItem("profile"));
    const userId = userProfile?.id;

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

    const handleKecamatanChange = (e) => {
        const kecamatan = e.target.value;
        setSelectedKecamatan(kecamatan);
        setSelectedKodePos("");
        setErrors((prev) => ({ ...prev, kecamatan: "", kode_pos: "" }));
    };

    const handleKodePosChange = (e) => {
        setSelectedKodePos(e.target.value);
        setErrors((prev) => ({ ...prev, kode_pos: "" }));
    };

    const handleLabelChange = (e) => {
        setLabel(e.target.value);
        setErrors((prev) => ({ ...prev, label: "" }));
    };

    const handleAlamatChange = (e) => {
        setAlamat(e.target.value);
        setErrors((prev) => ({ ...prev, alamat: "" }));
    };

    const validateForm = () => {
        const newErrors = {};
        if (!label) newErrors.label = "Label wajib diisi";
        if (!selectedKecamatan) newErrors.kecamatan = "Kecamatan wajib diisi";
        if (!selectedKodePos) newErrors.kode_pos = "Kode Pos wajib diisi";
        if (!alamat) newErrors.alamat = "Alamat wajib diisi";
        if (!catatan) newErrors.catatan = "Catatan wajib diisi";
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };


    const handleTambahAlamat = async () => {
        if (!validateForm()) {
            return;
        }

        const newAlamat = {
            id_user: userId,
            label,
            kota: "Yogyakarta",
            kecamatan: selectedKecamatan,
            kode_pos: selectedKodePos,
            alamat,
            catatan,
            isdefault: 0,
        };

        try {
            await api.post("/alamat/create", newAlamat);
            onSuccess();
            onHide();
            setLabel("");
            setSelectedKecamatan("");
            setSelectedKodePos("");
            setAlamat("");
            setCatatan("");
            setErrors({});
            setShowErrorToast(false);
            setErrorMessage("");
        } catch (error) {
            setErrorMessage("Gagal menambahkan alamat. Coba lagi.");
            setShowErrorToast(true);
            console.error("Error adding address:", error);
        }
    };

    const kodePosOptions = kecamatanToKodePos[selectedKecamatan] || [];

    return (
        <>
            <ToastContainer className="toast-center-screen">
                <Toast
                    onClose={() => setShowErrorToast(false)}
                    show={showErrorToast}
                    delay={3000}
                    autohide
                    bg="danger"
                >
                    <Toast.Header>
                        <strong className="me-auto">Error</strong>
                    </Toast.Header>
                    <Toast.Body className="text-white">{errorMessage}</Toast.Body>
                </Toast>
            </ToastContainer>

            <Modal show={show} onHide={onHide} centered backdrop={true} className="alamat-modal" size='lg'>
                <Modal.Header closeButton>
                    <Modal.Title className="w-100 text-center">Tambah Alamat</Modal.Title>
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
                                        onChange={handleLabelChange}
                                        isInvalid={!!errors.label}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.label}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Kota</Form.Label>
                                    <Form.Control
                                        type="text"
                                        placeholder="Yogyakarta"
                                        value="Yogyakarta"
                                        disabled
                                    />
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
                                        isInvalid={!!errors.kecamatan}
                                    >
                                        <option value="">Pilih Kecamatan</option>
                                        {Object.keys(kecamatanToKodePos).map((kec) => (
                                            <option key={kec} value={kec}>{kec}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.kecamatan}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group>
                                    <Form.Label style={{ fontWeight: 'bold' }}>Kode Pos</Form.Label>
                                    <Form.Select
                                        value={selectedKodePos}
                                        onChange={handleKodePosChange}
                                        disabled={!selectedKecamatan}
                                        isInvalid={!!errors.kode_pos}
                                    >
                                        <option value="">Pilih Kode Pos</option>
                                        {kodePosOptions.map((kode) => (
                                            <option key={kode} value={kode}>{kode}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.kode_pos}</Form.Control.Feedback>
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
                                        onChange={handleAlamatChange}
                                        isInvalid={!!errors.alamat}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.alamat}</Form.Control.Feedback>
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
                                        isInvalid={!!errors.catatan}
                                    />
                                    <Form.Control.Feedback type="invalid">{errors.catatan}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <br />
                        <div className="d-flex justify-content-end">
                            <Row>
                                <div className="d-flex justify-content-between">
                                    <Button variant="secondary" onClick={onHide}>
                                        Batal
                                    </Button>
                                    <Button
                                        variant="success"
                                        onClick={handleTambahAlamat}
                                        className="ms-2"
                                    >
                                        Tambah
                                    </Button>
                                </div>
                            </Row>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>
        </>
    );
};

export default AlamatModal;