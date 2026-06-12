// utils.js — مساعدات مشتركة

export const WD = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
export const MO = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

export function pad(x) { return String(x).padStart(2, "0"); }

export function isoOf(dt) {
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}

export function dateObj(m) {
  return new Date(m.d + "T" + m.t + ":00");
}

export function fmtD(d) {
  const x = new Date(d + "T12:00:00");
  return `${WD[x.getDay()]} ${x.getDate()} ${MO[x.getMonth()]}`;
}

export function fmtT(t) {
  const p = t.split(":"), h = +p[0], mn = p[1];
  const ap = h === 0 ? "منتصف الليل" : (h === 12 ? "ظهرًا" : (h < 12 ? "صباحًا" : "مساءً"));
  const hh = h % 12 || 12;
  return { t: `${hh}:${mn}`, ap };
}

export function nf(x) { return x.toLocaleString("en-US"); }

export function norm(s) {
  return (s || "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/ـ/g, "")
    .trim();
}

export function relTag(d) {
  const now = new Date();
  const today = isoOf(now);
  const tm = new Date(now.getTime() + 86400000);
  const tom = isoOf(tm);
  if (d === today) return "اليوم";
  if (d === tom) return "غدًا";
  return "";
}

export function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
