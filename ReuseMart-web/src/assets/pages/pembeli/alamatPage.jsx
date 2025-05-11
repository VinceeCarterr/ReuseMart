import NavbarPembeli from "../../components/Navbar/navbarPembeli";
import { useEffect, useState } from "react";
import { Container, Row, Col, Card, Button, Modal, Form } from 'react-bootstrap';
import { Pencil, Trash } from 'lucide-react';
import AlamatModal from "../../components/Pembeli/alamatModal";
import UbahAlamatModal from "../../components/Pembeli/ubahAlamatModal";
import api from "../../../api/api.js";

const AlamatCard = ({ alamat, onDeleteClick, onSetDefault, onEditClick }) => (
    <Col md={12} className="justify-content-center mx-auto mb-2">
        <Card className={alamat.isDefault ? "border border-2 border-success" : ""}>
            <Card.Body className="p-2">
                <Row className="align-items-center flex-wrap">
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        <strong>{alamat.label}</strong>
                        {alamat.isDefault && <div className="badge bg-success ms-2">Utama</div>}
                    </Col>
                    <Col md={1} className="border-end d-flex align-items-center justify-content-center">
                        {alamat.kota}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {alamat.kecamatan}
                    </Col>
                    <Col md={1} className="border-end d-flex align-items-center justify-content-center">
                        {alamat.kode_pos}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {alamat.alamat}
                    </Col>
                    <Col md={2} className="border-end d-flex align-items-center justify-content-center">
                        {alamat.catatan}
                    </Col>
                    <Col md={2} className="d-flex align-items-center justify-content-center">
                        <div className="d-flex justify-content-end gap-2">
                            {!alamat.isDefault && (
                                <Button
                                    variant="outline-success"
                                    size="sm"
                                    onClick={() => onSetDefault(alamat)}
                                >
                                    Utama
                                </Button>
                            )}
                            <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => onEditClick(alamat)}
                            >
                                <Pencil />
                            </Button>
                            <Button
                                variant="outline-danger"
                                size="sm"
                                onClick={() => onDeleteClick(alamat)}
                            >
                                <Trash />
                            </Button>
                        </div>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);

const AlamatPage = () => {
    const [showModal, setShowModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [alamatToDelete, setAlamatToDelete] = useState(null);
    const [alamatList, setAlamatList] = useState([]);
    const [showEditModal, setShowEditModal] = useState(false);
    const [alamatToEdit, setAlamatToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");


    const handleSetDefault = (selectedAlamat) => {
        const updatedList = alamatList.map((alamat) =>
            alamat === selectedAlamat
                ? { ...alamat, isDefault: true }
                : { ...alamat, isDefault: false }
        );
        setAlamatList(updatedList);
    };

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/alamat");
                setAlamatList(data);
            } catch (err) {
                console.error("Error loading alamat:", err);
            }
        })();
    }, []);

    const handleDelete = async () => {
        if (alamatToDelete) {
            try {
                await api.delete(`/alamat/${alamatToDelete.id_alamat}`);
                setAlamatList(prev => prev.filter(e => e.id_alamat !== alamatToDelete.id_alamat));
                setShowDeleteModal(false);
                setAlamatToDelete(null);
            } catch (error) {
                console.error('Failed to delete alamat:', error);
            }
        }
    };

    const onDeleteClick = (alamat) => {
        setAlamatToDelete(alamat);
        setShowDeleteModal(true);
    };

    const handleEditClick = (alamat) => {
        setAlamatToEdit(alamat);
        setShowEditModal(true);
    };

    const filtered = alamatList.filter((a) => {
        const label = (a.label || "").toLowerCase();
        const alamat = (a.alamat || "").toLowerCase();
        const term = searchTerm.toLowerCase();

        return label.includes(term) || alamat.includes(term);
    });


    return (
        <div>
            <NavbarPembeli />
            <AlamatModal show={showModal} onHide={() => setShowModal(false)} />
            <Container className="mt-5">
                <Row>
                    <Col md={12} className="mx-auto">
                        <Row>
                            <Col md={4}>
                                <h2 className="text-success fw-bold welcome-heading">Alamat</h2>
                            </Col>
                            <Col md={4}>
                                <Form.Control
                                    type="search"
                                    placeholder="Cari Alamat…"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </Col>
                            <Col md={4} className="d-flex justify-content-end">
                                <Button variant="success" className="btn btn-primary" onClick={() => setShowModal(true)}>Tambah alamat</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
            <br />
            <Container className="mt-3">
                <Row>
                    {filtered.length === 0 ? (
                        <Col md={12} className="text-center">
                            <p>Belum terdapat alamat yang dicari</p>
                        </Col>
                    ) : (
                        [...filtered]
                            .sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0))
                            .map((alamat, index) => (
                                <Col key={index} md={12} className="mb-2">
                                    <AlamatCard
                                        alamat={alamat}
                                        onDeleteClick={onDeleteClick}
                                        onSetDefault={handleSetDefault}
                                        onEditClick={handleEditClick}
                                    />
                                </Col>
                            ))
                    )}
                </Row>
            </Container>
            <Modal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                centered
            >
                <Modal.Header closeButton>
                    <Modal.Title>Konfirmasi Hapus</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Apakah anda yakin ingin menghapus alamat?</p>
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={handleDelete}>Hapus</Button>
                    </div>
                </Modal.Body>
            </Modal>

            <UbahAlamatModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                alamatData={alamatToEdit}
                onUpdateSuccess={async () => {
                    const { data } = await api.get("/alamat");
                    setAlamatList(data);
                }}
            />

        </div>
    );
}

export default AlamatPage;