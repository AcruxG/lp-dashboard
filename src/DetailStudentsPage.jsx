import { useMemo } from "react";
import { useAppContext } from "./AppContext";
import DetailNav from "./DetailNav";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "24px 32px" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  input: {
    background: "transparent", border: "none", borderBottom: "1px solid #14465B",
    color: "#FFFFFF", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", padding: "4px 0", width: "100%",
  },
  numInput: {
    background: "#060A0D", border: "1px solid #14465B", borderRadius: 6,
    color: "#FFFFFF", fontSize: 14, fontWeight: 600, outline: "none", fontFamily: "inherit", padding: "6px 10px", width: 80,
  },
  btn: {
    background: "#048C8C", color: "#FFFFFF", border: "none",
    padding: "8px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer",
    borderRadius: 6, fontFamily: "inherit",
  },
  btnSecondary: {
    background: "transparent", color: "#94A3B8", border: "1px solid #14465B",
    padding: "6px 12px", fontSize: 11, fontWeight: 600, cursor: "pointer",
    borderRadius: 6, fontFamily: "inherit",
  },
  btnDanger: {
    background: "transparent", color: "#F25C5C", border: "1px solid #F25C5C33",
    padding: "4px 10px", fontSize: 10, fontWeight: 600, cursor: "pointer",
    borderRadius: 6, fontFamily: "inherit",
  },
  chip: (active) => ({
    padding: "6px 12px",
    fontSize: 11, fontWeight: 600, cursor: "pointer",
    border: active ? "1px solid #048C8C" : "1px solid #14465B",
    background: active ? "#048C8C22" : "transparent",
    color: active ? "#34D399" : "#94A3B8",
    borderRadius: 16, fontFamily: "inherit",
    transition: "all 0.15s ease",
  }),
};

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));

const nextId = (prefix, existing) => {
  const nums = existing
    .map(x => parseInt((x.id || "").replace(`${prefix}_`, ""), 10))
    .filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}_${max + 1}`;
};

export default function DetailStudentsPage() {
  const {
    detailStudents, setDetailStudents,
    detailCourses,
    pricePerAppUsd, usdTry,
    kocLukPricePerHour, kocLukTutorCostPerHour,
  } = useAppContext();

  const pricePerAppTl = Math.round(pricePerAppUsd * usdTry);

  const courseMap = useMemo(() => {
    const m = {};
    detailCourses.forEach(c => { m[c.id] = c; });
    return m;
  }, [detailCourses]);

  const calcStudent = (s) => {
    let rev = 0, cst = 0;
    s.courseIds.forEach(cid => {
      const c = courseMap[cid];
      if (!c) return;
      rev += c.hours * c.pricePerHour * (1 - (c.discount || 0) / 100);
      cst += c.hours * c.tutorCostPerHour;
    });
    const apps = s.numApps || 0;
    const appsRev = apps * pricePerAppTl;
    const kocH = s.kocLukHours || 0;
    const kocRev = kocH * kocLukPricePerHour;
    const kocCst = kocH * kocLukTutorCostPerHour;
    return {
      rev, cst, courseMargin: rev - cst,
      appsRev,
      kocH, kocRev, kocCst, kocMargin: kocRev - kocCst,
      totalRev: rev + appsRev + kocRev,
    };
  };

  const update = (id, patch) => {
    setDetailStudents(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  };

  const toggleCourse = (sid, cid) => {
    setDetailStudents(prev => prev.map(s => {
      if (s.id !== sid) return s;
      const has = s.courseIds.includes(cid);
      return { ...s, courseIds: has ? s.courseIds.filter(x => x !== cid) : [...s.courseIds, cid] };
    }));
  };

  const addStudent = () => {
    const id = nextId("s", detailStudents);
    setDetailStudents(prev => [...prev, {
      id, name: `Öğrenci ${prev.length + 1}`, courseIds: [], numApps: 0, kocLukHours: 0
    }]);
  };

  const removeStudent = (id) => {
    setDetailStudents(prev => prev.filter(s => s.id !== id));
  };

  const totals = detailStudents.reduce((acc, s) => {
    const x = calcStudent(s);
    acc.courseRev += x.rev;
    acc.courseCst += x.cst;
    acc.appsRev += x.appsRev;
    acc.kocRev += x.kocRev;
    acc.totalRev += x.totalRev;
    return acc;
  }, { courseRev: 0, courseCst: 0, appsRev: 0, kocRev: 0, totalRev: 0 });

  return (
    <>
      <DetailNav />
      <div style={S.page}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
            <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2 }} />
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Öğrenciler ve Ders Atamaları</h1>
              <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
                Her öğrenciye isim ver, aldığı dersleri seç, danışmanlık başvuru sayısını gir.
              </div>
            </div>
            <button onClick={addStudent} style={S.btn}>+ Öğrenci Ekle</button>
          </div>
        </div>

        {/* Top totals */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 20 }}>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Toplam Öğrenci</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#FFFFFF" }}>{detailStudents.length}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Kurs Geliri</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#037A7A" }}>₺{fmt(totals.courseRev)}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Koçluk Geliri</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#8B5CF6" }}>₺{fmt(totals.kocRev)}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Danışmanlık Geliri</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#02A6A6" }}>₺{fmt(totals.appsRev)}</div>
          </div>
          <div style={{ ...S.card, padding: 14 }}>
            <div style={S.label}>Toplam Gelir</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: "#34D399" }}>₺{fmt(totals.totalRev)}</div>
          </div>
        </div>

        {detailStudents.length === 0 && (
          <div style={{ ...S.card, padding: 40, textAlign: "center", color: "#94A3B8" }}>
            Henüz öğrenci eklenmemiş. "+ Öğrenci Ekle" ile başla.
          </div>
        )}

        {detailStudents.map(s => {
          const calc = calcStudent(s);
          return (
            <div key={s.id} style={{ ...S.card, padding: 18, marginBottom: 14 }}>
              {/* Row 1: name + koçluk hours + apps + delete */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 180px 80px", gap: 14, alignItems: "end", marginBottom: 14 }}>
                <div>
                  <div style={S.label}>İsim</div>
                  <input type="text" value={s.name}
                    onChange={e => update(s.id, { name: e.target.value })}
                    style={S.input} />
                </div>
                <div>
                  <div style={S.label}>Koçluk Saati</div>
                  <input type="number" min={0} value={s.kocLukHours || 0}
                    onChange={e => update(s.id, { kocLukHours: Math.max(0, parseFloat(e.target.value) || 0) })}
                    style={S.numInput} />
                  <span style={{ fontSize: 10, color: "#8B5CF6", marginLeft: 8 }}>
                    ₺{fmt(calc.kocRev)}
                  </span>
                </div>
                <div>
                  <div style={S.label}>Danışmanlık Başvuru Sayısı</div>
                  <input type="number" min={0} value={s.numApps || 0}
                    onChange={e => update(s.id, { numApps: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                    style={S.numInput} />
                  <span style={{ fontSize: 10, color: "#94A3B8", marginLeft: 8 }}>
                    ₺{fmt(calc.appsRev)}
                  </span>
                </div>
                <button onClick={() => removeStudent(s.id)} style={S.btnDanger}>SİL</button>
              </div>

              {/* Row 2: course chips */}
              <div>
                <div style={S.label}>Dersler ({s.courseIds.length} seçili)</div>
                {detailCourses.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#F25C5C", padding: "6px 0" }}>
                    Henüz ders tanımlanmamış. "2. Dersler" sekmesinden ekle.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                    {detailCourses.map(c => (
                      <button
                        key={c.id}
                        onClick={() => toggleCourse(s.id, c.id)}
                        style={S.chip(s.courseIds.includes(c.id))}>
                        {c.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 3: summary */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginTop: 14, paddingTop: 14, borderTop: "1px solid #14465B" }}>
                <div>
                  <div style={S.label}>Kurs Geliri</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#037A7A" }}>₺{fmt(calc.rev)}</div>
                </div>
                <div>
                  <div style={S.label}>Eğt. Gideri</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#F25C5C" }}>₺{fmt(calc.cst)}</div>
                </div>
                <div>
                  <div style={S.label}>Kurs Marjini</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: calc.courseMargin >= 0 ? "#048C8C" : "#F25C5C" }}>
                    ₺{fmt(calc.courseMargin)}
                  </div>
                </div>
                <div>
                  <div style={S.label}>Koçluk Marjini</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: calc.kocMargin >= 0 ? "#8B5CF6" : "#F25C5C" }}>
                    ₺{fmt(calc.kocMargin)}
                  </div>
                </div>
                <div>
                  <div style={S.label}>Toplam Gelir</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#34D399" }}>₺{fmt(calc.totalRev)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
