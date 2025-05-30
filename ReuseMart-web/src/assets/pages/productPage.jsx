import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js";
import "./productPage.css";

import NavbarLandingPage from "../components/Navbar/navbar.jsx";
import NavbarPenitipPage from "../components/Navbar/navbarPenitip.jsx";
import NavbarPembeliPage from "../components/Navbar/navbarPembeli.jsx";
import NavbarOrganisasiPage from "../components/Navbar/navbarOrgansiasi.jsx";

const ProductPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [barang, setBarang] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [fotos, setFotos] = useState([]);
    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [addToCartLoading, setAddToCartLoading] = useState(false);
    const [userRating, setUserRating] = useState(null);

    let profile = {};
    try {
        profile = JSON.parse(localStorage.getItem("profile") || "{}");
    } catch {
        profile = {};
    }

    const role = profile.role?.trim().toLowerCase() || "";
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

    const renderNavbar = () => {
        switch (role) {
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

    useEffect(() => {
        const fetchBarangAndRating = async () => {
            try {
                const [barangResponse, penitipanResponse, userResponse] = await Promise.all([
                    api.get(`/barang/${id}`),
                    api.get('/penitipan/public'),
                    api.get('/user/public')
                ]);

                const barangData = barangResponse.data;
                const penitipan = penitipanResponse.data.find(p => p.id_penitipan === barangData.id_penitipan);
                const user = penitipan ? userResponse.data.find(u => u.id_user === penitipan.id_user) : null;

                setBarang({
                    ...barangData,
                    rating: user ? user.rating : null
                });
                setUserRating(user ? user.rating : null);
            } catch (error) {
                console.error("Gagal mengambil data produk atau rating:", error);
                setBarang(null);
                setUserRating(null);
            }
        };

        fetchBarangAndRating();
    }, [id]);

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

    const handleAddToCart = async () => {
        if (!isLoggedIn) {
            setError("Silakan login untuk menambahkan barang ke keranjang.");
            navigate('/login');
            return;
        }

        setAddToCartLoading(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const response = await api.post('/cart/add', {
                id_barang: id,
            });
            setSuccessMessage(response.data.message);
            setTimeout(() => {
                navigate('/cart');
            }, 1200);
        } catch (error) {
            if (error.response?.status === 401) {
                setError("Sesi Anda telah berakhir. Silakan login kembali.");
                localStorage.removeItem('token');
                setIsLoggedIn(false);
                navigate('/login');
            } else if (error.response?.status === 400) {
                setError(error.response.data.error || "Barang tidak tersedia untuk dibeli.");
            } else {
                setError(error.response?.data.error || "Gagal menambahkan barang ke keranjang. Silakan coba lagi.");
            }
        } finally {
            setAddToCartLoading(false);
        }
    };

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
            <Container className="mt-1" style={{ background:'none'}}>
                <Row>
                    <Col md={6} className="my-5 d-flex flex-column align-items-center">
                        <div className="main-image-container mb-3">
                            <img
                                src={selectedPhoto ? `http://localhost:8000/storage/${selectedPhoto}` : "image.png"}
                                alt={barang.nama_barang}
                                className="main-image"
                            />
                        </div>
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
                                    Rating Penitip: {userRating !== 0 ? userRating : 'Belum memiliki rating'}
                                </p>
                            </Col>
                            <Col md={6} style={{ textAlign: 'right' }}>
                                <Button
                                    variant="outline-success"
                                    onClick={handleAddToCart}
                                    disabled={addToCartLoading}
                                >
                                    {addToCartLoading ? (
                                        <Spinner animation="border" size="sm" />
                                    ) : (
                                        "Tambah ke Keranjang"
                                    )}
                                </Button>
                            </Col>
                        </Row>
                        {/* Tampilkan pesan sukses atau error */}
                        {successMessage && <Alert variant="success" className="mt-3">{successMessage}</Alert>}
                        {error && <Alert variant="danger" className="mt-3">{error}</Alert>}
                        <Card className="mt-4">
                            <Card.Header className="bg-success text-white">
                                <h5 className="mb-0">Forum Diskusi</h5>
                            </Card.Header>
                            <Card.Body>
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