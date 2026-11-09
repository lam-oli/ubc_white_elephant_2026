const app = document.getElementById("app");
let state = null;
let unlocked = false;

const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const persist = () => storage.save(state);
const colors = ["#d7263d", "#c8871a", "#2a8f6a", "#3a6fc4", "#8e4fb8", "#c24d86"];
function avatar(name) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `<div class="av" style="background:${colors[h % colors.length]}">${esc(name.trim().charAt(0).toUpperCase())}</div>`;
}
const peopleList = (list, cls, tag, tagCls) =>
  `<ul class="people ${cls}">${list.map((p) => `<li>${avatar(p.name)}<span class="who">${esc(p.name)}</span><span class="tag ${tagCls}">${tag}</span></li>`).join("")}</ul>`;

async function route() {
  state = await storage.load();
  let page = (location.hash || "#home").slice(1);
  if (page !== "admin" && page !== "password") page = "home";
  if (page === "admin" && !unlocked) page = "password";
  document.getElementById("n-home").className = page === "home" ? "on" : "";
  document.getElementById("n-admin").className = page === "home" ? "" : "on";
  ({ home: renderHome, admin: renderAdmin, password: renderPassword })[page]();
}

function renderHome(msg) {
  const ins = state.people.filter((p) => p.status === "in");
  const outs = state.people.filter((p) => p.status === "out");
  const s = state.settings;
  app.innerHTML = `
  <section class="card hero"><div class="hero-top"><img class="photo" src="images/santa.jpg" alt="Our Secret Santa host in festive tree glasses and a Santa hat"><div><h1>Secret Santa</h1><p class="gold">2026</p></div></div>
    <p class="muted">Ho ho ho! Christmas is coming and it is time for our annual FoMDSWhite Elephant gift exchange! Please sign up below if you are interested in participating.</p></section>
  <section class="tiles">
    <div class="tile"><div class="ic">🎁</div><b>Current Elf Count</b><span>${ins.length} taking part</span></div>
    <div class="tile"><div class="ic">📅</div><b>Date</b><span>${esc(s.date)}</span></div>
    <div class="tile"><div class="ic">🧦</div><b>Budget</b><span>${esc(s.budget)}</span></div>
    <div class="tile"><div class="ic">📍</div><b>Location</b><span>${esc(s.location)}</span></div>
  </section>
  <section class="card"><h2>Are you in?</h2><p class="muted">Enter your name, then let us know if you are coming. You can change your answer later with the same name.</p>
    <form class="stack" id="rsvp"><input id="nm" placeholder="Your name" aria-label="Your name" maxlength="40" autocomplete="name">
    <div class="choice"><button type="button" class="yes" data-s="in">Yes, I’m in! 🎄</button><button type="button" class="no" data-s="out">Not This Year</button></div></form>
    <div class="msg" id="msg" role="status">${msg || ""}</div></section>
  <section class="card"><h2>Participants</h2><p class="gold">${ins.length} ${ins.length === 1 ? "person" : "people"}</p>
    ${ins.length ? peopleList(ins, "", "In", "") : '<div class="empty">No one has joined yet. Be the first to say yes.</div>'}
    ${outs.length ? `<p class="muted" style="margin-top:20px">Not this year</p>${peopleList(outs, "sit", "Out", "out")}` : ""}</section>`;
  app.querySelectorAll("[data-s]").forEach((b) => {
    b.onclick = async () => {
      const name = document.getElementById("nm").value.trim().replace(/\s+/g, " ");
      if (!name) return (document.getElementById("msg").textContent = "Enter your name first.");
      const status = b.dataset.s;
      const found = state.people.find((p) => p.name.toLowerCase() === name.toLowerCase());
      if (found) found.status = status; else state.people.push({ name, status });
      state.pairs = null;
      await persist();
      renderHome(status === "in" ? `You’re in, ${esc(name)}! 🎁` : `Thanks for letting us know, see you next year Mr. Grinch.`);
    };
  });
}

function renderPassword() {
  app.innerHTML = `<section class="card"><h2>Organisers only</h2><p class="muted">Enter the admin password to manage the list.</p>
  <form class="stack" id="pf"><input type="password" id="pw" placeholder="Password" aria-label="Password"><button class="yes">Unlock</button></form><div class="msg" id="pm"></div></section>`;
  document.getElementById("pf").onsubmit = (e) => {
    e.preventDefault();
    if (document.getElementById("pw").value === state.password) { unlocked = true; location.hash = "#admin"; route(); }
    else document.getElementById("pm").textContent = "Wrong password. Try again.";
  };
}

// Shuffle until nobody is assigned to themselves.
function draw(names) {
  for (let t = 0; t < 200; t++) {
    const r = names.slice();
    for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
    if (r.every((v, i) => v !== names[i])) return names.map((g, i) => ({ giver: g, receiver: r[i] }));
  }
  return null;
}

function renderAdmin() {
  const s = state.settings;
  app.innerHTML = `
  <section class="card"><h2>Event details</h2><form class="fields" id="sf">
    <input id="sd" value="${esc(s.date)}" aria-label="Date" placeholder="Date"><input id="sb" value="${esc(s.budget)}" aria-label="Budget" placeholder="Budget"><input id="sl" value="${esc(s.location)}" aria-label="Location" placeholder="Location">
    <button class="yes">Save details</button></form></section>
  <section class="card"><h2>Everyone who replied</h2>
    ${state.people.length ? `<ul class="people">${state.people.map((p, i) => `<li>${avatar(p.name)}<span class="who">${esc(p.name)}</span><span class="tag ${p.status === "in" ? "" : "out"}">${p.status === "in" ? "In" : "Out"}</span><button class="ghost" data-i="${i}" aria-label="Remove ${esc(p.name)}">Remove</button></li>`).join("")}</ul>` : '<div class="empty">No replies yet.</div>'}
    <div class="msg" id="am"></div>
    <div class="row"><button class="red" id="dr">Draw names</button><button class="ghost" id="lo">Lock admin</button></div></section>
  ${state.pairs ? `<section class="card"><h2>Draw results</h2><ul class="people">${state.pairs.map((p) => `<li>${avatar(p.giver)}<span class="who"><b>${esc(p.giver)}</b> gives to <b>${esc(p.receiver)}</b> 🎁</span></li>`).join("")}</ul></section>` : ""}`;
  document.getElementById("sf").onsubmit = async (e) => {
    e.preventDefault();
    state.settings = { date: sd.value.trim(), budget: sb.value.trim(), location: sl.value.trim() };
    await persist();
    document.getElementById("am").textContent = "Details saved.";
  };
  app.querySelectorAll("button[data-i]").forEach((b) => {
    b.onclick = async () => { state.people.splice(+b.dataset.i, 1); state.pairs = null; await persist(); renderAdmin(); };
  });
  document.getElementById("dr").onclick = async () => {
    const names = state.people.filter((p) => p.status === "in").map((p) => p.name);
    if (names.length < 3) return (document.getElementById("am").textContent = "You need at least 3 people who are in to draw.");
    state.pairs = draw(names);
    await persist();
    renderAdmin();
  };
  document.getElementById("lo").onclick = () => { unlocked = false; location.hash = "#home"; route(); };
}

// Falling snow
(function () {
  const box = document.getElementById("snow");
  for (let i = 0; i < 28; i++) {
    const f = document.createElement("i");
    f.textContent = "❄";
    f.style.left = Math.random() * 100 + "%";
    f.style.fontSize = 8 + Math.random() * 14 + "px";
    f.style.animationDuration = 9 + Math.random() * 12 + "s";
    f.style.animationDelay = -Math.random() * 20 + "s";
    box.appendChild(f);
  }
})();

window.addEventListener("hashchange", route);
route();
