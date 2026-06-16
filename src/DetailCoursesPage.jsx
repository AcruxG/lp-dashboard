import { useMemo, useState } from "react";
import { useAppContext } from "./AppContext";
import DetailNav from "./DetailNav";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "24px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  numInput: {
    background: "#060A0D", border: "1px solid #14465B", borderRadius: 6,
    color: "#FFFFFF", fontSize: 13, fontWeight: 600, outline: "none", fontFamily: "inherit", padding: "6px 10px", width: "100%",
  },
  textInput: {
    background: "transparent", border: "none", borderBottom: "1px solid #14465B",
    color: "#FFFFFF", fontSize: 14, fontWeight: 700, outline: "none", fontFamily: "inherit", padding: "4px 0", width: "100%",
  },
  btn: {
    background: "#048C8C", color: "#FFFFFF", border: "none",
    padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    borderRadius: 6, fontFamily: "inherit",
  },
  btnDanger: {
    background: "transparent", color: "#F25C5C", border: "1px solid #F25C5C33",
    padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer",
    borderRadius: 6, fontFamily: "inherit",
  },
  select: {
    background: "#060A0D", border: "1px solid #14465B", borderRadius: 6,
    color: "#FFFFFF", fontSize: 12, fontWeight: 600, outline: "none", fontFamily: "inherit", padding: "8px 12px",
  },
};

// Curated catalog (40h default, derived per-hour rates from typical course pricing)
const CATALOG = [
  { name: "A-Level Mathematics",   hours: 40, pricePerHour: 4725, tutorCostPerHour: 3750 },
  { name: "A-Level Further Maths", hours: 40, pricePerHour: 5400, tutorCostPerHour: 3750 },
  { name: "A-Level Chemistry",     hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125 },
  { name: "A-Level Physics",       hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125 },
  { name: "A-Level Economics",     hours: 40, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "A-Level Psychology",    hours: 35, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "AP Calculus BC",        hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125 },
  { name: "AP Calculus AB",        hours: 40, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "AP Physics C",          hours: 40, pricePerHour: 4050, tutorCostPerHour: 2812 },
  { name: "AP Chemistry",          hours: 40, pricePerHour: 3600, tutorCostPerHour: 2500 },
  { name: "AP Statistics",         hours: 35, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "AP Psychology",         hours: 35, pricePerHour: 2250, tutorCostPerHour: 1785 },
  { name: "AP MicroEconomics",     hours: 30, pricePerHour: 2100, tutorCostPerHour: 1667 },
  { name: "AP MacroEconomics",     hours: 30, pricePerHour: 1575, tutorCostPerHour: 1250 },
  { name: "AP English Language",   hours: 35, pricePerHour: 2700, tutorCostPerHour: 2142 },
  { name: "AP English Literature", hours: 35, pricePerHour: 2700, tutorCostPerHour: 2142 },
  { name: "MAT (Oxford Maths)",    hours: 30, pricePerHour: 4500, tutorCostPerHour: 2500 },
  { name: "STEP (Cambridge)",      hours: 30, pricePerHour: 4500, tutorCostPerHour: 2500 },
  { name: "PAT (Oxford Physics)",  hours: 30, pricePerHour: 3750, tutorCostPerHour: 2083 },
  { name: "TSA",                   hours: 25, pricePerHour: 3240, tutorCostPerHour: 2000 },
  { name: "SAT Math",              hours: 30, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "SAT English",           hours: 30, pricePerHour: 3150, tutorCostPerHour: 2500 },
  { name: "Bocconi Test",          hours: 25, pricePerHour: 2880, tutorCostPerHour: 2000 },
  { name: "TOEFL",                 hours: 25, pricePerHour: 2700, tutorCostPerHour: 2500 },
  { name: "IELTS",                 hours: 25, pricePerHour: 2700, tutorCostPerHour: 2500 },
];

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));

const nextId = (prefix, existing) => {
  const nums = existing
    .map(x => parseInt((x.id || "").replace(`${prefix}_`, ""), 10))
    .filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}_${max + 1}`;
};

export default function DetailCoursesPage() {
  const { detailCourses, setDetailCourses, detailStudents } = useAppContext();
  const [catalogPick, setCatalogPick] = useState("");

  // Attach rate per course
  const attachRate = useMemo(() => {
    const m = {};
    detailCourses.forEach(c => { m[c.id] = 0; });
    detailStudents.forEach(s => {
      s.courseIds.forEach(cid => {
        if (m[cid] !== undefined) m[cid]++;
      });
    });
    return m;
  }, [detailCourses, detailStudents]);

  const update = (id, patch) => {
    setDetailCourses(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  };

  const addBlank = () => {
    const id = nextId("c", detailCourses);
    setDetailCourses(prev => [...prev, {
      id, name: `Ders ${prev.length + 1}`,
      hours: 40, pricePerHour: 4000, tutorCostPerHour: 2500, discount: 0
    }]);
  };

  const addFromCatalog = () => {
    if (!catalogPick) return;
    const item = CATALOG.find(c => c.name === catalogPick);
    if (!item) return;
    const id = nextId("c", detailCourses);
    setDetailCourses(prev => [...prev, { id, ...item, discount: 0 }]);
    setCatalogPick("");
  };

  const removeCourse = (id) => {
    if (attachRate[id] > 0) {
      if (!window.confirm(`Bu ders ${attachRate[id]} öğrenciye atanmış. Yine de silmek istiyor musunuz?`)) return;
    }
    setDetailCourses(prev => prev.filter(c => c.id !== id));
  };

  const calc = (c) => {
    const rev = c.hours * c.pricePerHour * (1 - (c.discount || 0) / 100);
    const cst = c.hours * c.tutorCostPerHour;
    return { rev, cst, margin: rev - cst };
  };

  const totals = detailCourses.reduce((acc, c) => {
    const n = attachRate[c.id] || 0;
    const x = calc(c);
    acc.totalRev += x.rev * n;
    acc.totalCst += x.cst * n;
    return acc;
  }, { totalRev: 0, totalCst: 0 });

  return (
    <>
      <DetailNav />
      <div style={S.page}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Dersler</h1>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                Her ders için saat, fiyat, eğitmen ücreti ve indirim ayarla. Atama "1. Öğrenciler" sekmesinde yapılır.
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={catalogPick} onChange={e => setCatalogPick(e.target.value)} style={S.select}>
                <option value="">— Katalogdan seç —</option>
                {CATALOG.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </select>
              <button onClick={addFromCatalog} disabled={!catalogPick} style={{
                ...S.btn,
                opacity: catalogPick ? 1 : 0.4,
                cursor: catalogPick ? "pointer" : "not-allowed"
              }}>+ Katalogdan</button>
              <button onClick={addBlank} style={S.btn}>+ Boş Ders</button>
            </div>
          </div>
        </div>

        {/* Top totals */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Toplam Ders</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{detailCourses.length}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Kurs Geliri (Atanmış)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#037A7A" }}>₺{fmt(totals.totalRev)}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Eğitmen Gideri (Atanmış)</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(totals.totalCst)}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Brüt Kurs Marjini</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: totals.totalRev - totals.totalCst >= 0 ? "#34D399" : "#F25C5C" }}>
              ₺{fmt(totals.totalRev - totals.totalCst)}
            </div>
          </div>
        </div>

        {detailCourses.length === 0 && (
          <div style={{ ...S.card, padding: 40, textAlign: "center", color: "#94A3B8" }}>
            Henüz ders eklenmemiş.
          </div>
        )}

        {/* Course table */}
        {detailCourses.length > 0 && (
          <div style={{ ...S.card, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
                  {["Ders Adı", "Saat", "Saat Ücreti (₺)", "Eğitmen ₺/saat", "İndirim %", "Kurs Fiyatı", "Eğitmen Gideri", "Marjin", "Öğrenci", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", textAlign: h === "Ders Adı" ? "left" : "right",
                      color: "#94A3B8", fontWeight: 600, fontSize: 10, textTransform: "uppercase"
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {detailCourses.map(c => {
                  const x = calc(c);
                  const n = attachRate[c.id] || 0;
                  return (
                    <tr key={c.id} style={{ borderBottom: "1px solid #1A5369" }}>
                      <td style={{ padding: "8px 12px", minWidth: 200 }}>
                        <input type="text" value={c.name}
                          onChange={e => update(c.id, { name: e.target.value })}
                          style={S.textInput} />
                      </td>
                      <td style={{ padding: "8px 8px", width: 90 }}>
                        <input type="number" min={0} value={c.hours}
                          onChange={e => update(c.id, { hours: Math.max(0, parseFloat(e.target.value) || 0) })}
                          style={S.numInput} />
                      </td>
                      <td style={{ padding: "8px 8px", width: 130 }}>
                        <input type="number" min={0} value={c.pricePerHour}
                          onChange={e => update(c.id, { pricePerHour: Math.max(0, parseFloat(e.target.value) || 0) })}
                          style={S.numInput} />
                      </td>
                      <td style={{ padding: "8px 8px", width: 130 }}>
                        <input type="number" min={0} value={c.tutorCostPerHour}
                          onChange={e => update(c.id, { tutorCostPerHour: Math.max(0, parseFloat(e.target.value) || 0) })}
                          style={S.numInput} />
                      </td>
                      <td style={{ padding: "8px 8px", width: 100 }}>
                        <input type="number" min={0} max={100} value={c.discount || 0}
                          onChange={e => update(c.id, { discount: Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)) })}
                          style={S.numInput} />
                      </td>
                      <td style={{ padding: "10px 12px", color: "#037A7A", textAlign: "right", fontWeight: 700 }}>₺{fmt(x.rev)}</td>
                      <td style={{ padding: "10px 12px", color: "#F25C5C", textAlign: "right" }}>₺{fmt(x.cst)}</td>
                      <td style={{ padding: "10px 12px", color: x.margin >= 0 ? "#048C8C" : "#F25C5C", textAlign: "right", fontWeight: 700 }}>
                        ₺{fmt(x.margin)}
                      </td>
                      <td style={{ padding: "10px 12px", textAlign: "right", color: n > 0 ? "#FBBF24" : "#94A3B8", fontWeight: 700 }}>{n}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>
                        <button onClick={() => removeCourse(c.id)} style={S.btnDanger}>SİL</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ marginTop: 16, color: "#94A3B8", fontSize: 10, textAlign: "center", lineHeight: 1.8 }}>
          Marjin = Kurs Fiyatı − Eğitmen Gideri. Öğrenci sütunu bu derse atanmış öğrenci sayısı.
        </div>
      </div>
    </>
  );
}
