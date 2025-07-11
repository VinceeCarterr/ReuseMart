import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Card, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Link } from "react-router-dom";
import { FaStar } from 'react-icons/fa';
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
    const [userIsTop, setUserIsTop] = useState(null);
    const [penitipFullName, setPenitipFullName] = useState(null); // New state for penitip's full name
    const [isLoading, setIsLoading] = useState(true); // New loading state for initial data fetch

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
        const fetchData = async () => {
            setIsLoading(true); // Set loading to true at the start
            try {
                await Promise.all([
                    fetchPhotos(),
                    fetchBarangAndRating(),
                    fetchComments()
                ]);
            } catch (error) {
                console.error("Gagal mengambil data:", error);
                setError("Gagal mengambil data. Silakan coba lagi.");
            } finally {
                setIsLoading(false); // Set loading to false after all fetches complete
            }
        };

        fetchData();
    }, [id]);

    const fetchPhotos = async () => {
        try {
            const response = await api.get(`/foto-barang/${id}`);
            setFotos(response.data);
            if (response.data.length > 0) {
                setSelectedPhoto(response.data[0].path);
            }
        } catch (error) {
            console.error("Gagal mengambil foto barang:", error);
            throw error; // Propagate error to be caught in fetchData
        }
    };

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

            
            if (user) {
                setUserIsTop(user.isTop); 
                setUserRating(user.rating);
                setPenitipFullName(`${user.first_name} ${user.last_name || ''}`); // Set penitip's full name
            } else {
                setUserIsTop(null);
                setUserRating(null);
                setPenitipFullName(null); // Reset penitip's full name
            }

            setBarang({
                ...barangData,
                rating: user ? user.rating : null
            });
        } catch (error) {
            console.error("Gagal mengambil data produk atau rating:", error);
            setBarang(null);
            setUserRating(null);
            setPenitipFullName(null); // Reset penitip's full name on error
            throw error; // Propagate error to be caught in fetchData
        }
    };


    const fetchComments = async () => {
        try {
            const response = await api.get(`/barang/${id}/komentar`);
            setComments(response.data.data);
        } catch (error) {
            console.error("Gagal mengambil komentar:", error);
            throw error; // Propagate error to be caught in fetchData
        }
    };

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
                setError(error.response.data.error || "Barang sudah terdapat di keranjang.");
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

    if (isLoading) {
        return (
            <div>
                {renderNavbar()}
                <Container className="mt-4" style={{ background: 'none' }}>
                    <div className="text-center mt-4">
                        <Spinner animation="border" variant="success" />
                        <p className="mt-2">Loading data...</p>
                    </div>
                </Container>
            </div>
        );
    }

    if (!barang) {
        return (
            <div>
                {renderNavbar()}
                <Container className="mt-4" style={{ background: 'none' }}>
                    <Alert variant="danger">Gagal memuat data produk. Silakan coba lagi.</Alert>
                </Container>
            </div>
        );
    }

    return (
        <div>
            {renderNavbar()}
            <Container className="mt-1" style={{ background: 'none' }}>
                <Row>
                    <Col md={6} className="my-5 d-flex flex-column align-items-center">
                        <div className="main-image-container mb-3">
                            <img
                                src={selectedPhoto ? `https://mediumvioletred-newt-905266.hostingersite.com/storage/${selectedPhoto}` : "image.png"}
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
                                                src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${foto.path}`}
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
                                    Rating Penitip: {userRating !== null ? userRating : 'Belum memiliki rating'} <br />
                                    <br />
                                    <hr />
                                    Penitip : {penitipFullName} <br /> 
                                    <strong>
                                        {userIsTop ? (
                                            <>
                                                <FaStar style={{ color: 'gold', marginRight: '5px' }} />
                                                Top Seller
                                            </>
                                        ) : ""}
                                    </strong>
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
