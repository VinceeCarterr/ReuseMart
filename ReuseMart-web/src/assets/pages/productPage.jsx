import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Card, Form, ListGroup, Alert, Spinner } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js"; // Pastikan path-nya benar
import NavbarLandingPage from "../components/Navbar/navbar.jsx";

const ProductPage = () => {
    const { id } = useParams();
    const [barang, setBarang] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));

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
            <NavbarLandingPage />
            <Container className="my-5">
                <Row>
                    <Col md={6} className="text-center my-5">
                        <img
                            src={barang.foto1 || "image.png"}
                            alt={barang.nama_barang}
                            style={{ width: '100%', maxWidth: '450px', borderRadius: '10px', objectFit: 'cover' }}
                        />
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
                                    Rating Penjual: {barang.rating}
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