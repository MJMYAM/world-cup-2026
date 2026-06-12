// main.js — نقطة الدخول الرئيسية للتطبيق
import { appState } from "./core/store.js";
import { t, getLang } from "./core/i18n.js";
import { pollScores, loadStandingsESPN, ymd, teamIs, claudeSearch } from "./core/api.js";
import { renderHero, renderHomeLists, refreshHeroScore } from "./pages/Home.js";
import "./pages/Bracket.js";

// ============== ROUTING (Hash-based) ==============
const ROUTES = {
  "": "home",
  "home": "home",
  "matches": "matches",
  "groups": "groups",
  "knockout": "ko",
  "stadiums": "stadiums",
  "bracket": "bracket"
};

function parseHash() {
  const h = location.hash.replace(/^#\/?/, "");
  const seg = h.split("/");
  return { tab: ROUTES[seg[0]] || "home", param: seg[1] || null };
}

function navigate(tab, param = null) {
  const hash = param ? `#/${tab}/${param}` : `#/${tab}`;
  if (location.hash !== hash) location.hash = hash;
  else applyRoute();
}

function applyRoute() {
  const { tab } = parseHash();
  appState.set({ activeTab: tab });
  document.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t.id === "tab-" + tab));
  document.querySelectorAll("#bn button").forEach((b) => b.classList.toggle("on", b.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: "auto" });

  if (tab === "groups" && !appState.get().lastFetch.standings) {
    loadStandingsESPN().catch(() => {});
  }
  if (tab === "bracket") {
    // صفحة منفصلة
    location.href = "bracket.html";
  }
}

window.addEventListener("hashchange", applyRoute);

// ============== NAV ==============
document.getElementById("bn").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (b) navigate(b.dataset.tab);
});

// ============== INIT ==============
applyRoute();
renderHero();
renderHomeLists();
setInterval(renderHero, 60000);
setInterval(renderHomeLists, 60000);
setInterval(pollScores, 120000);
pollScores();

// ============== THEME ==============
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("wc2026_theme", theme);
}
const savedTheme = localStorage.getItem("wc2026_theme") || "dark";
setTheme(savedTheme);

// ============== KEYBOARD SHORTCUTS ==============
document.addEventListener("keydown", (e) => {
  if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;
  const map = { "1": "home", "2": "matches", "3": "groups", "4": "ko", "5": "stadiums" };
  if (map[e.key]) navigate(map[e.key]);
});

// ============== ONLINE/OFFLINE ==============
window.addEventListener("online", () => {
  document.body.style.opacity = "1";
  pollScores();
});
window.addEventListener("offline", () => {
  console.warn("Offline — cached data only");
});

// ============== EXPOSE for debug ==============
window.__wc = { appState, navigate, renderHero };
