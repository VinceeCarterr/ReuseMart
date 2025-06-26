import React, { useRef, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Container, Row, Col, Card, Spinner } from "react-bootstrap";
import { FaStar } from "react-icons/fa";
import api from "../../../api/api.js";
import NavbarPembeli from "../../components/Navbar/navbarPembeli.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import "../landingPage.css";

const ProductCard = ({ barang }) => (
  <Card
    className="ProductCart mb-2"
    style={{ height: "350px", display: "flex", flexDirection: "column" }}
  >
    <div
      style={{ height: "150px", backgroundColor: "#ccc", overflow: "hidden" }}
    >
      <img
        src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${
          barang.foto?.[0]?.path ?? "defaults/no-image.png"
        }`}
        alt="Gambar 1"
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
    <Card.Body
      style={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        padding: "10px",
      }}
    >
      <div style={{ flexGrow: 1 }}>
        <Card.Title style={{ fontWeight: "575", fontSize: "1rem" }}>
          {barang.nama_barang}
        </Card.Title>
        <Card.Title style={{ fontWeight: "575", fontSize: "1rem" }}>
          {barang.harga?.toLocaleString("id-ID", {
            style: "currency",
            currency: "IDR",
          })}
        </Card.Title>
        <Card.Text style={{ fontSize: "0.9rem" }}>
          {barang.kategori.nama_kategori}
        </Card.Text>
        <Card.Text style={{ fontSize: "0.9rem" }}>
          Rating: {barang.rating ? `${barang.rating}` : "Belum memiliki rating"}
        </Card.Text>
        {barang.isTop ? (
          <>
            <Card.Text style={{ fontSize: "0.9rem" }}>
              <FaStar style={{ marginRight: "5px", color: "gold" }} />
              <strong>Top Seller</strong>
            </Card.Text>
          </>
        ) : (
          ""
        )}
      </div>
    </Card.Body>
  </Card>
);

const PembeliLandingPage = () => {
  const [barangList, setBarangList] = useState([]);
  const [penitipanList, setPenitipanList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const [now, setNow] = useState(Date.now());
  const hasSentNotifications = useRef(false);
  const expiredPatched = useRef(new Set());
  const donatedPatched = useRef(new Set());
  const [selectedCategory, setSelectedCategory] = useState("");
  const [groupedCats, setGroupedCats] = useState([]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    api
      .get("/kategori")
      .then(({ data }) => setGroupedCats(data))
      .catch(console.error);
  }, []);

  const fetchBarang = async () => {
    setLoading(true);
    try {
      const [tempBarang, tempPenitipan, tempUser] = await Promise.all([
        api.get("/barangWithKategori"),
        api.get("/penitipan/public"),
        api.get("/user/public"),
      ]);

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

      setBarangList(barangWithRatings);
      const kategoriTree = await api.get("/kategori").then((r) => r.data);
      const enriched = barangWithRatings.map((b) => {
        const cat = kategoriTree.find((c) => c.id_kategori === b.id_kategori);
        return {
          ...b,
          subKategori: cat?.sub_kategori,
        };
      });
      setBarangList(enriched);

      setPenitipanList(tempPenitipan.data);
      setUserList(tempUser.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setBarangList([]);
      setPenitipanList([]);
      setUserList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const sendNotifications = async () => {
      if (hasSentNotifications.current) {
        return;
      }
      hasSentNotifications.current = true;

      try {
        const response = await api.post("/barang/notifPenitip");
        console.log("Notifications sent:", response.data);
      } catch (error) {
        console.error(
          "Failed to send notifications:",
          error.response?.data || error.message
        );
      }
    };

    sendNotifications();
  }, []);

  useEffect(() => {
    barangList.forEach((item) => {
      if (item.status === "Available") {
        const expireTs =
          new Date(item.tanggal_titip).getTime() + 30 * 24 * 3600 * 1000;
        if (
          now >= expireTs &&
          item.status_periode !== "Expired" &&
          !expiredPatched.current.has(item.id_barang)
        ) {
          expiredPatched.current.add(item.id_barang);
          api
            .put("/barang/updateExpired")
            .then(() => fetchBarang())
            .catch(console.error);
        }
      }
    });
  }, [now, barangList]);

  useEffect(() => {
    barangList.forEach((item) => {
      if (item.status_periode === "Expired" && item.status === "Akan Ambil") {
        const pickupDeadline =
          new Date(item.tanggal_titip).getTime() + 2 * 24 * 3600 * 1000;

        if (
          now >= pickupDeadline &&
          !donatedPatched.current.has(item.id_barang)
        ) {
          donatedPatched.current.add(item.id_barang);
          api
            .patch(`/transaksi/historyPenitip/${item.id_barang}`, {
              status: "Untuk Donasi",
            })
            .then(() => fetchBarang())
            .catch(console.error);
        }
      }
    });
  }, [now, barangList]);

  const handleCategorySelect = (selection) => {
    setSelectedCategory(selection);
    setSearchQuery("");
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

  const filteredList = barangList
  .filter((b) => {
    if (!selectedCategory) return true;

    if (selectedCategory.type === "category") {
      return b.kategori.nama_kategori === selectedCategory.name;
    }

    if (selectedCategory.type === "subCategory") {
      return b.id_kategori === selectedCategory.id;
    }

    return true;
  })

  .filter((b) => {
    if (!searchQuery) return true;
    return b.nama_barang
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
  });

  return (
    <div>
      <NavbarPembeli
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onCategorySelect={handleCategorySelect}
      />

      <Container className="my-5 text-center" style={{ background: "none" }}>
        <h2 className="text-success fw-bold welcome-heading">
          Selamat Datang di ReuseMart!
        </h2>
        <p className="lead">
          Platform berbelanja barang bekas dengan kualitas terbaik. Pasti Murah!
        </p>
      </Container>

      <Container
        className="mb-4"
        style={{
          backgroundColor: "white",
          borderRadius: "10px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h4 className="text-success fw-bold border-start border-5 border-success ps-3 mb-3">
          Kesempatan Terakhir!
        </h4>
        <Row>
          <Container fluid>
            <div
              ref={scrollRef}
              className="horizontal-scroll d-flex flex-row overflow-auto mb-2"
            >
              {filteredList
                .filter(
                  (barang) =>
                    barang.status === "Available" &&
                    barang.status_periode === "Periode 2"
                )
                .map((barang, index) => (
                  <div
                    key={index}
                    className="highlight-card me-3 flex-shrink-0"
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
          </Container>
        </Row>
      </Container>

      <hr />

      <Container className="mt-4" style={{ background: "none" }}>
        <Row>
          {filteredList
            .filter(
              (barang) =>
                barang.status === "Available" &&
                (barang.status_periode === "Periode 1" ||
                  barang.status_periode === "Periode 2")
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
                  style={{ textDecoration: "none" }}
                >
                  <ProductCard barang={barang} />
                </Link>
              </Col>
            ))}
        </Row>
      </Container>
    </div>
  );
};

export default PembeliLandingPage;
