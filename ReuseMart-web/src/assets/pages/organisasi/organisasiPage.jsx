import NavbarAdmin from "../../components/Navbar/navbarAdmin.jsx";
import { useEffect, useState } from "react";
import { Modal, Container, Row, Col, Card, Button, Spinner, Form, Toast, ToastContainer } from 'react-bootstrap';
import { Pencil, Trash } from 'lucide-react';
import api from "../../../api/api.js";
import UbahOrganisasiModal from "../../components/Organisasi/ubahOrganisasiModal.jsx";

const OrganisasiCard = ({ organisasi, onDeleteClick, onEditClick }) => (
    <Col md={12} className="justify-content-center mx-auto mb-2">
        <Card>
            <Card.Body className="p-2">
                <Row className="align-items-center">
                    <Col
                        md={3}
                        className="border-end d-flex align-items-center justify-content-center"
                    >
                        <strong>{organisasi.first_name}</strong>
                    </Col>
                    <Col
                        md={3}
                        className="border-end d-flex align-items-center justify-content-center"
                    >
                        {organisasi.email}
                    </Col>
                    <Col
                        md={3}
                        className="border-end d-flex align-items-center justify-content-center"
                    >
                        {organisasi.no_telp}
                    </Col>
                    <Col
                        md={3}
                        className="d-flex align-items-center justify-content-end gap-2"
                    >
                        <Button
                            variant="outline-primary"
                            size="sm"
                            onClick={() => onEditClick(organisasi)}
                        >
                            <Pencil />
                        </Button>
                        <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => onDeleteClick(organisasi)}
                        >
                            <Trash />
                        </Button>
                    </Col>
                </Row>
            </Card.Body>
        </Card>
    </Col>
);

const OrganisasiPage = () => {
    const [userList, setUserList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [organisasiToDelete, setOrganisasiToDelete] = useState(null);
    const [organisasiToEdit, setOrganisasiToEdit] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [toastShow, setToastShow] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastVariant, setToastVariant] = useState("success");

    useEffect(() => {
        (async () => {
            try {
                const { data } = await api.get("/organisasi");
                const organisasiOnly = data.filter(u => u.role?.nama_role === 'Organisasi');
                setUserList(organisasiOnly);
            } catch (err) {
                console.error("Error loading users:", err);
                setError("Gagal memuat data organisasi.");
            } finally {
                setLoading(false);
            }
        })();
    }, []);

    const handleDelete = async () => {
        if (organisasiToDelete) {
            try {
                await api.delete(`/organisasi/${organisasiToDelete.id_user}`);
                setUserList(prev => prev.filter(e => e.id_user !== organisasiToDelete.id_user));
                showToast("Data organisasi berhasil dihapus", "success");
                setShowDeleteModal(false);
                setOrganisasiToDelete(null);
            } catch (error) {
                showToast("Terjadi kesalahan saat mengubah organisasi.", "danger");
                setShowDeleteModal(false);
                console.error('Failed to delete organisasi:', error);
            }
        }
    };

    const onDeleteClick = (organisasi) => {
        setOrganisasiToDelete(organisasi);
        setShowDeleteModal(true);
    };

    const onEditClick = (organisasi) => {
        setOrganisasiToEdit(organisasi);
        setShowEditModal(true);
    };

    const filtered = userList.filter((u) => {
        const name = (u.first_name || "").toLowerCase();
        const email = (u.email || "").toLowerCase();
        const term = searchTerm.toLowerCase();

        return name.includes(term) || email.includes(term);
    });

    const showToast = (message, variant) => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastShow(true);
    };


    return (
        <div>
            <NavbarAdmin />
            <Container className="mt-5">
                <Row className="align-items-center mb-2">
                    <Col md={4}>
                        <h2 className="text-success fw-bold">Daftar Organisasi</h2>
                    </Col>
                    <Col md={4}>
                        <Form.Control
                            type="search"
                            placeholder="Cari Organisasi…"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Col>
                </Row>

                <hr />

                {loading ? (
                    <div className="text-center py-5">
                        <Spinner animation="border" />
                    </div>
                ) : error ? (
                    <div className="alert alert-danger">{error}</div>
                ) : (
                    <Row>
                        {filtered.length > 0 ? (
                            filtered.map((org) => (
                                <OrganisasiCard
                                    key={org.id_user}
                                    organisasi={org}
                                    onDeleteClick={onDeleteClick}
                                    onEditClick={onEditClick}
                                />
                            ))
                        ) : (
                            <Col>
                                <p className="text-center">Tidak ada organisasi yang cocok.</p>
                            </Col>
                        )}
                    </Row>
                )}
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
                    <p>Apakah anda yakin ingin menghapus organisasi ?</p>
                    <div className="d-flex justify-content-end">
                        <Button variant="outline-danger" onClick={handleDelete}>Hapus</Button>
                    </div>
                </Modal.Body>
            </Modal>

            <UbahOrganisasiModal
                show={showEditModal}
                onHide={() => setShowEditModal(false)}
                organisasiData={organisasiToEdit}
                onUpdateSuccess={async () => {
                    const { data } = await api.get("/organisasi");
                    const organisasiOnly = data.filter(u => u.role?.nama_role === 'Organisasi');
                    setUserList(organisasiOnly);
                }}
            />

            <ToastContainer
                className="position-fixed top-50 start-50 translate-middle z-3"
                style={{ minWidth: "300px" }}>
                <Toast
                    show={toastShow}
                    onClose={() => setToastShow(false)}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toastVariant === "success" ? "Sukses" : "Error"}</strong>
                    </Toast.Header>
                    <Toast.Body className={toastVariant === "success" ? "text-white" : ""}>
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
};

export default OrganisasiPage;