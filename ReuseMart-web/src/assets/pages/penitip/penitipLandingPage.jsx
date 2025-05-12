import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Container,
  Row,
  Col,
  Card,
  Image,
} from "react-bootstrap";
import api from "../../../api/api.js";
import NavbarPenitip from "../../components/Navbar/navbarPenitip.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import "../landingPage.css";

const ProductCard = ({ barang }) => (
  <Card className="ProductCart mb-3">
    <div
      style={{
        height: "150px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Image
        src={barang.foto1}
        alt={barang.nama_barang}
        style={{ maxHeight: "100%", maxWidth: "100%" }}
      />
    </div>
    <Card.Body>
      <Card.Title style={{ fontWeight: 575 }}>
        {barang.nama_barang}
      </Card.Title>
      <Card.Title style={{ fontWeight: 575 }}>
        Rp {barang.harga.toLocaleString("id-ID")}
      </Card.Title>
      <Card.Text>
        {barang.kategori}
        <br />
        Rating Penjual: {barang.rating ?? "–"}
      </Card.Text>
    </Card.Body>
  </Card>
);

const PenitipLandingPage = () => {
  const [barangList, setBarangList] = useState([]);
  const [highlightProducts, setHighlightProducts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    // fetch all barang
    const fetchBarang = async () => {
      try {
        const { data } = await api.get("/barang");
        const available = data.filter((b) => b.status === "Available");
        setBarangList(available);
        setHighlightProducts(available.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch barang:", err);
      }
    };
    fetchBarang();
    AOS.init({ duration: 800 });
  }, []);

  // horizontal scroll
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

  return (
    <>
      <NavbarPenitip />

      {/* Hero */}
      <Container className="my-5">
        <h2 className="text-success fw-bold welcome-heading">
          Selamat Datang di ReuseMart!
        </h2>
        <p className="lead">
          Platform menitipkan barang bekas dengan kepercayaan penuh.
        </p>
      </Container>

      {/* Highlight
      {highlightProducts.length > 0 && (
        <Container
          className="mb-4"
          style={{ backgroundColor: "white", borderRadius: 10, padding: 20 }}
        >
          <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">
            Kesempatan Terakhir!
          </h4>
          <Row>
            <div
              ref={scrollRef}
              className="horizontal-scroll d-flex flex-row overflow-auto mb-2"
            >
              {highlightProducts.map((barang) => (
                <div
                  key={barang.id_barang}
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

      <hr /> */}

      {/* All Products */}
      <Container className="mt-4">
        <Row>
          {barangList.map((barang) => (
            <Col
              data-aos="fade-down"
              key={barang.id_barang}
              xs={6}
              sm={4}
              md={3}
              lg={2}
              className="mb-3"
            >
              <Link
                to={`/produk/${barang.id_barang}`}
                style={{ textDecoration: "none" }}
              >
                <ProductCard barang={barang} />
              </Link>
            </Col>
          ))}
          {barangList.length === 0 && (
            <p className="text-center text-muted w-100">
              Belum ada produk tersedia.
            </p>
          )}
        </Row>
      </Container>
    </>
  );
};

export default PenitipLandingPage;
