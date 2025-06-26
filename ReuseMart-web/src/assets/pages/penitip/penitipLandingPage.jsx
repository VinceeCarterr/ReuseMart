import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaStar } from "react-icons/fa";
import api from "../../../api/api.js";
import NavbarPenitip from "../../components/Navbar/navbarPenitip.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import "../landingPage.css";

const ProductCard = ({ barang }) => (
    <Card className="ProductCart mb-2" style={{ height: '350px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: '150px', backgroundColor: '#ccc', overflow: 'hidden' }}>
            <img 
                src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${barang.foto?.[0]?.path ?? 'defaults/no-image.png'}`} 
                alt="Gambar 1" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
        </div>
        <Card.Body style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '10px' }}>
            <div style={{ flexGrow: 1 }}>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>{barang.nama_barang}</Card.Title>
                <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>
                    {barang.harga?.toLocaleString("id-ID", {
                        style: "currency",
                        currency: "IDR",
                    })}
                </Card.Title>
                <Card.Text style={{ fontSize: '0.9rem' }}>{barang.kategori}</Card.Text>
                <Card.Text style={{ fontSize: '0.9rem' }}>
                    Rating: {barang.rating ? `${barang.rating}` : 'Belum memiliki rating'}
                </Card.Text>
                {barang.isTop ? (
                    <>
                        <Card.Text style={{ fontSize: "0.9rem" }}>
                            <FaStar style={{ marginRight: "5px", color: "gold" }} />
                            <strong>Top Seller</strong>
                        </Card.Text>
                    </>
                ) : null}
            </div>
        </Card.Body>
    </Card>
);

const PenitipLandingPage = () => {
    const [barangList, setBarangList] = useState([]);
    const [highlightProducts, setHighlightProducts] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const scrollRef = useRef(null);

    const fetchBarang = async () => {
        try {
            // Fetch barang, penitipan, and user data concurrently
            const [tempBarang, tempPenitipan, tempUser] = await Promise.all([
                api.get("/barang"),
                api.get("/penitipan/public"),
                api.get("/user/public"),
            ]);

            // Combine barang data with user ratings and isTop status
            const barangWithRatings = tempBarang.data.map((barang) => {
                const penitipan = tempPenitipan.data.find(
                    (p) => p.id_penitipan === barang.id_penitipan
                );
                const user = penitipan
                    ? tempUser.data.find((u) => u.id_user === penitipan.id_user)
                    : null;
                return {
                    ...barang,
                    rating: user ? user.rating : null,
                    isTop: user ? user.isTop : null,
                };
            });

            // Filter available barang
            const available = barangWithRatings.filter((b) => b.status === "Available");
            setBarangList(available);
            setHighlightProducts(available.slice(0, 6));
        } catch (err) {
            console.error("Failed to fetch data:", err);
            setBarangList([]);
            setHighlightProducts([]);
        }
    };

    useEffect(() => {
        fetchBarang();
        AOS.init({ duration: 800 });
    }, []);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        const onWheel = (e) => {
            if (!e.deltaY) return;
            e.preventDefault();
            el.scrollTo({
                left: el.scrollLeft + e.deltaY,
                behavior: "smooth",
            });
        };
        el.addEventListener("wheel", onWheel);
        return () => el.removeEventListener("wheel", onWheel);
    }, []);

    const filteredList = barangList.filter((barang) =>
        barang.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <>
            <NavbarPenitip
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
            />

            {/* Hero */}
            <Container className="my-5">
                <h2 className="text-success fw-bold welcome-heading">
                    Selamat Datang di ReuseMart!
                </h2>
                <p className="lead">
                    Platform menitipkan barang bekas dengan kepercayaan penuh.
                </p>
            </Container>

            {/* Highlight */}
            {highlightProducts.length > 0 && (
                <Container
                    className="mb-4"
                    style={{
                        backgroundColor: "white",
                        borderRadius: 10,
                        padding: 20,
                        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">
                        Kesempatan Terakhir!
                    </h4>
                    <Row>
                        <div
                            ref={scrollRef}
                            className="horizontal-scroll d-flex flex-row overflow-auto mb-2"
                        >
                            {filteredList
                                .filter(
                                    (barang) =>
                                        barang.status === 'Available' &&
                                        barang.status_periode === "Periode 2"
                                )
                                .map((barang, index) => (
                                    <div
                                        key={index}
                                        className="highlight-card me-3 flex-shrink-0"
                                        style={{ width: 200 }}
                                    >
                                        <Link
                                            to={`/produk/${barang.id_barang}`}
                                            style={{ textDecoration: "none" }}
                                        >
                                            <ProductCard barang={barang} />
                                        </Link>
                                    </div>
                                ))}
                        </div>
                    </Row>
                </Container>
            )}

            <hr />

            {/* All Products */}
            <Container className="mt-4">
                <Row>
                    {filteredList
                        .filter(
                            (barang) =>
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
                                <Link
                                    to={`/produk/${barang.id_barang}`}
                                    style={{ textDecoration: 'none' }}
                                >
                                    <ProductCard barang={barang} />
                                </Link>
                            </Col>
                        ))}
                </Row>
            </Container>
        </>
    );
};

export default PenitipLandingPage;