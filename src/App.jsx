import { useState, useMemo, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie
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

const CAT_COLORS = { AP: "#037A7A", "A-Level": "#035959", Oxbridge: "#035159", Sınav: "#048C8C" };
const LINE_COLORS = ["#048C8C", "#035959", "#02A6A6", "#F25C5C", "#037A7A", "#026E6E", "#038C8C", "#035159"];

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page: { background: "#01161E", color: "#e6edf3", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "28px 32px" },
  card: { background: "#023440", border: "1px solid #035159", borderRadius: 10 },
  label: { fontSize: 10, color: "#8AB0B0", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  tag: bg => ({ fontSize: 10, padding: "2px 8px", borderRadius: 12, background: `${bg}22`, color: bg, display: "inline-block" }),
  input: {
    width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #035159",
    color: "#e6edf3", fontSize: 20, fontWeight: 700, outline: "none", fontFamily: "inherit", padding: "6px 0"
  },
  sectionTitle: { display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: "#e6edf3", marginBottom: 16, marginTop: 40, borderBottom: "1px solid #035159", paddingBottom: 10 },
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#01161E", border: "1px solid #035159", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: "#8AB0B0", fontSize: 11, marginBottom: 6 }}>{label} öğrenci</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontSize: 11 }}>
          {p.name}: <b>₺{fmt(p.value)}</b>
        </div>
      ))}
    </div>
  );
};

const PieChartTip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div style={{ background: "#01161E", border: "1px solid #035159", borderRadius: 8, padding: "10px 14px", zIndex: 100 }}>
      <div style={{ color: p.color, fontSize: 11, fontWeight: 700 }}>{p.name}</div>
      <div style={{ color: "#e6edf3", fontSize: 12, marginTop: 4 }}>
        ₺{fmt(p.value)}
      </div>
    </div>
  );
};

// ── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [numCourses, setNumCourses] = useState(3);
  const [numStudents, setNumStudents] = useState(10);
  const [tableExpanded, setTableExpanded] = useState(false);
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

  // Break-even calculation
  // Per-student revenue = courses + danışmanlık (numApps per student)
  const danRevPerStu = numApps * pricePerAppTl;
  const combinedRevPerStu = revPerStu + danRevPerStu;
  
  // Per-student variable cost
  const danVarCstPerStu = payMode === "commission"
    ? Math.round(danRevPerStu * commissionPct / 100)
    : 0;
  const combinedVarCstPerStu = cstPerStu + danVarCstPerStu;
  
  // Per-student KDV
  const kdvPerStu = combinedRevPerStu * 20 / 120;
  
  // Per-student net margin (before fixed costs & corp tax)
  const perStuNetMargin = combinedRevPerStu - combinedVarCstPerStu - kdvPerStu;
  
  // Fixed costs (don't scale with students)
  const fixedCosts = fc + managerAnnual + (payMode === "wage" ? numConsultants * consultantWage * 12 : 0);
  
  // Break-even: n * perStuNetMargin * 0.75 = fixedCosts * 0.75 → n = fixedCosts / perStuNetMargin
  // (0.75 factor from corp tax cancels out, break-even is where preTaxProfit = 0)
  const breakEvenN = perStuNetMargin > 0 ? Math.ceil(fixedCosts / perStuNetMargin) : Infinity;
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

  const gelirData = [
    { name: "Kurs Geliri", value: courseRevTotal, color: "#037A7A" },
    { name: "Danışmanlık Geliri", value: danRevTotal, color: "#02A6A6" }
  ].filter(d => d.value > 0);

  const giderData = [
    { name: "Kurs Eğitmen Gideri", value: courseCstTotal, color: "#8b5cf6" },
    { name: "Danışman Gideri", value: danCstTotal, color: "#02A6A6" },
    { name: "Yönetici Maaşı", value: managerAnnual, color: "#038C8C" },
    { name: "Diğer Sabit Gider (FC)", value: fc, color: "#F25C5C" },
    { name: "KDV (%20)", value: totalKdv, color: "#026E6E" }
  ].filter(d => d.value > 0);
  if (corpTax > 0) giderData.push({ name: "Kurumlar Vergisi (%25)", value: corpTax, color: "#eab308" });

  return (
    <div style={S.page}>
      {/* ── Header ── */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Study Surfer — Kâr Simülatörü
            </h1>
            <div style={{ fontSize: 11, color: "#8AB0B0", marginTop: 2 }}>
              Kurs Sayısı × Öğrenci Sayısı → Net Kâr · Ortalama Kurs Fiyatı Bazlı
            </div>
          </div>
        </div>
      </div>

      {/* ── 1. Kurum Ayarları ── */}
      <div style={S.sectionTitle}>
        1. Kurum Ayarları
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        {/* Number of students */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Toplam Öğrenci Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={1} max={50} value={numStudents}
              onChange={e => setNumStudents(+e.target.value)}
              style={{ flex: 1, accentColor: "#035959", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 40, fontWeight: 700, color: "#035959", minWidth: 48, textAlign: "center" }}>{numStudents}</span>
          </div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 8 }}>
            Başa baş noktası: <span style={{ color: numStudents >= breakEvenN ? "#048C8C" : "#F25C5C" }}>
              {breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`}
            </span>
          </div>
        </div>

        {/* Fixed costs */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Diğer Sabit Gider — FC (₺)</div>
          <input type="number" value={fc} onChange={e => setFc(+e.target.value)} style={S.input} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 8 }}>İşletme sabit giderleri (kira, vb.)</div>
        </div>

        {/* Manager wage */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Yönetici Aylık Maaş (₺)</div>
          <input type="number" value={managerWage} onChange={e => setManagerWage(+e.target.value)} style={S.input} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 8 }}>
            Yıllık: <span style={{ color: "#e6edf3" }}>₺{fmt(managerAnnual)}</span>
          </div>
        </div>
      </div>

      {/* ── 2. Akademik Kurs Ayarları ── */}
      <div style={S.sectionTitle}>
        2. Akademik Kurs Ayarları
      </div>
      <div style={{ marginBottom: 14 }}>
        {/* Courses per student */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Öğrenci Başı Kurs Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input type="range" min={1} max={10} value={numCourses}
              onChange={e => setNumCourses(+e.target.value)}
              style={{ flex: 1, accentColor: "#048C8C", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 40, fontWeight: 700, color: "#048C8C", minWidth: 48, textAlign: "center" }}>{numCourses}</span>
          </div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 8 }}>
            <span style={{ color: "#e6edf3" }}>{numCourses}</span> kurs × ₺{fmt(avgRev)} ort. fiyat = <span style={{ color: "#037A7A" }}>₺{fmt(revPerStu)}</span> / öğrenci
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Ders Saati (saat)</div>
          <input type="number" value={hours} onChange={e => setHours(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Kurs başına toplam saat</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Saat Fiyatı (₺)</div>
          <input type="number" value={pricePerHour} onChange={e => setPricePerHour(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Öğrenciye satış fiyatı</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>İndirim (%)</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={0} max={50} value={discount}
              onChange={e => setDiscount(+e.target.value)}
              style={{ flex: 1, accentColor: "#035959", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 20, fontWeight: 700, color: "#035959", minWidth: 40, textAlign: "center" }}>%{discount}</span>
          </div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Paket indirimi</div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Eğitmen Saat Ücreti (₺)</div>
          <input type="number" value={tutorCostPerHour} onChange={e => setTutorCostPerHour(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Eğitmene ödenen saat başı</div>
        </div>
      </div>

      {/* Derived Averages */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Geliri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#037A7A" }}>₺{fmt(avgRev)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            {hours} saat × ₺{fmt(pricePerHour)} × {(100 - discount)}% = ₺{fmt(avgRev)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Gideri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(avgCst)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            {hours} saat × ₺{fmt(tutorCostPerHour)} = ₺{fmt(avgCst)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ort. Kurs Marjini</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#048C8C" }}>₺{fmt(avgMargin)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            Marjin oranı: <span style={{ color: "#048C8C" }}>{avgRev > 0 ? ((avgMargin / avgRev) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>

      {/* ── 3. Danışmanlık Ayarları ── */}
      <div style={S.sectionTitle}>
        3. Danışmanlık Ayarları
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Başvuru Sayısı</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input type="range" min={0} max={30} value={numApps}
              onChange={e => setNumApps(+e.target.value)}
              style={{ flex: 1, accentColor: "#02A6A6", cursor: "pointer", height: 6 }} />
            <span style={{ fontSize: 24, fontWeight: 700, color: "#02A6A6", minWidth: 36, textAlign: "center" }}>{numApps}</span>
          </div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Öğrenci başı başvuru · Toplam: <span style={{ color:"#02A6A6" }}>{totalApps}</span></div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Başvuru Fiyatı ($)</div>
          <input type="number" value={pricePerAppUsd} onChange={e => setPricePerAppUsd(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>
            = ₺{fmt(pricePerAppTl)} <span style={{ color:"#048C8C" }}>($1 = ₺{usdTry})</span>
          </div>
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>
            Kur ($/₺)
            {rateStatus === "live" && <span style={{ marginLeft: 6, color: "#048C8C", fontSize: 8, fontWeight: 700 }}>● CANLI</span>}
            {rateStatus === "loading" && <span style={{ marginLeft: 6, color: "#035959", fontSize: 8 }}>● YÜKLENİYOR</span>}
            {rateStatus === "manual" && <span style={{ marginLeft: 6, color: "#8AB0B0", fontSize: 8 }}>● MANUEL</span>}
          </div>
          <input type="number" step="0.01" value={usdTry} onChange={e => { setUsdTry(+e.target.value); setRateStatus("manual"); }} style={{ ...S.input, fontSize: 16 }} />
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>$1 = ₺{usdTry}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr 1fr", gap: 14, marginBottom: 14 }}>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Ödeme Modeli</div>
          <div style={{ display: "flex", gap: 0, marginTop: 6 }}>
            <button onClick={() => setPayMode("wage")} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #035159",
              borderRadius: "6px 0 0 6px", fontFamily: "inherit",
              background: payMode === "wage" ? "#02A6A6" : "transparent",
              color: payMode === "wage" ? "#fff" : "#8AB0B0",
            }}>Maaş</button>
            <button onClick={() => setPayMode("commission")} style={{
              padding: "6px 14px", fontSize: 11, fontWeight: 600, cursor: "pointer", border: "1px solid #035159",
              borderRadius: "0 6px 6px 0", borderLeft: "none", fontFamily: "inherit",
              background: payMode === "commission" ? "#02A6A6" : "transparent",
              color: payMode === "commission" ? "#fff" : "#8AB0B0",
            }}>Komisyon</button>
          </div>
        </div>

        {payMode === "wage" ? (
          <>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={S.label}>Danışman Sayısı</div>
              <input type="number" min={0} value={numConsultants} onChange={e => setNumConsultants(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
              <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>Tam zamanlı danışman</div>
            </div>
            <div style={{ ...S.card, padding: 16 }}>
              <div style={S.label}>Danışman Aylık Maaş (₺)</div>
              <input type="number" value={consultantWage} onChange={e => setConsultantWage(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
              <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>
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
                  style={{ flex: 1, accentColor: "#02A6A6", cursor: "pointer", height: 6 }} />
                <span style={{ fontSize: 28, fontWeight: 700, color: "#02A6A6", minWidth: 60, textAlign: "center" }}>%{commissionPct}</span>
              </div>
              <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 4 }}>
                Danışmanlık gelirinin %{commissionPct}'i = ₺{fmt(danCstTotal)}
              </div>
            </div>
          </>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışmanlık Geliri</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#02A6A6" }}>₺{fmt(danRevTotal)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            {totalApps} başvuru ({numApps} × {numStudents} öğr.) × ${fmt(pricePerAppUsd)} × ₺{usdTry} = ₺{fmt(danRevTotal)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışman Gideri <span style={{ color: payMode === "commission" ? "#02A6A6" : "#8AB0B0", fontSize: 8 }}>({payMode === "wage" ? "MAAŞ" : "KOMİSYON"})</span></div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(danCstTotal)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            {payMode === "wage"
              ? `${numConsultants} kişi × ₺${fmt(consultantWage)} × 12 ay`
              : `%${commissionPct} × ₺${fmt(danRevTotal)}`
            }
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <div style={S.label}>Danışmanlık Marjini</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: danMargin >= 0 ? "#048C8C" : "#F25C5C" }}>₺{fmt(danMargin)}</div>
          <div style={{ fontSize: 10, color: "#8AB0B0", marginTop: 2 }}>
            Gelir − Gider
          </div>
        </div>
      </div>

      {/* ── 4. Finansal Özet ── */}
      <div style={S.sectionTitle}>
        4. Finansal Özet
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 14, marginBottom: 16 }}>
        {[
          { label: "Kurs Marjini / Öğr.", value: `₺${fmt(margPerStu)}`, color: "#048C8C" },
          { label: "Danışmanlık Geliri", value: `₺${fmt(danRevTotal)}`, color: "#02A6A6" },
          { label: "Yönetici + FC", value: `₺${fmt(managerAnnual + fc)}`, color: "#F25C5C" },
          { label: "Başa Baş Noktası", value: breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`, color: numStudents >= breakEvenN ? "#048C8C" : "#035959" },
          { label: "Mevcut Durum", value: numStudents >= breakEvenN ? "KÂRDA ✓" : "ZARARDA ✗", color: numStudents >= breakEvenN ? "#048C8C" : "#F25C5C" },
        ].map(k => (
          <div key={k.label} style={{ ...S.card, padding: "14px 16px" }}>
            <div style={S.label}>{k.label}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      <div style={{
        ...S.card, padding: "24px 32px", marginBottom: 20,
        background: netProfit >= 0
          ? "linear-gradient(135deg, #048C8C10 0%, #023440 100%)"
          : "linear-gradient(135deg, #F25C5C10 0%, #023440 100%)",
        borderColor: netProfit >= 0 ? "#048C8C33" : "#F25C5C33"
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 20, alignItems: "center" }}>
          <div>
            <div style={S.label}>Toplam Gelir</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#037A7A" }}>₺{fmt(totalRev)}</div>
            <div style={{ fontSize: 9, color: "#8AB0B0" }}>Kurs ₺{fmt(courseRevTotal)} + Dan. ₺{fmt(danRevTotal)}</div>
          </div>
          <div>
            <div style={S.label}>Toplam Gider</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(totalCst)}</div>
            <div style={{ fontSize: 9, color: "#8AB0B0" }}>Kurs + Dan. + Yönetici</div>
          </div>
          <div>
            <div style={S.label}>KDV (%20)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#038C8C" }}>₺{fmt(totalKdv)}</div>
          </div>
          <div>
            <div style={S.label}>Sabit Gider</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(totalFC)}</div>
          </div>
          <div>
            <div style={S.label}>Brüt Marjin</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: totalGross >= 0 ? "#e6edf3" : "#F25C5C" }}>₺{fmt(totalGross)}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, alignItems: "center", marginTop: 16, paddingTop: 16, borderTop: "1px solid #035159" }}>
          <div>
            <div style={S.label}>Vergi Öncesi Kâr</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: preTaxProfit >= 0 ? "#e6edf3" : "#F25C5C" }}>₺{fmt(preTaxProfit)}</div>
          </div>
          <div>
            <div style={S.label}>Kurumlar Vergisi (%25)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#026E6E" }}>₺{fmt(corpTax)}</div>
          </div>
          <div>
            <div style={S.label}>NET KÂR</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: netProfit >= 0 ? "#048C8C" : "#F25C5C" }}>
              {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: 11, color: "#8AB0B0" }}>
          Gelir ₺{fmt(totalRev)} − Gider ₺{fmt(totalCst)} − FC ₺{fmt(totalFC)} − KDV ₺{fmt(totalKdv)} = VÖ ₺{fmt(preTaxProfit)}
          {preTaxProfit > 0 && <> − KV %25 ₺{fmt(corpTax)}</>}
          {" "}= <span style={{ color: netProfit >= 0 ? "#048C8C" : "#F25C5C", fontWeight: 700 }}>
            {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
          </span>
        </div>
      </div>

      {/* ── Pie Charts ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
        {/* Gelir Dağılımı */}
        <div style={{ ...S.card, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={S.label}>Gelir Dağılımı</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            {gelirData.map(d => (
              <div key={d.name} style={S.tag(d.color)}>{d.name} (₺{fmtK(d.value)})</div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={gelirData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none">
                {gelirData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<PieChartTip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Gider Dağılımı */}
        <div style={{ ...S.card, padding: 20, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={S.label}>Gider Dağılımı (KDV Dahil)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center", marginBottom: 10 }}>
            {giderData.map(d => (
              <div key={d.name} style={S.tag(d.color)}>{d.name} (₺{fmtK(d.value)})</div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={giderData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} stroke="none">
                {giderData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<PieChartTip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── 5. Senaryo Analizi ve Grafikler ── */}
      <div style={S.sectionTitle}>
        5. Senaryo Analizi ve Grafikler
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: tableExpanded ? "1fr" : "1.5fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Profit Chart */}
        <div style={{ ...S.card, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={S.label}>Net Kâr vs Öğrenci Sayısı — Kurs Sayısı Karşılaştırması</div>
            <div style={{ marginLeft: "auto", fontSize: 10, color: "#8AB0B0" }}>
              Aktif: <span style={{ color: "#048C8C" }}>{numCourses} kurs</span> (kalın çizgi)
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 5, right: 24, bottom: 16, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#035959" />
              <XAxis dataKey="n" stroke="#8AB0B0" tick={{ fontSize: 10, fill: "#8AB0B0" }}
                label={{ value: "Öğrenci Sayısı (n)", position: "insideBottom", offset: -8, fill: "#8AB0B0", fontSize: 10 }} />
              <YAxis stroke="#8AB0B0" tick={{ fontSize: 10, fill: "#8AB0B0" }} tickFormatter={v => `₺${fmtK(v)}`} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <ReferenceLine y={0} stroke="#035959" strokeDasharray="5 5"
                label={{ value: "Başa Baş", fill: "#035959", fontSize: 10, position: "insideTopLeft" }} />
              <ReferenceLine x={numStudents} stroke="#03595944" strokeDasharray="3 3" />
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
        <div style={{ ...S.card, overflow: "hidden", display: "flex", flexDirection: "column" }}>
          <div 
            onClick={() => setTableExpanded(!tableExpanded)}
            style={{ 
              padding: "14px 18px", 
              borderBottom: "1px solid #035159", 
              cursor: "pointer", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center", 
              background: tableExpanded ? "#03414D" : "transparent" 
            }}
            title="Tabloyu Genişlet/Daralt"
          >
            <div style={S.label}>Senaryo Analizi — {numCourses} kurs / öğrenci</div>
            <div style={{ color: "#048C8C", fontSize: 12, fontWeight: 700 }}>
              {tableExpanded ? "▲ Daralt (Kapat)" : "▼ Genişlet (Tıkla)"}
            </div>
          </div>
          <div style={{ overflowY: "auto", maxHeight: tableExpanded ? "none" : "320px", display: "flex", flexDirection: "column" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, flex: 1 }}>
              <thead style={{ zIndex: 10 }}>
                <tr style={{ background: "#01161E", position: "sticky", top: 0 }}>
                  {["n", "Yıllık Gelir", "Brüt Kâr", "KDV", "Sabit Gider", "KV %25", "NET KÂR"].map(h => (
                    <th key={h} style={{
                      padding: "8px 12px", textAlign: "right",
                      color: "#8AB0B0", fontWeight: 600, fontSize: 10, textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenRows.map(row => (
                  <tr key={row.n} style={{
                    borderBottom: "1px solid #035959",
                    background: row.n === numStudents ? "#0359590a" : row.green ? "#048C8C06" : "transparent"
                  }}>
                    <td style={{ padding: "10px 12px", fontWeight: 700, color: "#e6edf3", textAlign: "right" }}>
                      {row.n}
                      {row.n === numStudents && <span style={{ color: "#035959", fontSize: 9 }}> ★</span>}
                      {row.n === breakEvenN && <span style={{ color: "#035959", fontSize: 9 }}> BE</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#037A7A", textAlign: "right" }}>₺{fmt(row.rev)}</td>
                    <td style={{ padding: "10px 12px", color: "#e6edf3", textAlign: "right" }}>₺{fmt(row.gross)}</td>
                    <td style={{ padding: "10px 12px", color: "#038C8C", textAlign: "right" }}>₺{fmt(row.kdv)}</td>
                    <td style={{ padding: "10px 12px", color: "#F25C5C", textAlign: "right" }}>₺{fmt(fc)}</td>
                    <td style={{ padding: "10px 12px", color: "#026E6E", textAlign: "right" }}>₺{fmt(row.tax)}</td>
                    <td style={{
                      padding: "10px 12px", fontWeight: 700, textAlign: "right",
                      color: row.green ? "#048C8C" : "#F25C5C"
                    }}>
                      {row.green ? "+" : ""}₺{fmt(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Category breakdown */}
            <div style={{ padding: "14px 18px", borderTop: "1px solid #035159", marginTop: "auto" }}>
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
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, color: "#8AB0B0", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
        Net Kâr = (Brüt Marjin − FC − KDV) × 0.75
        &nbsp;|&nbsp; KDV = Gelir × 20/120 · Kurumlar Vergisi = %25
        &nbsp;|&nbsp; Ort. Gelir: ₺{fmt(avgRev)} · Ort. Gider: ₺{fmt(avgCst)} · Ort. Marjin: ₺{fmt(avgMargin)}
        &nbsp;|&nbsp; Yıllık FC: ₺{fmt(fc)}
        &nbsp;|&nbsp; Veriler: Ders Kataloğu ({ALL_COURSES.length} kurs)
      </div>
    </div>
  );
}
