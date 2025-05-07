import { useState } from 'react';
import { Modal, Button, Form, Row, Col, Dropdown, DropdownButton } from 'react-bootstrap';

const PegawaiModal = ({ show, onHide }) => {
    const [selectedJabatan, setSelectedJabatan] = useState("Pilih Jabatan");

    const handleSelect = (eventKey) => {
        setSelectedJabatan(eventKey);
    };

    return (
        <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
            <Modal.Header closeButton>
                <Modal.Title>Tambah Pegawai</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan nama depan" />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Last Name</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan nama belakang" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Email</Form.Label>
                                <Form.Control type="email" placeholder="Masukkan Email" />
                            </Form.Group>
                        </Col>
                        <Col md={6}>
                            <Form.Group>
                                <Form.Label>Nomor Telepon</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan Nomor Telepon" />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="mt-3">
                        <Col>
                            <Form.Group>
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" placeholder="Masukkan Password" />
                            </Form.Group>
                        </Col>
                        <Col>
                            <Form.Group>
                                <Form.Label>Jabatan</Form.Label>
                                <Form.Select
                                    value={selectedJabatan}
                                    onChange={(e) => setSelectedJabatan(e.target.value)}
                                >
                                    <option value="">Pilih Jabatan</option>
                                    <option value="Customer Service">Customer Service</option>
                                    <option value="Pegawai Gudang">Pegawai Gudang</option>
                                    <option value="Kurir">Kurir</option>
                                    <option value="Hunter">Hunter</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Form.Group className="mt-3">
                        <Form.Label>Profile Picture </Form.Label>
                        <Form.Control type='file' placeholder='Upload Profile Picture'></Form.Control>
                    </Form.Group>
                    <br />
                    <Button variant="success" onClick={onHide}>
                        Daftar
                    </Button>
                </Form>
            </Modal.Body>
        </Modal>
    );
};

export default PegawaiModal;
