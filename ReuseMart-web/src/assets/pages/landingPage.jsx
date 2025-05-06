import React, { useRef, useEffect, useState } from "react";
import { Container, Row, Col, Card, Button } from 'react-bootstrap';

import "./landingPage.css";

import NavbarLandingPage from "../components/navbar.jsx";

import AOS from 'aos';
import 'aos/dist/aos.css';

import AuthModal from "../components/authModal.jsx";

const productDummy = {
    title: "Mouse Gede",
    price: "Rp 250.000",
    category: "Elektronik",
    rating: "Rating Penjual: XX"
};

const ProductCard = () => (
    <Card className="ProductCart mb-3">
        <div style={{ height: '150px', backgroundColor: '#ccc' }} />
        <Card.Body>
            <Card.Title style={{ fontWeight: '575' }}>{productDummy.title}</Card.Title>
            <Card.Title style={{ fontWeight: '575' }}>{productDummy.price}</Card.Title>
            <Card.Text>{productDummy.category}<br />
                {productDummy.rating}</Card.Text>
        </Card.Body>
    </Card>
);

const LandingPage = () => {
    const [highlightProducts, setHighlightProducts] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState("login");
    const scrollRef = useRef(null);

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
        const data = Array(6).fill(productDummy);
        setHighlightProducts(data);
        setAllProducts(Array(6).fill(productDummy));
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
            <NavbarLandingPage onLoginClick={() => handleAuthOpen("login")} onRegisterClick={() => handleAuthOpen("register")}/>
            <AuthModal show={showAuthModal} onHide={handleAuthClose} mode={authMode} onSwitch={setAuthMode} />

            {/* Hero Section */}
            <Container className="my-5">
                <h2 className="text-success fw-bold welcome-heading">Selamat Datang di ReuseMart!</h2>
                <p className="lead">Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!</p>
            </Container>

            {/* Highlight Section */}
            <Container className="mb-4" style={{ backgroundColor: 'white', borderRadius: '10px', padding: '20px' }}>
                <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">Kesempatan Terakhir!</h4>
                <Row>
                    <Container fluid>
                        <div ref={scrollRef} className="horizontal-scroll d-flex flex-row overflow-auto mb-2">
                            {highlightProducts.map((_, index) => (
                                <div key={index} className="highlight-card me-3 flex-shrink-0">
                                    <a href="/produk" style={{ textDecoration: 'none' }}>
                                        <ProductCard />
                                    </a>
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
                    {allProducts.map((_, index) => (
                        <Col data-aos="fade-down" key={index} xs={6} sm={4} md={4} lg={2} className="mb-3">
                            <a href="/produk" style={{ textDecoration: 'none' }}>
                                <ProductCard />
                            </a>
                        </Col>
                    ))}
                </Row>
            </Container>
        </div>
    );
}

export default LandingPage;
