// pages/Bracket.js — الخيار D: Tournament Bracket (شجرة الأدوار الإقصائية)
import { M, ROUNDS, KO_DATES } from "../data/matches.js";
import { STADIUMS } from "../data/stadiums.js";
import { TEAMS, flagImg } from "../data/teams.js";
import { appState } from "../core/store.js";
import { fmtT, fmtD } from "../utils/utils.js";

/**
 * يبني هيكل الـBracket من بيانات M
 * كل جولة ترجع قائمة مباريات
 */
function buildBracketStructure() {
  // خريطة: نتيجة مباراة → من هو المتأهل
  // نرتب المباريات: r32 → r16 → qf → sf → final
  // مباريات المركز الثالث منفصلة
  const rounds = [
    { key: "r32", label: "دور الـ32", matches: [], color: "#f4b23e" },
    { key: "r16", label: "دور الـ16", matches: [], color: "#38c8d9" },
    { key: "qf",  label: "ربع النهائي", matches: [], color: "#b07cf7" },
    { key: "sf",  label: "نصف النهائي", matches: [], color: "#f4679b" },
    { key: "final", label: "النهائي", matches: [], color: "#f0c24b" }
  ];

  const map = {};
  M.forEach((m) => {
    if (m.r === "third") return; // منفصل
    const round = rounds.find((r) => r.key === m.r);
    if (round) {
      round.matches.push(m);
      map[m.n] = m;
    }
  });
  return rounds;
}

function teamSlot(m, side) {
  const cache = appState.get().cache;
  const name = m[side];
  const realTeam = TEAMS[name];
  const sc = cache.scores[m.n];

  let scText = "";
  let winner = false;
  let loser = false;

  if (sc && sc.found && sc.status === "finished") {
    if (side === "h") { scText = sc.sh; if (sc.sh > sc.sa) winner = true; if (sc.sh < sc.sa) loser = true; }
    if (side === "a") { scText = sc.sa; if (sc.sa > sc.sh) winner = true; if (sc.sa < sc.sh) loser = true; }
  }

  let cls = "brk-team";
  if (winner) cls += " winner";
  if (loser) cls += " loser";

  return `<div class="${cls}">
    <span class="fl">${realTeam ? flagImg(name) : '🔒'}</span>
    <span class="tn">${name}</span>
    <span class="sc">${scText}</span>
  </div>`;
}

function bracketMatchHTML(m) {
  const cache = appState.get().cache;
  const sc = cache.scores[m.n];
  const s = STADIUMS[m.s];
  const isLive = sc && sc.status === "live";
  const isFinal = m.r === "final";
  let cls = "brk-match";
  if (isLive) cls += " live";
  if (isFinal) cls += " final";

  const tm = m.t ? fmtT(m.t) : { t: "—", ap: "" };
  const dateStr = m.d ? fmtD(m.d) : KO_DATES[m.r] || "";

  return `<div class="${cls}" data-mn="${m.n}" data-tip="${dateStr} · ${tm.t} ${tm.ap} · ${s ? s.n : ''}">
    ${teamSlot(m, "h")}
    ${teamSlot(m, "a")}
    <div class="brk-meta">
      <span>مباراة ${m.n}</span>
      <span>${isLive ? '🔴 مباشر' : (dateStr || '')}</span>
    </div>
  </div>`;
}

export function renderBracketPage() {
  const rounds = buildBracketStructure();
  // ترتيب المباريات حسب الرقم
  rounds.forEach((r) => r.matches.sort((a, b) => a.n - b.n));

  // ميدالية ثالث مستقلة
  const thirdMatch = M.find((m) => m.r === "third");
  const thirdHTML = thirdMatch ? `
    <div style="margin-top:40px;text-align:center">
      <h3 style="font-family:Changa;font-weight:700;color:#9aa6c8;margin-bottom:12px">مباراة المركز الثالث</h3>
      <div style="max-width:280px;margin:0 auto">${bracketMatchHTML(thirdMatch)}</div>
    </div>
  ` : "";

  const html = `
    <div class="brk-page">
      <div class="brk-header">
        <h1>🏆 شجرة الأدوار الإقصائية</h1>
        <a href="index.html">← رجوع للتطبيق</a>
      </div>
      <p style="text-align:center;color:var(--mut);font-size:12.5px;margin:0 0 18px">32 منتخب يتأهلون · 15 مباراة من دور الـ32 حتى النهائي · اضغط على أي مباراة للتفاصيل</p>
      <div class="brk-wrapper">
        ${rounds.map((r) => `
          <div class="brk-round">
            <div class="brk-round-title" style="color:${r.color}">${r.label} <small style="color:var(--mut);font-size:10px">(${KO_DATES[r.key] || ''})</small></div>
            ${r.matches.map(bracketMatchHTML).join("")}
          </div>
        `).join("")}
      </div>
      ${thirdHTML}
    </div>
    <div class="brk-tip" id="brkTip"></div>
  `;

  document.body.innerHTML = html;

  // Tooltip
  const tip = document.getElementById("brkTip");
  document.body.addEventListener("mousemove", (e) => {
    const t = e.target.closest("[data-tip]");
    if (t) {
      tip.textContent = t.dataset.tip;
      tip.classList.add("show");
      tip.style.left = (e.clientX + 12) + "px";
      tip.style.top = (e.clientY + 12) + "px";
    } else {
      tip.classList.remove("show");
    }
  });

  // Click → navigate to match details
  document.body.addEventListener("click", (e) => {
    const t = e.target.closest("[data-mn]");
    if (t) {
      const n = t.dataset.mn;
      window.location.href = "index.html#match-" + n;
    }
  });
}
