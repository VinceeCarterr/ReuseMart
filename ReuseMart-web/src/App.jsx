import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./assets/pages/landingPage.jsx";
import ProductPage from "./assets/pages/productPage.jsx";

function App() {
  return (
    <Router>
      <div style={{ backgroundColor: "#FFFCF7", minHeight: "100vh", fontFamily: "Poppins, sans-serif" }}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/produk" element={<ProductPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
