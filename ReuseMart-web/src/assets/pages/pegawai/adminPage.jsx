import React, { useRef, useEffect, useState, use } from "react";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import NavbarLandingpage from "../../components/navbar.jsx";
import PegawaiModal from "../../components/Admin/pegawaiModal.jsx";"../../components/Admin/pegawaiModal.jsx";


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

const PegawaiCard = ({ pegawai }) => (
    <Card className="PegawaiCard mb-3">
        <div style={{ height: '150px', backgroundColor: '#ccc' }} />
        <Card.Body>
            <Card.Title style={{ fontWeight: '575' }}>{pegawai.name}</Card.Title>
            <Card.Text>{pegawai.email}<br />
                {pegawai.phone}<br />
                {pegawai.jabatan}
            </Card.Text>
        </Card.Body>
    </Card>
);


const AdminPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [pegawaiList, setPegawaiList] = useState([]);

    useEffect(() => {
        const data = [
            ...Array(6).fill(pegawaiDummy),
            ...Array(2).fill(pegawaiDummy2),
            ...Array(3).fill(pegawaiDummy3),
            ...Array(4).fill(pegawaiDummy4)
        ];
        setPegawaiList(data);
    }, []);
    
    return (
        <div>
            <NavbarLandingpage/>
            <PegawaiModal show={showModal} onHide={() => setShowModal(false)} />
            <Container className ="mt-5"> 
                <Row>
                    <Col className="md-6">
                        <h2 className = "test-success fw-bold welcome-heading">Daftar Pegawai</h2>
                    </Col>
                    <Col className="md-6 d-flex justify-content-end">
                        <Button variant="success" className="btn btn-primary" onClick={() => setShowModal(true)}>Tambah Pegawai </Button>
                    </Col>
                </Row>
            </Container>

            <br />
            <Container className="mt-4"> 
            <p className="lead">Customer Service</p>
                <Row>
                    {pegawaiList
                        .filter(pegawai=>pegawai.jabatan ==="Customer Service")
                        .map((pegawai, index) => (
                            <Col key={index} md={4} className="mb-4">
                                <PegawaiCard pegawai={pegawai}/>
                            </Col>
                    ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <p className="lead">Pegawai Gudang</p>  
                <Row>
                    {pegawaiList
                        .filter(pegawai=>pegawai.jabatan ==="Pegawai Gudang")
                        .map((pegawai, index) => (
                            <Col key={index} md={4} className="mb-4">
                                <PegawaiCard pegawai={pegawai}/>
                            </Col>
                    ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <p className="lead">Kurir</p> 
                <Row>
                    {pegawaiList
                        .filter(pegawai=>pegawai.jabatan ==="Kurir")
                        .map((pegawai, index) => (
                            <Col key={index} md={4} className="mb-4">
                                <PegawaiCard pegawai={pegawai}/>
                            </Col>
                    ))}
                </Row>
            </Container>
            <Container className="mt-4"> 
                <p className="lead">Hunter</p>
                <Row>
                    {pegawaiList
                        .filter(pegawai=>pegawai.jabatan ==="Hunter")
                        .map((pegawai, index) => (
                            <Col key={index} md={4} className="mb-4">
                                <PegawaiCard pegawai={pegawai}/>
                            </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
}

export default AdminPage;