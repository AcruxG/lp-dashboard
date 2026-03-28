import { HashRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import YearlyModel from "./YearlyModel";
import MonthlyModel from "./MonthlyModel";

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
  
  return (
    <div style={S.nav}>
      <Link to="/" style={S.link(loc.pathname === "/")}>Yıllık Simülasyon</Link>
      <Link to="/aylık" style={S.link(isAylik)}>Aylık Nakit Akışı</Link>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<YearlyModel />} />
        <Route path="/aylık" element={<MonthlyModel />} />
      </Routes>
    </HashRouter>
  );
}
