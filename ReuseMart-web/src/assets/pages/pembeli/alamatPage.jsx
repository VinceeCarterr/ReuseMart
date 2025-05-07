import NavbarPembeli from "../../components/Navbar/navbarPembeli";
import React, { useRef, useEffect, useState, use } from "react";
import { Container, Row, Col, Card, Button, Modal } from 'react-bootstrap';
import { Pencil, Trash } from 'lucide-react';
import AlamatModal from "../../components/Pembeli/alamatModal";

const AlamatCard = ({ alamat, onDeleteClick, onSetDefault }) => (
    <Col md={12} className="justify-content-center mx-auto">
        <Card className={alamat.isDefault ? "border border-2 border-success" : ""}>
            <Card.Body>
                <Row className="align-items-center">
                    <Col md={2}>
                        <strong>{alamat.label}</strong>
                        {alamat.isDefault && (
                            <div className="badge bg-success ms-2">Utama</div>
                        )}
                    </Col>
                    <Col md={1}>{alamat.kota}</Col>
                    <Col md={1}>{alamat.kecamatan}</Col>
                    <Col md={3}>{alamat.alamat}</Col>
                    <Col md={2}>{alamat.catatan}</Col>
                    <Col md={3} className="d-flex justify-content-end gap-2">
                        {!alamat.isDefault && (
                            <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => onSetDefault(alamat)}
                            >
                                Jadikan Utama
                            </Button>
                        )}
                        <Button variant="outline-primary" size="sm"><Pencil /></Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onDeleteClick(alamat)}
                        >
                            <Trash />
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);



const AlamatPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alamatList, setAlamatList] = useState([]);

    const handleSetDefault = (selectedAlamat) => {
        const updatedList = alamatList.map((alamat) =>
            alamat === selectedAlamat
                ? { ...alamat, isDefault: true }
                : { ...alamat, isDefault: false }
        );
        setAlamatList(updatedList);
    };


    useEffect(() => {
        const data = [
            {
                label: "Rumah",
                kota: "Yogyakarta",
                kecamatan: "Depok",
                alamat: "Jl Maguwoharjo No 211",
                catatan: "Depan kampus Atma Jaya",
                isDefault: true
            },
            {
                label: "Kantor",
                kota: "Yogyakarta",
                kecamatan: "Umbulharjo",
                alamat: "Jl Kusumanegara No 12",
                catatan: "Dekat stadion Mandala Krida",
                isDefault: false
            },
            {
                label: "Kos",
                kota: "Yogyakarta",
                kecamatan: "Depok",
                alamat: "Jl Kaliurang Km 5.5",
                catatan: "Sebelah Indomaret",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            },
            {
                label: "Orang Tua",
                kota: "Magelang",
                kecamatan: "Mungkid",
                alamat: "Jl Mayor Kusen No 8",
                catatan: "Dekat alun-alun Mungkid",
                isDefault: false
            },
            {
                label: "Rumah Sakit",
                kota: "Sleman",
                kecamatan: "Ngaglik",
                alamat: "Jl Palagan Tentara Pelajar No 88",
                catatan: "Belakang pom bensin",
                isDefault: false
            }
        ];
        setAlamatList(data);
    }, []);


    const onDeleteClick = (pegawai) => {
        setPegawaiToDelete(pegawai);
        setShowDeleteModal(true);
    };

    return (
        <div>
            <NavbarPembeli />
            <AlamatModal show={showModal} onHide={() => setShowModal(false)} />
            <Container className="mt-5">
                <Row>
                    <Col md={12} className="mx-auto">
                        <Row>
                            <Col md={6}>
                                <h2 className="text-success fw-bold welcome-heading">Alamat</h2>
                            </Col>
                            <Col md={6} className="d-flex justify-content-end">
                                <Button variant="success" className="btn btn-primary" onClick={() => setShowModal(true)}>Tambah alamat</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
            <br />
            <Container className="mt-3">
                <Row>
                    {[...alamatList]
                        .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                        .map((alamat, index) => (
                            <Col key={index} md={12} className="mb-2">
                                <AlamatCard
                                    alamat={alamat}
                                    onDeleteClick={onDeleteClick}
                                    onSetDefault={handleSetDefault}
                                />
                            </Col>
                        ))}
                </Row>
            </Container>
        </div>
    );
}

export default AlamatPage;