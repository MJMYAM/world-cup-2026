// api.js — طبقة الـAPI: ESPN + Claude + Stale-While-Revalidate
import { ALIAS } from "../data/teams.js";
import { getMatch, M } from "../data/matches.js";
import { appState } from "./store.js";

const ESPN_SB = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";
const ESPN_ST = "https://site.api.espn.com/apis/v2/sports/soccer/fifa.world/standings?season=2026";

/* ==================== utilities ==================== */
export function normEn(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function ymd(dt) {
  return dt.toISOString().slice(0, 10).replace(/-/g, "");
}

export function teamIs(ar, en) {
  const aliases = ALIAS[ar];
  if (!aliases) return false;
  const e = normEn(en);
  return aliases.some((a) => e.includes(a) || a.includes(e));
}

function mapSides(cs, m) {
  let hi = -1, ai = -1;
  for (let i = 0; i < cs.length; i++) {
    const nm = (cs[i].team && cs[i].team.displayName) || (cs[i].team && cs[i].team.name) || "";
    if (hi === -1 && teamIs(m.h, nm)) hi = i;
    else if (ai === -1 && teamIs(m.a, nm)) ai = i;
  }
  if (hi === -1 || ai === -1) {
    for (let j = 0; j < cs.length; j++) {
      if (cs[j].homeAway === "home" && hi === -1) hi = j;
      if (cs[j].homeAway === "away" && ai === -1) ai = j;
    }
  }
  if (hi === -1) hi = ai === 0 ? 1 : 0;
  if (ai === -1) ai = hi === 0 ? 1 : 0;
  return { hi, ai };
}

function findByNames(n1, n2) {
  for (const m of M) {
    if (!ALIAS[m.h] || !ALIAS[m.a]) continue;
    if ((teamIs(m.h, n1) && teamIs(m.a, n2)) || (teamIs(m.h, n2) && teamIs(m.a, n1))) {
      return m;
    }
  }
  return null;
}

const REV = (() => {
  const r = [];
  Object.keys(ALIAS).forEach((ar) => ALIAS[ar].forEach((a) => r.push([a, ar])));
  return r;
})();

function arOf(en) {
  const e = normEn(en);
  for (const [a, ar] of REV) {
    if (e.includes(a) || a.includes(e)) return ar;
  }
  return null;
}

function attachKnockout(ev, n1, n2) {
  const a1 = arOf(n1), a2 = arOf(n2);
  if (!a1 || !a2) return null;
  const et = new Date(ev.date).getTime();
  let cand = null, cnt = 0;
  for (const m of M) {
    if (m.n < 73 || !m.d || ALIAS[m.h]) continue;
    if (Math.abs(new Date(m.d + "T" + m.t + ":00").getTime() - et) <= 100 * 60000) {
      cand = m; cnt++;
    }
  }
  if (cnt !== 1) return null;
  cand.h = a1; cand.a = a2;
  window.dispatchEvent(new CustomEvent("ko-dirty"));
  return cand;
}

/* ==================== ESPN Scoreboard ==================== */
export async function loadScoresESPN(fromYmd, toYmd) {
  const res = await fetch(`${ESPN_SB}?dates=${fromYmd}-${toYmd}`);
  if (!res.ok) throw new Error("espn-fail");
  const data = await res.json();
  const evs = data.events || [];
  let changed = false;
  const newEventIds = {};

  evs.forEach((ev) => {
    try {
      const comp = (ev.competitions || [])[0];
      if (!comp) return;
      const cs = comp.competitors || [];
      if (cs.length < 2) return;
      const n1 = cs[0].team.displayName, n2 = cs[1].team.displayName;
      const mm = findByNames(n1, n2) || attachKnockout(ev, n1, n2);
      if (!mm) return;
      newEventIds[mm.n] = ev.id;

      const st = ev.status || {}, ty = st.type || {};
      const desc = (ty.description || "") + " " + (ty.detail || "") + " " + (ty.name || "");
      const isHT = /halftime|half-time|half time|STATUS_HALFTIME/i.test(desc) && !/second/i.test(desc);
      const status = ty.state === "post"
        ? "finished"
        : ty.state === "in" ? (isHT ? "ht" : "live") : "not_started";
      if (status === "not_started") return;

      const sd = mapSides(cs, mm);
      const sh = parseInt(cs[sd.hi].score || "0", 10);
      const sa = parseInt(cs[sd.ai].score || "0", 10);
      const cache = appState.get().cache;
      cache.scores[mm.n] = {
        found: true,
        sh: isNaN(sh) ? 0 : sh,
        sa: isNaN(sa) ? 0 : sa,
        status,
        minute: String(st.displayClock || "").replace(/['\u2019]/g, "")
      };
      changed = true;
    } catch (e) { /* skip */ }
  });

  appState.set({ cache: { ...appState.get().cache, scores: { ...appState.get().cache.scores }, eventIds: newEventIds } });
  return changed;
}

/* ==================== ESPN Standings ==================== */
export async function loadStandingsESPN() {
  const res = await fetch(ESPN_ST);
  if (!res.ok) throw new Error("espn-fail");
  const data = await res.json();
  const kids = data.children || [];
  const newStandings = {};
  kids.forEach((ch) => {
    const mt = /group\s*([A-L])/i.exec((ch.name || "") + " " + (ch.abbreviation || ""));
    if (!mt) return;
    const g = mt[1].toUpperCase();
    const ents = ((ch.standings || {}).entries) || [];
    if (!ents.length) return;
    newStandings[g] = {
      rows: ents.map((en) => {
        const st = {};
        (en.stats || []).forEach((x) => { if (x && x.name) st[x.name] = x; });
        const v = (names, dv = false) => {
          for (const n of names) {
            const o = st[n];
            if (o) return dv ? (o.displayValue != null ? o.displayValue : o.value) : (o.value != null ? o.value : o.displayValue);
          }
          return 0;
        };
        const nm = (en.team || {}).displayName || "";
        let gd = String(v(["pointDifferential", "goalDifferential", "differential"], true));
        if (/^\d/.test(gd) && gd !== "0") gd = "+" + gd;
        return {
          t: arOf(nm) || nm,
          p: v(["gamesPlayed"]),
          w: v(["wins"]),
          d: v(["ties", "draws"]),
          l: v(["losses"]),
          gd,
          pts: v(["points"])
        };
      })
    };
  });
  if (!Object.keys(newStandings).length) throw new Error("empty");
  appState.set({ cache: { ...appState.get().cache, standings: { ...appState.get().cache.standings, ...newStandings } } });
  return true;
}

/* ==================== Stale-While-Revalidate ==================== */
export async function pollScores() {
  if (document.hidden) return;
  const now = Date.now();
  const last = appState.get().lastFetch.scores;
  // Throttle: min 60s between calls
  if (now - last < 60000) return;
  appState.set({ lastFetch: { ...appState.get().lastFetch, scores: now } });
  try {
    const from = ymd(new Date(now - 36 * 3600000));
    const to = ymd(new Date(now + 24 * 3600000));
    await loadScoresESPN(from, to);
  } catch (e) {
    console.warn("ESPN poll failed", e);
  }
}

/* ==================== Claude Fallback ==================== */
export async function claudeSearch(prompt) {
  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "web_search_20250305", name: "web_search" }]
      })
    });
    const data = await res.json();
    const txt = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n");
    const clean = txt.replace(/```json|```/g, "").trim();
    const a1 = clean.indexOf("{"), a2 = clean.lastIndexOf("}");
    if (a1 === -1 || a2 === -1) throw new Error("no-json");
    return JSON.parse(clean.slice(a1, a2 + 1));
  } catch (e) {
    return null;
  }
}
