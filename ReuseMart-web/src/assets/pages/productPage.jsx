import React, { useEffect, useState } from "react";
import { Container, Row, Col, Card, Navbar, Form, Button, Nav } from 'react-bootstrap';
import { useNavigate } from "react-router-dom";
import "./productPage.css";
import NavbarLandingPage from "../components/Navbar/navbar.jsx";

const ProductPage = () => {
    return (
        <div>
            <NavbarLandingPage />

            <Container>
                <Row>
                    <Col md={6} className=" text-center my-5">
                        <img src="image.png" alt="Product" style={{ width: '100%', maxWidth: '450px', borderRadius: '10px' }} />
                    </Col>
                    <Col md={6} className=" ProductDesc my-5" style={{ borderRadius: 10, padding: 20 }}>
                        <h2 className="text-success fw-bold">Mouse Gede</h2>
                        <h4 className="text-success fw-bold">Rp 250.000</h4>
                        <p style={{ color: 'gray' }}>Deskripsi Produk:
                            <br />
                            <text style={{ color: 'black' }}>
                                Nikmati udara sejuk dengan sentuhan vintage! Kipas angin retro ini terbuat dari material besi asli yang kokoh, tahan lama, dan memiliki desain elegan yang kini sudah tidak diproduksi massal lagi.

                                💨 Angin kencang, suara halus cocok untuk kamar tidur atau ruang kerja.
                                💡 Hemat listrik dengan teknologi motor efisien.
                                🧼 Sudah dibersihkan dan dicek kondisi 95% mulus, semua fungsi berjalan dengan baik.

                                ⚠️ Barang langka! Harga hanya Rp150.000 jauh di bawah harga pasaran untuk barang serupa. Cocok untuk kolektor atau pecinta gaya klasik minimalis.
                            </text>
                        </p>
                        <br />
                        <Row>
                            <Col className="md-6">
                                <p>Kategori : Elektronik
                                    <br />
                                    Rating Penjual: XX
                                </p>
                            </Col>
                            <Col className="md-6" style={{ textAlign: 'right' }}>
                                <Button variant="outline-success">Tambah ke Keranjang</Button>
                            </Col>
                        </Row>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};


export default ProductPage;