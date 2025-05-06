import { useState } from 'react';
import { Modal, Button, Form } from 'react-bootstrap'; // Remove duplicate 'Modal'

const PegawaiModal = ({ show, onHide }) => {
    return (
        <Modal show={show} onHide={onHide} centered backdrop={true} className="pegawai-modal">
            <Modal.Header closeButton>
                <Modal.Title>Tambah Pegawai</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* You can add Form here */}
                <Form>
                    <Row>
                        <Col className="md-6">
                            <Form.Group>
                                <Form.Label>First Name</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan nama depan" />
                            </Form.Group>                    
                        </Col>
                        <Col className="md-6">
                            <Form.Group>
                                <Form.Label>Last Nama</Form.Label>
                                <Form.Control type="text" placeholder="Masukkan nama belakang" />
                            </Form.Group>
                        </Col>
                    </Row>
                    {/* Add more fields as needed */}
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>
                    Close
                </Button>
                <Button variant="primary" onClick={onHide}>
                    Save Changes
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PegawaiModal;
