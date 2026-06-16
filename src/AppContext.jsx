import { createContext, useContext, useState, useEffect } from "react";

export const AppContext = createContext();

// ── Detail-mode seed data ────────────────────────────────────────────────────
const SEED_COURSES = [
  { id: "c_alm",   name: "A-Level Mathematics", hours: 40, pricePerHour: 4725, tutorCostPerHour: 3750, discount: 0 },
  { id: "c_ap_bc", name: "AP Calculus BC",      hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125, discount: 0 },
  { id: "c_alc",   name: "A-Level Chemistry",   hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125, discount: 0 },
  { id: "c_alp",   name: "A-Level Physics",     hours: 40, pricePerHour: 4500, tutorCostPerHour: 3125, discount: 0 },
  { id: "c_sat_m", name: "SAT Math",            hours: 30, pricePerHour: 3150, tutorCostPerHour: 2500, discount: 0 },
];

const SEED_STUDENTS = [
  { id: "s_1", name: "Öğrenci 1", courseIds: ["c_alm", "c_alc"],    numApps: 5 },
  { id: "s_2", name: "Öğrenci 2", courseIds: ["c_ap_bc", "c_alp"], numApps: 3 },
  { id: "s_3", name: "Öğrenci 3", courseIds: ["c_sat_m"],            numApps: 0 },
];

const loadJSON = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch { return fallback; }
};

export const AppProvider = ({ children }) => {
  const [numCourses, setNumCourses] = useState(3);
  const [numStudents, setNumStudents] = useState(10);
  const [hours, setHours] = useState(40);
  const [pricePerHour, setPricePerHour] = useState(4000);
  const [discount, setDiscount] = useState(10);
  const [tutorCostPerHour, setTutorCostPerHour] = useState(2000);
  
  // Danışmanlık
  const [numApps, setNumApps] = useState(5);
  const [pricePerAppUsd, setPricePerAppUsd] = useState(700);
  const [usdTry, setUsdTry] = useState(38);
  const [rateStatus, setRateStatus] = useState("loading");
  const [numConsultants, setNumConsultants] = useState(1);
  const [consultantWage, setConsultantWage] = useState(30000);
  const [payMode, setPayMode] = useState("wage");
  const [commissionPct, setCommissionPct] = useState(20);
  
  // Manager
  const [managerWage, setManagerWage] = useState(50000);

  // Detailed Fixed Costs
  const [fcKira, setFcKira] = useState(0);
  const [fcKiraStopaj, setFcKiraStopaj] = useState(0);
  const [fcDamga, setFcDamga] = useState(1872); // One-off / Annual
  const [fcSmmm, setFcSmmm] = useState(5704);
  const [fcSmmmStopaj, setFcSmmmStopaj] = useState(0);
  const [fcIto, setFcIto] = useState(5220); // One-off / Annual
  const [fcNoter, setFcNoter] = useState(988); // One-off / Annual
  const [fcWeb, setFcWeb] = useState(600);
  const [fcY, setFcY] = useState(0);
  const [fcKredi, setFcKredi] = useState(0);
  const [fcKurulus, setFcKurulus] = useState(14990); // One-off / Annual
  const [fcBagkur, setFcBagkur] = useState(1808);

  // ── Detail mode (per-student/per-course) ──────────────────────────────────
  const [detailCourses, setDetailCourses] = useState(() => loadJSON("lp_detail_courses", SEED_COURSES));
  const [detailStudents, setDetailStudents] = useState(() => loadJSON("lp_detail_students", SEED_STUDENTS));

  useEffect(() => {
    localStorage.setItem("lp_detail_courses", JSON.stringify(detailCourses));
  }, [detailCourses]);

  useEffect(() => {
    localStorage.setItem("lp_detail_students", JSON.stringify(detailStudents));
  }, [detailStudents]);

  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then(res => res.json())
      .then(data => {
        if (data?.rates?.TRY) {
          setUsdTry(Math.round(data.rates.TRY * 100) / 100);
          setRateStatus("live");
        } else setRateStatus("manual");
      })
      .catch(() => setRateStatus("manual"));
  }, []);

  const totalMonthlyFc = fcKira + fcKiraStopaj + fcSmmm + fcSmmmStopaj + fcWeb + fcY + fcKredi + fcBagkur;
  const totalAnnualOneOffFc = fcDamga + fcIto + fcNoter + fcKurulus;
  const fc = (totalMonthlyFc * 12) + totalAnnualOneOffFc;

  const value = {
    numCourses, setNumCourses,
    numStudents, setNumStudents,
    hours, setHours,
    pricePerHour, setPricePerHour,
    discount, setDiscount,
    tutorCostPerHour, setTutorCostPerHour,
    numApps, setNumApps,
    pricePerAppUsd, setPricePerAppUsd,
    usdTry, setUsdTry,
    rateStatus, setRateStatus,
    numConsultants, setNumConsultants,
    consultantWage, setConsultantWage,
    payMode, setPayMode,
    commissionPct, setCommissionPct,
    managerWage, setManagerWage,
    // Detailed FC
    fcKira, setFcKira,
    fcKiraStopaj, setFcKiraStopaj,
    fcDamga, setFcDamga,
    fcSmmm, setFcSmmm,
    fcSmmmStopaj, setFcSmmmStopaj,
    fcIto, setFcIto,
    fcNoter, setFcNoter,
    fcWeb, setFcWeb,
    fcY, setFcY,
    fcKredi, setFcKredi,
    fcKurulus, setFcKurulus,
    fcBagkur, setFcBagkur,
    // Derived aggregates
    fc,
    totalMonthlyFc,
    totalAnnualOneOffFc,
    // Detail mode
    detailCourses, setDetailCourses,
    detailStudents, setDetailStudents,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
