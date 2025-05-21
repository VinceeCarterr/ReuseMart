import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Card, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js"; // Pastikan path-nya benar

import "./productPage.css"; // Pastikan path-nya benar

import NavbarLandingPage from "../components/Navbar/navbar.jsx";
import NavbarPenitipPage from "../components/Navbar/navbarPenitip.jsx";
import NavbarPembeliPage from "../components/Navbar/navbarPembeli.jsx";
import NavbarOrganisasiPage from "../components/Navbar/navbarOrgansiasi.jsx";

const ProductPage = () => {
    const { id } = useParams();
    const [barang, setBarang] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [fotos, setFotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    // New state to store user rating
    const [userRating, setUserRating] = useState(null);
    
    let profile = {};
    try{
        profile = JSON.parse(localStorage.getItem("profile") || "{}");
    }catch{ }

    const role = profile.role?.trim().toLowerCase() || "";

    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
    const renderNavbar = () => {
        switch (role){
            case "penitip":
                return <NavbarPenitipPage />;
            case "pembeli":
                return <NavbarPembeliPage />;
            case "organisasi":
                return <NavbarOrganisasiPage />;
            default:
                return <NavbarLandingPage />;
        }
    };

    useEffect(() => {
        const fetchPhotos = async () => {
            try {
                const response = await api.get(`/foto-barang/${id}`);
                setFotos(response.data);
                if (response.data.length > 0) {
                    setSelectedPhoto(response.data[0].path);
                }
            } catch (error) {
                console.error("Gagal mengambil foto barang:", error);
            }
        };

        fetchPhotos();
    }, [id]);

    // Fetch product details
    useEffect(() => {
        const fetchBarang = async () => {
            try {
                const response = await api.get(`/barang/${id}`);
                setBarang(response.data);
            } catch (error) {
                console.error("Gagal mengambil data produk:", error);
            }
        };
        fetchBarang();
    }, [id]);

    // New useEffect to fetch user rating for the product
    useEffect(() => {
        const fetchUserRating = async () => {
            try {
                const response = await api.get('/user-ratings');
                const ratingData = response.data.find(r => r.id_barang === parseInt(id));
                setUserRating(ratingData ? ratingData.rating : null);
            } catch (error) {
                console.error("Gagal mengambil rating pengguna:", error);
                setUserRating(null);
            }
        };

        fetchUserRating();
    }, [id]);

    // Fetch comments
    useEffect(() => {
        const fetchComments = async () => {
            try {
                const response = await api.get(`/barang/${id}/komentar`);
                setComments(response.data.data);
            } catch (error) {
                console.error("Gagal mengambil komentar:", error);
                setError("Gagal mengambil komentar. Silakan coba lagi.");
            }
        };

        fetchComments();
    }, [id]);

    // Handle adding a new comment
    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) {
            setError("Komentar tidak boleh kosong.");
            return;
        }

        if (!isLoggedIn) {
            setError("Silakan login untuk mengomentari forum.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const response = await api.post(`/barang/${id}/komentar`, {
                komentar: newComment,
            });
            setComments([...comments, response.data.data]);
            setNewComment("");
        } catch (error) {
            if (error.response?.status === 401) {
                setError("Silakan login untuk mengomentari forum.");
                localStorage.removeItem('token');
                setIsLoggedIn(false);
            } else if (error.response?.status === 403) {
                setError("Anda tidak memiliki izin untuk mengomentari forum.");
            } else if (error.response?.status === 500) {
                setError("Terjadi kesalahan server. Silakan coba lagi nanti.");
            } else {
                setError(error.response?.data?.message || "Gagal menambahkan komentar. Silakan coba lagi.");
            }
        } finally {
            setLoading(false);
        }
    };

    // Format garansi
    const cekGaransi = (garansi) => {
        if (!garansi || isNaN(new Date(garansi))) {
            return "Tidak ada garansi";
        }

        const garansiDate = new Date(garansi);
        const now = new Date();

        if (garansiDate < now) {
            return "Tidak ada garansi";
        }

        return garansiDate.toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    // Format waktu komentar
    const formatWaktu = (waktu) => {
        return new Date(waktu).toLocaleString('id-ID', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (!barang) return <div>Sedang memuat...</div>;

    return (
        <div>
            {renderNavbar()}
            <Container className="mt-1">
                <Row>
                    <Col md={6} className="my-5 d-flex flex-column align-items-center">
                        {/* Foto Utama */}
                        <div className="main-image-container mb-3">
                            <img
                                src={selectedPhoto ? `http://localhost:8000/storage/${selectedPhoto}` : "image.png"}
                                alt={barang.nama_barang}
                                className="main-image"
                            />
                        </div>

                        {/* Thumbnail */}
                        {fotos.length > 1 && (
                            <div className="thumbnail-scroll-container">
                                <div className="thumbnail-list d-flex gap-2">
                                    {fotos.map((foto, index) => (
                                        <div
                                            key={index}
                                            className={`thumbnail-box ${selectedPhoto === foto.path ? 'selected' : ''}`}
                                            onClick={() => setSelectedPhoto(foto.path)}
                                        >
                                            <img
                                                src={`http://localhost:8000/storage/${foto.path}`}
                                                alt={`Foto ${index + 1}`}
                                                className="thumbnail-image"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </Col>

                    <Col md={6} className="ProductDesc my-5" style={{ borderRadius: 10, padding: 20, backgroundColor: '#f8f9fa' }}>
                        <h2 className="text-success fw-bold">{barang.nama_barang}</h2>
                        <h4 className="text-success fw-bold">Rp {barang.harga}</h4>
                        <p style={{ color: 'gray' }}>
                            Deskripsi Produk:<br />
                            <span style={{ color: 'black' }}>{barang.deskripsi}</span>
                        </p>
                        <Row>
                            <Col md={6}>
                                <p>
                                    Kategori: {barang.kategori}<br />
                                    Garansi: {cekGaransi(barang.garansi)}<br />
                                    {/* Updated to show user rating instead of barang.rating */}
                                    Rating Penitip: {userRating !== null ? userRating : 'N/A'}
                                </p>
                            </Col>
                            <Col md={6} style={{ textAlign: 'right' }}>
                                <Button variant="outline-success">Tambah ke Keranjang</Button>
                            </Col>
                        </Row>
                        <Card className="mt-4">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">Forum Diskusi</h5>
                            </Card.Header>
                            <Card.Body>
                                {error && <Alert variant="danger">{error}</Alert>}
                                {comments.length === 0 ? (
                                    <p className="text-muted">Belum ada komentar.</p>
                                ) : (
                                    <ListGroup variant="flush" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                                        {comments.map((comment) => (
                                            <ListGroup.Item key={comment.id_komentar} className="border-0 py-3">
                                                <div className="d-flex justify-content-between">
                                                    <div>
                                                        <strong>
                                                            {comment.user
                                                                ? `${comment.user.first_name} ${comment.user.last_name || ''}`
                                                                : `${comment.pegawai.first_name} ${comment.pegawai.last_name} (CS)`}
                                                        </strong>
                                                        <p className="mb-1">{comment.komentar}</p>
                                                        <small className="text-muted">{formatWaktu(comment.waktu_komentar)}</small>
                                                    </div>
                                                </div>
                                            </ListGroup.Item>
                                        ))}
                                    </ListGroup>
                                )}
                                {isLoggedIn ? (
                                    <Form onSubmit={handleAddComment} className="mt-3">
                                        <Form.Group controlId="newComment">
                                            <Form.Control
                                                as="textarea"
                                                rows={3}
                                                placeholder="Tulis komentar Anda..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                disabled={loading}
                                            />
                                        </Form.Group>
                                        <Button
                                            variant="success"
                                            type="submit"
                                            className="mt-2"
                                            disabled={loading}
                                        >
                                            {loading ? <Spinner animation="border" size="sm" /> : "Kirim Komentar"}
                                        </Button>
                                    </Form>
                                ) : (
                                    <p className="mt-3 text-muted">
                                        <Link to="/login">Masuk</Link> untuk menambahkan komentar.
                                    </p>
                                )}
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ProductPage;