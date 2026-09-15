import { useEffect, useMemo, useRef, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ReferenceLine, ResponsiveContainer
} from "recharts";
import {
  GROUP_COURSES, GROUP_DEFAULTS, STUDENT_OPTIONS, calcGroupSale, calcMaxDiscount
} from "./groupLessonsModel";

const S = {
  page: { background: "#060A0D", color: "#F1F5F9", minHeight: "100vh", fontFamily: "'IBM Plex Mono', 'Cascadia Code', monospace", padding: "24px clamp(12px, 3vw, 32px)" },
  card: { background: "#0B202B", border: "1px solid #14465B", borderRadius: 10 },
  label: { fontSize: 10, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 },
  hint: { fontSize: 10, color: "#94A3B8", marginTop: 6 },
  sectionTitle: { fontSize: 16, fontWeight: 700, color: "#FFFFFF", marginTop: 32, marginBottom: 14, borderBottom: "1px solid #14465B", paddingBottom: 8 },
  select: { width: "100%", background: "#060A0D", border: "1px solid #14465B", borderRadius: 6, color: "#FFFFFF", fontSize: 14, fontWeight: 600, fontFamily: "inherit", padding: "10px 12px", outline: "none", colorScheme: "dark" },
  numInput: { width: "100%", background: "#060A0D", border: "1px solid #14465B", borderRadius: 6, color: "#FFFFFF", fontSize: 15, fontWeight: 700, fontFamily: "inherit", padding: "8px 10px", outline: "none" },
  toggle: active => ({
    flex: 1, padding: "10px 0", fontSize: 15, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", borderRadius: 6,
    border: active ? "1px solid #048C8C" : "1px solid #14465B",
    background: active ? "#048C8C" : "transparent",
    color: active ? "#FFFFFF" : "#94A3B8",
  }),
  btn: { background: "transparent", border: "1px solid #14465B", color: "#CBD5E1", padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer", borderRadius: 6, fontFamily: "inherit" },
  chip: color => ({ fontSize: 11, padding: "4px 10px", borderRadius: 12, border: `1px solid ${color}44`, background: `${color}14`, color }),
  th: { padding: "10px 12px", textAlign: "right", color: "#94A3B8", fontWeight: 600, fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap" },
  td: { padding: "9px 12px", textAlign: "right", whiteSpace: "nowrap" },
};

const CAT_COLORS = { SAT: "#FBBF24", AP: "#38BDF8", IMAT: "#C084FC" };
const N_COLORS = { 3: "#38BDF8", 4: "#34D399", 5: "#C084FC" };
const CATEGORIES = [...new Set(GROUP_COURSES.map(c => c.category))];

const DEFAULT_SETTINGS = {
  vatRatePct: GROUP_DEFAULTS.vatRatePct,
  extraPerStudentPerLesson: GROUP_DEFAULTS.extraPerStudentPerLesson,
  minMarginPct: GROUP_DEFAULTS.minMarginPct,
  maxDiscountCapPct: GROUP_DEFAULTS.maxDiscountCapPct,
};

const fmt = v => new Intl.NumberFormat("tr-TR").format(Math.round(v));
const fmtPct = v => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v);
const fmtPlain = v => new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 4, useGrouping: false }).format(v);
const fmtRate = v => new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
const fmtK = v => {
  const a = Math.abs(v), s = v < 0 ? "-" : "";
  return a >= 1_000_000 ? `${s}${(a / 1_000_000).toFixed(1)}M` : a >= 1000 ? `${s}${Math.round(a / 1000)}K` : `${s}${Math.round(a)}`;
};
const money = sym => v => { const r = Math.round(v); return `${r < 0 ? "−" : ""}${sym}${fmt(Math.abs(r))}`; };
const tl = money("₺");
const eur = money("€");
const pct = v => `${v < -0.05 ? "−" : ""}%${fmtPct(Math.abs(v))}`;
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const parseDec = t => parseFloat(String(t).replace(/\s/g, "").replace(",", "."));
const parseTl = t => parseFloat(String(t).replace(/[\s.₺]/g, "").replace(",", "."));

// Yazarken imleç zıplamasın diye metni taslakta tutar. commitOnBlur: değer Enter / odak kaybında işlenir.
function NumberField({ value, onValue, display, parse = parseDec, commitOnBlur = false, ...props }) {
  const [draft, setDraft] = useState(null);
  const commit = text => { const v = parse(text); if (Number.isFinite(v)) onValue(v); };
  return (
    <input
      type="text"
      inputMode="decimal"
      {...props}
      value={draft ?? display(value)}
      onFocus={e => e.target.select()}
      onChange={e => { setDraft(e.target.value); if (!commitOnBlur) commit(e.target.value); }}
      onBlur={() => { if (draft !== null && commitOnBlur) commit(draft); setDraft(null); }}
      onKeyDown={e => { if (e.key === "Enter") e.currentTarget.blur(); }}
    />
  );
}

function DiscountBar({ discountPct, maxDiscountPct, ok }) {
  const maxAlign = maxDiscountPct > 85 ? "translateX(-100%)" : maxDiscountPct < 12 ? "none" : "translateX(-50%)";
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ position: "relative", height: 10, borderRadius: 5, background: "#F25C5C33" }}>
        <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${maxDiscountPct}%`, borderRadius: 5, background: "#34D39966" }} />
        <div style={{
          position: "absolute", left: `${clamp(discountPct, 0, 100)}%`, top: -5, width: 4, height: 20, marginLeft: -2,
          borderRadius: 2, background: ok ? "#FFFFFF" : "#F25C5C", boxShadow: "0 0 0 2px #0B202B"
        }} />
      </div>
      <div style={{ position: "relative", height: 16, marginTop: 8, fontSize: 10, color: "#94A3B8" }}>
        {maxDiscountPct >= 12 && <span style={{ position: "absolute", left: 0 }}>%0</span>}
        <span style={{ position: "absolute", left: `${maxDiscountPct}%`, transform: maxAlign, color: "#34D399", whiteSpace: "nowrap", fontWeight: 700 }}>
          maks %{fmtPct(maxDiscountPct)}
        </span>
        {maxDiscountPct <= 85 && <span style={{ position: "absolute", right: 0 }}>%100</span>}
      </div>
    </div>
  );
}

export default function GroupLessonsPage() {
  const [courseId, setCourseId] = useState("ap-calc");
  const [students, setStudents] = useState(STUDENT_OPTIONS[0]);
  const [discountPct, setDiscountPct] = useState(0);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [liveEur, setLiveEur] = useState(null);
  const [manualEur, setManualEur] = useState(null);
  const [rateFetch, setRateFetch] = useState("loading");
  const calcRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    fetch("https://api.exchangerate-api.com/v4/latest/EUR")
      .then(res => res.json())
      .then(data => {
        if (cancelled) return;
        if (data?.rates?.TRY) { setLiveEur(Math.round(data.rates.TRY * 10000) / 10000); setRateFetch("live"); }
        else setRateFetch("failed");
      })
      .catch(() => { if (!cancelled) setRateFetch("failed"); });
    return () => { cancelled = true; };
  }, []);

  const eurTry = manualEur ?? liveEur ?? GROUP_DEFAULTS.eurTryFallback;
  const rateStatus = manualEur != null ? ["MANUEL", "#94A3B8"]
    : liveEur != null ? ["CANLI", "#34D399"]
    : rateFetch === "loading" ? ["YÜKLENİYOR", "#94A3B8"] : ["EXCEL KURU", "#FBBF24"];
  const settingsChanged = manualEur != null || Object.keys(DEFAULT_SETTINGS).some(k => settings[k] !== DEFAULT_SETTINGS[k]);
  const setSetting = (key, lo, hi) => v => setSettings(prev => ({ ...prev, [key]: clamp(v, lo, hi) }));

  const course = GROUP_COURSES.find(c => c.id === courseId) ?? GROUP_COURSES[0];
  const sale = calcGroupSale(course, { ...settings, eurTry, students, discountPct });
  const limit = calcMaxDiscount(course, { ...settings, students });
  const ok = !limit.listBelowFloor && discountPct <= limit.maxDiscountPct + 1e-9;
  const keepColor = sale.keep >= 0 ? "#34D399" : "#F25C5C";

  const ruleSummary = [
    settings.minMarginPct > 0 ? `min. %${fmtPct(settings.minMarginPct)} marj` : "başa baş",
    settings.maxDiscountCapPct < 100 ? `tavan %${fmtPct(settings.maxDiscountCapPct)}` : null,
  ].filter(Boolean).join(" · ");
  const limitReason = limit.limitedByCap ? `yönetim tavanı %${fmtPct(settings.maxDiscountCapPct)}`
    : settings.minMarginPct > 0 ? `min. %${fmtPct(settings.minMarginPct)} marj korunarak` : "başa baş · bize kalan ≥ ₺0";

  let status;
  if (limit.listBelowFloor) {
    status = {
      color: "#F25C5C", title: "✗ Liste fiyatı bu grup büyüklüğünde yetersiz",
      detail: `İndirim yapılamaz — öğrenci başı en az ${tl(limit.floorPricePerStudent)} olmalı.`,
    };
  } else if (ok) {
    const room = limit.maxDiscountPct - discountPct;
    status = room < 0.05
      ? { color: "#FBBF24", title: "✓ Taban fiyattasınız", detail: "Bu fiyattan daha fazla indirim yapılamaz." }
      : { color: "#34D399", title: "✓ İndirim uygun", detail: `Maks indirime %${fmtPct(room)} kaldı · öğrenci başı ${tl(sale.pricePerStudent - limit.floorPricePerStudent)} daha inilebilir.` };
  } else {
    status = {
      color: "#F25C5C", title: `✗ Maks indirimi %${fmtPct(discountPct - limit.maxDiscountPct)} aşıyor`,
      detail: `Öğrenci başı en az ${tl(limit.floorPricePerStudent)} olmalı${sale.keep < 0 ? ` · bu fiyatta şirket ${tl(-sale.keep)} zarar eder` : ""}.`,
    };
  }

  const chartData = useMemo(() => {
    const c = GROUP_COURSES.find(x => x.id === courseId) ?? GROUP_COURSES[0];
    return Array.from({ length: 51 }, (_, i) => {
      const row = { d: i * 2 };
      for (const n of STUDENT_OPTIONS) row[`n${n}`] = Math.round(calcGroupSale(c, { ...settings, eurTry: 0, students: n, discountPct: i * 2 }).keep);
      return row;
    });
  }, [courseId, settings]);

  const maxRows = useMemo(() => GROUP_COURSES.map(c => ({
    course: c,
    byN: Object.fromEntries(STUDENT_OPTIONS.map(n => [n, calcMaxDiscount(c, { ...settings, students: n })])),
  })), [settings]);

  const analysisRows = useMemo(
    () => GROUP_COURSES.map(c => ({ course: c, sale: calcGroupSale(c, { ...settings, eurTry, students, discountPct }) })),
    [settings, eurTry, students, discountPct]
  );
  const totals = analysisRows.reduce((a, { course: c, sale: s }) => ({
    lessons: a.lessons + c.lessons,
    grossTotal: a.grossTotal + s.grossTotal,
    tutorTotal: a.tutorTotal + s.tutorTotal,
    profitPreVat: a.profitPreVat + s.profitPreVat,
    vatAmount: a.vatAmount + s.vatAmount,
    netRevenue: a.netRevenue + s.netRevenue,
    keep: a.keep + s.keep,
    grossTotalEur: a.grossTotalEur + s.grossTotalEur,
    keepEur: a.keepEur + s.keepEur,
  }), { lessons: 0, grossTotal: 0, tutorTotal: 0, profitPreVat: 0, vatAmount: 0, netRevenue: 0, keep: 0, grossTotalEur: 0, keepEur: 0 });

  const openInCalculator = id => {
    setCourseId(id);
    calcRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const breakdown = [
    { k: "Ders miktarı", v: `${course.lessons} ders` },
    { k: "Öğrenci sayısı", v: `${students} öğrenci` },
    { k: "Liste ders satışı (öğrenci başı, KDV dahil)", v: tl(course.pricePerLesson) },
    ...(discountPct > 0 ? [{ k: `İndirimli ders satışı (%${fmtPct(discountPct)})`, v: tl(sale.pricePerLesson), col: "#38BDF8" }] : []),
    { k: "Ders başı maliyet (hoca, baz)", v: tl(course.costPerLesson), sep: true },
    { k: `Hocaya ekstra (${students} öğr. × ${tl(settings.extraPerStudentPerLesson)})`, v: tl(students * settings.extraPerStudentPerLesson) },
    { k: "Hocaya ders başı ödeme", v: tl(sale.tutorPerLesson) },
    { k: "Toplam hoca ödemesi", v: tl(sale.tutorTotal), col: "#F25C5C" },
    { k: "Toplam miktar (KDV dahil)", v: tl(sale.grossTotal), col: "#38BDF8", sep: true },
    { k: `KDV (%${fmtPlain(settings.vatRatePct)})`, v: tl(sale.vatAmount), col: "#FBBF24" },
    { k: "KDV sonrası bize kalan", v: tl(sale.keep), col: keepColor, bold: true },
    { k: "Toplam miktar (€)", v: eur(sale.grossTotalEur), sep: true },
    { k: "KDV sonrası bize kalan (€)", v: eur(sale.keepEur), col: keepColor },
  ];

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 4, height: 36, background: "#048C8C", borderRadius: 2, flexShrink: 0 }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>Grup Dersleri</h1>
          <div style={{ fontSize: 11, color: "#94A3B8", marginTop: 2 }}>
            Satış hesaplayıcı · maks indirim · ders bazlı kârlılık
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginTop: 14 }}>
        <span style={S.chip("#CBD5E1")}>KDV %{fmtPlain(settings.vatRatePct)}</span>
        <span style={S.chip("#CBD5E1")}>Hoca ekstra {tl(settings.extraPerStudentPerLesson)} / öğr. / ders</span>
        <span style={S.chip("#CBD5E1")}>
          1 € = ₺{fmtRate(eurTry)}{" "}
          <span style={{ color: rateStatus[1], fontSize: 9, fontWeight: 700 }}>● {rateStatus[0]}</span>
        </span>
        <span style={S.chip("#34D399")}>Maks indirim: {ruleSummary}</span>
        {settingsChanged && <span style={S.chip("#FBBF24")}>Varsayılandan farklı</span>}
        <button style={{ ...S.btn, marginLeft: "auto" }} onClick={() => setSettingsOpen(o => !o)} aria-expanded={settingsOpen}>
          ⚙ Ayarlar {settingsOpen ? "▲" : "▼"}
        </button>
      </div>

      {/* Settings */}
      {settingsOpen && (
        <div style={{ ...S.card, padding: 16, marginTop: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14 }}>
          <div>
            <div style={S.label}>KDV Oranı (%)</div>
            <NumberField value={settings.vatRatePct} display={fmtPlain} commitOnBlur onValue={setSetting("vatRatePct", 0, 100)} style={S.numInput} aria-label="KDV oranı" />
          </div>
          <div>
            <div style={S.label}>Hocaya Ekstra (₺ / öğr. / ders)</div>
            <NumberField value={settings.extraPerStudentPerLesson} display={fmtPlain} commitOnBlur onValue={setSetting("extraPerStudentPerLesson", 0, 1e9)} style={S.numInput} aria-label="Öğrenci başına hocaya ekstra ücret" />
          </div>
          <div>
            <div style={S.label}>Min. Kâr Marjı (%)</div>
            <NumberField value={settings.minMarginPct} display={fmtPlain} commitOnBlur onValue={setSetting("minMarginPct", 0, 99)} style={S.numInput} aria-label="Minimum kâr marjı" />
            <div style={S.hint}>0 = başa baş · kalan ÷ KDV hariç gelir</div>
          </div>
          <div>
            <div style={S.label}>Maks İndirim Tavanı (%)</div>
            <NumberField value={settings.maxDiscountCapPct} display={fmtPlain} commitOnBlur onValue={setSetting("maxDiscountCapPct", 0, 100)} style={S.numInput} aria-label="Maksimum indirim tavanı" />
            <div style={S.hint}>100 = tavan yok</div>
          </div>
          <div>
            <div style={S.label}>1 € = ₺ <span style={{ color: rateStatus[1] }}>● {rateStatus[0]}</span></div>
            <NumberField value={eurTry} display={fmtPlain} commitOnBlur onValue={v => { if (v > 0) setManualEur(v); }} style={S.numInput} aria-label="Euro kuru" />
            {manualEur != null && liveEur != null && (
              <button style={{ ...S.btn, marginTop: 6 }} onClick={() => setManualEur(null)}>Canlı kura dön</button>
            )}
          </div>
          <div style={{ gridColumn: "1 / -1", display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
            <span style={S.hint}>Değişiklikler yalnızca bu oturumda geçerli; sayfa yenilenince resmi değerlere döner.</span>
            <button style={{ ...S.btn, opacity: settingsChanged ? 1 : 0.4 }} disabled={!settingsChanged}
              onClick={() => { setSettings(DEFAULT_SETTINGS); setManualEur(null); }}>
              Varsayılanlara dön
            </button>
          </div>
        </div>
      )}

      {/* Calculator inputs */}
      <div ref={calcRef} style={{ scrollMarginTop: 16 }}>
        <div style={S.sectionTitle}>Satış Hesaplayıcı</div>
      </div>
      <div style={{ ...S.card, padding: 18, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 18 }}>
        <div>
          <div style={S.label}>Ders</div>
          <select value={courseId} onChange={e => setCourseId(e.target.value)} style={S.select} aria-label="Ders">
            {CATEGORIES.map(cat => (
              <optgroup key={cat} label={cat}>
                {GROUP_COURSES.filter(c => c.category === cat).map(c => (
                  <option key={c.id} value={c.id}>{c.name} · {c.lessons} ders</option>
                ))}
              </optgroup>
            ))}
          </select>
          <div style={S.hint}>
            Liste {tl(course.pricePerLesson)} / ders / öğrenci ·{" "}
            <a href={course.source} target="_blank" rel="noopener noreferrer" style={{ color: "#38BDF8" }}>site ↗</a>
          </div>
        </div>

        <div>
          <div style={S.label}>Öğrenci Sayısı</div>
          <div style={{ display: "flex", gap: 8 }}>
            {STUDENT_OPTIONS.map(n => (
              <button key={n} onClick={() => setStudents(n)} style={S.toggle(students === n)} aria-pressed={students === n}>{n}</button>
            ))}
          </div>
          <div style={S.hint}>Sınıf mevcudu {STUDENT_OPTIONS[0]}–{STUDENT_OPTIONS[STUDENT_OPTIONS.length - 1]} kişi</div>
        </div>

        <div>
          <div style={S.label}>İndirim</div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input type="range" min={0} max={100} step={0.5} value={discountPct}
              onChange={e => setDiscountPct(+e.target.value)}
              style={{ flex: 1, minWidth: 0, accentColor: ok ? "#34D399" : "#F25C5C", cursor: "pointer" }}
              aria-label="İndirim yüzdesi kaydırıcı" />
            <div style={{ position: "relative", width: 92, flexShrink: 0 }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#94A3B8", fontSize: 14, pointerEvents: "none" }}>%</span>
              <NumberField value={discountPct} display={fmtPct} onValue={v => setDiscountPct(clamp(v, 0, 100))}
                style={{ ...S.numInput, paddingLeft: 26, color: ok ? "#FFFFFF" : "#F25C5C" }} aria-label="İndirim yüzdesi" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
            <button style={S.btn} onClick={() => setDiscountPct(0)}>Sıfırla</button>
            <button style={{ ...S.btn, color: "#34D399", borderColor: "#34D39955", opacity: limit.listBelowFloor ? 0.4 : 1 }}
              disabled={limit.listBelowFloor} onClick={() => setDiscountPct(limit.maxDiscountPct)}>
              Maks indirimi uygula
            </button>
          </div>
        </div>

        <div>
          <div style={S.label}>Öğrenci Başı Teklif (₺, KDV dahil)</div>
          <NumberField value={sale.pricePerStudent} display={fmt} parse={parseTl} commitOnBlur
            onValue={v => setDiscountPct(clamp((1 - v / sale.listPricePerStudent) * 100, 0, 100))}
            style={{ ...S.numInput, color: ok ? "#FFFFFF" : "#F25C5C" }} aria-label="Öğrenci başı teklif fiyatı" />
          <div style={S.hint}>Liste {tl(sale.listPricePerStudent)} · taban {tl(limit.floorPricePerStudent)}</div>
        </div>
      </div>

      {/* Status */}
      <div style={{ ...S.card, padding: "14px 18px", marginTop: 14, borderColor: `${status.color}66`, background: `linear-gradient(135deg, ${status.color}14 0%, #0B202B 70%)` }} role="status">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: status.color }}>{status.title}</div>
          <div style={{ fontSize: 11, color: "#CBD5E1" }}>{status.detail}</div>
        </div>
        <DiscountBar discountPct={discountPct} maxDiscountPct={limit.maxDiscountPct} ok={ok} />
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginTop: 14 }}>
        <div style={{ ...S.card, padding: 16, borderTop: "4px solid #38BDF8" }}>
          <div style={S.label}>Öğrenci Başı Fiyat (KDV dahil)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#38BDF8" }}>{tl(sale.pricePerStudent)}</div>
          <div style={S.hint}>
            {discountPct > 0 && <span style={{ textDecoration: "line-through", marginRight: 6 }}>{tl(sale.listPricePerStudent)}</span>}
            {course.lessons} × {tl(sale.pricePerLesson)} · {eur(sale.pricePerStudentEur)}
          </div>
        </div>
        <div style={{ ...S.card, padding: 16, borderTop: "4px solid #048C8C" }}>
          <div style={S.label}>Grup Toplamı (KDV dahil)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>{tl(sale.grossTotal)}</div>
          <div style={S.hint}>{students} öğrenci · {eur(sale.grossTotalEur)}</div>
        </div>
        <div style={{ ...S.card, padding: 16, borderTop: `4px solid ${keepColor}` }}>
          <div style={S.label}>KDV Sonrası Bize Kalan</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: keepColor }}>{tl(sale.keep)}</div>
          <div style={S.hint}>{eur(sale.keepEur)} · marj {pct(sale.marginPct)}</div>
        </div>
        <div style={{ ...S.card, padding: 16, borderTop: "4px solid #34D399" }}>
          <div style={S.label}>Maks İndirim</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#34D399" }}>%{fmtPct(limit.maxDiscountPct)}</div>
          <div style={S.hint}>Taban {tl(limit.floorPricePerStudent)} / öğrenci · {limitReason}</div>
        </div>
      </div>

      {/* Breakdown + chart */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 340px), 1fr))", gap: 12, marginTop: 14 }}>
        <div style={{ ...S.card, padding: "16px 18px" }}>
          <div style={S.label}>Hesap Dökümü — {course.name}</div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, marginTop: 6 }}>
            <tbody>
              {breakdown.map(row => (
                <tr key={row.k} style={{ borderTop: row.sep ? "1px solid #14465B" : "none" }}>
                  <td style={{ padding: "7px 8px 7px 0", color: "#94A3B8" }}>{row.k}</td>
                  <td style={{ padding: "7px 0", textAlign: "right", whiteSpace: "nowrap", color: row.col ?? "#F1F5F9", fontWeight: row.bold ? 700 : 600, fontSize: row.bold ? 14 : 12 }}>{row.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ ...S.card, padding: "16px 12px 4px 0" }}>
          <div style={{ ...S.label, paddingLeft: 18 }}>İndirim → Bize Kalan (₺)</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 10, right: 16, bottom: 18, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#14465B" />
              <XAxis dataKey="d" type="number" domain={[0, 100]} ticks={[0, 20, 40, 60, 80, 100]}
                tickFormatter={v => `%${v}`} stroke="#94A3B8" tick={{ fontSize: 10, fill: "#CBD5E1" }}
                label={{ value: "İndirim", position: "insideBottom", offset: -10, fill: "#94A3B8", fontSize: 10 }} />
              <YAxis stroke="#94A3B8" tick={{ fontSize: 10, fill: "#CBD5E1" }} tickFormatter={v => `₺${fmtK(v)}`} width={62} />
              <Tooltip
                contentStyle={{ background: "#0B202B", borderRadius: 8, border: "1px solid #14465B", color: "#F1F5F9", fontSize: 11 }}
                labelStyle={{ color: "#94A3B8" }}
                labelFormatter={d => `%${d} indirim`}
                formatter={(v, name) => [tl(v), name]} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#CBD5E1", paddingTop: 6 }} verticalAlign="top" height={26} />
              <ReferenceLine y={0} stroke="#FBBF24" strokeDasharray="5 5" />
              <ReferenceLine x={discountPct} stroke="#F472B6" strokeDasharray="3 3" />
              {STUDENT_OPTIONS.map(n => (
                <Line key={n} type="linear" dataKey={`n${n}`} name={`${n} öğrenci`} stroke={N_COLORS[n]} dot={false}
                  strokeWidth={n === students ? 3 : 1.5} strokeOpacity={n === students ? 1 : 0.45} isAnimationActive={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Max discount table */}
      <div style={S.sectionTitle}>Maks İndirim &amp; Taban Fiyat — Tüm Dersler</div>
      <div style={{ ...S.card, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 860, borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#060A0D" }}>
              <th style={{ ...S.th, textAlign: "left" }} rowSpan={2}>Grup Programı</th>
              <th style={S.th} rowSpan={2}>Ders Miktarı</th>
              <th style={S.th} rowSpan={2}>Liste / Öğrenci</th>
              {STUDENT_OPTIONS.map(n => (
                <th key={n} colSpan={2} style={{ ...S.th, textAlign: "center", color: n === students ? N_COLORS[n] : "#94A3B8", borderLeft: "1px solid #14465B" }}>
                  {n} Öğrenci
                </th>
              ))}
            </tr>
            <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
              {STUDENT_OPTIONS.map(n => [
                <th key={`${n}m`} style={{ ...S.th, borderLeft: "1px solid #14465B" }}>Maks %</th>,
                <th key={`${n}t`} style={S.th}>Taban / Öğr.</th>,
              ])}
            </tr>
          </thead>
          <tbody>
            {maxRows.map(({ course: c, byN }) => {
              const selected = c.id === courseId;
              return (
                <tr key={c.id} tabIndex={0} title="Hesaplayıcıda aç"
                  onClick={() => openInCalculator(c.id)}
                  onKeyDown={e => { if (e.key === "Enter") openInCalculator(c.id); }}
                  style={{ borderBottom: "1px solid #14465B", cursor: "pointer", background: selected ? "#048C8C1F" : "transparent" }}>
                  <td style={{ ...S.td, textAlign: "left", color: "#FFFFFF", fontWeight: 700 }}>
                    <span style={{ color: CAT_COLORS[c.category], fontSize: 9, marginRight: 6 }}>{c.category}</span>{c.name}
                  </td>
                  <td style={{ ...S.td, color: "#CBD5E1" }}>{c.lessons}</td>
                  <td style={{ ...S.td, color: "#38BDF8" }}>{tl(c.lessons * c.pricePerLesson)}</td>
                  {STUDENT_OPTIONS.map(n => {
                    const m = byN[n], active = n === students;
                    return [
                      <td key={`${n}m`} style={{ ...S.td, borderLeft: "1px solid #14465B", color: m.listBelowFloor ? "#F25C5C" : active ? "#34D399" : "#CBD5E1", fontWeight: active ? 700 : 400 }}>
                        %{fmtPct(m.maxDiscountPct)}
                      </td>,
                      <td key={`${n}t`} style={{ ...S.td, color: active ? "#FFFFFF" : "#94A3B8", fontWeight: active ? 700 : 400 }}>
                        {tl(m.floorPricePerStudent)}
                      </td>,
                    ];
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Analysis table */}
      <div style={S.sectionTitle}>
        Grup Analizi — {students} öğrenci{discountPct > 0 ? ` · %${fmtPct(discountPct)} indirim` : " · liste fiyatı"}
      </div>
      <div style={{ ...S.card, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 1080, borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr style={{ background: "#060A0D", borderBottom: "1px solid #14465B" }}>
              {["Grup Programı", "Ders Miktarı", "Öğr. Başı Fiyat", "Grup Toplamı", "Hoca Ödemesi", "Kâr (KDV Öncesi)", "KDV", "Bize Kalan", "Toplam (€)", "Bize Kalan (€)", "Marj"].map((h, i) => (
                <th key={i} style={{ ...S.th, textAlign: i === 0 ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {analysisRows.map(({ course: c, sale: s }) => {
              const col = s.keep >= 0 ? "#34D399" : "#F25C5C";
              return (
                <tr key={c.id} style={{ borderBottom: "1px solid #14465B", background: c.id === courseId ? "#048C8C1F" : "transparent" }}>
                  <td style={{ ...S.td, textAlign: "left", color: "#FFFFFF", fontWeight: 700 }}>
                    <span style={{ color: CAT_COLORS[c.category], fontSize: 9, marginRight: 6 }}>{c.category}</span>{c.name}
                    <a href={c.source} target="_blank" rel="noopener noreferrer" style={{ color: "#38BDF8", marginLeft: 6, textDecoration: "none" }} aria-label={`${c.name} sayfası`}>↗</a>
                  </td>
                  <td style={{ ...S.td, color: "#CBD5E1" }}>{c.lessons}</td>
                  <td style={{ ...S.td, color: "#38BDF8" }}>{tl(s.pricePerStudent)}</td>
                  <td style={{ ...S.td, color: "#FFFFFF" }}>{tl(s.grossTotal)}</td>
                  <td style={{ ...S.td, color: "#F25C5C" }}>{tl(s.tutorTotal)}</td>
                  <td style={{ ...S.td, color: "#CBD5E1" }}>{tl(s.profitPreVat)}</td>
                  <td style={{ ...S.td, color: "#FBBF24" }}>{tl(s.vatAmount)}</td>
                  <td style={{ ...S.td, color: col, fontWeight: 700 }}>{tl(s.keep)}</td>
                  <td style={{ ...S.td, color: "#CBD5E1" }}>{eur(s.grossTotalEur)}</td>
                  <td style={{ ...S.td, color: col }}>{eur(s.keepEur)}</td>
                  <td style={{ ...S.td, color: col }}>{pct(s.marginPct)}</td>
                </tr>
              );
            })}
            <tr style={{ background: "#060A0D", borderTop: "1px solid #048C8C" }}>
              <td style={{ ...S.td, textAlign: "left", color: "#FFFFFF", fontWeight: 700 }}>TOPLAM</td>
              <td style={{ ...S.td, color: "#FFFFFF", fontWeight: 700 }}>{totals.lessons}</td>
              <td style={S.td} />
              <td style={{ ...S.td, color: "#FFFFFF", fontWeight: 700 }}>{tl(totals.grossTotal)}</td>
              <td style={{ ...S.td, color: "#F25C5C", fontWeight: 700 }}>{tl(totals.tutorTotal)}</td>
              <td style={{ ...S.td, color: "#CBD5E1", fontWeight: 700 }}>{tl(totals.profitPreVat)}</td>
              <td style={{ ...S.td, color: "#FBBF24", fontWeight: 700 }}>{tl(totals.vatAmount)}</td>
              <td style={{ ...S.td, color: totals.keep >= 0 ? "#34D399" : "#F25C5C", fontWeight: 700 }}>{tl(totals.keep)}</td>
              <td style={{ ...S.td, color: "#CBD5E1", fontWeight: 700 }}>{eur(totals.grossTotalEur)}</td>
              <td style={{ ...S.td, color: totals.keep >= 0 ? "#34D399" : "#F25C5C", fontWeight: 700 }}>{eur(totals.keepEur)}</td>
              <td style={{ ...S.td, color: "#CBD5E1", fontWeight: 700 }}>{pct(totals.netRevenue > 0 ? (totals.keep / totals.netRevenue) * 100 : 0)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 16, color: "#94A3B8", fontSize: 10, textAlign: "center" }}>
        Kaynak: Grup_Dersi_Fiyatlama.xlsx · Tablo satırına tıklayınca ders hesaplayıcıda açılır
      </div>
    </div>
  );
}
