import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { AppProvider } from "./AppContext";
import YearlyModel from "./YearlyModel";
import MonthlyModel from "./MonthlyModel";
import PriceBreakevenModel from "./PriceBreakevenModel";
import DetailStudentsPage from "./DetailStudentsPage";
import DetailCoursesPage from "./DetailCoursesPage";
import DetailAnalysisPage from "./DetailAnalysisPage";

const S = {
  nav: {
    background: "#060A0D",
    padding: "16px 32px",
    borderBottom: "1px solid #14465B",
    display: "flex",
    gap: "10px",
    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace"
  },
  link: (active) => ({
    padding: "8px 16px",
    borderRadius: "8px",
    textDecoration: "none",
    fontSize: "14px",
    fontWeight: "bold",
    color: active ? "#FFFFFF" : "#94A3B8",
    background: active ? "#1A5369" : "transparent",
    border: active ? "1px solid #048C8C" : "1px solid transparent",
    transition: "all 0.2s ease-in-out"
  })
};

const Navigation = () => {
  const loc = useLocation();
  const isAylik = loc.pathname === "/ayl%C4%B1k" || loc.pathname === "/ayl%C4%B1k/" || loc.pathname === "/aylık" || loc.pathname === "/aylık/";
  const isFiyat = loc.pathname === "/fiyat" || loc.pathname === "/fiyat/";
  const isDetay = loc.pathname.startsWith("/detay");

  return (
    <div style={S.nav}>
      <Link to="/" style={S.link(loc.pathname === "/")}>Yıllık Simülasyon</Link>
      <Link to="/aylık" style={S.link(isAylik)}>Aylık Nakit Akışı</Link>
      <Link to="/fiyat" style={S.link(isFiyat)}>Fiyat Bazlı Başa Baş</Link>
      <Link to="/detay/ogrenciler" style={S.link(isDetay)}>Detaylı Hesaplama</Link>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Navigation />
        <Routes>
          <Route path="/" element={<YearlyModel />} />
          <Route path="/aylık" element={<MonthlyModel />} />
          <Route path="/fiyat" element={<PriceBreakevenModel />} />
          <Route path="/detay/ogrenciler" element={<DetailStudentsPage />} />
          <Route path="/detay/dersler" element={<DetailCoursesPage />} />
          <Route path="/detay/analiz" element={<DetailAnalysisPage />} />
        </Routes>
      </HashRouter>
    </AppProvider>
  );
}
