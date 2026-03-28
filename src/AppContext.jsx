import { createContext, useContext, useState, useEffect } from "react";

export const AppContext = createContext();

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
    totalAnnualOneOffFc
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => useContext(AppContext);
