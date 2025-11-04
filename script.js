/* script.js
   Simple ToolHub demo behavior.
   - Defines tools (some allowed, some disabled)
   - Renders selector, moves slider under selected button
   - Run button: if allowed -> perform safe demo actions
               if disabled -> show toast message
   - Safe demo actions: URL shortener (client-side), QR generator
*/

const TOOLS = [
  { id: "yt", label: "YouTube Downloader", allowed: false, desc: "Disabled (downloaders not allowed)" },
  { id: "tt", label: "TikTok Downloader", allowed: false, desc: "Disabled (downloaders not allowed)" },
  { id: "lv", label: "Linkvertise Bypasser", allowed: false, desc: "Disabled (bypassers not allowed)" },
  { id: "short", label: "URL Shortener", allowed: true, desc: "Creates a short code stored locally" },
  { id: "qr", label: "QR Generator", allowed: true, desc: "Generates a QR image from the URL" }
];

const selectorEl = document.getElementById("toolSelector");
const sliderEl = document.getElementById("slider");
const urlInput = document.getElementById("urlInput");
const runBtn = document.getElementById("runBtn");
const resultArea = document.getElementById("resultArea");
const resultInner = document.getElementById("resultInner");
const toastEl = document.getElementById("toast");

let selectedTool = TOOLS[0].id;

// render tool buttons
function renderTools() {
  selectorEl.innerHTML = "";
  TOOLS.forEach((t, i) => {
    const btn = document.createElement("button");
    btn.className = "tool-btn";
    btn.textContent = t.label;
    btn.dataset.id = t.id;
    btn.dataset.allowed = t.allowed ? "true" : "false";
    btn.addEventListener("click", () => selectTool(t.id));
    selectorEl.appendChild(btn);
  });
  // initial slider placement after a tick
  requestAnimationFrame(() => moveSliderTo(selectedTool));
}

function selectTool(id) {
  selectedTool = id;
  // visual move
  moveSliderTo(id);
  // optional: update placeholder based on tool
  const tool = TOOLS.find(x => x.id === id);
  if(tool) urlInput.placeholder = tool.allowed ? `Enter URL for ${tool.label}...` : `Enter URL (this tool is disabled)...`;
  // clear result
  hideResult();
}

// move slider element under button
function moveSliderTo(id) {
  const btn = Array.from(selectorEl.children).find(b => b.dataset.id === id);
  if (!btn) return;
  const wrapRect = selectorEl.getBoundingClientRect();
  const btnRect = btn.getBoundingClientRect();
  const left = btnRect.left - wrapRect.left + 6; // 6 = selector padding
  const width = btnRect.width;
  sliderEl.style.transform = `translateX(${left}px)`;
  sliderEl.style.width = `${width}px`;
}

// toast
let toastTimer = null;
function showToast(msg, ms=2500) {
  toastEl.hidden = false;
  toastEl.textContent = msg;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toastEl.hidden = true; }, ms);
}

// results handling
function showResult(html) {
  resultInner.innerHTML = html;
  resultArea.hidden = false;
}
function hideResult() {
  resultInner.innerHTML = "";
  resultArea.hidden = true;
}

// actions
async function handleRun() {
  const url = (urlInput.value || "").trim();
  const tool = TOOLS.find(t => t.id === selectedTool);
  if (!tool) { showToast("No tool selected"); return; }
  if (!url) { showToast("Paste a URL or text first"); return; }

  if (!tool.allowed) {
    showToast(`${tool.label} is disabled here. Coming soon or restricted.`);
    return;
  }

  // Allowed tools: implement safe demos
  if (tool.id === "short") {
    // simple client-side shortener: generate code + save map to localStorage
    const code = generateShortCode(url);
    saveShort(url, code);
    const localUrl = `${location.origin}${location.pathname}#r=${code}`;
    showResult(`<div><strong>Short URL:</strong><div style="margin-top:8px"><code>${localUrl}</code></div><div style="margin-top:10px;color:var(--muted)">This demo stores mapping in your browser only (localStorage)</div></div>`);
    showToast("Short link created");
    return;
  }

  if (tool.id === "qr") {
    // use Google Charts QR generator
    const encoded = encodeURIComponent(url);
    const size = 220;
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${encoded}`;
    showResult(`<div style="display:flex;gap:12px;align-items:center"><img src="${qrUrl}" width="${size}" height="${size}" alt="QR"/><div><strong>QR for:</strong><div style="margin-top:6px"><code>${escapeHtml(url)}</code></div></div></div>`);
    showToast("QR generated");
    return;
  }

  // fallback
  showToast("Tool action not implemented in demo");
}

// small helpers
function generateShortCode(url){
  const seed = Math.random().toString(36).slice(2,8);
  const hash = btoa(url).slice(0,6).replace(/=+$/,'');
  return `${seed}${hash}`.slice(0,8);
}
function saveShort(url, code){
  const key = "toolhub_short_map";
  const raw = localStorage.getItem(key);
  const map = raw ? JSON.parse(raw) : {};
  map[code] = { url, created: Date.now() };
  localStorage.setItem(key, JSON.stringify(map));
}
// on page load, if there's a hash like #r=CODE then try to resolve
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
      // show resolved info with clickable link
      showResult(`<div><strong>Resolved short code:</strong> <code>${code}</code><div style="margin-top:8px">Original URL: <a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.url)}</a></div></div>`);
    } else {
      showToast("Short code not found in local storage");
    }
  }
}
function escapeHtml(s){
  return (s+"").replace(/[&<>"']/g, function(m){
    return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'})[m];
  });
}

// init
renderTools();
selectTool(selectedTool);
runBtn.addEventListener("click", handleRun);
window.addEventListener("resize", () => moveSliderTo(selectedTool));
urlInput.addEventListener("keydown", (e)=> { if(e.key === "Enter") handleRun(); });
handleHashResolve();
