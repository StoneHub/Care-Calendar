// Phase 2 split: Utilities & shared globals
function pad2(n){ return String(n).padStart(2,'0'); }
function localDateStr(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function startOfWeek(d){ const x=new Date(d); const w=(x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-w); return x; }
function startOfMonth(d){ const x=new Date(d.getFullYear(), d.getMonth(), 1); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function hashString(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return Math.abs(h); }
function nameToEventClass(name){ const n=name.toLowerCase(); if(n.includes('kellie')) return 'kellie'; if(n.includes('robin')) return 'robin'; if(n.includes('scarlett')) return 'scarlett'; const pool=['purple','cyan']; return pool[hashString(name)%pool.length]; }
function validateShiftForm(){ return true; }

// Data injected by template JSON script tags
const shiftsData = JSON.parse(document.getElementById('shifts-data').textContent);
const employeesData = JSON.parse(document.getElementById('employees-data').textContent);

// API endpoints provided via inline script (window.CARE_API)
const API = (window.CARE_API)||{};

// Coverage prefs
function getCov(){ try{ const s=localStorage.getItem('cov'); if(!s) return { a:540, b:1260 }; const {a,b}=JSON.parse(s); return { a, b }; }catch{ return { a:540, b:1260 }; } }
function setCov(a,b){ localStorage.setItem('cov', JSON.stringify({a,b})); }
function minsFromHHMM(t){ const [hh,mm]=t.split(':').map(x=>parseInt(x,10)||0); return hh*60+mm; }

// Pre-index shifts by YYYY-MM-DD for faster rendering
function buildDayIndex(shifts){ const idx={}; for(const s of shifts){ const day=s.shift_time.slice(0,10); (idx[day] ||= []).push(s); } return idx; }
const dayIndex = buildDayIndex(shiftsData);

// Time formatting helpers
function to12h(dateObj){ let h=dateObj.getHours(); const m=pad2(dateObj.getMinutes()); const am=h<12; h = h % 12; if(h===0) h=12; return `${h}:${m} ${am?'AM':'PM'}`; }
function fmtDayLabel(d){ const w=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(d.getDay()+6)%7]; return `${w} ${pad2(d.getMonth()+1)}/${pad2(d.getDate())}`; }

// Shared fetch helper
async function postJSON(url, payload){ const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}); if(!res.ok){ const t=await res.text(); throw new Error(t); } return res.json(); }

// Dark mode heuristic (kept here so it executes early)
(function sunsetDarkMode(){
  const sunsetByMonth={1:'17:35',2:'18:02',3:'19:23',4:'19:51',5:'20:17',6:'20:35',7:'20:34',8:'20:11',9:'19:31',10:'18:51',11:'17:25',12:'17:17'};
  function shouldDark(){ try{ const now=new Date(); const mm=now.getMonth()+1; const s=sunsetByMonth[mm]||'19:00'; const [sh,sm]=s.split(':').map(x=>parseInt(x,10)); const sunset=new Date(now); sunset.setHours(sh,sm,0,0); const sunrise=new Date(now); sunrise.setHours(6,45,0,0); return (now>=sunset || now<sunrise); }catch{ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; } }
  function apply(){ document.documentElement.classList.toggle('dark', shouldDark()); }
  apply(); setInterval(apply, 60*1000);
})();

// End utils module
