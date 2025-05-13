import api from "../../../api/api.js";
import { useEffect, useState } from "react";
import { Card, Col, Container, Row, Button, Image } from "react-bootstrap";
import NavbarOwner from "../../components/Navbar/navbarOwner.jsx";
import "../../components/Navbar/navbarOwner.css";
import "aos/dist/aos.css";
import KelolaDonasiModal from "../../components/Owner/kelolaDonasiModal.jsx"; 


const ReqDonasiCard = ({ reqDonasi, getUserNameById }) => (
    <Col md={6} className="mx-auto mb-4">
        <Card className="req-card h-100">
            <Card.Body>
                <Row>
                    <Col xs={4}>
                        <Image
                            src={`http://localhost:8000/storage/${reqDonasi.contoh_foto}`}
                            thumbnail
                        />
                    </Col>
                    <Col xs={8}>
                        <div>
                            <h5 className="mb-2">{reqDonasi.nama_barangreq}</h5>
                        </div>
                        <div>
                            <strong>Nama Request:</strong> {reqDonasi?.nama_barangreq || "Tidak Diketahui"}
                        </div>
                        <div>
                            <strong>Nama Organisasi:</strong> {getUserNameById(reqDonasi.id_user)}
                        </div>
                        <div>
                            <strong>Kategori:</strong> {reqDonasi.kategori_barangreq}
                        </div>
                        <div>
                            <strong>Deskripsi</strong> {reqDonasi.deskripsi}
                        </div>
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
    const [donasiList, setDonasiList] = useState([]);

    const handleShow = () => setShowModal(true);
    const handleClose = () => setShowModal(false);

    const fetchDonasi = async () => {
        try {
            const response = await api.get('/donasi');
            setDonasiList(response.data);
        } catch (error) {
            console.error('Failed to fetch Donasi:', error);
        }
    };


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
        fetchDonasi();
    }, []);


    const isReqDonasiDone = (idReq) => {
        return donasiList.some(donasi => donasi.id_reqdonasi === idReq);
    };

    const filteredReqDonasiList = reqDonasiList.filter(req => !isReqDonasiDone(req.id_reqdonasi));


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
                    {filteredReqDonasiList.map((reqDonasi) => (
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