import React, { useRef, useEffect, useState, use } from "react";
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Pencil, Trash } from 'lucide-react';
import api from "../../../api/api.js";
import NavbarLandingpage from "../../components/Navbar/navbar.jsx";
import PegawaiModal from "../../components/Admin/pegawaiModal.jsx";
import UpdatePegawaiModal from "../../components/Admin/UpdatePegawaiModal.jsx";

const getJabatanName = (id) => {
    switch (id) {
        case 2: return "Customer Service";
        case 3: return "Pegawai Gudang";
        case 4: return "Kurir";
        case 5: return "Hunter";
        case 6: return "Admin";
        default: return "Unknown";
    }
};

const PegawaiCard = ({ pegawai, onDeleteClick, onUpdateClick, getJabatanName }) => (
    <Col md={12} className="justify-content-center mx-auto">
        <Card>
            <Card.Body className="p-2">
                <Row className="align-items-center">
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        <strong>{pegawai.first_name} {pegawai.last_name}</strong>
                    </Col>
                    <Col md={3} className="border-end d-flex align-items-center justify-content-center">
                        {pegawai.email}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {pegawai.no_telp}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {getJabatanName(pegawai.id_jabatan)}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {pegawai.id_jabatan === 5 ? `Rp ${pegawai.komisi}` : null}
                    </Col>
                    <Col md={1} className="d-flex justify-content-end align-items-center">
                        <Button variant="outline-primary" size="sm" onClick={() => onUpdateClick(pegawai)}><Pencil /></Button>
                        <Button variant="outline-danger" size="sm" className="ms-2" onClick={() => onDeleteClick(pegawai)}><Trash /></Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);



const AdminPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [pegawaiList, setPegawaiList] = useState([]);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [pegawaiToDelete, setPegawaiToDelete] = useState(null);
    const [pegawaiToUpdate, setPegawaiToUpdate] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(null);
    const [pencarian, setPencarian] = useState("");


    const fetchPegawai = async () => {
        try {
            const response = await api.get('/pegawai');
            setPegawaiList(response.data);
        } catch (error) {
            console.error('Failed to fetch pegawai:', error);
        }
    };

    useEffect(() => {
        fetchPegawai();  
    }, []);

    const handleDelete = async () => {
        if (pegawaiToDelete) {
            try {
                await api.delete(`/pegawai/${pegawaiToDelete.id_pegawai}`);
                setPegawaiList(prev => prev.filter(p => p.id_pegawai !== pegawaiToDelete.id_pegawai));
                setShowDeleteModal(false);
                setPegawaiToDelete(null);
            } catch (error) {
                console.error('Failed to delete pegawai:', error);
            }
        }
    };
    
    const onUpdateClick = (pegawai) => {
        setPegawaiToUpdate(pegawai);
        setShowUpdateModal(true);
    }

    const onDeleteClick = (pegawai) => {
        setPegawaiToDelete(pegawai);
        setShowDeleteModal(true);
    };

    const filteredPegawai = pegawaiList.filter(pegawai => {
        const fullName = `${pegawai.first_name} ${pegawai.last_name}`.toLowerCase();
        const email = pegawai.email.toLowerCase();
        const noTelp = pegawai.no_telp.toLowerCase();
        const jabatan = getJabatanName(pegawai.id_jabatan).toLowerCase();
        const search = pencarian.toLowerCase();
        return (
            fullName.includes(search) ||
            email.includes(search) ||
            noTelp.includes(search) ||
            jabatan.includes(search)
        );
    });
    
    

    return (
        <div>
            
            <NavbarLandingpage />
            <UpdatePegawaiModal show={showUpdateModal} onHide={() => setShowUpdateModal(false)} pegawai = {pegawaiToUpdate} fetchPegawai={fetchPegawai}/>
            <PegawaiModal show={showModal} onHide={() => setShowModal(false)} fetchPegawai={fetchPegawai}/>
            <Container className="mt-5" >
                <Row >
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={4}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar Pegawai</h2>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    type="search"
                                    placeholder="Cari Pegawai . . ."
                                    className="me-2"
                                    value={pencarian}
                                    onChange={(e) => setPencarian(e.target.value)}
                                />
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                                <Button variant="success" className="btn btn-primary" onClick={() => setShowModal(true)}>Tambah Pegawai</Button>
                            </Col>
                        </Row>
                        <hr />
                    </Col>
                </Row>
            </Container>
            <br />
            <Container className="mt-4">
                <Row>
                    {filteredPegawai.filter(pegawai => pegawai.id_jabatan === 6)
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} onUpdateClick={onUpdateClick} getJabatanName={getJabatanName}/>
                            </Col>
                        ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <Row>
                    {filteredPegawai.filter(pegawai => pegawai.id_jabatan === 2)
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} onUpdateClick={onUpdateClick} getJabatanName={getJabatanName}/>
                            </Col>
                        ))}
                </Row>
            </Container>

            <Container className="mt-4">
                <Row>
                    {filteredPegawai.filter(pegawai => pegawai.id_jabatan === 3)
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} onUpdateClick={onUpdateClick} getJabatanName={getJabatanName}/>
                            </Col>
                        ))}
                </Row>
            </Container>
            <Container className="mt-4">
                <Row>
                    {filteredPegawai.filter(pegawai => pegawai.id_jabatan === 4)
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} onUpdateClick={onUpdateClick} getJabatanName={getJabatanName}/>
                            </Col>
                        ))}
                </Row>
            </Container>
            <Container className="mt-4 mb-4">
                <Row>
                    {filteredPegawai.filter(pegawai => pegawai.id_jabatan === 5)
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} onUpdateClick={onUpdateClick} getJabatanName={getJabatanName}/>
                            </Col>
                        ))}
                </Row>
            </Container>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} fetchPegawai={fetchPegawai} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Hapus</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Apakah anda yakin ingin menghapus pegawai {pegawaiToDelete?.first_name} {pegawaiToDelete?.last_name}?</p>
                    <Button variant="outline-danger" onClick={handleDelete}>Hapus</Button>
                </Modal.Body>
            </Modal>
        </div>
    );
}

export default AdminPage;