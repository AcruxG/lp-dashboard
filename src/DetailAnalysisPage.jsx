import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine
} from "recharts";
import { useAppContext } from "./AppContext";
import DetailNav from "./DetailNav";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "24px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  sectionTitle: { display: "flex", alignItems: "center", gap: 10, fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginBottom: 14, marginTop: 32, borderBottom: "1px solid #14465B", paddingBottom: 8 },
};

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtK = v => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v));

export default function DetailAnalysisPage() {
  const {
    detailStudents, detailCourses,
    pricePerAppUsd, usdTry,
    numConsultants, consultantWage, payMode, commissionPct,
    managerWage, fc,
    totalMonthlyFc, totalAnnualOneOffFc,
  } = useAppContext();

  const pricePerAppTl = Math.round(pricePerAppUsd * usdTry);
  const managerAnnual = managerWage * 12;

  const courseMap = useMemo(() => {
    const m = {};
    detailCourses.forEach(c => { m[c.id] = c; });
    return m;
  }, [detailCourses]);

  // Per-student
  const perStudent = useMemo(() => detailStudents.map(s => {
    let courseRev = 0, courseCst = 0;
    s.courseIds.forEach(cid => {
      const c = courseMap[cid];
      if (!c) return;
      courseRev += c.hours * c.pricePerHour * (1 - (c.discount || 0) / 100);
      courseCst += c.hours * c.tutorCostPerHour;
    });
    const apps = s.numApps || 0;
    const appsRev = apps * pricePerAppTl;
    return {
      ...s,
      apps,
      courseRev, courseCst,
      courseMargin: courseRev - courseCst,
      appsRev,
      totalRev: courseRev + appsRev,
    };
  }), [detailStudents, courseMap, pricePerAppTl]);

  // Totals
  const totalCourseRev = perStudent.reduce((a, x) => a + x.courseRev, 0);
  const totalCourseCst = perStudent.reduce((a, x) => a + x.courseCst, 0);
  const totalAppsRev = perStudent.reduce((a, x) => a + x.appsRev, 0);
  const danCstTotal = payMode === "wage"
    ? numConsultants * consultantWage * 12
    : Math.round(totalAppsRev * commissionPct / 100);

  const totalRev = totalCourseRev + totalAppsRev;
  const totalVarCst = totalCourseCst + danCstTotal + managerAnnual;
  const grossProfit = totalRev - totalVarCst;
  const totalKdv = totalRev * 20 / 120;
  const preTaxProfit = grossProfit - fc - totalKdv;
  const corpTax = preTaxProfit > 0 ? preTaxProfit * 0.25 : 0;
  const netProfit = preTaxProfit - corpTax;

  // ── Averages from detail data ─────────────────────────────────────────────
  const totalAssignments = detailStudents.reduce((a, s) => a + s.courseIds.length, 0);
  const totalHoursAssigned = detailStudents.reduce((a, s) => (
    a + s.courseIds.reduce((b, cid) => b + ((courseMap[cid]?.hours) || 0), 0)
  ), 0);
  const totalEffectiveHours = detailStudents.reduce((a, s) => (
    a + s.courseIds.reduce((b, cid) => {
      const c = courseMap[cid];
      return c ? b + c.hours * (1 - (c.discount || 0) / 100) : b;
    }, 0)
  ), 0);
  const weightedDiscountSum = detailStudents.reduce((a, s) => (
    a + s.courseIds.reduce((b, cid) => {
      const c = courseMap[cid];
      return c ? b + c.hours * (c.discount || 0) : b;
    }, 0)
  ), 0);

  const avgCoursesPerStudent = detailStudents.length > 0 ? totalAssignments / detailStudents.length : 0;
  const avgHoursPerCourse = totalAssignments > 0 ? totalHoursAssigned / totalAssignments : 0;
  const avgPricePerHour = totalEffectiveHours > 0 ? totalCourseRev / totalEffectiveHours : 0;
  const avgTutorCostPerHour = totalHoursAssigned > 0 ? totalCourseCst / totalHoursAssigned : 0;
  const avgDiscount = totalHoursAssigned > 0 ? weightedDiscountSum / totalHoursAssigned : 0;
  const currentAvgCoursePrice = totalAssignments > 0 ? totalCourseRev / totalAssignments : 0;

  // Break-even avg price/hour (uniform price applied to all assignments, holding hours/discount constant)
  const fixedCostsForBE = totalCourseCst + danCstTotal + managerAnnual + fc;
  const requiredCourseRev = 1.2 * fixedCostsForBE - totalAppsRev;
  const breakEvenAvgPrice = totalEffectiveHours > 0 ? requiredCourseRev / totalEffectiveHours : Infinity;
  const breakEvenAvgCoursePrice = totalAssignments > 0 ? requiredCourseRev / totalAssignments : Infinity;
  const priceDiff = avgPricePerHour - breakEvenAvgPrice;
  const priceSurplus = avgPricePerHour >= breakEvenAvgPrice;

  // Per-course attach + revenue
  const perCourse = useMemo(() => {
    return detailCourses.map(c => {
      let n = 0;
      detailStudents.forEach(s => {
        if (s.courseIds.includes(c.id)) n++;
      });
      const rev = c.hours * c.pricePerHour * (1 - (c.discount || 0) / 100);
      const cst = c.hours * c.tutorCostPerHour;
      return {
        ...c,
        n,
        unitRev: rev,
        unitCst: cst,
        unitMargin: rev - cst,
        totalRev: rev * n,
        totalCst: cst * n,
      };
    }).sort((a, b) => b.totalRev - a.totalRev);
  }, [detailCourses, detailStudents]);

  // Chart: per-student net contribution (revenue - variable cost share allocated by revenue)
  const chartData = useMemo(() => {
    const fixedTotal = fc + managerAnnual + (payMode === "wage" ? numConsultants * consultantWage * 12 : 0);
    return perStudent.map(s => {
      // Each student's pretax = totalRev - courseCst - (commission share if commission) - kdvShare - allocated fixed
      const revShare = totalRev > 0 ? s.totalRev / totalRev : 0;
      const commShare = payMode === "commission" ? Math.round(s.appsRev * commissionPct / 100) : 0;
      const kdvShare = s.totalRev * 20 / 120;
      const fixedShare = fixedTotal * revShare;
      const preTax = s.totalRev - s.courseCst - commShare - kdvShare - fixedShare;
      return {
        name: s.name,
        gelir: Math.round(s.totalRev),
        netKatki: Math.round(preTax),
      };
    });
  }, [perStudent, totalRev, fc, managerAnnual, numConsultants, consultantWage, payMode, commissionPct]);

  return (
    <>
      <DetailNav />
      <div style={S.page}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2 }} />
            <div>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Analiz</h1>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                {detailStudents.length} öğrenci · {detailCourses.length} ders · Sabit gider ve danışman/yönetici ayarları
                <Link to="/" style={{ color: "#048C8C", marginLeft: 6 }}>Yıllık Simülasyon</Link>'dan alınır.
              </div>
            </div>
          </div>
        </div>

        {/* Headline KPIs */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
          <div style={{ ...S.card, padding: 16, borderTop: "4px solid #038C8C" }}>
            <div style={S.label}>Toplam Gelir</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#037A7A" }}>₺{fmt(totalRev)}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
              Kurs ₺{fmtK(totalCourseRev)} + Dan. ₺{fmtK(totalAppsRev)}
            </div>
          </div>
          <div style={{ ...S.card, padding: 16, borderTop: "4px solid #F25C5C" }}>
            <div style={S.label}>Değişken Gider</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(totalVarCst)}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
              Eğt. ₺{fmtK(totalCourseCst)} + Dan. ₺{fmtK(danCstTotal)} + Yön. ₺{fmtK(managerAnnual)}
            </div>
          </div>
          <div style={{ ...S.card, padding: 16, borderTop: "4px solid #FB7185" }}>
            <div style={S.label}>Sabit Gider (FC)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FB7185" }}>₺{fmt(fc)}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
              Aylık ₺{fmtK(totalMonthlyFc)} × 12 + Yıllık ₺{fmtK(totalAnnualOneOffFc)}
            </div>
          </div>
          <div style={{ ...S.card, padding: 16, borderTop: "4px solid #FBBF24" }}>
            <div style={S.label}>KDV (%20) + KV (%25)</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#FBBF24" }}>₺{fmt(totalKdv + corpTax)}</div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
              KDV ₺{fmtK(totalKdv)} + KV ₺{fmtK(corpTax)}
            </div>
          </div>
          <div style={{ ...S.card, padding: 16, borderTop: netProfit >= 0 ? "4px solid #34D399" : "4px solid #F25C5C" }}>
            <div style={S.label}>Net Kâr</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: netProfit >= 0 ? "#34D399" : "#F25C5C" }}>
              {netProfit >= 0 ? "+" : ""}₺{fmt(netProfit)}
            </div>
            <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
              {netProfit >= 0 ? "KÂRDA ✓" : "ZARARDA ✗"}
            </div>
          </div>
        </div>

        {/* P&L breakdown */}
        <div style={{ ...S.card, padding: "16px 22px", marginBottom: 18 }}>
          <div style={S.label}>Gelir Tablosu</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 8 }}>
            <tbody>
              {[
                { k: "Kurs Geliri", v: totalCourseRev, col: "#037A7A" },
                { k: "Danışmanlık Geliri", v: totalAppsRev, col: "#02A6A6" },
                { k: "= Toplam Gelir", v: totalRev, col: "#FFFFFF", bold: true },
                { k: "− Eğitmen Gideri", v: -totalCourseCst, col: "#F25C5C" },
                { k: `− Danışman Gideri (${payMode === "wage" ? "Maaş" : `Komisyon %${commissionPct}`})`, v: -danCstTotal, col: "#F25C5C" },
                { k: "− Yönetici Maaşı (yıllık)", v: -managerAnnual, col: "#F25C5C" },
                { k: "= Brüt Kâr", v: grossProfit, col: grossProfit >= 0 ? "#FFFFFF" : "#F25C5C", bold: true },
                { k: "− Sabit Giderler (FC)", v: -fc, col: "#FB7185" },
                { k: "− KDV (%20 dahili)", v: -totalKdv, col: "#FBBF24" },
                { k: "= Vergi Öncesi Kâr", v: preTaxProfit, col: preTaxProfit >= 0 ? "#FFFFFF" : "#F25C5C", bold: true },
                { k: "− Kurumlar Vergisi (%25)", v: -corpTax, col: "#FBBF24" },
                { k: "= NET KÂR", v: netProfit, col: netProfit >= 0 ? "#34D399" : "#F25C5C", bold: true, big: true },
              ].map((row, i) => (
                <tr key={i} style={{ borderTop: row.bold ? "1px solid #14465B" : "none" }}>
                  <td style={{ padding: "8px 0", color: row.col, fontWeight: row.bold ? 700 : 400, fontSize: row.big ? 14 : 12 }}>
                    {row.k}
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right", color: row.col, fontWeight: row.bold ? 700 : 600, fontSize: row.big ? 16 : 12 }}>
                    {row.v >= 0 ? "" : ""}₺{fmt(row.v)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Chart: per-student contribution */}
        {chartData.length > 0 && (
          <>
            <div style={S.sectionTitle}>Öğrenci Bazlı Katkı (Pay Edilmiş Vergi Öncesi)</div>
            <div style={{ ...S.card, padding: "20px 16px 0 0", marginBottom: 18 }}>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 24, bottom: 20, left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#14465B" />
                  <XAxis dataKey="name" stroke="#94A3B8" tick={{ fontSize: 11, fill: "#CBD5E1" }} />
                  <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: "#CBD5E1" }} tickFormatter={v => `₺${fmtK(v)}`} />
                  <Tooltip
                    contentStyle={{ background: "#0B202B", borderRadius: 8, border: "1px solid #14465B", color: "#F1F5F9" }}
                    labelStyle={{ color: "#94A3B8" }}
                    formatter={(v, k) => [`₺${fmt(v)}`, k === "gelir" ? "Gelir" : "Net Katkı"]} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 4, color: "#CBD5E1" }} />
                  <ReferenceLine y={0} stroke="#FBBF24" />
                  <Bar dataKey="gelir" name="Gelir" fill="#38BDF8" />
                  <Bar dataKey="netKatki" name="Net Katkı">
                    {chartData.map((d, i) => (
                      <Cell key={i} fill={d.netKatki >= 0 ? "#34D399" : "#F25C5C"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        )}

        {/* Per-student table */}
        <div style={S.sectionTitle}>Öğrenci Bazlı Detay</div>
        <div style={{ ...S.card, overflow: "hidden", marginBottom: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
                {["Öğrenci", "Ders Sayısı", "Başvuru", "Kurs Geliri", "Eğt. Gideri", "Kurs Marjini", "Dan. Geliri", "Toplam Gelir"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px",
                    textAlign: h === "Öğrenci" ? "left" : "right",
                    color: "#94A3B8", fontWeight: 600, fontSize: 10, textTransform: "uppercase"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perStudent.map(s => (
                <tr key={s.id} style={{ borderBottom: "1px solid #1A5369" }}>
                  <td style={{ padding: "10px 12px", color: "#FFFFFF", fontWeight: 700 }}>{s.name}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#CBD5E1" }}>{s.courseIds.length}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#CBD5E1" }}>{s.apps}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#037A7A" }}>₺{fmt(s.courseRev)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#F25C5C" }}>₺{fmt(s.courseCst)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: s.courseMargin >= 0 ? "#048C8C" : "#F25C5C", fontWeight: 700 }}>
                    ₺{fmt(s.courseMargin)}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#02A6A6" }}>₺{fmt(s.appsRev)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#34D399", fontWeight: 700 }}>₺{fmt(s.totalRev)}</td>
                </tr>
              ))}
              {perStudent.length === 0 && (
                <tr><td colSpan={8} style={{ padding: 30, textAlign: "center", color: "#94A3B8" }}>
                  Öğrenci yok. "1. Öğrenciler" sekmesinden ekle.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Per-course table */}
        <div style={S.sectionTitle}>Ders Bazlı Detay</div>
        <div style={{ ...S.card, overflow: "hidden", marginBottom: 18 }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
            <thead>
              <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
                {["Ders", "Öğrenci", "Birim Fiyat", "Birim Gider", "Birim Marjin", "Toplam Gelir", "Toplam Gider"].map(h => (
                  <th key={h} style={{
                    padding: "10px 12px",
                    textAlign: h === "Ders" ? "left" : "right",
                    color: "#94A3B8", fontWeight: 600, fontSize: 10, textTransform: "uppercase"
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {perCourse.map(c => (
                <tr key={c.id} style={{
                  borderBottom: "1px solid #1A5369",
                  background: c.n === 0 ? "#060A0D44" : "transparent",
                  opacity: c.n === 0 ? 0.55 : 1
                }}>
                  <td style={{ padding: "10px 12px", color: "#FFFFFF", fontWeight: 700 }}>{c.name}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: c.n > 0 ? "#FBBF24" : "#94A3B8", fontWeight: 700 }}>{c.n}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#037A7A" }}>₺{fmt(c.unitRev)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#F25C5C" }}>₺{fmt(c.unitCst)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: c.unitMargin >= 0 ? "#048C8C" : "#F25C5C", fontWeight: 700 }}>
                    ₺{fmt(c.unitMargin)}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#037A7A", fontWeight: 700 }}>₺{fmt(c.totalRev)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: "#F25C5C" }}>₺{fmt(c.totalCst)}</td>
                </tr>
              ))}
              {perCourse.length === 0 && (
                <tr><td colSpan={7} style={{ padding: 30, textAlign: "center", color: "#94A3B8" }}>
                  Ders yok. "2. Dersler" sekmesinden ekle.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Average-based break-even */}
        <div style={S.sectionTitle}>Ortalama Bazlı Başa Baş Fiyat</div>
        {totalAssignments === 0 ? (
          <div style={{ ...S.card, padding: 30, textAlign: "center", color: "#94A3B8", marginBottom: 18 }}>
            Ders ataması yok. "1. Öğrenciler" sayfasından öğrencilere ders ata.
          </div>
        ) : (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 14 }}>
              <div style={{ ...S.card, padding: 16, borderTop: "4px solid #94A3B8" }}>
                <div style={S.label}>Mevcut Ort. Saat Ücreti</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#CBD5E1" }}>₺{fmt(avgPricePerHour)}</div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>Ağırlıklı (saat × indirim)</div>
              </div>
              <div style={{ ...S.card, padding: 16, borderTop: priceSurplus ? "4px solid #048C8C" : "4px solid #F25C5C" }}>
                <div style={S.label}>Başa Baş Ort. Saat Ücreti</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: priceSurplus ? "#048C8C" : "#F25C5C" }}>
                  ₺{fmt(breakEvenAvgPrice)}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>
                  Fark: {priceSurplus ? "+" : ""}₺{fmt(priceDiff)} ({breakEvenAvgPrice > 0 ? ((priceDiff / breakEvenAvgPrice) * 100).toFixed(1) : "0"}%)
                </div>
              </div>
              <div style={{ ...S.card, padding: 16, borderTop: "4px solid #94A3B8" }}>
                <div style={S.label}>Mevcut Ort. Kurs Fiyatı</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: "#CBD5E1" }}>₺{fmt(currentAvgCoursePrice)}</div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>Toplam gelir / atama</div>
              </div>
              <div style={{ ...S.card, padding: 16, borderTop: priceSurplus ? "4px solid #38BDF8" : "4px solid #F25C5C" }}>
                <div style={S.label}>Başa Baş Ort. Kurs Fiyatı</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: priceSurplus ? "#38BDF8" : "#F25C5C" }}>
                  ₺{fmt(breakEvenAvgCoursePrice)}
                </div>
                <div style={{ fontSize: 9, color: "#94A3B8", marginTop: 4 }}>Atama başına</div>
              </div>
            </div>

            {/* Average values detail */}
            <div style={{ ...S.card, padding: "16px 22px", marginBottom: 18 }}>
              <div style={S.label}>Ortalamaların Türetildiği Değerler</div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, marginTop: 10 }}>
                <tbody>
                  {[
                    ["Toplam öğrenci", detailStudents.length, "#FFFFFF"],
                    ["Toplam ders ataması", totalAssignments, "#FFFFFF"],
                    ["Ort. ders / öğrenci", avgCoursesPerStudent.toFixed(2), "#FFFFFF"],
                    ["Ort. saat / ders", avgHoursPerCourse.toFixed(1), "#FFFFFF"],
                    ["Ort. saat ücreti (ağırlıklı)", `₺${fmt(avgPricePerHour)}`, "#037A7A"],
                    ["Ort. eğitmen ₺/saat", `₺${fmt(avgTutorCostPerHour)}`, "#F25C5C"],
                    ["Ort. indirim", `%${avgDiscount.toFixed(1)}`, "#FBBF24"],
                    ["Toplam etkin saat (saat × (1−indirim))", fmt(totalEffectiveHours), "#94A3B8"],
                  ].map(([k, v, col], i) => (
                    <tr key={i} style={{ borderBottom: i < 7 ? "1px solid #14465B" : "none" }}>
                      <td style={{ padding: "8px 0", color: "#94A3B8" }}>{k}</td>
                      <td style={{ padding: "8px 0", textAlign: "right", color: col, fontWeight: 600 }}>{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div style={{ color: "#94A3B8", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
          KDV %20 gelirin içinde · Kurumlar Vergisi %25 vergi öncesi kâr üzerinden · Sabit giderler, danışman maaş/komisyon ve yönetici maaşı paylaşımlıdır.
          <br/>Başa baş fiyat: tüm derslere uniform fiyat uygulansaydı, mevcut saat ve indirimlerle vergi öncesi kâr = 0 olurdu.
        </div>
      </div>
    </>
  );
}
