import { useState } from 'react';
import { Modal, Button, Form, Row, Col } from 'react-bootstrap';
import "./alamatModal.css";

const AlamatModal = ({ show, onHide }) => {
    const [selectedKecamatan, setSelectedKecamatan] = useState("");
    const [selectedKodePos, setSelectedKodePos] = useState("");

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
    };

    const kodePosOptions = kecamatanToKodePos[selectedKecamatan] || [];

    return (
        <Modal show={show} onHide={onHide} centered backdrop={true} className="alamat-modal" size='lg'>
            <Modal.Header closeButton>
                <Modal.Title className="w-100 text-center">Tambah Alamat</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Label</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan Label" />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Kota</Form.Label>
                                <Form.Control type="text" placeholder="Yogyakarta" disabled />
                            </Form.Group>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Kecamatan</Form.Label>
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
                                <Form.Label>Kode Pos</Form.Label>
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
                                <Form.Label>Alamat Lengkap</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan alamat lengkap" />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Catatan</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan Catatan" />
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

                                <Button variant="success" onClick={onHide} className="ms-2">
                                    Tambah
                                </Button>
                            </div>
                        </Row>
                    </div>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default AlamatModal;
