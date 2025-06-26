import React, { useRef, useEffect, useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import api from "../../api/api.js";
import "./landingPage.css";
import NavbarLandingPage from "../components/Navbar/navbar.jsx";
import AOS from "aos";
import "aos/dist/aos.css";
import AuthModal from "../components/authModal.jsx";

const ProductCard = ({ barang }) => (
  <Card
    className="ProductCart mb-2"
    style={{ height: "350px", display: "flex", flexDirection: "column" }}
  >
    <div
      style={{ height: "150px", backgroundColor: "#ccc", overflow: "hidden" }}
    >
      <img
        src={`https://mediumvioletred-newt-905266.hostingersite.com/storage/${barang.foto?.[0]?.path ?? "defaults/no-image.png"
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
        <Card.Text style={{ fontSize: "0.9rem" }}>{barang.kategori}</Card.Text>
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

const LandingPage = () => {
  const [barangList, setBarangList] = useState([]);
  const [penitipanList, setPenitipanList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState("login");
  const [searchQuery, setSearchQuery] = useState("");
  const scrollRef = useRef(null);

  const [now, setNow] = useState(Date.now());
  const hasSentNotifications = useRef(false);
  const expiredPatched = useRef(new Set());
  const donatedPatched = useRef(new Set());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchBarang = async () => {
    try {
      const [tempBarang, tempPenitipan, tempUser] = await Promise.all([
        api.get("/barang"),
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
          isTop: user ? user.isTop : null, // Add isTop field
        };
      });

      setBarangList(barangWithRatings);
      setPenitipanList(tempPenitipan.data);
      setUserList(tempUser.data);
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setBarangList([]);
      setPenitipanList([]);
      setUserList([]);
    }
  };

  useEffect(() => {
    const sendNotifications = async () => {
      if (hasSentNotifications.current) {
        return; // Skip if notifications have already been sent
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
      const donationDeadline = new Date(item.tanggal_titip).getTime() + 37 * 24 * 3600 * 1000; // 30 + 7 days

      if (now >= donationDeadline && !donatedPatched.current.has(item.id_barang)) {
        donatedPatched.current.add(item.id_barang);
        api
          .put(`/barang/update/${item.id_barang}`, {
            status: "Untuk Donasi",
            status_periode: item.status_periode, // Include existing status_periode to avoid overwriting
            tanggal_titip: item.tanggal_titip,  // Include existing tanggal_titip if needed
          })
          .then(() => fetchBarang())
          .catch((error) => {
            console.error(`Update failed for id_barang ${item.id_barang}:`, error);
            donatedPatched.current.delete(item.id_barang); // Allow retry if update fails
          });
      }
    }
  });
}, [now, barangList]);

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

  const handleAuthOpen = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };
  const handleAuthClose = () => setShowAuthModal(false);

  const filteredList = barangList.filter((barang) =>
    barang.nama_barang.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <NavbarLandingPage
        onLoginClick={() => handleAuthOpen("login")}
        onRegisterClick={() => handleAuthOpen("register")}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <AuthModal
        show={showAuthModal}
        onHide={handleAuthClose}
        mode={authMode}
        onSwitch={setAuthMode}
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

export default LandingPage;
