import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./assets/pages/landingPage.jsx";
import ProductPage from "./assets/pages/productPage.jsx";
import AdminPage from "./assets/pages/pegawai/adminPage.jsx";
import ProfilePenitipPage from "./assets/pages/penitip/profilePenitipPage.jsx";
import HistoryPenitip from "./assets/pages/penitip/historyPenitip.jsx"
import AlamatPage from "./assets/pages/pembeli/alamatPage.jsx";
import PembeliLandingPage from "./assets/pages/pembeli/pembeliLandingPage.jsx";
import HistoryPembeli from "./assets/pages/pembeli/historyPembeli.jsx";
import CSLandingPage from "./assets/pages/pegawai/CSLandingPage.jsx";
import OrganisasiPage from "./assets/pages/organisasi/organisasiPage.jsx";
import OrganisasiLandingPage from "./assets/pages/organisasi/organisasiLandingPage.jsx";
import ReqDonasi from "./assets/pages/organisasi/reqDonasi.jsx";
import ResetPassword from "./assets/pages/resetPasswordPage.jsx";

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#FFFCF7", minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/produk/:id" element={<ProductPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/profilePenitip" element={<ProfilePenitipPage />} />
          <Route path="/historyPenitip" element={<HistoryPenitip />} />
          <Route path="/alamat" element={<AlamatPage />} />
          <Route path="/pembeliLP" element={<PembeliLandingPage />} />
          <Route path="/historyPembeli" element={<HistoryPembeli />} />
          <Route path="/CSLP" element={<CSLandingPage />} />
          <Route path="/organisasi" element={<OrganisasiPage />} />
          <Route path="/organisasiLP" element={<OrganisasiLandingPage />} />
          <Route path="/request-donasi" element={<ReqDonasi />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
