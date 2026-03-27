import { useState, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ReferenceLine, ResponsiveContainer,
  BarChart, Bar, Cell, AreaChart, Area
} from "recharts";

// ── Course Catalog ───────────────────────────────────────────────────────────
const ALL_COURSES = [
  { name: "A-Level Further Maths",  cat: "A-Level",  rev: 216000, cst: 150000 },
  { name: "MAT (Oxford Maths)",     cat: "Oxbridge", rev: 135000, cst:  75000 },
  { name: "STEP (Cambridge)",       cat: "Oxbridge", rev: 135000, cst:  75000 },
  { name: "AP Calculus BC",         cat: "AP",       rev: 180000, cst: 125000 },
  { name: "A-Level Chemistry",      cat: "A-Level",  rev: 180000, cst: 125000 },
  { name: "A-Level Physics",        cat: "A-Level",  rev: 180000, cst: 125000 },
  { name: "PAT (Oxford Physics)",   cat: "Oxbridge", rev: 112500, cst:  62500 },
  { name: "AP Physics C",           cat: "AP",       rev: 162000, cst: 112500 },
  { name: "AP Chemistry",           cat: "AP",       rev: 144000, cst: 100000 },
  { name: "A-Level Mathematics",    cat: "A-Level",  rev: 189000, cst: 150000 },
  { name: "TSA",                    cat: "Oxbridge", rev:  81000, cst:  50000 },
  { name: "AP Calculus AB",         cat: "AP",       rev: 126000, cst: 100000 },
  { name: "A-Level Economics",      cat: "A-Level",  rev: 126000, cst: 100000 },
  { name: "AP Statistics",          cat: "AP",       rev: 110250, cst:  87500 },
  { name: "A-Level Psychology",     cat: "A-Level",  rev: 110250, cst:  87500 },
  { name: "Bocconi Test",           cat: "Sınav",    rev:  72000, cst:  50000 },
  { name: "AP English Language",    cat: "AP",       rev:  94500, cst:  75000 },
  { name: "AP English Literature",  cat: "AP",       rev:  94500, cst:  75000 },
  { name: "SAT Math",              cat: "Sınav",    rev:  94500, cst:  75000 },
  { name: "SAT English",           cat: "Sınav",    rev:  94500, cst:  75000 },
  { name: "AP Psychology",          cat: "AP",       rev:  78750, cst:  62500 },
  { name: "AP MicroEconomics",      cat: "AP",       rev:  63000, cst:  50000 },
  { name: "AP MacroEconomics",      cat: "AP",       rev:  47250, cst:  37500 },
  { name: "TOEFL",                  cat: "Sınav",    rev:  67500, cst:  62500 },
  { name: "IELTS",                  cat: "Sınav",    rev:  67500, cst:  62500 },
];

// Compute averages
const AVG_REV = Math.round(ALL_COURSES.reduce((s, c) => s + c.rev, 0) / ALL_COURSES.length);
const AVG_CST = Math.round(ALL_COURSES.reduce((s, c) => s + c.cst, 0) / ALL_COURSES.length);
const AVG_MARGIN = AVG_REV - AVG_CST;

const CAT_COLORS = { AP: "#3b82f6", "A-Level": "#8b5cf6", Oxbridge: "#00d4aa", Sınav: "#f59e0b" };
const LINE_COLORS = ["#00d4aa", "#f59e0b", "#7c3aed", "#ef4444", "#3b82f6", "#ec4899", "#14b8a6", "#f97316"];

const fmt  = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}K` : String(Math.round(v));

// ── Styles ───────────────────────────────────────────────────────────────────
const S = {
  page:  { background:"#0d1117", color:"#e6edf3", minHeight:"100vh", fontFamily:"'IBM Plex Mono', 'Cascadia Code', monospace", padding:"28px 32px" },
  card:  { background:"#161b22", border:"1px solid #30363d", borderRadius:10 },
  label: { fontSize:10, color:"#7d8590", textTransform:"uppercase", letterSpacing:1, marginBottom:6 },
  tag:   bg => ({ fontSize:10, padding:"2px 8px", borderRadius:12, background:`${bg}22`, color:bg, display:"inline-block" }),
  input: { width:"100%", background:"transparent", border:"none", borderBottom:"1px solid #30363d",
           color:"#e6edf3", fontSize:20, fontWeight:700, outline:"none", fontFamily:"inherit", padding:"6px 0" },
};

// ── Custom Tooltip ───────────────────────────────────────────────────────────
const ChartTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:"#0d1117", border:"1px solid #30363d", borderRadius:8, padding:"10px 14px" }}>
      <div style={{ color:"#7d8590", fontSize:11, marginBottom:6 }}>{label} öğrenci</div>
      {payload.map(p => (
        <div key={p.name} style={{ color:p.color, fontSize:11 }}>
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
  const [avgRev, setAvgRev] = useState(AVG_REV);
  const [avgCst, setAvgCst] = useState(AVG_CST);

  const avgMargin   = avgRev - avgCst;
  const revPerStu   = numCourses * avgRev;
  const cstPerStu   = numCourses * avgCst;
  const margPerStu  = numCourses * avgMargin;

  const totalRev    = numStudents * revPerStu;
  const totalCst    = numStudents * cstPerStu;
  const totalGross  = numStudents * margPerStu;
  // KDV (VAT) — 20% included in revenue → extracted as rev × 20/120
  const kdvPerStu   = revPerStu * 20 / 120;
  const totalKdv    = numStudents * kdvPerStu;
  const netMarginPerStu = margPerStu - kdvPerStu;
  const netProfit   = totalGross - fc - totalKdv;
  const breakEvenN  = netMarginPerStu > 0 ? Math.ceil(fc / netMarginPerStu) : Infinity;
  const grossPct    = revPerStu > 0 ? (margPerStu / revPerStu * 100) : 0;

  // Chart: profit vs students for different course counts (1..8)
  const maxN = Math.max(30, numStudents + 10);
  const chartData = useMemo(() => Array.from({ length: maxN + 1 }, (_, n) => {
    const row = { n };
    for (let c = 1; c <= 8; c++) {
      const cRevPerStu = c * avgRev;
      const cMarginPerStu = c * avgMargin;
      const cKdvPerStu = cRevPerStu * 20 / 120;
      row[`C${c}`] = n * cMarginPerStu - fc - n * cKdvPerStu;
    }
    return row;
  }), [fc, avgMargin, avgRev, maxN]);

  // Scenario rows
  const scenarioNs = [...new Set([1, 3, 5, 8, 10, 15, 20, 25, 30, numStudents])].sort((a,b) => a - b);
  const scenRows = scenarioNs.map(n => {
    const rev   = n * revPerStu;
    const gross = n * margPerStu;
    const kdv   = n * kdvPerStu;
    const net   = gross - fc - kdv;
    return { n, rev, cst: n * cstPerStu, gross, kdv, net, green: net >= 0 };
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
      <div style={{ marginBottom:32 }}>
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
          <div style={{ width:4, height:36, background:"#00d4aa", borderRadius:2 }} />
          <div>
            <h1 style={{ margin:0, fontSize:22, fontWeight:700, letterSpacing:"-0.5px" }}>
              Study Surfer — Kâr Simülatörü
            </h1>
            <div style={{ fontSize:11, color:"#7d8590", marginTop:2 }}>
              Kurs Sayısı × Öğrenci Sayısı → Net Kâr · Ortalama Kurs Fiyatı Bazlı
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Controls ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>

        {/* Courses per student */}
        <div style={{ ...S.card, padding:20 }}>
          <div style={S.label}>Öğrenci Başı Kurs Sayısı</div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <input type="range" min={1} max={10} value={numCourses}
              onChange={e => setNumCourses(+e.target.value)}
              style={{ flex:1, accentColor:"#00d4aa", cursor:"pointer", height:6 }} />
            <span style={{ fontSize:40, fontWeight:700, color:"#00d4aa", minWidth:48, textAlign:"center" }}>{numCourses}</span>
          </div>
          <div style={{ fontSize:10, color:"#7d8590", marginTop:8 }}>
            <span style={{ color:"#e6edf3" }}>{numCourses}</span> kurs × ₺{fmt(avgRev)} ort. fiyat = <span style={{ color:"#3b82f6" }}>₺{fmt(revPerStu)}</span> / öğrenci
          </div>
        </div>

        {/* Number of students */}
        <div style={{ ...S.card, padding:20 }}>
          <div style={S.label}>Toplam Öğrenci Sayısı</div>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            <input type="range" min={1} max={50} value={numStudents}
              onChange={e => setNumStudents(+e.target.value)}
              style={{ flex:1, accentColor:"#f59e0b", cursor:"pointer", height:6 }} />
            <span style={{ fontSize:40, fontWeight:700, color:"#f59e0b", minWidth:48, textAlign:"center" }}>{numStudents}</span>
          </div>
          <div style={{ fontSize:10, color:"#7d8590", marginTop:8 }}>
            Başa baş noktası: <span style={{ color: numStudents >= breakEvenN ? "#00d4aa" : "#ef4444" }}>
              {breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`}
            </span>
          </div>
        </div>

        {/* Fixed costs */}
        <div style={{ ...S.card, padding:20 }}>
          <div style={S.label}>Yıllık Sabit Gider — FC (₺)</div>
          <input type="number" value={fc} onChange={e => setFc(+e.target.value)} style={S.input} />
          <div style={{ fontSize:10, color:"#7d8590", marginTop:8 }}>İşletme + ders sabit giderleri</div>
        </div>
      </div>

      {/* ── Average Price Controls ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:14, marginBottom:20 }}>
        <div style={{ ...S.card, padding:16 }}>
          <div style={S.label}>Ort. Kurs Geliri (₺)</div>
          <input type="number" value={avgRev} onChange={e => setAvgRev(+e.target.value)} style={{...S.input, fontSize:16}} />
          <div style={{ fontSize:10, color:"#7d8590", marginTop:4 }}>
            Katalog ort: ₺{fmt(AVG_REV)}
            <button onClick={() => setAvgRev(AVG_REV)}
              style={{ marginLeft:8, background:"transparent", border:"1px solid #30363d", color:"#7d8590",
                       borderRadius:4, padding:"1px 6px", cursor:"pointer", fontSize:9 }}>sıfırla</button>
          </div>
        </div>
        <div style={{ ...S.card, padding:16 }}>
          <div style={S.label}>Ort. Kurs Gideri (₺)</div>
          <input type="number" value={avgCst} onChange={e => setAvgCst(+e.target.value)} style={{...S.input, fontSize:16}} />
          <div style={{ fontSize:10, color:"#7d8590", marginTop:4 }}>
            Katalog ort: ₺{fmt(AVG_CST)}
            <button onClick={() => setAvgCst(AVG_CST)}
              style={{ marginLeft:8, background:"transparent", border:"1px solid #30363d", color:"#7d8590",
                       borderRadius:4, padding:"1px 6px", cursor:"pointer", fontSize:9 }}>sıfırla</button>
          </div>
        </div>
        <div style={{ ...S.card, padding:16, display:"flex", flexDirection:"column", justifyContent:"center" }}>
          <div style={S.label}>Ort. Kurs Marjini</div>
          <div style={{ fontSize:22, fontWeight:700, color:"#00d4aa" }}>₺{fmt(avgMargin)}</div>
          <div style={{ fontSize:10, color:"#7d8590", marginTop:2 }}>
            Marjin oranı: <span style={{ color:"#00d4aa" }}>{avgRev > 0 ? ((avgMargin / avgRev) * 100).toFixed(1) : 0}%</span>
          </div>
        </div>
      </div>

      {/* ── Profit Result Card ── */}
      <div style={{
        ...S.card, padding:"24px 32px", marginBottom:20,
        background: netProfit >= 0
          ? "linear-gradient(135deg, #00d4aa10 0%, #161b22 100%)"
          : "linear-gradient(135deg, #ef444410 0%, #161b22 100%)",
        borderColor: netProfit >= 0 ? "#00d4aa33" : "#ef444433"
      }}>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:20, alignItems:"center" }}>
          <div>
            <div style={S.label}>Toplam Gelir</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#3b82f6" }}>₺{fmt(totalRev)}</div>
          </div>
          <div>
            <div style={S.label}>Değişken Gider</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#ef4444" }}>₺{fmt(totalCst)}</div>
          </div>
          <div>
            <div style={S.label}>KDV (%20)</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#f97316" }}>₺{fmt(totalKdv)}</div>
          </div>
          <div>
            <div style={S.label}>Brüt Kâr</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#e6edf3" }}>₺{fmt(totalGross)}</div>
          </div>
          <div>
            <div style={S.label}>Sabit Gider</div>
            <div style={{ fontSize:20, fontWeight:700, color:"#ef4444" }}>₺{fmt(fc)}</div>
          </div>
          <div>
            <div style={S.label}>NET KÂR</div>
            <div style={{ fontSize:28, fontWeight:700, color: netProfit >= 0 ? "#00d4aa" : "#ef4444" }}>
              {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
            </div>
          </div>
        </div>
        <div style={{ marginTop:12, fontSize:11, color:"#7d8590" }}>
          {numStudents} öğrenci × {numCourses} kurs × ₺{fmt(avgMargin)} marjin − ₺{fmt(fc)} sabit gider − ₺{fmt(totalKdv)} KDV
          = <span style={{ color: netProfit >= 0 ? "#00d4aa" : "#ef4444", fontWeight:700 }}>
            {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
          </span>
        </div>
      </div>

      {/* ── KPI Strip ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:14, marginBottom:20 }}>
        {[
          { label:"Marjin / Öğrenci",  value:`₺${fmt(margPerStu)}`,    color:"#00d4aa" },
          { label:"KDV / Öğrenci",     value:`₺${fmt(kdvPerStu)}`,     color:"#f97316" },
          { label:"Net Marjin / Öğrenci", value:`₺${fmt(netMarginPerStu)}`, color:"#3b82f6" },
          { label:"Başa Baş Noktası",  value: breakEvenN === Infinity ? "∞" : `${breakEvenN} öğrenci`, color: numStudents >= breakEvenN ? "#00d4aa" : "#f59e0b" },
          { label:"Mevcut Durum",       value: numStudents >= breakEvenN ? "KÂRDA ✓" : "ZARARDA ✗", color: numStudents >= breakEvenN ? "#00d4aa" : "#ef4444" },
        ].map(k => (
          <div key={k.label} style={{ ...S.card, padding:"14px 16px" }}>
            <div style={S.label}>{k.label}</div>
            <div style={{ fontSize:18, fontWeight:700, color:k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* ── Two-Column: Chart + Scenarios ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1.5fr 1fr", gap:16, marginBottom:16 }}>

        {/* Profit Chart */}
        <div style={{ ...S.card, padding:20 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:14 }}>
            <div style={S.label}>Net Kâr vs Öğrenci Sayısı — Kurs Sayısı Karşılaştırması</div>
            <div style={{ marginLeft:"auto", fontSize:10, color:"#7d8590" }}>
              Aktif: <span style={{ color:"#00d4aa" }}>{numCourses} kurs</span> (kalın çizgi)
            </div>
          </div>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top:5, right:24, bottom:16, left:20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#21262d" />
              <XAxis dataKey="n" stroke="#7d8590" tick={{ fontSize:10, fill:"#7d8590" }}
                label={{ value:"Öğrenci Sayısı (n)", position:"insideBottom", offset:-8, fill:"#7d8590", fontSize:10 }} />
              <YAxis stroke="#7d8590" tick={{ fontSize:10, fill:"#7d8590" }} tickFormatter={v => `₺${fmtK(v)}`} />
              <Tooltip content={<ChartTip />} />
              <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
              <ReferenceLine y={0} stroke="#f59e0b" strokeDasharray="5 5"
                label={{ value:"Başa Baş", fill:"#f59e0b", fontSize:10, position:"insideTopLeft" }} />
              <ReferenceLine x={numStudents} stroke="#f59e0b44" strokeDasharray="3 3" />
              {[1,2,3,4,5,6,7,8].map((c, i) => (
                <Line key={c} type="monotone" dataKey={`C${c}`} name={`${c} kurs`}
                  stroke={LINE_COLORS[i]} dot={false}
                  strokeWidth={c === numCourses ? 3 : 1}
                  strokeOpacity={c === numCourses ? 1 : 0.2} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Scenario Table */}
        <div style={{ ...S.card, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px", borderBottom:"1px solid #30363d" }}>
            <div style={S.label}>Senaryo Analizi — {numCourses} kurs / öğrenci</div>
          </div>
          <div style={{ overflowY:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse", fontSize:11 }}>
              <thead>
                <tr style={{ background:"#0d1117", position:"sticky", top:0 }}>
                  {["n","Yıllık Gelir","Brüt Kâr","KDV","Sabit Gider","NET KÂR"].map(h => (
                    <th key={h} style={{ padding:"8px 12px", textAlign:"right",
                                         color:"#7d8590", fontWeight:600, fontSize:10, textTransform:"uppercase" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scenRows.map(row => (
                  <tr key={row.n} style={{
                    borderBottom:"1px solid #21262d",
                    background: row.n === numStudents ? "#f59e0b0a" : row.green ? "#00d4aa06" : "transparent"
                  }}>
                    <td style={{ padding:"10px 12px", fontWeight:700, color:"#e6edf3", textAlign:"right" }}>
                      {row.n}
                      {row.n === numStudents && <span style={{ color:"#f59e0b", fontSize:9 }}> ★</span>}
                      {row.n === breakEvenN && <span style={{ color:"#f59e0b", fontSize:9 }}> BE</span>}
                    </td>
                    <td style={{ padding:"10px 12px", color:"#3b82f6", textAlign:"right" }}>₺{fmt(row.rev)}</td>
                    <td style={{ padding:"10px 12px", color:"#e6edf3", textAlign:"right" }}>₺{fmt(row.gross)}</td>
                    <td style={{ padding:"10px 12px", color:"#f97316", textAlign:"right" }}>₺{fmt(row.kdv)}</td>
                    <td style={{ padding:"10px 12px", color:"#ef4444", textAlign:"right" }}>₺{fmt(fc)}</td>
                    <td style={{ padding:"10px 12px", fontWeight:700, textAlign:"right",
                                 color: row.green ? "#00d4aa" : "#ef4444" }}>
                      {row.green ? "+" : ""}₺{fmt(row.net)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Category breakdown */}
          <div style={{ padding:"14px 18px", borderTop:"1px solid #30363d" }}>
            <div style={S.label}>Kategori Bazlı Ortalamalar</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:8 }}>
              {Object.entries(catStats).map(([cat, st]) => (
                <div key={cat} style={{ ...S.tag(CAT_COLORS[cat]), padding:"4px 10px", fontSize:10 }}>
                  {cat}: {st.count} kurs · ort. ₺{fmtK(st.totalRev / st.count)} gelir · ₺{fmtK((st.totalRev - st.totalCst) / st.count)} marjin
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop:16, color:"#7d8590", fontSize:10, textAlign:"center", lineHeight:1.8 }}>
        Net Kâr = n_öğrenci × kurs_sayısı × ort_marjin − sabit_gider − KDV
        &nbsp;|&nbsp; KDV = Gelir × 20/120
        &nbsp;|&nbsp; Ort. Gelir: ₺{fmt(avgRev)} · Ort. Gider: ₺{fmt(avgCst)} · Ort. Marjin: ₺{fmt(avgMargin)}
        &nbsp;|&nbsp; Yıllık FC: ₺{fmt(fc)}
        &nbsp;|&nbsp; Veriler: Ders Kataloğu ({ALL_COURSES.length} kurs)
      </div>
    </div>
  );
}
