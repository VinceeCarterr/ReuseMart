import React, { useRef, useEffect, useState } from "react";
import { Container, Row, Col, Card } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js";
import "./landingPage.css";
import NavbarLandingPage from "../components/Navbar/navbar.jsx";
import AOS from 'aos';
import 'aos/dist/aos.css';
import AuthModal from "../components/authModal.jsx";

const ProductCard = ({ barang }) => (
    <Card className="ProductCart mb-2" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '150px', backgroundColor: '#ccc', overflow: 'hidden' }}>
            <img 
                src={`http://127.0.0.1:8000/storage/${barang.foto?.[0]?.path ?? 'defaults/no-image.png'}`} 
                alt="Gambar 1" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
        </div>
        <Card.Body style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
            <div style={{ flexGrow: 1 }}>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>{barang.nama_barang}</Card.Title>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>
                    {barang.harga?.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}
                </Card.Title>
                <Card.Text style={{ fontSize: '0.9rem' }}>{barang.kategori}</Card.Text>
                <Card.Text style={{ fontSize: '0.9rem' }}>
                    Rating: {barang.rating ? barang.rating : 'N/A'}
                </Card.Text>
            </div>
        </Card.Body>
    </Card>
);

const LandingPage = () => {
    const [barangHighlight, setBarangHighlight] = useState([]);
    const [barangList, setBarangList] = useState([]);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const scrollRef = useRef(null);

    const fetchBarang = async () => {
        try {
            const [ { data: barangData }, { data: ratingsData } ] = await Promise.all([
            api.get('/barang'),
            api.get('/user-ratings'),
            ]);

            const combined = barangData.map(item => {
            const userRating = ratingsData.find(r => r.id_barang === item.id_barang)?.rating ?? null;

            return {
                ...item,
                rating: userRating,
            };
        });
        setBarangList(combined);
    } catch (err) {
        console.error('Failed to fetch barang or ratings:', err);
        setBarangList([]);
    }
    };
    useEffect(() => {
        fetchBarang();
    }, []);

    const handleAuthOpen = (mode) => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const handleAuthClose = () => {
        setShowAuthModal(false);
    };

    useEffect(() => {
        AOS.init({ duration: 800 });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        const onWheel = (e) => {
            if (e.deltaY === 0) return;
            e.preventDefault();
            el.scrollTo({
                left: el.scrollLeft + e.deltaY,
                behavior: "smooth",
            });
        };

        el.addEventListener("wheel", onWheel);
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    return (
        <div>
            <NavbarLandingPage onLoginClick={() => handleAuthOpen("login")} onRegisterClick={() => handleAuthOpen("register")} />
            <AuthModal show={showAuthModal} onHide={handleAuthClose} mode={authMode} onSwitch={setAuthMode} />

            {/* Hero Section */}
            <Container className="my-5">
                <h2 className="text-success fw-bold welcome-heading">Selamat Datang di ReuseMart!</h2>
                <p className="lead">Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!</p>
            </Container>

            {/* Highlight Section (Commented Out) */}
            <Container className="mb-4" style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}>
                <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">Kesempatan Terakhir!</h4>
                <Row>
                    <Container fluid>
                        <div ref={scrollRef} className="horizontal-scroll d-flex flex-row overflow-auto mb-2">
                            {barangList
                                .filter(barang => 
                                    barang.status === 'Available' && barang.status_periode === "Periode 2")
                                .map((barang, index) => (
                                <div key={index} className="highlight-card me-3 flex-shrink-0">
                                    <Link to={`/produk/${barang.id_barang}`} style={{ textDecoration: 'none' }}>
                                        <ProductCard barang={barang} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </Container>
                </Row>
            </Container>

            <hr />

            {/* All Products Section */}
            <Container className="mt-4">
                <Row>
                    {barangList
                        .filter(barang => 
                            barang.status === 'Available' && 
                            (barang.status_periode === "Periode 1" || barang.status_periode === "Periode 2")
                        )
                        .map((barang, index) => (
                            <Col 
                                data-aos="fade-down" 
                                key={index} 
                                xs={6} 
                                sm={4} 
                                md={4} 
                                lg={2} 
                                className="mb-3"
                            >
                                <Link to={`/produk/${barang.id_barang}`} style={{ textDecoration: 'none' }}>
                                    <ProductCard barang={barang} />
                                </Link>
                            </Col>
                        ))}
                </Row>
            </Container>
        </div>
    );
};

export default LandingPage;