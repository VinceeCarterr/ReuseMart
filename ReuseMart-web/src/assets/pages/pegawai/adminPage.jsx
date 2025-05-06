import React, { useRef, useEffect, useState, use } from "react";
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { Pencil, Trash } from 'lucide-react';
import NavbarLandingpage from "../../components/navbar.jsx";
import PegawaiModal from "../../components/Admin/pegawaiModal.jsx";


const pegawaiDummy = {
    name: "John Doe",
    email: "johnDope@gmail.com",
    phone: "08123456789",
    jabatan: "Customer Service"
}

const pegawaiDummy2 = {
    name: "Jane Doe",
    email: "Janedoe@gmail.com",
    phone: "08123456789",
    jabatan: "Kurir"
}

const pegawaiDummy3 = {
    name: "Jane Doe",
    email: "Janedoe@gmail.com",
    phone: "08123456789",
    jabatan: "Pegawai Gudang"
}

const pegawaiDummy4 = {
    name: "Jane Doe",
    email: "Janedoe@gmail.com",
    phone: "08123456789",
    jabatan: "Hunter"
}

const PegawaiCard = ({ pegawai, onDeleteClick }) => (
    <Col md={10} className="justify-content-center mx-auto">  
        <Card>     
            <Card.Body>
                <Row className="align-items-center">
                    <Col md={2}><strong>{pegawai.name}</strong></Col>
                    <Col md={3}>{pegawai.email}</Col>
                    <Col md={2}>{pegawai.phone}</Col>
                    <Col md={5} className="d-flex justify-content-end">
                        <Button variant="outline-primary" size="sm"><Pencil /></Button>
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

    useEffect(() => {
        const data = [
            ...Array(6).fill(pegawaiDummy),
            ...Array(2).fill(pegawaiDummy2),
            ...Array(3).fill(pegawaiDummy3),
            ...Array(4).fill(pegawaiDummy4)
        ];
            setPegawaiList(data);
    }, []);

    const handleDelete = () => {
        if (pegawaiToDelete) {
            setPegawaiList(prev => prev.filter(p => p !== pegawaiToDelete));
            setPegawaiToDelete(null);
            setShowDeleteModal(false);
        }
    };
    
    const onDeleteClick = (pegawai) => {
        setPegawaiToDelete(pegawai);
        setShowDeleteModal(true);
    };
        
    return (
        <div>
            <NavbarLandingpage />
            <PegawaiModal show={showModal} onHide={() => setShowModal(false)} />
            <Container className="mt-5">
                <Row>
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={6}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar Pegawai</h2>
                            </Col>
                            <Col md={6} className="d-flex justify-content-end">
                                <Button variant="success" className="btn btn-primary" onClick={() => setShowModal(true)}>Tambah Pegawai</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
            <br />
            <Container className="mt-4"> 
                <Row>
                    <Col md={10} className="mx-auto">
                        <p className="lead" style={{textDecoration:'underline'}} >Customer Service</p>
                    </Col>
                </Row>
                <Row>
                    {pegawaiList
                        .filter(pegawai => pegawai.jabatan === "Customer Service")
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} />
                            </Col>
                        ))}
                </Row>
            </Container>

            <Container className="mt-4"> 
                <Row>
                    <Col md={10} className="mx-auto">
                        <p className="lead"  style={{textDecoration:'underline'}}>Pegawai Gudang</p>
                    </Col>
                </Row>
                <Row>
                    {pegawaiList
                        .filter(pegawai => pegawai.jabatan === "Pegawai Gudang")
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} />
                            </Col>
                        ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <Row>
                    <Col md={10} className="mx-auto">
                        <p className="lead">Kurir</p>
                    </Col>
                </Row>
                <Row>
                    {pegawaiList
                        .filter(pegawai => pegawai.jabatan === "Kurir")
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} />
                            </Col>
                        ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <Row>
                    <Col md={10} className="mx-auto">
                        <p className="lead">Hunter</p>
                    </Col>
                </Row>
                <Row>
                    {pegawaiList
                        .filter(pegawai => pegawai.jabatan === "Hunter")
                        .map((pegawai, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <PegawaiCard pegawai={pegawai} onDeleteClick={onDeleteClick} />
                            </Col>
                        ))}
                    </Row>
            </Container>

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Hapus</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Apakah anda yakin ingin menghapus pegawai {pegawaiToDelete?.name}?</p>
                    <Button variant="outline-danger" onClick={handleDelete}>Hapus</Button>
                </Modal.Body>
            </Modal>
        </div>
    );
}

    export default AdminPage;