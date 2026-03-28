import { useMemo } from "react";
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine
} from "recharts";
import { useAppContext } from "./AppContext";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "28px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
};

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

export default function MonthlyModel() {
  const {
    numCourses, numStudents, hours, pricePerHour, discount, tutorCostPerHour,
    numApps, pricePerAppUsd, usdTry, numConsultants, consultantWage, payMode, commissionPct,
    managerWage, totalMonthlyFc, totalAnnualOneOffFc, fcKurulus, fcDamga, fcIto, fcNoter
  } = useAppContext();

  const chartData = useMemo(() => {
    // 1. Calculate per-student economics
    const avgRev = Math.round(hours * pricePerHour * (1 - discount / 100));
    const avgCst = Math.round(hours * tutorCostPerHour);
    const revPerStu = numCourses * avgRev;
    const cstPerStu = numCourses * avgCst;

    const pricePerAppTl = Math.round(pricePerAppUsd * usdTry);
    const totalApps = numApps * numStudents;
    const danRevTotal = totalApps * pricePerAppTl;
    const danCstTotal = payMode === "wage"
      ? numConsultants * consultantWage * 12
      : Math.round(danRevTotal * commissionPct / 100);

    const courseRevTotal = numStudents * revPerStu;
    const courseCstTotal = numStudents * cstPerStu;

    const totalAnnualRev = courseRevTotal + danRevTotal;
    const totalAnnualVarCst = courseCstTotal + danCstTotal;

    // Distribute evenly over 12 months
    const monthlyRev = totalAnnualRev / 12;
    const monthlyVarCst = totalAnnualVarCst / 12;
    const monthlyManager = managerWage;

    let currentCash = 0; // Starts at 0
    const data = [];

    for (let m = 1; m <= 12; m++) {
      const mnthRev = monthlyRev;
      
      // Determine specific one-off costs for this particular month
      let currentMonthOneOff = 0;
      if (m === 1) currentMonthOneOff += fcKurulus; // Jan
      if (m === 2 || m === 5 || m === 8) currentMonthOneOff += fcDamga / 3; // Feb, May, Aug
      if (m === 6 || m === 10) currentMonthOneOff += fcIto / 2; // Jun, Oct
      if (m === 5 || m === 11) currentMonthOneOff += fcNoter / 2; // May, Nov
      
      // Expenses: Variable Costs + Manager Wage + Monthly Fixed Costs + Month-specific One-Off Costs
      const specificMonthlyFc = totalMonthlyFc + currentMonthOneOff;
      const mnthCst = monthlyVarCst + monthlyManager + specificMonthlyFc;
      
      const kdv = mnthRev * 20 / 120;
      const netPreTaxFlow = mnthRev - mnthCst - kdv;
      
      // Assuming corporate tax is paid on profitable months
      const corpTax = netPreTaxFlow > 0 ? netPreTaxFlow * 0.25 : 0;
      const netFlow = netPreTaxFlow - corpTax;
      
      currentCash += netFlow;

      data.push({
        ay: `Ay ${m}`,
        gelir: mnthRev,
        gider: mnthCst + kdv + corpTax,
        netFlow,
        kasa: currentCash
      });
    }
    return data;
  }, [
    numCourses, numStudents, hours, pricePerHour, discount, tutorCostPerHour,
    numApps, pricePerAppUsd, usdTry, numConsultants, consultantWage, payMode, commissionPct,
    managerWage, totalMonthlyFc, totalAnnualOneOffFc
  ]);

  const minCash = Math.min(...chartData.map(d => d.kasa));
  const eoyCash = chartData[11].kasa;
  const breakEvenMonth = chartData.find(d => d.netFlow > 0)?.ay || "Yıllık Zarar";

  return (
    <div style={S.page}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Aylık Nakit Akışı</h1>
        <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
          Yıllık simülasyon ayarlarınıza göre hesaplanan 12 aylık kasa projeksiyonu. Bir kereye mahsus kuruluş/yıllık giderleri 1. aya yansıtılmıştır.
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #048C8C" }}>
          <div style={S.label}>1. Yıl Sonu Kasa Bakiyesi</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: eoyCash >= 0 ? "#048C8C" : "#F25C5C" }}>₺{fmt(eoyCash)}</div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: minCash < 0 ? "4px solid #F25C5C" : "4px solid #38BDF8" }}>
          <div style={S.label}>En Yüksek Nakit İhtiyacı (Sermaye İhtiyacı)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: minCash < 0 ? "#F25C5C" : "#38BDF8" }}>₺{fmt(minCash)}</div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #34D399" }}>
          <div style={S.label}>Operasyonel Başa Baş (İlk Kârlı Nakit Akışı Ayı)</div>
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
            <Bar yAxisId="left" dataKey="gider" name="Aylık Gider (Tüm Maliyet + FC + KDV/Vergi)" fill="#FB7185" />
            <Line yAxisId="right" type="monotone" dataKey="kasa" name="Kümülatif Kasa (Sağ Eksen)" stroke="#048C8C" strokeWidth={3} dot={{ r: 4 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
