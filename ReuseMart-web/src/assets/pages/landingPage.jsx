import React, { useRef, useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js";
import "./landingPage.css";

import NavbarLandingPage from "../components/Navbar/navbar.jsx";
// import NavbarPembeli from "../components/Navbar/navbarPembeli.jsx";

import AOS from 'aos';
import 'aos/dist/aos.css';

import AuthModal from "../components/authModal.jsx";


const ProductCard = ({ barang }) => (
    <Card className="ProductCart mb-3">
        <div style={{ height: '150px', backgroundColor: '#ccc' }} > 
            <img src={barang.foto1} alt="Gambar 1" />
        </div>
        <Card.Body>
            <Card.Title style={{ fontWeight: '575' }}>{barang.nama_barang}</Card.Title>
            <Card.Title style={{ fontWeight: '575' }}>Rp {barang.harga}</Card.Title>
            <Card.Text>{barang.kategori}<br />
                {barang.rating}</Card.Text>
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
            const response = await api.get('/barang');
            setBarangList(response.data);
        } catch (error) {
            console.error('Failed to fetch barang:', error);
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

            {/* Highlight Section */}
            {/* <Container className="mb-4" style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px' }}>
                <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">Kesempatan Terakhir!</h4>
                <Row>
                    <Container fluid>
                        <div ref={scrollRef} className="horizontal-scroll d-flex flex-row overflow-auto mb-2">
                            {barangHighlight.map((barang, index) => (
                                <div key={index} className="highlight-card me-3 flex-shrink-0">
                                    <a href="/produk" style={{ textDecoration: 'none' }}>
                                        <ProductCard />
                                    </a>
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
                    {barangList.filter(barang => barang.status === 'Available')
                        .map((barang, index) => (
                        <Col data-aos="fade-down" key={index} xs={6} sm={4} md={4} lg={2} className="mb-3">
                            <Link to={`/produk/${barang.id_barang}`} style={{ textDecoration: 'none' }}>
                                <ProductCard barang={barang} />
                            </Link>
                        </Col>                    
                    ))}
                </Row>
            </Container>
        </div>
    );
}

export default LandingPage;
