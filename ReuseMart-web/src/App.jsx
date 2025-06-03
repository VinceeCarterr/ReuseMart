import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import ProtectedRoute from './ProtectedRoute.jsx';
import LandingPage from "./assets/pages/landingPage.jsx";
import ProductPage from "./assets/pages/productPage.jsx";
import AdminPage from "./assets/pages/pegawai/adminPage.jsx";
import OwnerLandingPage from "./assets/pages/Owner/ownerLandingPage.jsx";
import HistoryPenitip from "./assets/pages/penitip/historyPenitip.jsx"
import AlamatPage from "./assets/pages/pembeli/alamatPage.jsx";
import PembeliLandingPage from "./assets/pages/pembeli/pembeliLandingPage.jsx";
import HistoryPembeli from "./assets/pages/pembeli/historyPembeli.jsx";
import CSLandingPage from "./assets/pages/pegawai/CSLandingPage.jsx";
import OrganisasiPage from "./assets/pages/organisasi/organisasiPage.jsx";
import OrganisasiLandingPage from "./assets/pages/organisasi/organisasiLandingPage.jsx";
import HistoryDonasi from "./assets/pages/Owner/historyDonasi.jsx";
import ReqDonasi from "./assets/pages/organisasi/reqDonasi.jsx";
import KeranjangPage from "./assets/pages/pembeli/keranjangPage.jsx";
import CheckoutOptionsPage from "./assets/pages/pembeli/checkOutOptionsPage.jsx";
import PenitipLandingPage from "./assets/pages/penitip/penitipLandingPage.jsx";
import ResetPassword from "./assets/pages/resetPasswordPage.jsx";
import Unauthorized from "./assets/pages/unauthorize.jsx";
import GudangLandingPage from "./assets/pages/gudang/gudangLP.jsx";
import Penjadwalan from "./assets/pages/gudang/penjadwalan.jsx";
import CatatPengambilan from "./assets/pages/gudang/catatPengambilan.jsx";
import AddBarangPage from "./assets/pages/gudang/addBarangPage.jsx";
import UploadProofPage from "./assets/pages/pembeli/UploadProofPage.jsx";
import KlaimMerch from './assets/pages/pegawai/klaimMerch.jsx';
import PelaporanPage from './assets/pages/Owner/pelaporanPage.jsx'

import VerifPembayaranPage from "./assets/pages/pegawai/VerifPembayaranPage.jsx";

import PenitipanBarang from "./assets/pages/gudang/penitipanBarang.jsx";


function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#FFFCF7", minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
        <Routes>
          {/* public route */}
          <Route path="/unauthorize" element={<Unauthorized />} />
          <Route path="/" element={<LandingPage />} />
          <Route path="/produk/:id" element={<ProductPage />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}> <AdminPage /> </ProtectedRoute>} />
          <Route path="/historyPenitip" element={<ProtectedRoute allowedRoles={['penitip']}> <HistoryPenitip /></ProtectedRoute>} />
          <Route path="/alamat" element={<ProtectedRoute allowedRoles={['pembeli', 'organisasi']}> <AlamatPage /> </ProtectedRoute>} />
          <Route path="/pembeliLP" element={<ProtectedRoute allowedRoles={['pembeli']}> <PembeliLandingPage /> </ProtectedRoute>} />
          <Route path="/historyPembeli" element={<ProtectedRoute allowedRoles={['pembeli']}> <HistoryPembeli /> </ProtectedRoute>} />
          <Route path="/CSLP" element={<ProtectedRoute allowedRoles={['cs']}> <CSLandingPage /> </ProtectedRoute>} />
          <Route path="/klaimMerch" element={<ProtectedRoute allowedRoles={['cs']}> <KlaimMerch /> </ProtectedRoute>} />
          <Route path="/organisasi" element={<ProtectedRoute allowedRoles={['admin']}> <OrganisasiPage /> </ProtectedRoute>} />
          <Route path="/organisasiLP" element={<ProtectedRoute allowedRoles={['organisasi']}> <OrganisasiLandingPage /> </ProtectedRoute>} />
          <Route path="/request-donasi" element={<ProtectedRoute allowedRoles={['organisasi']}> <ReqDonasi /> </ProtectedRoute>} />
          <Route path="penitipLP" element={<ProtectedRoute allowedRoles={['penitip']}> <PenitipLandingPage /> </ProtectedRoute>} />
          <Route path="/ownerLP" element={<ProtectedRoute allowedRoles={['owner']}> <OwnerLandingPage /> </ProtectedRoute>} />
          <Route path="/HistoryDonasi" element={<ProtectedRoute allowedRoles={['owner']}> <HistoryDonasi /> </ProtectedRoute>} />
          <Route path="/pelaporan" element={<ProtectedRoute allowedRoles={['owner']}> <PelaporanPage /> </ProtectedRoute>} />
          {/* Gudang */}
          <Route path="/gudangLP" element = {<ProtectedRoute allowedRoles={['gudang']}> <GudangLandingPage /></ProtectedRoute>} />
          <Route path="/catatPengambilan" element = {<ProtectedRoute allowedRoles={['gudang']}> <CatatPengambilan /></ProtectedRoute>} />
          <Route path="/penjadwalan" element = {<ProtectedRoute allowedRoles={['gudang']}> <Penjadwalan /></ProtectedRoute>} />
          <Route path="/tambahBarang" element = {<ProtectedRoute allowedRoles={['gudang']}> <AddBarangPage /></ProtectedRoute>} />

          <Route path="/gudangLP" element={<ProtectedRoute allowedRoles={['gudang']}> <GudangLandingPage /></ProtectedRoute>} />
          <Route path="/penitipanBarang" element={<ProtectedRoute allowedRoles={['gudang']}> <PenitipanBarang /></ProtectedRoute>} />

          <Route path="/cart" element={<ProtectedRoute allowedRoles={['pembeli']}> <KeranjangPage /> </ProtectedRoute>} />
          <Route path="/checkout-options" element={<ProtectedRoute allowedRoles={['pembeli']}> <CheckoutOptionsPage /> </ProtectedRoute>} />
          <Route path="/upload-proof" element={<ProtectedRoute allowedRoles={['pembeli']}> <UploadProofPage /> </ProtectedRoute>} />
          <Route path="/verif-pembayaran" element={<ProtectedRoute allowedRoles={['cs']}> <VerifPembayaranPage /> </ProtectedRoute>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
