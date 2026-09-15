// Grup dersi fiyatlama modeli — kaynak: Grup_Dersi_Fiyatlama.xlsx
// Fiyat ve maliyetler koddan gelir; site herkese aynı değerleri gösterir.

export const GROUP_DEFAULTS = {
  vatRatePct: 20,                 // KDV oranı
  eurTryFallback: 56.1636,        // 1 € = ₺ — canlı kur alınamazsa kullanılır (Excel kuru)
  usdTryFallback: 48.64,          // 1 $ = ₺ — canlı kur alınamazsa kullanılır (15.09.2026 kuru)
  extraPerStudentPerLesson: 300,  // Öğrenci başına hocaya ekstra ücret (₺ / ders)
  minMarginPct: 0,                // Maks indirim kuralı: 0 = başa baş (bize kalan ≥ ₺0)
  maxDiscountCapPct: 100,         // Sabit indirim tavanı (100 = tavan yok)
};

export const STUDENT_RANGE = { min: 1, max: 10 };  // hesaplayıcıda denenebilecek grup büyüklüğü
export const STANDARD_STUDENTS = [3, 4, 5];         // standart sınıf mevcudu

// costPerLesson: hocaya ders başı baz ödeme · pricePerLesson: öğrenci başı ders satışı (KDV dahil)
export const GROUP_COURSES = [
  { id: "sat",         category: "SAT",  name: "SAT Grup Dersi",                          lessons: 30,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/sat-kurs" },
  { id: "ap-bio",      category: "AP",   name: "AP Biyoloji",                             lessons: 45,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-biyoloji" },
  { id: "ap-calc",     category: "AP",   name: "AP Calculus AB/BC",                       lessons: 45,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-calculus" },
  { id: "ap-gov",      category: "AP",   name: "AP Comparative Government and Politics",  lessons: 30,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-comparative-politics" },
  { id: "ap-cs",       category: "AP",   name: "AP Computer Science",                     lessons: 30,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-computer-science" },
  { id: "ap-env",      category: "AP",   name: "AP Environmental Science (Çevre Bilimi)", lessons: 40,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-cevre-bilimi" },
  { id: "ap-euh",      category: "AP",   name: "AP EU History",                           lessons: 35,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-tarih" },
  { id: "ap-phys",     category: "AP",   name: "AP Fizik",                                lessons: 40,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-fizik" },
  { id: "ap-geo",      category: "AP",   name: "AP Human Geography (Beşeri Coğrafya)",    lessons: 35,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-beseri-cografya" },
  { id: "ap-eng",      category: "AP",   name: "AP İngilizce",                            lessons: 45,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-english-language-and-literature" },
  { id: "ap-stat",     category: "AP",   name: "AP İstatistik",                           lessons: 30,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-istatistik" },
  { id: "ap-chem",     category: "AP",   name: "AP Kimya",                                lessons: 40,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-kimya" },
  { id: "ap-macro",    category: "AP",   name: "AP Makroekonomi",                         lessons: 20,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-ekonomi" },
  { id: "ap-micro",    category: "AP",   name: "AP Mikroekonomi",                         lessons: 20,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-ekonomi" },
  { id: "ap-psych",    category: "AP",   name: "AP Psikoloji",                            lessons: 35,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-psikoloji" },
  { id: "ap-ush",      category: "AP",   name: "AP US History",                           lessons: 40,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-tarih" },
  { id: "ap-world",    category: "AP",   name: "AP World History",                        lessons: 35,  costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/ap-kurs/ap-tarih" },
  { id: "imat",        category: "IMAT", name: "IMAT Grup Dersi",                         lessons: 100, costPerLesson: 2000, pricePerLesson: 3000, source: "https://veritasedu.net/kurslarimiz/imat-sinavi" },
];

// Tüm derslerde aynıysa o değer; farklıysa null (= her ders kendi resmi değeri).
export function uniformCourseValue(key) {
  const values = new Set(GROUP_COURSES.map(c => c[key]));
  return values.size === 1 ? [...values][0] : null;
}

// Sayfa ayarındaki ders maliyeti / satış fiyatı dersin resmi değerinin yerine geçer (null/undefined = resmi değer).
export function priceCourse(course, { costPerLesson, pricePerLesson } = {}) {
  return {
    ...course,
    costPerLesson: costPerLesson ?? course.costPerLesson,
    pricePerLesson: pricePerLesson ?? course.pricePerLesson,
  };
}

// Bir grup satışının tam dökümü (Excel HESAPLAYICI ile aynı mantık, üstüne indirim).
export function calcGroupSale(baseCourse, opts) {
  const { students, discountPct = 0, vatRatePct, extraPerStudentPerLesson, eurTry, usdTry } = opts;
  const course = priceCourse(baseCourse, opts);
  const vat = vatRatePct / 100;
  const pricePerLesson = course.pricePerLesson * (1 - discountPct / 100);
  const pricePerStudent = course.lessons * pricePerLesson;
  const tutorPerLesson = course.costPerLesson + students * extraPerStudentPerLesson;
  const tutorTotal = course.lessons * tutorPerLesson;
  const grossTotal = pricePerStudent * students;           // KDV dahil
  const vatAmount = grossTotal - grossTotal / (1 + vat);
  const netRevenue = grossTotal - vatAmount;               // KDV hariç
  const keep = netRevenue - tutorTotal;                    // KDV sonrası bize kalan
  const toEur = v => (eurTry ? v / eurTry : 0);
  const toUsd = v => (usdTry ? v / usdTry : 0);
  return {
    listPricePerStudent: course.lessons * course.pricePerLesson,
    pricePerLesson,
    pricePerStudent,
    tutorPerLesson,
    tutorTotal,
    grossTotal,
    vatAmount,
    netRevenue,
    profitPreVat: grossTotal - tutorTotal,
    keep,
    marginPct: netRevenue > 0 ? (keep / netRevenue) * 100 : 0,
    pricePerStudentEur: toEur(pricePerStudent),
    grossTotalEur: toEur(grossTotal),
    keepEur: toEur(keep),
    pricePerStudentUsd: toUsd(pricePerStudent),
    grossTotalUsd: toUsd(grossTotal),
    keepUsd: toUsd(keep),
  };
}

// Maks indirim: bize kalan ≥ minMarginPct × KDV hariç gelir kuralını sağlayan en düşük fiyat,
// varsa sabit tavanla birlikte. İndirim fiyatı doğrusal düşürür, hoca ödemesi sabit kalır.
export function calcMaxDiscount(baseCourse, opts) {
  const { students, vatRatePct, extraPerStudentPerLesson, minMarginPct = 0, maxDiscountCapPct = 100 } = opts;
  const course = priceCourse(baseCourse, opts);
  const vat = vatRatePct / 100;
  const margin = Math.min(Math.max(minMarginPct, 0), 99) / 100;
  const capPct = Math.min(Math.max(maxDiscountCapPct, 0), 100);
  const list = course.pricePerLesson;
  const tutorPerLesson = course.costPerLesson + students * extraPerStudentPerLesson;

  // P·N/(1+KDV)·(1−marj) = hoca ödemesi  →  kuralı tam sağlayan öğrenci başı ders fiyatı
  const rulePricePerLesson = (tutorPerLesson * (1 + vat)) / (students * (1 - margin));
  const capPricePerLesson = list * (1 - capPct / 100);
  const floorPricePerLesson = Math.max(rulePricePerLesson, capPricePerLesson);
  const maxDiscountPct = list > 0 ? Math.max(0, (1 - floorPricePerLesson / list) * 100) : 0;

  return {
    maxDiscountPct,
    floorPricePerLesson,
    floorPricePerStudent: floorPricePerLesson * course.lessons,
    limitedByCap: capPricePerLesson > rulePricePerLesson,
    listBelowFloor: list < rulePricePerLesson,
  };
}
