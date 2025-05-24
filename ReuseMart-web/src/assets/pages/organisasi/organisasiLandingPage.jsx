import React, { useRef, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";

import "../landingPage.css";
import NavbarOrganisasi from "../../components/Navbar/navbarOrgansiasi.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import api from "../../../api/api.js";

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
        <Card.Title style={{ fontWeight: '575', fontSize: '1rem' }}>Rp {barang.harga}</Card.Title>
        <Card.Text style={{ fontSize: '0.9rem' }}>{barang.kategori}</Card.Text>
        <Card.Text style={{ fontSize: '0.9rem' }}>
          Rating Penitip: {barang.rating ? barang.rating : 'Belum memiliki rating'}
        </Card.Text>
      </div>
    </Card.Body>
  </Card>
);

const OrganisasiLandingPage = () => {
  const { search } = useLocation();
  const q = new URLSearchParams(search).get("q")?.toLowerCase() || "";
  const [barangList, setBarangList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightProducts, setHighlightProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    AOS.init({ duration: 800 });
  }, []);

  const fetchBarang = async () => {
    try {
            // Fetch barang
      const { data } = await api.get("/barang");

            // Fetch user ratings
      const ratingsResponse = await api.get('/user-ratings');
      const ratingsData = ratingsResponse.data;

            // Combine barang data with ratings
      const combinedData = data.map(barang => {
      const ratingObj = ratingsData.find(r => r.id_barang === barang.id_barang);
    return {
      ...barang,
        rating: ratingObj ? ratingObj.rating : null
      };
    });

            // Filter available barang
    const available = combinedData.filter(b => b.status === "Available");
    setBarangList(available);
    setHighlightProducts(available.slice(0, 6));
      } catch (err) {
        console.error("Failed to fetch barang or ratings:", err);
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

  const filteredList = barangList.filter(barang =>
        barang.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <NavbarOrganisasi 
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}/>

      {/* Hero */}
      <Container className="my-5">
        <h2 className="text-success fw-bold welcome-heading">
          Selamat Datang di ReuseMart!
        </h2>
        <p className="lead">
          Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!
        </p>
      </Container>
      {/* Highlight (Uncomment when needed) */}
      {highlightProducts.length > 0 && (
        <Container
          className="mb-4"
          style={{ backgroundColor: "white", borderRadius: 10, padding: 20, boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)' }}
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
                .filter(barang => 
                barang.status === 'Available' && barang.status_periode === "Periode 2")
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

      {/* Products */}
      <Container className="mt-4">
        <Row>
          {filteredList
            .filter(barang => 
              (barang.status === 'Available' && 
                (barang.status_periode === "Periode 1" || barang.status_periode === "Periode 2"))
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

export default OrganisasiLandingPage;
