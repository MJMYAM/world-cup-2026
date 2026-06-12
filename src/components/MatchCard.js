// components/MatchCard.js — مكون بطاقة المباراة
import { STADIUMS } from "../data/stadiums.js";
import { ROUNDS, statusOf } from "../data/matches.js";
import { TEAMS, flagImg } from "../data/teams.js";
import { appState } from "../core/store.js";
import { fmtT, fmtD, relTag, escapeHtml } from "../utils/utils.js";

function teamHTML(name) {
  if (TEAMS[name]) {
    return `<div class="team"><span class="fl">${flagImg(name)}</span><span class="tn">${escapeHtml(name)}</span></div>`;
  }
  return `<div class="team ph"><span class="tn">${escapeHtml(name)}</span></div>`;
}

function vsHTML(m, tm, st) {
  const cache = appState.get().cache;
  const sc = cache.scores[m.n];
  if (sc && sc.found) {
    let stl;
    if (sc.status === "finished") stl = '<span class="scst">انتهت</span>';
    else if (sc.status === "ht") stl = '<span class="scst lv">استراحة</span>';
    else if (sc.status === "live") stl = '<span class="scst lv">⏱ الدقيقة ' + (sc.minute || "") + '</span>';
    else stl = '<span class="scst">' + tm.t + ' ' + tm.ap + '</span>';
    const b = st === "live" ? '<button class="scbtn" data-sc="' + m.n + '">تحديث ⟳</button>' : '';
    return `<div class="sc"><span class="num">${sc.sh}</span><span class="sep">:</span><span class="num">${sc.sa}</span></div>${stl}${b}`;
  }
  let base = '<span class="t">' + tm.t + '</span><span class="ap">' + tm.ap + '</span>';
  if (st === "live") base += '<button class="scbtn" data-sc="' + m.n + '">نتيجة لايف ⟳</button>';
  else if (st === "done") base += '<button class="scbtn" data-sc="' + m.n + '">النتيجة ⟳</button>';
  return base;
}

export function matchCard(m, opts = {}) {
  const s = STADIUMS[m.s];
  const r = ROUNDS[m.r];
  const st = statusOf(m);
  const tm = fmtT(m.t);
  let cls = "match " + st + (m.r === "final" ? " is-final" : "");
  let badges = "";
  if (st === "live") badges = '<span class="tag live"><i></i> مباشر الآن</span>';
  else if (st === "done") badges = '<span class="tag fin">انتهت</span>';
  else if (m.d && relTag(m.d) === "اليوم") badges = '<span class="tag today">اليوم</span>';

  const grp = m.g ? '<span class="tag">المجموعة ' + m.g + '</span>' : "";
  const dline = (opts.showDate && m.d) ? '<span class="tag">' + fmtD(m.d) + '</span>' : "";

  return `<div class="${cls}" data-mn="${m.n}" style="--rc:${r.c}">
    <div class="m-top">
      <span class="tag num">مباراة ${m.n}</span>${grp}<span class="tag rnd">${r.l}</span>${dline}<span class="grow"></span>${badges}
    </div>
    <div class="m-mid">
      ${teamHTML(m.h)}
      <div class="vs">${vsHTML(m, tm, st)}</div>
      ${teamHTML(m.a)}
    </div>
    <div class="m-bot">
      🏟️ <b>${s.sn || s.n}</b><span>·</span>📍 ${s.c} <span>${flagImg(s.co)}</span><span>·</span>👥 <span class="cap">${s.cap.toLocaleString("en-US")}</span>
    </div>
    <div class="m-tv"><span>📺 <span class="bein">شبكة beIN Sports</span> — الناقل الحصري</span><span class="chev">التشكيلة والقناة ▾</span></div>
    <div class="m-ext"></div>
  </div>`;
}

export { vsHTML };
