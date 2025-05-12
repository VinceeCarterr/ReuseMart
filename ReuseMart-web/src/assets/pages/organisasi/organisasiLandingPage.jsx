import React, { useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import "../landingPage.css";
import NavbarOrganisasi from "../../components/Navbar/navbarOrgansiasi.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../../api/api.js";

const ProductCard = ({ barang }) => (
  <Card className="ProductCart mb-3">
    <div style={{ height: "150px", backgroundColor: "#ccc" }}>
      <img
        src={barang.foto1}
        alt={barang.nama_barang}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
    <Card.Body>
      <Card.Title style={{ fontWeight: 575 }}>{barang.nama_barang}</Card.Title>
      <Card.Title style={{ fontWeight: 575 }}>
        Rp {barang.harga.toLocaleString("id-ID")}
      </Card.Title>
      <Card.Text>
        {barang.kategori}
        <br />
        Rating Penjual: {barang.rating}
      </Card.Text>
    </Card.Body>
  </Card>
);

const OrganisasiLandingPage = () => {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get("q")?.toLowerCase() || "";

  const [highlightProducts, setHighlightProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  useEffect(() => {
    api
      .get("/barang")
      .then(({ data }) => {
        setHighlightProducts(data.slice(0, 6));
        setAllProducts(data.filter((b) => b.status === "Available"));
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e) => {
      if (e.deltaY === 0) return;
      e.preventDefault();
      el.scrollTo({ left: el.scrollLeft + e.deltaY, behavior: "smooth" });
    };
    el.addEventListener("wheel", onWheel);
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // filter by nama_barang
  const visible = allProducts.filter((b) =>
    b.nama_barang.toLowerCase().includes(q)
  );

  return (
    <div>
      <NavbarOrganisasi />

      {/* Hero */}
      <Container className="my-5">
        <h2 className="text-success fw-bold welcome-heading">
          Selamat Datang di ReuseMart!
        </h2>
        <p className="lead">
          Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!
        </p>
      </Container>

      <hr />

      {/* Products */}
      <Container className="mt-4">
        <Row>
          {visible.length === 0 ? (
            <Col>
              <p className="text-center text-muted">
                {q ? `Tidak ada produk untuk "${q}".` : "Belum ada produk tersedia."}
              </p>
            </Col>
          ) : (
            visible.map((barang, idx) => (
              <Col
                data-aos="fade-down"
                key={idx}
                xs={6}
                sm={4}
                md={4}
                lg={2}
                className="mb-3"
              >
                <a href={`/produk/${barang.id_barang}`} style={{ textDecoration: "none" }}>
                  <ProductCard barang={barang} />
                </a>
              </Col>
            ))
          )}
        </Row>
      </Container>
    </div>
  );
};

export default OrganisasiLandingPage;
