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
                src={barang.foto1 ? `http://localhost:8000${barang.foto1}` : '/placeholder.jpg'} 
                alt="Gambar 1" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
        </div>
        <Card.Body style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
            <div style={{ flexGrow: 1 }}>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>{barang.nama_barang}</Card.Title>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>Rp {barang.harga}</Card.Title>
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
            // Fetch barang
            const barangResponse = await api.get('/barang');
            const barangData = barangResponse.data;

            // Fetch user ratings
            const ratingsResponse = await api.get('/user-ratings');
            const ratingsData = ratingsResponse.data;

            // Fetch photos for each barang
            const combinedData = await Promise.all(
                barangData.map(async (barang) => {
                    try {
                        const fotoResponse = await api.get(`/foto-barang/${barang.id_barang}`);
                        const fotos = fotoResponse.data;
                        // Use the first photo or null if none exist
                        const foto1 = fotos.length > 0 ? fotos[0].path : null;
                        const ratingObj = ratingsData.find(r => r.id_barang === barang.id_barang);
                        return {
                            ...barang,
                            rating: ratingObj ? ratingObj.rating : null,
                            foto1: foto1
                        };
                    } catch (fotoError) {
                        console.error(`Failed to fetch photos for barang ${barang.id_barang}:`, fotoError);
                        // Fallback if photo fetch fails
                        const ratingObj = ratingsData.find(r => r.id_barang === barang.id_barang);
                        return {
                            ...barang,
                            rating: ratingObj ? ratingObj.rating : null,
                            foto1: null
                        };
                    }
                })
            );

            setBarangList(combinedData);
        } catch (error) {
            console.error('Failed to fetch barang, ratings, or photos:', error);
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
            {/* <Container className="mb-4" style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px' }}>
                <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">Kesempatan Terakhir!</h4>
                <Row>
                    <Container fluid>
                        <div ref={scrollRef} className="horizontal-scroll d-flex flex-row overflow-auto mb-2">
                            {barangHighlight.map((barang, index) => (
                                <div key={index} className="highlight-card me-3 flex-shrink-0">
                                    <Link to={`/produk/${barang.id_barang}`} style={{ textDecoration: 'none' }}>
                                        <ProductCard barang={barang} />
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </Container>
                </Row>
            </Container> */}

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