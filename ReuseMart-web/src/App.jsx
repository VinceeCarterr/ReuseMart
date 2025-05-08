import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./assets/pages/landingPage.jsx";
import ProductPage from "./assets/pages/productPage.jsx";
import AdminPage from "./assets/pages/pegawai/adminPage.jsx";
import ProfilePenitipPage from "./assets/pages/penitip/profilePenitipPage.jsx";
import AlamatPage from "./assets/pages/pembeli/alamatPage.jsx";
import PembeliLandingPage from "./assets/pages/pembeli/pembeliLandingPage.jsx";
import HistoryPembeli from "./assets/pages/pembeli/historyPembeli.jsx";
import OrganisasiPage from "./assets/pages/pegawai/organisasiPage.jsx";

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#FFFCF7", minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/produk" element={<ProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profilePenitip" element={<ProfilePenitipPage />} />
          <Route path="/alamat" element={<AlamatPage />} />
          <Route path="/pembeliLP" element={<PembeliLandingPage />} />
          <Route path="/historyPembeli" element={<HistoryPembeli />} />
          <Route path="/organisasi" element={<OrganisasiPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
