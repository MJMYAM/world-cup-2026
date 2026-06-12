/*
  ============================================
  Quick Wins Patches — v1.0 → v1.1
  ============================================
  يطبّق التحسينات التالية على ملف v1 الأصلي (index بهىشمhtml.html)
  بدون تغيير في البنية العامة.

  طريقة التطبيق:
  1) افتح الملف الأصلي
  2) طبّق التعديلات التالية واحداً تلو الآخر
  3) أضف ملف v1-quickwins.html في نفس المجلد
  ============================================
*/

/* ============================================================
   PATCH 1: Service Worker registration
   أضف قبل </body> في v1
============================================================ */
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("./sw.js")
    .catch(err => console.warn("SW register failed:", err));
}

/* ============================================================
   PATCH 2: Visibility-aware polling
   استبدل setInterval(pollScores, 120000) بالكود التالي
============================================================ */
let _polling = false;
async function smartPoll() {
  if (_polling || document.hidden) return;
  _polling = true;
  try { await pollScores(); }
  finally { _polling = false; }
}
setInterval(smartPoll, 120000);
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) smartPoll();
});

/* ============================================================
   PATCH 3: Error boundary (عام)
   أضف في أول script block
============================================================ */
window.addEventListener("error", (e) => {
  console.error("Uncaught:", e.error);
  // إرسال للـanalytics أو إظهار banner
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled rejection:", e.reason);
});

/* ============================================================
   PATCH 4: Lazy loading on tabs
   استبدل renderMatches عند الـtab switch
============================================================ */
const _tabRendered = {};
function goTab(id) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.id === "tab-" + id));
  document.querySelectorAll("#bn button").forEach(b => b.classList.toggle("on", b.dataset.tab === id));

  // Render only on first visit
  if (!_tabRendered[id]) {
    if (id === "matches") buildDays();
    if (id === "groups") renderGroups();
    if (id === "ko") renderKO();
    if (id === "stadiums") renderStadiums();
    _tabRendered[id] = true;
  }

  // Refresh always
  if (id === "home") { renderHero(); renderHomeLists(); }

  window.scrollTo({ top: 0, behavior: "auto" });
}

/* ============================================================
   PATCH 5: Match card memoization (Diffing بسيط)
   يحل محل innerHTML rebuilds المتكررة
============================================================ */
const _cardCache = new Map();
function matchCardMemo(m, opts) {
  const key = m.n + JSON.stringify(opts || {}) + JSON.stringify(SC_CACHE[m.n] || null);
  if (_cardCache.has(key)) return _cardCache.get(key);
  const html = matchCard(m, opts);
  _cardCache.set(key, html);
  // تنظيف إذا كبر
  if (_cardCache.size > 200) {
    const firstKey = _cardCache.keys().next().value;
    _cardCache.delete(firstKey);
  }
  return html;
}
function refreshCards(n) {
  _cardCache.clear(); // force recompute for this match
  const m = getM(n); if (!m) return;
  const tm = fmtT(m.t), st = statusOf(m);
  document.querySelectorAll('.match[data-mn="' + n + '"] .vs').forEach(vs => {
    vs.innerHTML = vsHTML(m, tm, st);
  });
}

/* ============================================================
   PATCH 6: Tournament Bracket Quick View
   يضاف كتـsection في v1 ضمن tab-ko
============================================================ */
// في HTML: <div class="sec-t"><i></i>شجرة الأدوار الإقصائية</div>
// <div id="bracketView"></div>
// ثم:
// renderBracketView();
function renderBracketView() {
  const KO = {
    r32: { l: "دور الـ32", d: "28 يونيو – 3 يوليو", c: "#f4b23e" },
    r16: { l: "دور الـ16", d: "4 – 7 يوليو", c: "#38c8d9" },
    qf:  { l: "ربع النهائي", d: "9 – 12 يوليو", c: "#b07cf7" },
    sf:  { l: "نصف النهائي", d: "14 – 15 يوليو", c: "#f4679b" },
    final: { l: "النهائي", d: "19 يوليو", c: "#f0c24b" }
  };
  const order = ["r32", "r16", "qf", "sf", "final"];
  const box = document.getElementById("bracketView");
  if (!box) return;
  box.innerHTML = '<div class="brk-wrapper" style="display:flex;gap:18px;overflow-x:auto;padding:8px 0">' +
    order.map(rk => {
      const arr = M.filter(m => m.r === rk).sort((a, b) => a.n - b.n);
      const info = KO[rk];
      return '<div class="brk-round" style="display:flex;flex-direction:column;gap:8px;min-width:190px">' +
        '<div class="round-title" style="font-family:Changa;font-weight:700;font-size:12px;text-align:center;color:' + info.c + ';letter-spacing:1.5px;margin-bottom:6px">' + info.l + '<br><small style="color:var(--dim);font-size:9.5px;font-weight:500">' + info.d + '</small></div>' +
        arr.map(m => miniBracketMatch(m)).join("") +
      '</div>';
    }).join("") +
  '</div>';
}
function miniBracketMatch(m) {
  const sc = SC_CACHE[m.n];
  const isLive = sc && sc.status === "live";
  const isFinal = m.r === "final";
  let cls = "brk-mini";
  if (isLive) cls += " live";
  if (isFinal) cls += " is-final";
  function row(side) {
    const sh = sc && side === "h" ? sc.sh : (sc && side === "a" ? sc.sa : "");
    const winner = sc && sc.status === "finished" && (
      (side === "h" && sc.sh > sc.sa) || (side === "a" && sc.sa > sc.sh)
    );
    const loser = sc && sc.status === "finished" && (
      (side === "h" && sc.sh < sc.sa) || (side === "a" && sc.sa < sc.sh)
    );
    return '<div class="mini-row' + (winner ? ' win' : '') + (loser ? ' lose' : '') + '">' +
      '<span class="mfl">' + (TEAMS[m[side]] || "🔒") + '</span>' +
      '<span class="mtn">' + m[side] + '</span>' +
      '<span class="msc">' + (sh || "") + '</span>' +
    '</div>';
  }
  return '<div class="' + cls + '" data-mn="' + m.n + '" style="background:var(--card);border:1px solid var(--line);border-radius:10px;padding:6px 8px;cursor:pointer' + (isFinal ? ';border-color:rgba(240,194,75,.6);box-shadow:0 0 24px -8px rgba(240,194,75,.4)' : '') + (isLive ? ';border-color:rgba(255,71,87,.55)' : '') + '">' +
    row("h") + row("a") +
  '</div>';
}
// CSS needed:
/*
.brk-mini .mini-row{display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;border-bottom:1px dashed rgba(255,255,255,.05)}
.brk-mini .mini-row:last-of-type{border-bottom:none}
.brk-mini .mini-row.win{color:var(--gold2);font-weight:700}
.brk-mini .mini-row.win .msc{color:var(--gold2)}
.brk-mini .mini-row.lose{opacity:.4}
.brk-mini .mfl{font-size:13px;flex-shrink:0}
.brk-mini .mtn{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.brk-mini .msc{font-family:Changa;font-weight:800;font-size:12px;min-width:14px;text-align:center;color:var(--mut)}
*/

/* ============================================================
   PATCH 7: Add "البراكت" tab to bottom nav
============================================================ */
// في nav#bn أضف:
/*
<button data-tab="bracket"><span class="ic">🌳</span>الشجرة</button>
*/
// وفي main أضف:
/*
<section id="tab-bracket" class="tab">
  <div class="sec-t"><i></i>شجرة الأدوار الإقصائية <span class="cnt">15 مباراة</span></div>
  <div id="bracketView"></div>
</section>
*/
// وفي goTab:
/*
if (id === "bracket") renderBracketView();
*/

/* ============================================================
   PATCH 8: ARIA & a11y improvements
============================================================ */
// <html lang="ar" dir="rtl"> already good
// Add to header button: aria-label="القائمة الرئيسية"
// Add aria-current="page" to active nav button
// Add role="navigation" to <nav>
// Add role="tablist" to .pills
// Add aria-live="polite" to hero score area

/* ============================================================
   PATCH 9: Performance — debounce search
============================================================ */
const _qDebounced = (function () {
  let t;
  return (val) => {
    clearTimeout(t);
    t = setTimeout(() => { state.q = val; applyFilters(); }, 200);
  };
})();
document.getElementById("q").addEventListener("input", (e) => {
  _qDebounced(e.target.value);
});

/* ============================================================
   PATCH 10: Search improvements (English fallback)
============================================================ */
function normEn(s) {
  return (s || "").toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
}
const REV = (() => {
  const r = [];
  Object.keys(ALIAS).forEach(ar => ALIAS[ar].forEach(a => r.push([a, ar])));
  return r;
})();
function arOf(en) {
  const e = normEn(en);
  for (const [a, ar] of REV) {
    if (e.includes(a) || a.includes(e)) return ar;
  }
  return null;
}
// في applyFilters استبدل شرط البحث:
/*
if (q) {
  const homeAr = norm(m.h);
  const awayAr = norm(m.a);
  const homeEn = normEn(arOf(m.h) || "");
  const awayEn = normEn(arOf(m.a) || "");
  const inAr = homeAr.includes(q) || awayAr.includes(q);
  const inEn = (homeEn && homeEn.includes(q)) || (awayEn && awayEn.includes(q));
  if (!inAr && !inEn) return false;
}
*/

/* ============================================================
   PATCH 11: Cache last standings in localStorage
============================================================ */
function cacheStandings(g, data) {
  try { localStorage.setItem("st_" + g, JSON.stringify({ data, ts: Date.now() })); } catch (e) {}
}
function getCachedStandings(g) {
  try {
    const r = localStorage.getItem("st_" + g);
    if (!r) return null;
    const o = JSON.parse(r);
    // 6 hours
    if (Date.now() - o.ts > 6 * 3600 * 1000) return null;
    return o.data;
  } catch (e) { return null; }
}
// في renderStanding أضف:
/*
const cached = getCachedStandings(g);
if (cached) { ST_CACHE[g] = cached; renderStanding(g); return; }
*/

/* ============================================================
   PATCH 12: Skeleton loaders
============================================================ */
// .skeleton { background: linear-gradient(90deg, var(--card) 25%, var(--card2) 50%, var(--card) 75%); background-size: 200% 100%; animation: skel 1.4s infinite; }
// @keyframes skel { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

/* ============================================================
   PATCH 13: Keyboard shortcuts
============================================================ */
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  const map = { "1": "home", "2": "matches", "3": "groups", "4": "ko", "5": "stadiums" };
  if (map[e.key]) goTab(map[e.key]);
});

/* ============================================================
   PATCH 14: Auto theme detection
============================================================ */
const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
if (prefersLight) document.documentElement.dataset.theme = "light";

/* ============================================================
   PATCH 15: Reduce CLS (Cumulative Layout Shift)
============================================================ */
// أضف width/height لكل img
// <img class="flg" width="40" height="27" ...>
