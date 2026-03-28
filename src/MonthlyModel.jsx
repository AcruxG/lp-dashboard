import { useState, useMemo } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "28px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  input: {
    width: "100%", background: "transparent", border: "none", borderBottom: "1px solid #14465B",
    color: "#FFFFFF", fontSize: 20, fontWeight: 700, outline: "none", fontFamily: "inherit", padding: "6px 0"
  },
  sectionTitle: { fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 16, marginTop: 40, borderBottom: "1px solid #14465B", paddingBottom: 10 },
};

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

export default function MonthlyModel() {
  const [initialCapital, setInitialCapital] = useState(500000);
  const [startStudents, setStartStudents] = useState(2);
  const [growthPerMonth, setGrowthPerMonth] = useState(3);
  
  // Simplified economics per student per month
  const [revPerStudentMonth, setRevPerStudentMonth] = useState(20000);
  const [cstPerStudentMonth, setCstPerStudentMonth] = useState(8000);
  
  const [monthlyFc, setMonthlyFc] = useState(15000);
  const [monthlyManager, setMonthlyManager] = useState(40000);

  const chartData = useMemo(() => {
    let currentCash = initialCapital;
    let students = startStudents;
    const data = [];

    for (let m = 1; m <= 12; m++) {
      const mnthRev = students * revPerStudentMonth;
      const mnthCst = (students * cstPerStudentMonth) + monthlyFc + monthlyManager;
      
      const kdv = mnthRev * 20 / 120;
      const netPreTaxFlow = mnthRev - mnthCst - kdv;
      
      const corpTax = netPreTaxFlow > 0 ? netPreTaxFlow * 0.25 : 0;
      const netFlow = netPreTaxFlow - corpTax;
      currentCash += netFlow;

      data.push({
        ay: `Ay ${m}`,
        students,
        gelir: mnthRev,
        gider: mnthCst + kdv + corpTax,
        netFlow,
        kasa: currentCash
      });

      students += growthPerMonth;
    }
    return data;
  }, [initialCapital, startStudents, growthPerMonth, revPerStudentMonth, cstPerStudentMonth, monthlyFc, monthlyManager]);

  const minCash = Math.min(...chartData.map(d => d.kasa));
  const eoyCash = chartData[11].kasa;
  const breakEvenMonth = chartData.find(d => d.netFlow >= 0)?.ay || "Yok";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Aylık Nakit Akışı ve Büyüme</h1>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>Kuruluş sermayesi ve aylık büyüme oranlarıyla kasa projeksiyonu</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Başlangıç Sermayesi (₺)</div>
          <input type="number" value={initialCapital} onChange={e => setInitialCapital(+e.target.value)} style={S.input} />
        </div>
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>1. Ay Öğrenci Sayısı</div>
          <input type="number" value={startStudents} onChange={e => setStartStudents(+e.target.value)} style={S.input} />
        </div>
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Aylık Büyüme (Yeni Öğrenci/Ay)</div>
          <input type="number" value={growthPerMonth} onChange={e => setGrowthPerMonth(+e.target.value)} style={S.input} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Aylık Gelir (₺) / Öğr.</div>
          <input type="number" value={revPerStudentMonth} onChange={e => setRevPerStudentMonth(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Aylık Gider (₺) / Öğr.</div>
          <input type="number" value={cstPerStudentMonth} onChange={e => setCstPerStudentMonth(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Aylık Sabit FC (₺)</div>
          <input type="number" value={monthlyFc} onChange={e => setMonthlyFc(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
        </div>
        <div style={{ ...S.card, padding: 16 }}>
          <div style={S.label}>Aylık Yönetici Maaşı (₺)</div>
          <input type="number" value={monthlyManager} onChange={e => setMonthlyManager(+e.target.value)} style={{ ...S.input, fontSize: 16 }} />
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #048C8C" }}>
          <div style={S.label}>1. Yıl Sonu Kasa</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: eoyCash >= 0 ? "#048C8C" : "#F25C5C" }}>₺{fmt(eoyCash)}</div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: minCash < 0 ? "4px solid #F25C5C" : "4px solid #38BDF8" }}>
          <div style={S.label}>En Düşük Kasa Bakiyesi (Max İhtiyaç)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: minCash < 0 ? "#F25C5C" : "#38BDF8" }}>₺{fmt(minCash)}</div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #FBBF24" }}>
          <div style={S.label}>1. Yıl Sonu Öğrenci</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FBBF24" }}>{chartData[11].students} Öğrenci</div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #34D399" }}>
          <div style={S.label}>Operasyonel Başa Baş (İlk Kârlı Ay)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#34D399" }}>{breakEvenMonth}</div>
        </div>
      </div>

      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "24px 20px 0 0", marginBottom: 20 }}>
        <div style={{ paddingLeft: 24, marginBottom: 8, fontWeight: 700, color: "#0F172A" }}>Aylık Kasa ve Gelir/Gider Tablosu (12 Ay Nakit Akışı)</div>
        <ResponsiveContainer width="100%" height={360}>
          <ComposedChart data={chartData} margin={{ top: 10, right: 20, bottom: 20, left: 24 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="ay" stroke="#475569" tick={{ fontSize: 11 }} />
            <YAxis yAxisId="left" stroke="#475569" tickFormatter={v => `₺${fmtK(v)}`} tick={{ fontSize: 11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="#048C8C" tickFormatter={v => `₺${fmtK(v)}`} tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #CBD5E1", color: "#0F172A" }} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 10, color: "#0F172A" }} />
            <ReferenceLine y={0} yAxisId="left" stroke="#D97706" strokeWidth={2} />
            <ReferenceLine y={0} yAxisId="right" stroke="#D97706" strokeWidth={2} />
            
            <Bar yAxisId="left" dataKey="gelir" name="Aylık Gelir" fill="#38BDF8" />
            <Bar yAxisId="left" dataKey="gider" name="Aylık Gider (KDV/Vergi Dahil)" fill="#FB7185" />
            <Line yAxisId="right" type="monotone" dataKey="kasa" name="Kümülatif Kasa (Sağ Eksen)" stroke="#048C8C" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}
