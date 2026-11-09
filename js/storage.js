// DATA LAYER: the only file that knows where data lives.
// Now: the browser's localStorage (per-device, not shared).
// Later: replace load() and save() with Supabase calls (see README.md).
// app.js only calls storage.load() and storage.save(data).

const STORAGE_KEY = "secretsanta:v2";
const DEFAULTS = {
  people: [],            // [{ name: "Sam", status: "in" | "out" }]
  pairs: null,           // [{ giver, receiver }]
  password: "santa2026",
  settings: { date: "Dec 20", budget: "$20", location: "Office, 1st floor" },
};
const fresh = () => JSON.parse(JSON.stringify(DEFAULTS));

const storage = {
  async load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return fresh();
      const d = JSON.parse(raw);
      return Object.assign(fresh(), d, { settings: Object.assign({}, DEFAULTS.settings, d.settings) });
    } catch (e) {
      return fresh();
    }
  },
  async save(data) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch (e) { console.error("Could not save", e); }
  },
};
