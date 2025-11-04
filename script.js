// Define tools
const TOOLS = [
  { id: "yt", label: "YouTube Downloader", allowed: false },
  { id: "tt", label: "TikTok Downloader", allowed: false },
  { id: "lv", label: "Linkvertise Bypasser", allowed: false },
  { id: "short", label: "URL Shortener", allowed: true },
  { id: "qr", label: "QR Generator", allowed: true }
];

const selectorEl = document.getElementById("toolSelector");
const sliderEl = document.getElementById("slider");
const urlInput = document.getElementById("urlInput");
const runBtn = document.getElementById("runBtn");
const resultArea = document.getElementById("resultArea");
const resultInner = document.getElementById("resultInner");
const toastEl = document.getElementById("toast");

let selectedTool = TOOLS[0].id;

// Render tool buttons
function renderTools() {
  selectorEl.innerHTML = "";
  TOOLS.forEach((t) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.textContent = t.label;
    btn.dataset.id = t.id;
    btn.dataset.allowed = t.allowed ? "true" : "false";
    btn.addEventListener("click", () => selectTool(t.id));
    selectorEl.appendChild(btn);
  });
  requestAnimationFrame(() => moveSliderTo(selectedTool));
}

// Select a tool
function selectTool(id) {
  selectedTool = id;
  moveSliderTo(id);
  const tool = TOOLS.find(t => t.id === id);
  if(tool) urlInput.placeholder = tool.allowed ? `Enter URL for ${tool.label}...` : `Enter URL (disabled)...`;
  hideResult();
}

// Move slider under selected button
function moveSliderTo(id) {
  const btn = Array.from(selectorEl.children).find(b => b.dataset.id === id);
  if (!btn) return;
  const wrapRect = selectorEl.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const left = btnRect.left - wrapRect.left + 6;
  sliderEl.style.transform = `translateX(${left}px)`;
  sliderEl.style.width = `${btnRect.width}px`;
}

// Toast
let toastTimer = null;
function showToast(msg, ms=2500) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

// Show/Hide result
function showResult(html) {
  resultInner.innerHTML = html;
  resultArea.hidden = false;
}
function hideResult() {
  resultInner.innerHTML = "";
  resultArea.hidden = true;
}

// Generate short code
function generateShortCode(url){
  const seed = Math.random().toString(36).slice(2,6);
  const hash = btoa(url).slice(0,4).replace(/=+$/,'');
  return (seed+hash).slice(0,8);
}

// Save short URL in localStorage
function saveShort(url, code){
  const key = "toolhub_short_map";
  const raw = localStorage.getItem(key);
  const map = raw ? JSON.parse(raw) : {};
  map[code] = { url, created: Date.now() };
  localStorage.setItem(key, JSON.stringify(map));
}

// Handle #r=CODE in URL (resolve short link)
function handleHashResolve(){
  const hash = location.hash || "";
  if(hash.startsWith("#r=")){
    const code = hash.slice(3);
    const key = "toolhub_short_map";
    const raw = localStorage.getItem(key);
    if(!raw){ showToast("No short links stored locally"); return; }
    const map = JSON.parse(raw);
    if(map[code]) {
      const entry = map[code];
      showResult(`<div><strong>Resolved short code:</strong> <code>${code}</code><div style="margin-top:8px">Original URL: <a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.url)}</a></div></div>`);
    } else {
      showToast("Short code not found in local storage");
    }
  }
}

// Escape HTML
function escapeHtml(s){
  return (s+"").replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m];
  });
}

// Handle Run button
function handleRun() {
  const url = (urlInput.value || "").trim();
  const tool = TOOLS.find(t => t.id === selectedTool);
  if (!tool) { showToast("No tool selected"); return; }
  if (!url) { showToast("Paste a URL or text first"); return; }

  if (!tool.allowed) {
    showToast(`${tool.label} is disabled here. Coming soon.`);
    return;
  }

  if(tool.id === "short") {
    const code = generateShortCode(url);
    saveShort(url, code);
    const localUrl = `${location.origin}${location.pathname}#r=${code}`;
    showResult(`<div><strong>Short URL:</strong><div style="margin-top:8px"><code>${localUrl}</code></div><div style="margin-top:6px;color:var(--muted)">Stored in your browser only (localStorage)</div></div>`);
    showToast("Short link created");
    return;
  }

  if(tool.id === "qr") {
    const encoded = encodeURIComponent(url);
    const size = 220;
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}`;
    showResult(`<div style="display:flex;gap:12px;align-items:center"><img src="${qrUrl}" width="${size}" height="${size}" alt="QR"/><div><strong>QR for:</strong><div style="margin-top:6px"><code>${escapeHtml(url)}</code></div></div></div>`);
    showToast("QR generated");
    return;
  }

  showToast("Tool action not implemented.");
}

// Init
renderTools();
selectTool(selectedTool);
runBtn.addEventListener("click", handleRun);
urlInput.addEventListener("keydown", (e)=> { if(e.key === "Enter") handleRun(); });
window.addEventListener("resize", () => moveSliderTo(selectedTool));
handleHashResolve();
