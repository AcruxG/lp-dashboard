import { useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from "recharts";
import { useAppContext } from "./AppContext";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "28px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 16, marginTop: 40, borderBottom: "1px solid #14465B", paddingBottom: 10 },
};

const fmt = v => {
  if (!Number.isFinite(v)) return "∞";
  return new Intl.NumberFormat("tr-TR").format(Math.round(v));
};
const fmtK = v => {
  if (!Number.isFinite(v)) return "∞";
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
  return String(Math.round(v));
};

const PriceTip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", borderRadius: 8, padding: "10px 14px" }}>
      <div style={{ color: "#475569", fontSize: 11, marginBottom: 6, fontWeight: 600 }}>₺{fmt(label)} / saat</div>
      {payload.map(p => (
        <div key={p.name} style={{ color: p.color, fontSize: 11, display: "flex", gap: 4 }}>
          <span>{p.name}:</span> <b style={{ color: "#0F172A" }}>₺{fmt(p.value)}</b>
        </div>
      ))}
    </div>
  );
};

export default function PriceBreakevenModel() {
  const {
    numCourses, numStudents, hours, pricePerHour, discount, tutorCostPerHour,
    numApps, pricePerAppUsd, usdTry,
    numConsultants, consultantWage, payMode, commissionPct,
    managerWage, fc
  } = useAppContext();

  const discountFactor = 1 - discount / 100;
  const kdvRatio = 20 / 120;
  const grossUp = 120 / 100;

  // ── Constants (don't depend on pricePerHour) ─────────────────────────────
  const pricePerAppTl = Math.round(pricePerAppUsd * usdTry);
  const totalApps = numApps * numStudents;
  const danRevTotal = totalApps * pricePerAppTl;

  const courseCstTotal = numStudents * numCourses * hours * tutorCostPerHour;
  const danCstTotal = payMode === "wage"
    ? numConsultants * consultantWage * 12
    : Math.round(danRevTotal * commissionPct / 100);
  const managerAnnual = managerWage * 12;
  const totalCst = courseCstTotal + danCstTotal + managerAnnual;
  const allCostsForBE = totalCst + fc;

  // ── Break-even price/hour ────────────────────────────────────────────────
  // At pre-tax break-even: totalRev × (1 − KDV/120) = totalCst + fc
  //   totalRev = grossUp × (totalCst + fc)
  //   = courseRev + danRev  →  courseRev = grossUp × (totalCst + fc) − danRev
  //   courseRev = a × p,  a = numStudents × numCourses × hours × (1 − discount/100)
  //   p_BE = (grossUp × (totalCst + fc) − danRev) / a
  const a = numStudents * numCourses * hours * discountFactor;
  const beNum = grossUp * allCostsForBE - danRevTotal;
  const breakEvenPrice = a > 0 ? beNum / a : Infinity;
  const breakEvenCoursePrice = Number.isFinite(breakEvenPrice)
    ? hours * breakEvenPrice * discountFactor
    : Infinity;

  // ── Current net profit (mirrors YearlyModel) ─────────────────────────────
  const avgRev = Math.round(hours * pricePerHour * discountFactor);
  const courseRevTotal = numStudents * numCourses * avgRev;
  const totalRev = courseRevTotal + danRevTotal;
  const totalKdv = totalRev * kdvRatio;
  const preTaxProfit = (totalRev - totalCst) - fc - totalKdv;
  const corpTax = preTaxProfit > 0 ? preTaxProfit * 0.25 : 0;
  const netProfit = preTaxProfit - corpTax;

  // ── Chart 1: Net profit vs price/hour ────────────────────────────────────
  const beP = Number.isFinite(breakEvenPrice) ? breakEvenPrice : pricePerHour;
  const anchor = Math.max(pricePerHour, beP, 1000);
  const priceLow = Math.max(0, Math.min(pricePerHour, beP) * 0.4);
  const priceHigh = anchor * 1.8;
  const priceData = useMemo(() => {
    const arr = [];
    const steps = 50;
    const step = (priceHigh - priceLow) / steps;
    for (let i = 0; i <= steps; i++) {
      const p = priceLow + i * step;
      const cRev = a * p;
      const totRev = cRev + danRevTotal;
      const kdv = totRev * kdvRatio;
      const preTax = (totRev - totalCst) - fc - kdv;
      const tax = preTax > 0 ? preTax * 0.25 : 0;
      arr.push({
        price: Math.round(p),
        net: Math.round(preTax - tax),
      });
    }
    return arr;
  }, [a, danRevTotal, totalCst, fc, priceLow, priceHigh, kdvRatio]);

  // ── Chart 2: Break-even price vs # students ──────────────────────────────
  const beVsStudents = useMemo(() => {
    const arr = [];
    for (let n = 1; n <= 50; n++) {
      const danR = (numApps * n) * pricePerAppTl;
      const ccTot = n * numCourses * hours * tutorCostPerHour;
      const dCst = payMode === "wage"
        ? numConsultants * consultantWage * 12
        : Math.round(danR * commissionPct / 100);
      const tCst = ccTot + dCst + managerAnnual;
      const aN = n * numCourses * hours * discountFactor;
      const num = grossUp * (tCst + fc) - danR;
      const beN = aN > 0 ? num / aN : Infinity;
      arr.push({ n, beP: Number.isFinite(beN) ? Math.max(0, Math.round(beN)) : null });
    }
    return arr;
  }, [numCourses, hours, discountFactor, numApps, pricePerAppTl, tutorCostPerHour,
      payMode, numConsultants, consultantWage, commissionPct, managerAnnual, fc, grossUp]);

  // ── Scenario table ───────────────────────────────────────────────────────
  const beRounded = Number.isFinite(breakEvenPrice) ? Math.round(breakEvenPrice) : null;
  const scenarioPrices = [...new Set([
    1000, 2000, 3000, 4000, 5000, 6000, 7000,
    pricePerHour,
    ...(beRounded ? [beRounded] : [])
  ])].sort((x, y) => x - y);

  const scenRows = scenarioPrices.map(p => {
    const cRev = a * p;
    const totRev = cRev + danRevTotal;
    const kdv = totRev * kdvRatio;
    const preTax = (totRev - totalCst) - fc - kdv;
    const tax = preTax > 0 ? preTax * 0.25 : 0;
    const net = preTax - tax;
    const coursePrice = hours * p * discountFactor;
    return { p, coursePrice, rev: totRev, kdv, preTax, tax, net, green: net >= 0 };
  });

  const inSurplus = pricePerHour >= breakEvenPrice;
  const priceDiff = pricePerHour - breakEvenPrice;
  const priceDiffPct = breakEvenPrice > 0 ? (priceDiff / breakEvenPrice * 100) : 0;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2 }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.5px" }}>
              Fiyat Bazlı Başa Baş
            </h1>
            <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
              Sabit {numStudents} öğrenci · {numCourses} kurs / öğrenci · {hours} saat / kurs → Başa baş için gerekli kurs satış fiyatı
            </div>
          </div>
        </div>
      </div>

      {/* Top KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #048C8C" }}>
          <div style={S.label}>Başa Baş Saat Ücreti</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#048C8C" }}>₺{fmt(breakEvenPrice)}<span style={{ fontSize: 12, color: "#94A3B8", fontWeight: 400 }}> / saat</span></div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
            Mevcut: <span style={{ color: "#FFFFFF" }}>₺{fmt(pricePerHour)}</span>
          </div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: "4px solid #38BDF8" }}>
          <div style={S.label}>Başa Baş Kurs Satış Fiyatı</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#38BDF8" }}>₺{fmt(breakEvenCoursePrice)}</div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
            {hours} saat × ₺{fmt(breakEvenPrice)} × %{100 - discount}
          </div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: inSurplus ? "4px solid #048C8C" : "4px solid #F25C5C" }}>
          <div style={S.label}>Mevcut Fiyat Marjı</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: inSurplus ? "#048C8C" : "#F25C5C" }}>
            {inSurplus ? "+" : ""}₺{fmt(priceDiff)}
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
            ({inSurplus ? "+" : ""}{priceDiffPct.toFixed(1)}%) {inSurplus ? "yeterli ✓" : "eksik ✗"}
          </div>
        </div>
        <div style={{ ...S.card, padding: 20, borderTop: netProfit >= 0 ? "4px solid #34D399" : "4px solid #F25C5C" }}>
          <div style={S.label}>Mevcut Net Kâr</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: netProfit >= 0 ? "#34D399" : "#F25C5C" }}>
            {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
          </div>
          <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 8 }}>
            {netProfit >= 0 ? "KÂRDA" : "ZARARDA"} · Yıllık
          </div>
        </div>
      </div>

      {/* Formula explanation */}
      <div style={{
        ...S.card, padding: 20, marginBottom: 20,
        background: "linear-gradient(135deg, #048C8C10 0%, #0B202B 100%)",
        borderColor: "#048C8C33"
      }}>
        <div style={S.label}>Formül</div>
        <div style={{ color: "#F1F5F9", fontSize: 13, marginTop: 8, fontWeight: 600 }}>
          p<sub>BE</sub> = [1.2 × (Değişken Maliyet + Sabit Gider) − Danışmanlık Geliri] / [Öğr × Kurs × Saat × (1 − İndirim)]
        </div>
        <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 10, lineHeight: 1.7 }}>
          • Değişken Maliyet: ₺{fmt(courseCstTotal)} (eğitmen) + ₺{fmt(danCstTotal)} (danışman) + ₺{fmt(managerAnnual)} (yönetici) = <span style={{ color: "#F25C5C" }}>₺{fmt(totalCst)}</span><br/>
          • Sabit Gider (FC): <span style={{ color: "#F25C5C" }}>₺{fmt(fc)}</span><br/>
          • Danışmanlık Geliri: <span style={{ color: "#02A6A6" }}>₺{fmt(danRevTotal)}</span> (kurs fiyatından bağımsız, başa başı düşürür)<br/>
          • 1.2 katsayısı: KDV %20 → Gelir × (100/120) net kalır
        </div>
        <div style={{ color: "#94A3B8", fontSize: 11, marginTop: 8, paddingTop: 8, borderTop: "1px solid #14465B" }}>
          <span style={{ color: "#048C8C" }}>p<sub>BE</sub></span> = [1.2 × ₺{fmt(allCostsForBE)} − ₺{fmt(danRevTotal)}] / [{numStudents} × {numCourses} × {hours} × {discountFactor.toFixed(2)}]
          {Number.isFinite(breakEvenPrice) && <> = <span style={{ color: "#048C8C", fontWeight: 700 }}>₺{fmt(breakEvenPrice)}/saat</span></>}
        </div>
      </div>

      {/* Chart 1: Net profit vs price */}
      <div style={S.sectionTitle}>Net Kâr vs Saat Ücreti</div>
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "20px 16px 0 0", marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={priceData} margin={{ top: 20, right: 32, bottom: 28, left: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="price" stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }}
              tickFormatter={v => `₺${fmtK(v)}`}
              label={{ value: "Saat Ücreti (₺/saat)", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={v => `₺${fmtK(v)}`} />
            <Tooltip content={<PriceTip />} />
            <ReferenceLine y={0} stroke="#D97706" strokeDasharray="5 5" />
            {Number.isFinite(breakEvenPrice) && (
              <ReferenceLine x={Math.round(breakEvenPrice)} stroke="#048C8C" strokeDasharray="5 5"
                label={{ value: `Başa Baş ₺${fmt(breakEvenPrice)}`, fill: "#048C8C", fontSize: 10, position: "top", fontWeight: "bold" }} />
            )}
            <ReferenceLine x={pricePerHour} stroke="#F25C5C" strokeDasharray="3 3"
              label={{ value: `Mevcut ₺${fmt(pricePerHour)}`, fill: "#F25C5C", fontSize: 10, position: "insideBottomRight" }} />
            <Line type="monotone" dataKey="net" name="Net Kâr" stroke="#048C8C" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Chart 2: BE price vs # students */}
      <div style={S.sectionTitle}>Başa Baş Saat Ücreti vs Öğrenci Sayısı</div>
      <div style={{ background: "#F8FAFC", borderRadius: 8, padding: "20px 16px 0 0", marginBottom: 20 }}>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart data={beVsStudents} margin={{ top: 20, right: 32, bottom: 28, left: 28 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" />
            <XAxis dataKey="n" stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }}
              label={{ value: "Öğrenci Sayısı", position: "insideBottom", offset: -10, fill: "#475569", fontSize: 11 }} />
            <YAxis stroke="#475569" tick={{ fontSize: 10, fill: "#475569" }} tickFormatter={v => `₺${fmtK(v)}`} />
            <Tooltip
              contentStyle={{ background: "#FFFFFF", borderRadius: 8, border: "1px solid #CBD5E1", color: "#0F172A" }}
              labelFormatter={l => `${l} öğrenci`}
              formatter={v => [`₺${fmt(v)} / saat`, "Gerekli Saat Ücreti"]} />
            <ReferenceLine x={numStudents} stroke="#F25C5C" strokeDasharray="3 3"
              label={{ value: `Mevcut: ${numStudents} öğr.`, fill: "#F25C5C", fontSize: 10, position: "top" }} />
            <ReferenceLine y={pricePerHour} stroke="#D97706" strokeDasharray="3 3"
              label={{ value: `Mevcut Fiyat: ₺${fmt(pricePerHour)}`, fill: "#D97706", fontSize: 10, position: "insideTopRight" }} />
            <Line type="monotone" dataKey="beP" name="Başa Baş Saat Ücreti" stroke="#048C8C" strokeWidth={3} dot={{ r: 2 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Scenario table */}
      <div style={S.sectionTitle}>Fiyat Senaryoları</div>
      <div style={{ ...S.card, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
              {["Saat Ücreti", "Kurs Fiyatı", "Yıllık Gelir", "KDV", "VÖ Kâr", "KV %25", "Net Kâr"].map(h => (
                <th key={h} style={{ padding: "12px 14px", textAlign: "right", color: "#94A3B8", fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {scenRows.map(r => (
              <tr key={r.p} style={{
                borderBottom: "1px solid #1A5369",
                background: r.p === pricePerHour ? "#1A53690a"
                  : r.p === beRounded ? "#FBBF2410"
                  : r.green ? "#048C8C06" : "transparent"
              }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: "#FFFFFF", textAlign: "right" }}>
                  ₺{fmt(r.p)}
                  {r.p === pricePerHour && <span style={{ color: "#FBBF24", fontSize: 11 }}> ★</span>}
                  {r.p === beRounded && <span style={{ color: "#FBBF24", fontSize: 11, fontWeight: "bold" }}> BE</span>}
                </td>
                <td style={{ padding: "10px 14px", color: "#38BDF8", textAlign: "right" }}>₺{fmt(r.coursePrice)}</td>
                <td style={{ padding: "10px 14px", color: "#037A7A", textAlign: "right" }}>₺{fmt(r.rev)}</td>
                <td style={{ padding: "10px 14px", color: "#038C8C", textAlign: "right" }}>₺{fmt(r.kdv)}</td>
                <td style={{ padding: "10px 14px", color: r.preTax >= 0 ? "#FFFFFF" : "#F25C5C", textAlign: "right" }}>
                  {r.preTax >= 0 ? "+" : ""}₺{fmt(r.preTax)}
                </td>
                <td style={{ padding: "10px 14px", color: "#026E6E", textAlign: "right" }}>₺{fmt(r.tax)}</td>
                <td style={{
                  padding: "10px 14px", fontWeight: 700, textAlign: "right",
                  color: r.green ? "#048C8C" : "#F25C5C"
                }}>
                  {r.green ? "+" : ""}₺{fmt(r.net)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, color: "#94A3B8", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
        Diğer parametreleri (öğrenci, kurs, FC, danışmanlık) Yıllık Simülasyon sayfasından değiştirebilirsiniz.
        <br/>
        Net Kâr = (Brüt Marjin − FC − KDV) × 0.75 · KDV = Gelir × 20/120 · KV %25
      </div>
    </div>
  );
}
