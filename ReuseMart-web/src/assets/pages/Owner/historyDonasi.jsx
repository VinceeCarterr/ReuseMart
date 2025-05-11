import api from "../../../api/api.js";
import { useEffect, useState } from "react";
import { Card, Col, Container, Row, Form } from "react-bootstrap";
import NavbarOwner from "../../components/Navbar/navbarOwner.jsx";
import "../../components/Navbar/navbarOwner.css";

const DonasiCard = ({ donasi, getBarangById, getUserById, getReqDonasiById, getPenjualByBarangId }) => {
    const barang = getBarangById(donasi.id_barang);
    const reqDonasi = getReqDonasiById(donasi.id_reqdonasi);
    const organisasi = getUserById(reqDonasi?.id_user);
    const penjual = getPenjualByBarangId(donasi.id_barang);
    // const foto = getFotoByBarangId(donasi.id_barang);

    return (
        <Col md={6} className="mx-auto mb-4">
            <Card>
                <Card.Body className="p-3">
                    <Row>
                        {/* <Col md={4} className="d-flex align-items-center justify-content-center">
                            <img 
                                src={`http://localhost:8000/storage/${foto?.nama_file}`} 
                                alt="Foto Barang" 
                                className="img-fluid rounded" 
                                style={{ maxHeight: '150px', objectFit: 'cover' }}
                            />
                        </Col> */}

                        <Col md={8}>
                            <h5 className="mb-2">{barang?.nama_barang || "Barang Tidak Ditemukan"}</h5>
                            <p className="mb-1"><strong>Penjual:</strong> {penjual?.first_name || "Tidak Diketahui"}</p>
                            <p className="mb-1"><strong>Organisasi:</strong> {organisasi?.first_name || "Tidak Diketahui"}</p>
                            <p className="mb-1"><strong>Tanggal Donasi:</strong> {donasi.tanggal_donasi}</p>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Col>
    );
};

const HistoryDonasi = () => {
    const [donasiList, setDonasiList] = useState([]);
    const [barangList, setBarangList] = useState([]);
    const [userList, setUserList] = useState([]);
    // const [fotoList, setFotoList] = useState([]);
    const [reqDonasiList, setReqDonasiList] = useState([]);
    const [penitipanList, setPenitipanList] = useState([]);

    const fetchData = async () => {
        try {
            
            const donasi= await api.get('/donasi')
            const barang= await api.get('/barang');
            const user= await api.get('/user/public');
                // api.get('/foto'),
            const reqDonasi =  await api.get('/reqDonasi/all');
            const penitipan = await    api.get('/penitipan');
            
            setDonasiList(donasi.data);
            setBarangList(barang.data);
            setUserList(user.data);
            // setFotoList(foto.data);
            setReqDonasiList(reqDonasi.data);
            setPenitipanList(penitipan.data);
        } catch (error) {
            console.error("Error fetching data:", error);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const getBarangById = (id) => barangList.find(barang => barang.id_barang === id);
    const getUserById = (id) => userList.find(user => user.id_user === id);
    const getReqDonasiById = (id) => reqDonasiList.find(req => req.id_reqdonasi === id);
    // const getFotoByBarangId = (id) => fotoList.find(foto => foto.id_barang === id);
    const getPenjualByBarangId = (id) => {
        const penitipan = penitipanList.find(p => p.id_barang === id);
        return penitipan ? getUserById(penitipan.id_user) : null;
    };

    return (
        <>
            <NavbarOwner />
            <Container className="mt-5">
                <Row>
                    <Col md={10} className="mx-auto">
                        <Row>
                            <Col md={6}>
                                <h2 className="text-success fw-bold welcome-heading">Daftar History Donasi</h2>
                            </Col>
                            <Col md={6}>
                                <Form.Control
                                    type="search"
                                    placeholder="Cari Donasi . . ."
                                    className="me-2"
                                    // value={pencarian}
                                    // onChange={(e) => setPencarian(e.target.value)}
                                />
                            </Col>
                        </Row>
                        <hr />
                    </Col>
                </Row>
                <Row>
                    {donasiList.map((donasi, idx) => (
                        <DonasiCard 
                            key={idx} 
                            donasi={donasi}
                            getBarangById={getBarangById}
                            getUserById={getUserById}
                            getReqDonasiById={getReqDonasiById}
                            getPenjualByBarangId={getPenjualByBarangId}
                        />
                    ))}
                </Row>
            </Container>
        </>
    );
};

export default HistoryDonasi;
