// store.js — إدارة الحالة المركزية (mini state management)

class Store {
  constructor(initialState) {
    this.state = initialState;
    this.listeners = new Set();
  }

  get() { return this.state; }

  set(updates) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((cb) => cb(this.state));
  }

  subscribe(cb) {
    this.listeners.add(cb);
    cb(this.state);
    return () => this.listeners.delete(cb);
  }
}

export const appState = new Store({
  activeTab: "home",
  filters: {
    round: "all",
    group: "all",
    stadium: "all",
    q: "",
    day: "all"
  },
  cache: {
    scores: {},
    goals: {},
    lineups: {},
    standings: {},
    eventIds: {}
  },
  lastFetch: {
    scores: 0,
    standings: 0
  }
});
