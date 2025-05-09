import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Button, Card } from 'react-bootstrap';
import { Link } from "react-router-dom";
import api from "../../api/api.js"; // Pastikan path-nya benar
import NavbarLandingPage from "../components/Navbar/navbar.jsx";

const ProductPage = () => {
    const { id } = useParams();
    const [barang, setBarang] = useState(null);

    useEffect(() => {
        const fetchBarang = async () => {
            try {
                const response = await api.get(`/barang/${id}`);
                setBarang(response.data);
            } catch (error) {
                console.error("Error fetching product:", error);
            }
        };

        fetchBarang();
    }, [id]);


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
            day: 'numeric'
        });
    };
    

    if (!barang) return <div>Loading...</div>;

    return (
        <div>
            <NavbarLandingPage />
            <Container>
                <Row>
                    <Col md={6} className="text-center my-5">
                        <img url={barang.foto1 || "image.png"} alt={barang.nama_barang} style={{ width: '100%', maxWidth: '450px', borderRadius: '10px' }} />
                    </Col>
                    <Col md={6} className="ProductDesc my-5" style={{ borderRadius: 10, padding: 20 }}>
                        <h2 className="text-success fw-bold">{barang.nama_barang}</h2>
                        <h4 className="text-success fw-bold">Rp {barang.harga}</h4>
                        <p style={{ color: 'gray' }}>
                            Deskripsi Produk:<br />
                            <span style={{ color: 'black' }}>{barang.deskripsi}</span>
                        </p>
                        <br />
                        <Row>
                            <Col md={6}>
                                <p>
                                    Kategori : {barang.kategori}<br />
                                    Garansi : {cekGaransi(barang.garansi)}
                                    <br />
                                    Rating Penjual: {barang.rating}
                                </p>
                            </Col>
                            <Col md={6} style={{ textAlign: 'right' }}>
                                <Button variant="outline-success">Tambah ke Keranjang</Button>
                            </Col>
                        </Row>
                        <Card>
                            INI NANTI DISKUSINYA
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ProductPage;
