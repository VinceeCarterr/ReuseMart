import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";

const EditPegawaiModal = ({ show, onHide, pegawai, onSave }) => {
    const [formData, setFormData] = useState(pegawai);

    useEffect(() => {
        setFormData(pegawai || {});
    }, [pegawai]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = () => {
        onSave(formData);
        onHide();
    };

    return (
        <Modal show={show} onHide={onHide}>
        <Modal.Header closeButton>
            <Modal.Title>Edit Pegawai</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form>
            <Form.Group controlId="formNama">
                <Form.Label>Nama</Form.Label>
                <Form.Control name="name" value={formData.name || ''} onChange={handleChange} />
            </Form.Group>
            <Form.Group controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control name="email" value={formData.email || ''} onChange={handleChange} />
            </Form.Group>
            <Form.Group controlId="formPhone">
                <Form.Label>Phone</Form.Label>
                <Form.Control name="phone" value={formData.phone || ''} onChange={handleChange} />
            </Form.Group>
            <Form.Group controlId="formJabatan">
                <Form.Label>Jabatan</Form.Label>
                <Form.Control name="jabatan" value={formData.jabatan || ''} onChange={handleChange} />
            </Form.Group>
            </Form>
        </Modal.Body>
        <Modal.Footer>
            <Button variant="secondary" onClick={onHide}>Batal</Button>
            <Button variant="primary" onClick={handleSubmit}>Simpan</Button>
        </Modal.Footer>
        </Modal>
    );
};

export default EditPegawaiModal;
