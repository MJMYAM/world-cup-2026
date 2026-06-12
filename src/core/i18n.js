// i18n.js — نظام الترجمة (ar, en, fr) — افتراضياً عربي

const dict = {
  ar: {
    app_title: "كأس العالم 2026",
    app_subtitle: "نسخة الجوال 📱 · بتوقيت الكويت",
    tab_today: "اليوم",
    tab_matches: "المباريات",
    tab_groups: "المجموعات",
    tab_knockout: "الإقصائيات",
    tab_stadiums: "الملاعب",
    search_placeholder: "ابحث عن منتخب… (مثال: السعودية)",
    next_match: "المباراة القادمة",
    live_now: "مباشر الآن من {city}",
    countdown: "العد التنازلي للمباراة القادمة",
    no_match_today: "لا توجد مباريات اليوم",
    tomorrow: "غدًا",
    finished: "انتهت",
    live: "مباشر الآن",
    half_time: "استراحة",
    goals: "الأهداف",
    lineups: "التشكيلة",
    standings: "الترتيب",
    stadium: "الملعب",
    capacity: "متفرج",
    group: "المجموعة",
    match_num: "مباراة {n}",
    filter_round: "الجولة",
    filter_group: "المجموعة",
    filter_stadium: "الملعب",
    reset: "↺ إعادة الضبط",
    show_more: "⚙️ فلاتر إضافية",
    tap_for_more: "اضغط للمزيد",
    channel: "📺 شبكة beIN Sports",
    no_results: "لا توجد مباريات مطابقة لبحثك",
    weeks_left: "{day} من 39"
  },
  en: {
    app_title: "FIFA World Cup 2026",
    app_subtitle: "Mobile version 📱 · Kuwait time",
    tab_today: "Today",
    tab_matches: "Matches",
    tab_groups: "Groups",
    tab_knockout: "Knockout",
    tab_stadiums: "Stadiums",
    search_placeholder: "Search team… (e.g. Saudi Arabia)",
    next_match: "Next match",
    live_now: "Live now from {city}",
    countdown: "Countdown to next match",
    no_match_today: "No matches today",
    tomorrow: "Tomorrow",
    finished: "Finished",
    live: "LIVE",
    half_time: "Half-time",
    goals: "Goals",
    lineups: "Lineups",
    standings: "Standings",
    stadium: "Stadium",
    capacity: "seats",
    group: "Group",
    match_num: "Match {n}",
    filter_round: "Round",
    filter_group: "Group",
    filter_stadium: "Stadium",
    reset: "↺ Reset",
    show_more: "⚙️ More filters",
    tap_for_more: "Tap for more",
    channel: "📺 beIN Sports",
    no_results: "No matches match your search",
    weeks_left: "Day {day} of 39"
  }
};

let currentLang = localStorage.getItem("wc2026_lang") || "ar";

export function setLang(lang) {
  if (dict[lang]) {
    currentLang = lang;
    localStorage.setItem("wc2026_lang", lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  }
}

export function getLang() { return currentLang; }

/**
 * يترجم مفتاح، مع دعم placeholders بسيطة {name}
 * @param {string} key
 * @param {object} vars
 */
export function t(key, vars = {}) {
  let s = (dict[currentLang] && dict[currentLang][key]) || dict.ar[key] || key;
  Object.keys(vars).forEach((k) => {
    s = s.replace(new RegExp(`{${k}}`, "g"), vars[k]);
  });
  return s;
}
