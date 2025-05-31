import api from "../../../api/api.js";
import { useEffect, useState } from "react";
import { Card, Col, Container, Row, Form, Image } from "react-bootstrap";
import NavbarOwner from "../../components/Navbar/navbarOwner.jsx";
import "../../components/Navbar/navbarOwner.css";


const DonasiCard = ({ donasi, getBarangById, getUserById, getReqDonasiById, getPenjualByBarangId }) => {
    const barang = getBarangById(donasi.id_barang);
    const reqDonasi = getReqDonasiById(donasi.id_reqdonasi);
    const organisasi = getUserById(reqDonasi?.id_user);
    const penjual = getPenjualByBarangId(donasi.id_barang);

    console.log("donasi:", donasi); // Debug donasi
    console.log("reqDonasi:", reqDonasi); // Debug reqDonasi

    return (
        <Col md={6} className="mx-auto mb-4">
            <Card className="req-card h-100">
                <Card.Body>
                    <Row>
                        <Col xs={4}>
                            <Image
                                src={`http://localhost:8000/storage/${reqDonasi?.contoh_foto}`}
                                thumbnail
                            />
                        </Col>
                        <Col xs={8}>
                            <div>
                                <h5 className="mb-2">{barang?.nama_barang || "Barang Tidak Ditemukan"}</h5>
                            </div>
                            <div>
                                <strong>Nama Request:</strong> {reqDonasi?.nama_barangreq || "Tidak Diketahui"} <br />
                                <strong>Nama Penerima: </strong>{donasi.nama_penerima}
                            </div>
                            <div>
                                <strong>Penjual:</strong> {penjual?.first_name || "Tidak Diketahui"}
                            </div>
                            <div>
                                <strong>Organisasi:</strong> {organisasi?.first_name || "Tidak Diketahui"}
                            </div>
                            <div>
                                <strong>Tanggal Donasi:</strong> {donasi.tanggal_donasi}
                            </div>
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
    const [reqDonasiList, setReqDonasiList] = useState([]);
    const [penitipanList, setPenitipanList] = useState([]);

    const fetchData = async () => {
        try {
            const donasi = await api.get("/donasi");
            const barang = await api.get("/barang");
            const user = await api.get("/user/public");
            const reqDonasi = await api.get("/reqDonasi/all");
            const penitipan = await api.get("/penitipan/owner");

            console.log("reqDonasiList:", reqDonasi.data); // Debug reqDonasi data

            setDonasiList(donasi.data);
            setBarangList(barang.data);
            setUserList(user.data);
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
    const getPenjualByBarangId = (id) => {
        const barang = barangList.find(b => b.id_barang === id);
        if (!barang || !barang.id_penitipan) return null;
        const penitipan = penitipanList.find(p => p.id_penitipan === barang.id_penitipan);
        return penitipan ? userList.find(u => u.id_user === penitipan.id_user) : null;
    };

    const groupedDonasi = donasiList.reduce((acc, donasi) => {
        const reqDonasi = getReqDonasiById(donasi.id_reqdonasi);
        const user = reqDonasi ? getUserById(reqDonasi.id_user) : null;
        const firstName = user?.first_name || "Tidak Diketahui";

        if (!acc[firstName]) {
        acc[firstName] = [];
        }
        acc[firstName].push(donasi);
        return acc;
    }, {});

    return (
        <>
            <NavbarOwner />
            <Container className="mt-5" style={{ background: "none" }}>
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
                        />
                    </Col>
                    </Row>
                    <hr />
                </Col>
                </Row>
                {Object.keys(groupedDonasi).map((firstName) => (
                    <div key={firstName} className="mb-5">
                        <Row className="mb-3">
                            <Col md={10} className="mx-auto">
                                <h4 className="text-success fw-semibold border-bottom pb-2 mt-4">
                                    Organisasi: {firstName}
                                </h4>
                            </Col>
                        </Row>
                        <Row>
                        {groupedDonasi[firstName].map((donasi, idx) => (
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
                    </div>
                ))}
            </Container>
        </>
    );
};

export default HistoryDonasi;
