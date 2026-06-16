import { Link, useLocation } from "react-router-dom";

const S = {
  wrap: {
    display: "flex",
    gap: 8,
    padding: "0 32px",
    background: "#060A0D",
    borderBottom: "1px solid #14465B",
    fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace",
  },
  link: (active) => ({
    padding: "10px 18px",
    textDecoration: "none",
    fontSize: 12,
    fontWeight: 600,
    color: active ? "#FFFFFF" : "#94A3B8",
    background: active ? "#0B202B" : "transparent",
    borderTop: active ? "2px solid #048C8C" : "2px solid transparent",
    borderLeft: active ? "1px solid #14465B" : "1px solid transparent",
    borderRight: active ? "1px solid #14465B" : "1px solid transparent",
    borderBottom: active ? "1px solid #0B202B" : "1px solid transparent",
    marginBottom: -1,
    transition: "all 0.15s ease",
  }),
};

const TABS = [
  { to: "/detay/ogrenciler", label: "1. Öğrenciler" },
  { to: "/detay/dersler",    label: "2. Dersler" },
  { to: "/detay/analiz",     label: "3. Analiz" },
];

export default function DetailNav() {
  const loc = useLocation();
  return (
    <div style={S.wrap}>
      {TABS.map(t => {
        const active = loc.pathname === t.to || loc.pathname === t.to + "/";
        return (
          <Link key={t.to} to={t.to} style={S.link(active)}>{t.label}</Link>
        );
      })}
    </div>
  );
}
