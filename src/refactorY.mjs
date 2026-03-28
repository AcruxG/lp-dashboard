import fs from 'fs';

let code = fs.readFileSync('src/YearlyModel.jsx', 'utf8');

// 1. Add context import
code = code.replace(
  'import { useState, useMemo, useEffect } from "react";',
  'import { useState, useMemo, useEffect } from "react";\nimport { useAppContext } from "./AppContext";'
);

// 2. Remove internal state definitions
const stateRegex = /export default function App\(\) \{[\s\S]*?const \[managerWage, setManagerWage\] = useState.*?;\n/m;
code = code.replace(stateRegex, 
  'export default function YearlyModel() {\n' +
  '  const { numCourses, setNumCourses, numStudents, setNumStudents, hours, setHours, pricePerHour, setPricePerHour, discount, setDiscount, tutorCostPerHour, setTutorCostPerHour, numApps, setNumApps, pricePerAppUsd, setPricePerAppUsd, usdTry, setUsdTry, rateStatus, setRateStatus, numConsultants, setNumConsultants, consultantWage, setConsultantWage, payMode, setPayMode, commissionPct, setCommissionPct, managerWage, setManagerWage, fcKira, setFcKira, fcKiraStopaj, setFcKiraStopaj, fcDamga, setFcDamga, fcSmmm, setFcSmmm, fcSmmmStopaj, setFcSmmmStopaj, fcIto, setFcIto, fcNoter, setFcNoter, fcWeb, setFcWeb, fcY, setFcY, fcKredi, setFcKredi, fcKurulus, setFcKurulus, fcBagkur, setFcBagkur, fc, totalMonthlyFc, totalAnnualOneOffFc } = useAppContext();\n'
);

// 3. Remove useEffect for fetch rate
code = code.replace(/\s*\/\/ Fetch live USD[\s\S]*?\}, \[\]\);\n/m, '');

// 4. Modify 1. Kurum Ayarları grid and insert FC details
const oldFcCard = /\s*\{\/\* Fixed costs \*\/\}[\s\S]*?\{\/\* Manager wage \*\/\}/;
code = code.replace(oldFcCard, '\n        {/* Manager wage */}');

const gridStart = '<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>';
const gridStartNew = '<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>';
code = code.replace(gridStart, gridStartNew);

const newFcHtml = `
      {/* ── 1.1 Sabit Giderler (FC) ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 18, fontWeight: 700, color: "#FFFFFF", marginBottom: 16, marginTop: 40, borderBottom: "1px solid #14465B", paddingBottom: 10 }}>
        1.1 Sabit Gider Detayları (Aylık & Yıllık)
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Kira (Aylık)</div><input type="number" value={fcKira} onChange={e => setFcKira(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Kira Stop. (Aylık)</div><input type="number" value={fcKiraStopaj} onChange={e => setFcKiraStopaj(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>SMMM (Aylık)</div><input type="number" value={fcSmmm} onChange={e => setFcSmmm(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>SMMM Stop. (Aylık)</div><input type="number" value={fcSmmmStopaj} onChange={e => setFcSmmmStopaj(+e.target.value)} style={S.input} /></div>
        
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Web Sitesi (Aylık)</div><input type="number" value={fcWeb} onChange={e => setFcWeb(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Sabit Gider Y (Aylık)</div><input type="number" value={fcY} onChange={e => setFcY(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Kredi (Aylık)</div><input type="number" value={fcKredi} onChange={e => setFcKredi(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Bağkur (Aylık)</div><input type="number" value={fcBagkur} onChange={e => setFcBagkur(+e.target.value)} style={S.input} /></div>
        
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Damga Verg. (Yıllık)</div><input type="number" value={fcDamga} onChange={e => setFcDamga(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>İTO Aidatı (Yıllık)</div><input type="number" value={fcIto} onChange={e => setFcIto(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Noter Tasdik (Yıllık)</div><input type="number" value={fcNoter} onChange={e => setFcNoter(+e.target.value)} style={S.input} /></div>
        <div style={{ ...S.card, padding: 16 }}><div style={S.label}>Kuruluş İşlem (Yıllık)</div><input type="number" value={fcKurulus} onChange={e => setFcKurulus(+e.target.value)} style={S.input} /></div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Aylık Toplam Sabit Gider (FC)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#FFFFFF" }}>₺{new Intl.NumberFormat("tr-TR").format(totalMonthlyFc)}</div>
        </div>
        <div style={{ ...S.card, padding: 20 }}>
          <div style={S.label}>Yıllık Toplam Sabit Gider (FC - Yönetici Hariç)</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: "#F25C5C" }}>₺{new Intl.NumberFormat("tr-TR").format(fc)}</div>
        </div>
      </div>
`;
// Insert new sections after the first manager wage card grid closes
code = code.replace(/(<div style=\{\{ fontSize: 10, color: "#94A3B8"(?:[\s\S]*?)<\/div>\s*<\/div>\s*<\/div>)/, "$1\n" + newFcHtml);

// 5. App.jsx wrapper needs AppProvider check. We wrote App.jsx in previous tools correctly.

fs.writeFileSync('src/YearlyModel.jsx', code);
console.log('Refactor complete.');
