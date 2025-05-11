import api from "../../../api/api.js";
import { useEffect, useState } from "react";
import { Card, Col, Container, Row, Button } from "react-bootstrap";
import NavbarOwner from "../../components/Navbar/navbarOwner.jsx";
import "../../components/Navbar/navbarOwner.css";
import "aos/dist/aos.css";
import KelolaDonasiModal from "../../components/Owner/kelolaDonasiModal.jsx"; 


const ReqDonasiCard = ({ reqDonasi, getUserNameById }) => (
    <Col md={6} className="mx-auto mb-4">
        <Card>
            <Card.Body className="p-3">
                <Row>
                    {/* Image Column */}
                    <Col md={4} className="d-flex align-items-center justify-content-center">
                        <img 
                            src={`http://localhost:8000/storage/${reqDonasi.contoh_foto}`} 
                            alt="Contoh Foto" 
                            className="img-fluid rounded" 
                            style={{ maxHeight: '150px', objectFit: 'cover' }}
                        />
                    </Col>

                    {/* Text Content Column */}
                    <Col md={8}>
                        <h5 className="mb-2">{reqDonasi.nama_barangreq}</h5>
                        <p className="mb-1"><strong>Nama Organisasi:</strong> {getUserNameById(reqDonasi.id_user)}</p>
                        <p className="mb-1"><strong>Kategori:</strong> {reqDonasi.kategori_barangreq}</p>
                        <p className="mb-0"><strong>Deskripsi:</strong> {reqDonasi.deskripsi}</p>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);

const OwnerLandingPage = () => {
    const [reqDonasiList, setReqDonasiList] = useState([]);
    const [userList, setUserList] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const handleShow = () => setShowModal(true);
    const handleClose = () => setShowModal(false);


    const fetchReqDonasi = async () => {
        try {
            const response = await api.get('/reqDonasi/all');
            setReqDonasiList(response.data);
        } catch (error) {
            console.error('Failed to fetch ReqDonasi:', error);
        }
    };

    const fetchUser = async () => {
        try {
            const response = await api.get('/user/public');
            setUserList(response.data);
        } catch (error) {
            console.error('Failed to fetch User:', error);
        }
    };

    const getUserNameById = (id) => {
        const user = userList.find(u => u.id_user === id);
        return user ? user.first_name : 'Unknown User';
    };

    useEffect(() => {
        fetchReqDonasi();  
        fetchUser();
    }, []);

    return (

        <div>
            <NavbarOwner />
            <KelolaDonasiModal  show={showModal} onHide={handleClose} />
            <Container className="mt-5">
                <Row>
                    <Col md={6}>
                        <h2 className="text-success fw-bold welcome-heading">Daftar Request Donasi</h2>
                    </Col>
                    <Col md={6} className="d-flex justify-content-end">
                        <Button variant="success" onClick={handleShow}>Kelola Donasi</Button>
                    </Col>
                </Row>
                <hr />
                <Row className="mt-4">
                    {reqDonasiList.map((reqDonasi) => (
                        <ReqDonasiCard 
                            key={reqDonasi.id_reqdonasi} 
                            reqDonasi={reqDonasi} 
                            getUserNameById={getUserNameById} 
                        />
                    ))}
                </Row>
            </Container>
        </div>
    );
};
export default OwnerLandingPage;