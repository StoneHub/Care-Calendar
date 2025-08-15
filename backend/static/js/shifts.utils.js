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

// ---- Time Off (Phase 2 minimal integration) ----
// Cache keyed by 'YYYY-MM' to avoid repeated fetches when navigating months.
const timeOffCache = {};
let timeOffItems = [];
let timeOffDayIndex = {}; // { 'YYYY-MM-DD': [row,...] }

async function fetchTimeOffForRange(startISO, endISO){
  const key = startISO.slice(0,7);
  if(timeOffCache[key]) return timeOffCache[key];
  try {
    const res = await fetch(`/api/time_off?start=${startISO}&end=${endISO}`);
    if(!res.ok) throw new Error(await res.text());
    const data = await res.json();
    if(data.ok){
      timeOffCache[key] = data.items;
      rebuildTimeOffIndex();
      return data.items;
    }
  } catch(e){ console.warn('Time off fetch failed', e); }
  return [];
}

function rebuildTimeOffIndex(){
  timeOffItems = Object.values(timeOffCache).flat();
  const idx={};
  for(const row of timeOffItems){
    try {
      const sd = new Date(row.start_date+'T00:00:00');
      const ed = new Date(row.end_date+'T00:00:00');
      if(ed < sd) continue;
      // Cap safeguard (should already be <=30 days)
      for(let d=new Date(sd); d<=ed && (d - sd) < 40*86400000; d.setDate(d.getDate()+1)){
        const k = localDateStr(d);
        (idx[k] ||= []).push(row);
      }
    }catch{}
  }
  timeOffDayIndex = idx;
}

// Expose to other modules
window.__CARE_TIME_OFF__ = { fetchTimeOffForRange, timeOffDayIndex: ()=>timeOffDayIndex };

// Time Off modal logic injected here to keep single additional file change (could be split later)
function initTimeOffModal(){
  console.debug('[TimeOff] init modal binding');
  const btn = document.getElementById('btnNewTimeOff');
  const overlay = document.getElementById('timeOffOverlay');
  if(!btn || !overlay){ console.debug('[TimeOff] elements missing, abort init'); return; }
  const form = document.getElementById('timeOffForm');
  const selEmp = document.getElementById('toEmployee');
  const startInput = document.getElementById('toStart');
  const endInput = document.getElementById('toEnd');
  const reasonInput = document.getElementById('toReason');
  const reasonCount = document.getElementById('toReasonCount');
  const errBox = document.getElementById('toError');
  const btnCancel = document.getElementById('toCancel');
  const btnSubmit = document.getElementById('toSubmit');
  function openTO(){
    // populate employees each time (in case changed)
    selEmp.innerHTML = '<option value="">Select…</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
    const today = new Date(); const iso = localDateStr(today);
    startInput.value = iso; endInput.value = iso; reasonInput.value=''; reasonCount.textContent='0 / 120';
    errBox.classList.add('hidden'); errBox.textContent='';
    overlay.removeAttribute('hidden');
    overlay.style.display = 'flex'; // Fix: ensure modal is visible by overriding CSS display: none
    selEmp.focus();
  }
  function closeTO(){ 
    overlay.setAttribute('hidden',''); 
    overlay.style.display = 'none'; // Fix: ensure modal is properly hidden
  }
  btn.addEventListener('click', openTO);
  btnCancel.addEventListener('click', closeTO);
  overlay.addEventListener('click', (e)=>{ if(e.target===overlay) closeTO(); });
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && !overlay.hasAttribute('hidden')) closeTO(); });
  reasonInput.addEventListener('input', ()=>{ reasonCount.textContent = `${reasonInput.value.length} / 120`; });
  async function submitTO(){
    errBox.classList.add('hidden'); errBox.textContent='';
    const empId = selEmp.value;
    if(!empId) return showErr('Select an employee');
    const s = startInput.value; const e = endInput.value;
    if(!s || !e) return showErr('Start and End dates required');
    if(e < s) return showErr('End date must be after or same as start');
    const payload = { employee_id: parseInt(empId,10), start_date: s, end_date: e, reason: reasonInput.value.trim()||null };
    btnSubmit.disabled=true; btnSubmit.textContent='Saving…';
    try {
      const res = await fetch('/api/time_off',{ method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload) });
      if(!res.ok){ const text=await res.text(); throw new Error(text); }
      const js = await res.json(); if(!js.ok) throw new Error(js.error||'Failed');
      // Merge into cache & index
      const key = s.slice(0,7);
      (timeOffCache[key] ||= []).push(js.item);
      rebuildTimeOffIndex();
      closeTO();
      render && await render();
    } catch(err){ showErr(err.message.replace(/<[^>]+>/g,'').slice(0,200)); }
    finally { btnSubmit.disabled=false; btnSubmit.textContent='Create'; }
  }
  function showErr(msg){ errBox.textContent=msg; errBox.classList.remove('hidden'); }
  btnSubmit.addEventListener('click', submitTO);
  console.debug('[TimeOff] modal ready');
}
if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', initTimeOffModal); else initTimeOffModal();

// Conflict detection helper (shift overlaps any time off for same employee date)
function shiftConflictsWithTimeOff(shift){
  try {
    const dateStr = shift.shift_time.slice(0,10);
    const toIdx = window.__CARE_TIME_OFF__.timeOffDayIndex();
    const items = toIdx[dateStr]; if(!items) return false;
    return items.some(r=> r.employee_id === shift.employee_id);
  }catch{return false;}
}
window.shiftConflictsWithTimeOff = shiftConflictsWithTimeOff;

// Time off popover (edit/delete)
function openTimeOffPopover(anchorEl, row){
  const pop=document.getElementById('timeOffPopover'); if(!pop) return;
  const details=document.getElementById('toPopDetails');
  const editStart=document.getElementById('toEditStart');
  const editEnd=document.getElementById('toEditEnd');
  const editReason=document.getElementById('toEditReason');
  const msg=document.getElementById('toEditMsg');
  const saveBtn=document.getElementById('toSaveEdit');
  const delBtn=document.getElementById('toDelete');
  const closeBtn=document.getElementById('toClosePop');
  const emp=employeesData.find(e=>e.id===row.employee_id);
  details.textContent=`${emp?emp.name:('Emp '+row.employee_id)}: ${row.start_date} → ${row.end_date}`;
  editStart.value=row.start_date; editEnd.value=row.end_date; editReason.value=row.reason||''; msg.textContent='';
  pop.style.display='block';
  // Position near element
  const rect=anchorEl.getBoundingClientRect();
  let left=rect.left; let top=rect.bottom+6;
  if(left+pop.offsetWidth>window.innerWidth) left=window.innerWidth-pop.offsetWidth-8;
  if(top+pop.offsetHeight>window.innerHeight) top=rect.top-pop.offsetHeight-8;
  pop.style.left=left+'px'; pop.style.top=top+'px';
  function close(){ pop.style.display='none'; document.removeEventListener('click', outside); }
  function outside(e){ if(!pop.contains(e.target) && e.target!==anchorEl){ close(); }}
  document.addEventListener('click', outside, { capture:true });
  closeBtn.onclick=()=>close();
  delBtn.onclick=async ()=>{
    if(!confirm('Delete this time off record?')) return;
    try { const res=await fetch(`/api/time_off/${row.id}`, { method:'DELETE' }); if(!res.ok && res.status!==204) throw new Error(await res.text());
      // Remove from cache
      Object.keys(timeOffCache).forEach(k=>{ timeOffCache[k]=timeOffCache[k].filter(r=>r.id!==row.id); });
      rebuildTimeOffIndex(); render && await render(); close();
    }catch(err){ msg.textContent='Delete failed: '+err.message; }
  };
  saveBtn.onclick=async ()=>{
    msg.textContent='';
    const s=editStart.value; const e=editEnd.value; if(!s||!e){ msg.textContent='Start/End required'; return; }
    if(e<s){ msg.textContent='End before start'; return; }
    const payload={ start_date:s, end_date:e, reason:editReason.value||null };
    try { const res=await fetch(`/api/time_off/${row.id}`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body:JSON.stringify(payload)}); const js=await res.json(); if(!res.ok || !js.ok) throw new Error(js.error||'Failed');
      // Update in cache
      Object.keys(timeOffCache).forEach(k=>{ timeOffCache[k]=timeOffCache[k].map(r=> r.id===row.id? js.item: r); });
      rebuildTimeOffIndex(); render && await render(); close();
    }catch(err){ msg.textContent='Save failed: '+err.message; }
  };
}

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
