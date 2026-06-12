// pages/Home.js — الصفحة الرئيسية (Hero + اليوم + الغد)
import { STADIUMS } from "../data/stadiums.js";
import { M, getTodayMatches, getTomorrowMatches, statusOf, dateObj } from "../data/matches.js";
import { TEAMS, flagImg } from "../data/teams.js";
import { appState } from "../core/store.js";
import { fmtT, fmtD, relTag } from "../utils/utils.js";
import { matchCard } from "../components/MatchCard.js";

let countdownInterval = null;

function pickHeroTarget() {
  const now = Date.now();
  let live = null, next = null;
  for (const m of M) {
    if (!m.d) continue;
    const st = statusOf(m);
    if (st === "live" && !live) live = m;
    if (st === "up") { if (!next || dateObj(m) < dateObj(next)) next = m; }
  }
  return { live, next, target: live || next };
}

export function renderHero() {
  const { live, next, target } = pickHeroTarget();
  const eb = document.getElementById("heroEyebrow");
  const lbl = document.getElementById("heroLabel");
  const duel = document.getElementById("heroDuel");
  const meta = document.getElementById("heroMeta");
  const cd = document.getElementById("heroCd");

  if (!target) {
    eb.classList.remove("is-live"); lbl.textContent = "انتهت البطولة 🏆";
    duel.innerHTML = ""; meta.innerHTML = "نلتقي في مونديال 2030 إن شاء الله"; cd.innerHTML = "";
    return;
  }

  const s = STADIUMS[target.s];
  const tm = fmtT(target.t);
  duel.innerHTML =
    '<div class="side">' + (TEAMS[target.h] ? '<span class="fl">' + flagImg(target.h) + '</span>' : '') + '<div class="nm">' + target.h + '</div></div>' +
    '<span class="x">VS</span>' +
    '<div class="side">' + (TEAMS[target.a] ? '<span class="fl">' + flagImg(target.a) + '</span>' : '') + '<div class="nm">' + target.a + '</div></div>';
  meta.innerHTML = fmtD(target.d) + " · <b>" + tm.t + " " + tm.ap + "</b> بتوقيت الكويت<br>🏟️ " + s.n + " · " + s.c + " " + flagImg(s.co) + " · 📺 beIN Sports";

  appState.set({ liveMatchN: live ? live.n : null });
  if (countdownInterval) { clearInterval(countdownInterval); countdownInterval = null; }

  if (live) {
    eb.classList.add("is-live"); lbl.textContent = "مباشر الآن من " + s.c;
    cd.innerHTML = '<div class="live-big" id="heroScore">⚽ المباراة جارية الآن</div>';
    refreshHeroScore();
  } else {
    eb.classList.remove("is-live"); lbl.textContent = "العد التنازلي للمباراة القادمة";
    cd.innerHTML =
      '<div class="cd">' +
        '<div class="box"><div class="v" id="cdD">0</div><div class="l">يوم</div></div>' +
        '<div class="box"><div class="v" id="cdH">0</div><div class="l">ساعة</div></div>' +
        '<div class="box"><div class="v" id="cdM">0</div><div class="l">دقيقة</div></div>' +
        '<div class="box"><div class="v" id="cdS">0</div><div class="l">ثانية</div></div>' +
      '</div>';
    const ts = dateObj(target).getTime();
    const tick = () => {
      const diff = ts - Date.now();
      if (diff <= 0) { renderHero(); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor(diff % 86400000 / 3600000);
      const mn = Math.floor(diff % 3600000 / 60000);
      const s = Math.floor(diff % 60000 / 1000);
      const eD = document.getElementById("cdD"); if (!eD) return;
      eD.textContent = d;
      document.getElementById("cdH").textContent = String(h).padStart(2, "0");
      document.getElementById("cdM").textContent = String(mn).padStart(2, "0");
      document.getElementById("cdS").textContent = String(s).padStart(2, "0");
    };
    tick();
    countdownInterval = setInterval(tick, 1000);
  }

  // Tournament beam
  const start = new Date("2026-06-11T00:00:00").getTime();
  const end = new Date("2026-07-19T23:59:00").getTime();
  const now = Date.now();
  const pct = Math.max(0, Math.min(1, (now - start) / (end - start)));
  document.getElementById("beamFill").style.width = (pct * 100).toFixed(2) + "%";
  const day = Math.floor((now - start) / 86400000) + 1;
  const bd = document.getElementById("beamDay");
  if (now < start) bd.textContent = "تنطلق البطولة قريبًا";
  else if (now > end) bd.textContent = "انتهت البطولة";
  else bd.textContent = "اليوم " + day + " من 39";
}

function refreshHeroScore() {
  const el = document.getElementById("heroScore");
  const liveN = appState.get().liveMatchN;
  if (!el || liveN === null) return;
  const sc = appState.get().cache.scores[liveN];
  if (sc && sc.found) {
    el.innerHTML =
      '<span style="direction:rtl;display:inline-block;letter-spacing:2px">' + sc.sh + ' : ' + sc.sa + '</span>' +
      (sc.status === "live" && sc.minute ? ' <small style="font-size:13px;color:#ffb1b8">⏱ ' + sc.minute + '</small>' : '') +
      (sc.status === "ht" ? ' <small style="font-size:13px;color:#ffb1b8">استراحة</small>' : '');
  }
}

export { refreshHeroScore };

export function renderHomeLists() {
  const tEl = document.getElementById("homeToday");
  const mEl = document.getElementById("homeTomorrow");
  if (tEl.querySelector(".match.open") || mEl.querySelector(".match.open")) return;
  const tList = getTodayMatches();
  const mList = getTomorrowMatches();
  tEl.innerHTML = tList.length
    ? '<div class="sec-t"><i></i>مباريات اليوم <span class="cnt">' + tList.length + '</span></div>' + tList.map((m) => matchCard(m)).join("")
    : '<div class="sec-t"><i></i>مباريات اليوم</div><div class="empty"><span class="e">😴</span>لا توجد مباريات اليوم</div>';
  mEl.innerHTML = mList.length
    ? '<div class="sec-t"><i></i>مباريات الغد <span class="cnt">' + mList.length + '</span></div>' + mList.map((m) => matchCard(m)).join("")
    : "";
}
