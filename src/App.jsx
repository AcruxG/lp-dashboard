import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from "recharts";

// ── Course Catalog ───────────────────────────────────────────────────────────
const ALL_COURSES = [
  { name: "A-Level Further Maths", cat: "A-Level", rev: 216000, cst: 150000 },
  { name: "MAT (Oxford Maths)", cat: "Oxbridge", rev: 135000, cst: 75000 },
  { name: "STEP (Cambridge)", cat: "Oxbridge", rev: 135000, cst: 75000 },
  { name: "AP Calculus BC", cat: "AP", rev: 180000, cst: 125000 },
  { name: "A-Level Chemistry", cat: "A-Level", rev: 180000, cst: 125000 },
  { name: "A-Level Physics", cat: "A-Level", rev: 180000, cst: 125000 },
  { name: "PAT (Oxford Physics)", cat: "Oxbridge", rev: 112500, cst: 62500 },
  { name: "AP Physics C", cat: "AP", rev: 162000, cst: 112500 },
  { name: "AP Chemistry", cat: "AP", rev: 144000, cst: 100000 },
  { name: "A-Level Mathematics", cat: "A-Level", rev: 189000, cst: 150000 },
  { name: "TSA", cat: "Oxbridge", rev: 81000, cst: 50000 },
  { name: "AP Calculus AB", cat: "AP", rev: 126000, cst: 100000 },
  { name: "A-Level Economics", cat: "A-Level", rev: 126000, cst: 100000 },
  { name: "AP Statistics", cat: "AP", rev: 110250, cst: 87500 },
  { name: "A-Level Psychology", cat: "A-Level", rev: 110250, cst: 87500 },
  { name: "Bocconi Test", cat: "Sınav", rev: 72000, cst: 50000 },
  { name: "AP English Language", cat: "AP", rev: 94500, cst: 75000 },
  { name: "AP English Literature", cat: "AP", rev: 94500, cst: 75000 },
  { name: "SAT Math", cat: "Sınav", rev: 94500, cst: 75000 },
  { name: "SAT English", cat: "Sınav", rev: 94500, cst: 75000 },
  { name: "AP Psychology", cat: "AP", rev: 78750, cst: 62500 },
  { name: "AP MicroEconomics", cat: "AP", rev: 63000, cst: 50000 },
  { name: "AP MacroEconomics", cat: "AP", rev: 47250, cst: 37500 },
  { name: "TOEFL", cat: "Sınav", rev: 67500, cst: 62500 },
  { name: "IELTS", cat: "Sınav", rev: 67500, cst: 62500 },
];

// Compute averages
const AVG_REV = Math.round(ALL_COURSES.reduce((s, c) => s + c.rev, 0) / ALL_COURSES.length);
const AVG_CST = Math.round(ALL_COURSES.reduce((s, c) => s + c.cst, 0) / ALL_COURSES.length);
const AVG_MARGIN = AVG_REV - AVG_CST;

const CAT_COLORS = { AP: "#3b82f6", "A-Level": "#8b5cf6", Oxbridge: "#00d4aa", Sınav: "#f59e0b" };
const LINE_COLORS = ["#00d4aa", "#f59e0b", "#7c3aed", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { background: "#0d1117", color: "#e6edf3", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "28px 32px" },
  card: { background: "#161b22", border: "1px solid #30363d", borderRadius: 10 },
  label: { fontSize: 10, color: "#7d8590", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  tag: bg => ({ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: `${bg}22`, color: bg, display: "inline-block" }),
  input: {
    width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #30363d",
    color: "#e6edf3", fontSize: 20, fontWeight: 700, outline: "none", fontFamily: "inherit", padding: "6px 0"
  },
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#0d1117", border: "1px solid #30363d", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: "#7d8590", fontSize: 11, marginBottom: 6 }}>{label} öğrenci</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontSize: 11 }}>
          {p.name}: <b>₺{fmt(p.value)}</b>
        </div>
      ))}
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [numCourses, setNumCourses] = useState(3);
  const [numStudents, setNumStudents] = useState(10);
  const [fc, setFc] = useState(139252);
  const [hours, setHours] = useState(40);
  const [pricePerHour, setPricePerHour] = useState(4000);
  const [discount, setDiscount] = useState(10);
  const [tutorCostPerHour, setTutorCostPerHour] = useState(2000);
  // Danışmanlık (Consulting)
  const [numApps, setNumApps] = useState(5);
  const [pricePerAppUsd, setPricePerAppUsd] = useState(700);
  const [usdTry, setUsdTry] = useState(38);
  const [rateStatus, setRateStatus] = useState("loading");
  const [numConsultants, setNumConsultants] = useState(1);
  const [consultantWage, setConsultantWage] = useState(30000);
  const [payMode, setPayMode] = useState("wage"); // "wage" | "commission"
  const [commissionPct, setCommissionPct] = useState(20);
  // Manager
  const [managerWage, setManagerWage] = useState(50000);

  // Fetch live USD/TRY rate
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        const data = await res.json();
        if (data?.rates?.TRY) {
          setUsdTry(Math.round(data.rates.TRY * 100) / 100);
          setRateStatus("live");
        } else {
          setRateStatus("manual");
        }
      } catch {
        setRateStatus("manual");
      }
    };
    fetchRate();
  }, []);

  // Course calculations
  const avgRev = Math.round(hours * pricePerHour * (1 - discount / 100));
  const avgCst = Math.round(hours * tutorCostPerHour);
  const avgMargin = avgRev - avgCst;
  const revPerStu = numCourses * avgRev;
  const cstPerStu = numCourses * avgCst;
  const margPerStu = numCourses * avgMargin;

  // Danışmanlık calculations
  const pricePerAppTl = Math.round(pricePerAppUsd * usdTry);
  const totalApps = numApps * numStudents;
  const danRevTotal = totalApps * pricePerAppTl;
  const danCstTotal = payMode === "wage"
    ? numConsultants * consultantWage * 12
    : Math.round(danRevTotal * commissionPct / 100);
  const danMargin = danRevTotal - danCstTotal;

  // Manager annual cost
  const managerAnnual = managerWage * 12;

  // Combined totals
  const courseRevTotal = numStudents * revPerStu;
  const courseCstTotal = numStudents * cstPerStu;
  const courseGross = numStudents * margPerStu;

  const totalRev = courseRevTotal + danRevTotal;
  const totalCst = courseCstTotal + danCstTotal + managerAnnual;
  const totalGross = totalRev - totalCst;
  // KDV (VAT) — 20% included in revenue → extracted as rev × 20/120
  const totalKdv = totalRev * 20 / 120;
  const totalFC = fc;
  const preTaxProfit = totalGross - totalFC - totalKdv;
  // Kurumlar Vergisi (Corporate Tax) — 25% on profit (only if positive)
  const corpTax = preTaxProfit > 0 ? preTaxProfit * 0.25 : 0;
  const netProfit = preTaxProfit - corpTax;

  // Break-even (for course-only, simplified)
  const netMarginPerStu = margPerStu - (revPerStu * 20 / 120);
  const fixedTotal = fc + danCstTotal + managerAnnual - danRevTotal + (danRevTotal * 20 / 120);
  const breakEvenN = netMarginPerStu > 0 ? Math.ceil(Math.max(0, fixedTotal) / (netMarginPerStu * 0.75)) : Infinity;
  const grossPct = revPerStu > 0 ? (margPerStu / revPerStu * 100) : 0;

  // Chart: profit vs students for different course counts (1..8)
  const maxN = Math.max(30, numStudents + 10);
  const chartData = useMemo(() => Array.from({ length: maxN + 1 }, (_, n) => {
    const row = { n };
    for (let c = 1; c <= 8; c++) {
      const cRevPerStu = c * avgRev;
      const cMarginPerStu = c * avgMargin;
      const courseRev = n * cRevPerStu;
      const combinedRev = courseRev + danRevTotal;
      const combinedCst = n * c * avgCst + danCstTotal + managerAnnual;
      const combinedGross = combinedRev - combinedCst;
      const kdv = combinedRev * 20 / 120;
      const preTax = combinedGross - fc - kdv;
      const tax = preTax > 0 ? preTax * 0.25 : 0;
      row[`C${c}`] = preTax - tax;
    }
    return row;
  }), [fc, avgMargin, avgRev, avgCst, danRevTotal, danCstTotal, managerAnnual, maxN]);

  // Scenario rows
  const scenarioNs = [...new Set([1, 3, 5, 8, 10, 15, 20, 25, 30, numStudents])].sort((a, b) => a - b);
  const scenRows = scenarioNs.map(n => {
    const courseRev = n * revPerStu;
    const combinedRev = courseRev + danRevTotal;
    const combinedCst = n * cstPerStu + danCstTotal + managerAnnual;
    const combinedGross = combinedRev - combinedCst;
    const kdv = combinedRev * 20 / 120;
    const preTax = combinedGross - fc - kdv;
    const tax = preTax > 0 ? preTax * 0.25 : 0;
    const net = preTax - tax;
    return { n, rev: combinedRev, cst: combinedCst, gross: combinedGross, kdv, tax, net, green: net >= 0 };
  });

  // Course catalog stats by category
  const catStats = {};
  ALL_COURSES.forEach(c => {
    if (!catStats[c.cat]) catStats[c.cat] = { count: 0, totalRev: 0, totalCst: 0 };
    catStats[c.cat].count++;
    catStats[c.cat].totalRev += c.rev;
    catStats[c.cat].totalCst += c.cst;
  });

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 36, background: "#00d4aa", borderRadius: 2 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Study Surfer — Kâr Simülatörü
            </h1>
            <div style={{ fontSize: 11, color: "#7d8590", marginTop: 2 }}>
              Kurs Sayısı × Öğrenci Sayısı → Net Kâr · Ortalama Kurs Fiyatı Bazlı
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Controls ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>

        {/* Courses per student */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Öğrenci Başı Kurs Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={1} max={10} value={numCourses}
              onChange={e => setNumCourses(+e.target.value)}
              style={{ flex: 1, accentColor: "#00d4aa", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 40, fontWeight: 700, color: "#00d4aa", minWidth: 48, textAlign: "center" }}>{numCourses}</span>
          </div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 8 }}>
            <span style={{ color: "#e6edf3" }}>{numCourses}</span> kurs × ₺{fmt(avgRev)} ort. fiyat = <span style={{ color: "#3b82f6" }}>₺{fmt(revPerStu)}</span> / öğrenci
          </div>
        </div>

        {/* Number of students */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Toplam Öğrenci Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={1} max={50} value={numStudents}
              onChange={e => setNumStudents(+e.target.value)}
              style={{ flex: 1, accentColor: "#f59e0b", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 40, fontWeight: 700, color: "#f59e0b", minWidth: 48, textAlign: "center" }}>{numStudents}</span>
          </div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 8 }}>
            Başa baş noktası: <span style={{ color: numStudents >= breakEvenN ? "#00d4aa" : "#ef4444" }}>
              {breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`}
            </span>
          </div>
        </div>

        {/* Fixed costs */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Diğer Sabit Gider — FC (₺)</div>
          <input type="number" value={fc} onChange={e => setFc(+e.target.value)} style={S.input} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 8 }}>İşletme sabit giderleri (kira, vs.)</div>
        </div>

        {/* Manager wage */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Yönetici Aylık Maaş (₺)</div>
          <input type="number" value={managerWage} onChange={e => setManagerWage(+e.target.value)} style={S.input} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 8 }}>
            Yıllık: <span style={{ color: "#e6edf3" }}>₺{fmt(managerAnnual)}</span>
          </div>
        </div>
      </div>

      {/* ── Course Pricing Controls ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Ders Saati (saat)</div>
          <input type="number" value={hours} onChange={e => setHours(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Kurs başına toplam saat</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Saat Fiyatı (₺)</div>
          <input type="number" value={pricePerHour} onChange={e => setPricePerHour(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Öğrenciye satış fiyatı</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>İndirim (%)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={0} max={50} value={discount}
              onChange={e => setDiscount(+e.target.value)}
              style={{ flex: 1, accentColor: "#f59e0b", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#f59e0b", minWidth: 40, textAlign: "center" }}>%{discount}</span>
          </div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Paket indirimi</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Eğitmen Saat Ücreti (₺)</div>
          <input type="number" value={tutorCostPerHour} onChange={e => setTutorCostPerHour(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Eğitmene ödenen saat başı</div>
        </div>
      </div>

      {/* ── Derived Averages ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Geliri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#3b82f6" }}>₺{fmt(avgRev)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            {hours} saat × ₺{fmt(pricePerHour)} × {(100 - discount)}% = ₺{fmt(avgRev)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Gideri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>₺{fmt(avgCst)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            {hours} saat × ₺{fmt(tutorCostPerHour)} = ₺{fmt(avgCst)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Marjini</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#00d4aa" }}>₺{fmt(avgMargin)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            Marjin oranı: <span style={{ color: "#00d4aa" }}>{avgRev > 0 ? ((avgMargin / avgRev) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Danışmanlık Controls ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Başvuru Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={0} max={30} value={numApps}
              onChange={e => setNumApps(+e.target.value)}
              style={{ flex: 1, accentColor: "#ec4899", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 24, fontWeight: 700, color: "#ec4899", minWidth: 36, textAlign: "center" }}>{numApps}</span>
          </div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Öğrenci başı başvuru · Toplam: <span style={{ color:"#ec4899" }}>{totalApps}</span></div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Başvuru Fiyatı ($)</div>
          <input type="number" value={pricePerAppUsd} onChange={e => setPricePerAppUsd(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>
            = ₺{fmt(pricePerAppTl)} <span style={{ color:"#14b8a6" }}>($1 = ₺{usdTry})</span>
          </div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>
            Kur ($/₺)
            {rateStatus === "live" && <span style={{ marginLeft: 6, color: "#00d4aa", fontSize: 8, fontWeight: 700 }}>● CANLI</span>}
            {rateStatus === "loading" && <span style={{ marginLeft: 6, color: "#f59e0b", fontSize: 8 }}>● YÜKLENİYOR</span>}
            {rateStatus === "manual" && <span style={{ marginLeft: 6, color: "#7d8590", fontSize: 8 }}>● MANUEL</span>}
          </div>
          <input type="number" step="0.01" value={usdTry} onChange={e => { setUsdTry(+e.target.value); setRateStatus("manual"); }} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>$1 = ₺{usdTry}</div>
        </div>
      </div>

      {/* ── Danışman Ödeme Modeli ── */}
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* Toggle */}
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ödeme Modeli</div>
          <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
            <button onClick={() => setPayMode("wage")} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #30363d",
              borderRadius: "6px 0 0 6px", fontFamily: "inherit",
              background: payMode === "wage" ? "#ec4899" : "transparent",
              color: payMode === "wage" ? "#fff" : "#7d8590",
            }}>Maaş</button>
            <button onClick={() => setPayMode("commission")} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #30363d",
              borderRadius: "0 6px 6px 0", borderLeft: "none", fontFamily: "inherit",
              background: payMode === "commission" ? "#ec4899" : "transparent",
              color: payMode === "commission" ? "#fff" : "#7d8590",
            }}>Komisyon</button>
          </div>
        </div>

        {payMode === "wage" ? (
          <>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={S.label}>Danışman Sayısı</div>
              <input type="number" min={0} value={numConsultants} onChange={e => setNumConsultants(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
              <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>Tam zamanlı danışman</div>
            </div>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={S.label}>Danışman Aylık Maaş (₺)</div>
              <input type="number" value={consultantWage} onChange={e => setConsultantWage(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
              <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>
                Yıllık: ₺{fmt(numConsultants * consultantWage * 12)} ({numConsultants} kişi)
              </div>
            </div>
          </>
        ) : (
          <>
            <div style={{ ...S.card, padding: 16, gridColumn: "span 2" }}>
              <div style={S.label}>Komisyon Oranı</div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <input type="range" min={1} max={50} value={commissionPct}
                  onChange={e => setCommissionPct(+e.target.value)}
                  style={{ flex: 1, accentColor: "#ec4899", cursor: "pointer", height: 6 }} />
                <span style={{ fontSize: 28, fontWeight: 700, color: "#ec4899", minWidth: 60, textAlign: "center" }}>%{commissionPct}</span>
              </div>
              <div style={{ fontSize: 10, color: "#7d8590", marginTop: 4 }}>
                Danışmanlık gelirinin %{commissionPct}'i = ₺{fmt(danCstTotal)}
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Danışmanlık Summary ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışmanlık Geliri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ec4899" }}>₺{fmt(danRevTotal)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            {totalApps} başvuru ({numApps} × {numStudents} öğr.) × ${fmt(pricePerAppUsd)} × ₺{usdTry} = ₺{fmt(danRevTotal)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışman Gideri <span style={{ color: payMode === "commission" ? "#ec4899" : "#7d8590", fontSize: 8 }}>({payMode === "wage" ? "MAAŞ" : "KOMİSYON"})</span></div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#ef4444" }}>₺{fmt(danCstTotal)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            {payMode === "wage"
              ? `${numConsultants} kişi × ₺${fmt(consultantWage)} × 12 ay`
              : `%${commissionPct} × ₺${fmt(danRevTotal)}`
            }
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışmanlık Marjini</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: danMargin >= 0 ? "#00d4aa" : "#ef4444" }}>₺{fmt(danMargin)}</div>
          <div style={{ fontSize: 10, color: "#7d8590", marginTop: 2 }}>
            Gelir − Gider
          </div>
        </div>
      </div>

      {/* ── Profit Result Card ── */}
      <div style={{
        ...S.card, padding: "24px 32px", marginBottom: 20,
        background: netProfit >= 0
          ? "linear-gradient(135deg, #00d4aa10 0%, #161b22 100%)"
          : "linear-gradient(135deg, #ef444410 0%, #161b22 100%)",
        borderColor: netProfit >= 0 ? "#00d4aa33" : "#ef444433"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20, alignItems: "center" }}>
          <div>
            <div style={S.label}>Toplam Gelir</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#3b82f6" }}>₺{fmt(totalRev)}</div>
            <div style={{ fontSize: 9, color: "#7d8590" }}>Kurs ₺{fmt(courseRevTotal)} + Dan. ₺{fmt(danRevTotal)}</div>
          </div>
          <div>
            <div style={S.label}>Toplam Gider</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>₺{fmt(totalCst)}</div>
            <div style={{ fontSize: 9, color: "#7d8590" }}>Kurs + Dan. + Yönetici</div>
          </div>
          <div>
            <div style={S.label}>KDV (%20)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#f97316" }}>₺{fmt(totalKdv)}</div>
          </div>
          <div>
            <div style={S.label}>Sabit Gider</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#ef4444" }}>₺{fmt(totalFC)}</div>
          </div>
          <div>
            <div style={S.label}>Brüt Marjin</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totalGross >= 0 ? "#e6edf3" : "#ef4444" }}>₺{fmt(totalGross)}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #30363d" }}>
          <div>
            <div style={S.label}>Vergi Öncesi Kâr</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: preTaxProfit >= 0 ? "#e6edf3" : "#ef4444" }}>₺{fmt(preTaxProfit)}</div>
          </div>
          <div>
            <div style={S.label}>Kurumlar Vergisi (%25)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#a855f7" }}>₺{fmt(corpTax)}</div>
          </div>
          <div>
            <div style={S.label}>NET KÂR</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: netProfit >= 0 ? "#00d4aa" : "#ef4444" }}>
              {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#7d8590" }}>
          Gelir ₺{fmt(totalRev)} − Gider ₺{fmt(totalCst)} − FC ₺{fmt(totalFC)} − KDV ₺{fmt(totalKdv)} = VÖ ₺{fmt(preTaxProfit)}
          {preTaxProfit > 0 && <> − KV %25 ₺{fmt(corpTax)}</>}
          {" "}= <span style={{ color: netProfit >= 0 ? "#00d4aa" : "#ef4444", fontWeight: 700 }}>
            {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
          </span>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 20 }}>
        {[
          { label: "Kurs Marjini / Öğr.", value: `₺${fmt(margPerStu)}`, color: "#00d4aa" },
          { label: "Danışmanlık Geliri", value: `₺${fmt(danRevTotal)}`, color: "#ec4899" },
          { label: "Yönetici + FC", value: `₺${fmt(managerAnnual + fc)}`, color: "#ef4444" },
          { label: "Başa Baş Noktası", value: breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`, color: numStudents >= breakEvenN ? "#00d4aa" : "#f59e0b" },
          { label: "Mevcut Durum", value: numStudents >= breakEvenN ? "KÂRDA ✓" : "ZARARDA ✗", color: numStudents >= breakEvenN ? "#00d4aa" : "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ ...S.card, padding: "14px 16px" }}>
            <div style={S.label}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Two-Column: Chart + Scenarios ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Profit Chart */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={S.label}>Net Kâr vs Öğrenci Sayısı — Kurs Sayısı Karşılaştırması</div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "#7d8590" }}>
              Aktif: <span style={{ color: "#00d4aa" }}>{numCourses} kurs</span> (kalın çizgi)
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 24, bottom: 16, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="n" stroke="#7d8590" tick={{ fontSize: 10, fill: "#7d8590" }}
                label={{ value: "Öğrenci Sayısı (n)", position: "insideBottom", offset: -8, fill: "#7d8590", fontSize: 10 }} />
              <YAxis stroke="#7d8590" tick={{ fontSize: 10, fill: "#7d8590" }} tickFormatter={v => `₺${fmtK(v)}`} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="5 5"
                label={{ value: "Başa Baş", fill: "#f59e0b", fontSize: 10, position: "insideTopLeft" }} />
              <ReferenceLine x={numStudents} stroke="#f59e0b44" strokeDasharray="3 3" />
              {[1, 2, 3, 4, 5, 6, 7, 8].map((c, i) => (
                <Line key={c} type="monotone" dataKey={`C${c}`} name={`${c} kurs`}
                  stroke={LINE_COLORS[i]} dot={false}
                  strokeWidth={c === numCourses ? 3 : 1}
                  strokeOpacity={c === numCourses ? 1 : 0.2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Table */}
        <div style={{ ...S.card, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid #30363d" }}>
            <div style={S.label}>Senaryo Analizi — {numCourses} kurs / öğrenci</div>
          </div>
          <div style={{ overflowY: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
              <thead>
                <tr style={{ background: "#0d1117", position: "sticky", top: 0 }}>
                  {["n", "Yıllık Gelir", "Brüt Kâr", "KDV", "Sabit Gider", "KV %25", "NET KÂR"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "right",
                      color: "#7d8590", fontWeight: 600, fontSize: 10, textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenRows.map(row => (
                  <tr key={row.n} style={{
                    borderBottom: "1px solid #21262d",
                    background: row.n === numStudents ? "#f59e0b0a" : row.green ? "#00d4aa06" : "transparent"
                  }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#e6edf3", textAlign: "right" }}>
                      {row.n}
                      {row.n === numStudents && <span style={{ color: "#f59e0b", fontSize: 9 }}> ★</span>}
                      {row.n === breakEvenN && <span style={{ color: "#f59e0b", fontSize: 9 }}> BE</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#3b82f6", textAlign: "right" }}>₺{fmt(row.rev)}</td>
                    <td style={{ padding: "10px 12px", color: "#e6edf3", textAlign: "right" }}>₺{fmt(row.gross)}</td>
                    <td style={{ padding: "10px 12px", color: "#f97316", textAlign: "right" }}>₺{fmt(row.kdv)}</td>
                    <td style={{ padding: "10px 12px", color: "#ef4444", textAlign: "right" }}>₺{fmt(fc)}</td>
                    <td style={{ padding: "10px 12px", color: "#a855f7", textAlign: "right" }}>₺{fmt(row.tax)}</td>
                    <td style={{
                      padding: "10px 12px", fontWeight: 700, textAlign: "right",
                      color: row.green ? "#00d4aa" : "#ef4444"
                    }}>
                      {row.green ? "+" : ""}₺{fmt(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category breakdown */}
          <div style={{ padding: "14px 18px", borderTop: "1px solid #30363d" }}>
            <div style={S.label}>Kategori Bazlı Ortalamalar</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {Object.entries(catStats).map(([cat, st]) => (
                <div key={cat} style={{ ...S.tag(CAT_COLORS[cat]), padding: "4px 10px", fontSize: 10 }}>
                  {cat}: {st.count} kurs · ort. ₺{fmtK(st.totalRev / st.count)} gelir · ₺{fmtK((st.totalRev - st.totalCst) / st.count)} marjin
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, color: "#7d8590", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
        Net Kâr = (Brüt Marjin − FC − KDV) × 0.75
        &nbsp;|&nbsp; KDV = Gelir × 20/120 · Kurumlar Vergisi = %25
        &nbsp;|&nbsp; Ort. Gelir: ₺{fmt(avgRev)} · Ort. Gider: ₺{fmt(avgCst)} · Ort. Marjin: ₺{fmt(avgMargin)}
        &nbsp;|&nbsp; Yıllık FC: ₺{fmt(fc)}
        &nbsp;|&nbsp; Veriler: Ders Kataloğu ({ALL_COURSES.length} kurs)
      </div>
    </div>
  );
}
