// --- Utilities ---
function pad2(n){ return String(n).padStart(2,'0'); }
function localDateStr(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function startOfWeek(d){ const x=new Date(d); const w=(x.getDay()+6)%7; x.setHours(0,0,0,0); x.setDate(x.getDate()-w); return x; }
function startOfMonth(d){ const x=new Date(d.getFullYear(), d.getMonth(), 1); x.setHours(0,0,0,0); return x; }
function addDays(d,n){ const x=new Date(d); x.setDate(x.getDate()+n); return x; }
function hashString(str){ let h=0; for(let i=0;i<str.length;i++){ h=(h<<5)-h+str.charCodeAt(i); h|=0; } return Math.abs(h); }
function nameToEventClass(name){ const n=name.toLowerCase(); if(n.includes('kellie')) return 'kellie'; if(n.includes('robin')) return 'robin'; if(n.includes('scarlett')) return 'scarlett'; const pool=['purple','cyan']; return pool[hashString(name)%pool.length]; }
// Ensure form validation handler exists (wizard handles validation already)
function validateShiftForm(){ return true; }

// --- Data ---
const shiftsData = JSON.parse(document.getElementById('shifts-data').textContent);
const employeesData = JSON.parse(document.getElementById('employees-data').textContent);
const API = {
  deleteShift: "{{ url_for('api_delete_shift') }}",
  deleteSeries: "{{ url_for('api_delete_series') }}",
  swapShift: "{{ url_for('api_swap_shift') }}",
  updateSeries: "{{ url_for('api_update_series') }}"
};

// Pre-index shifts by YYYY-MM-DD for faster rendering
function buildDayIndex(shifts){
  const idx = {};
  for(const s of shifts){
    const day = s.shift_time.slice(0,10);
    (idx[day] ||= []).push(s);
  }
  return idx;
}
const dayIndex = buildDayIndex(shiftsData);

// Coverage prefs
function getCov(){ try{ const s=localStorage.getItem('cov'); if(!s) return { a:540, b:1260 }; const {a,b}=JSON.parse(s); return { a, b }; }catch{ return { a:540, b:1260 }; } }
function setCov(a,b){ localStorage.setItem('cov', JSON.stringify({a,b})); }
function minsFromHHMM(t){ const [hh,mm]=t.split(':').map(x=>parseInt(x,10)||0); return hh*60+mm; }

// --- Legend ---
function buildLegend(){
  const legend = document.getElementById('calendarLegend'); legend.innerHTML='';
  const names=[...new Set(shiftsData.map(s=>s.name))].sort((a,b)=>a.localeCompare(b));
  names.forEach(n=>{ const cls=nameToEventClass(n); const item=document.createElement('div'); item.className='legend-item'; const sw=document.createElement('span'); sw.className='legend-swatch '+cls; const label=document.createElement('span'); label.textContent=n; item.append(sw,label); legend.appendChild(item); });
}

// --- Views ---
let view = (function(){
  const saved = localStorage.getItem('view');
  if(saved) return saved;
  const v = window.innerWidth < 800 ? 'week' : 'month';
  localStorage.setItem('view', v);
  return v;
})();
let anchor = new Date();

function render(){
  if(view==='month') buildMonth(); else buildWeek();
}

function buildMonth(){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  const today=new Date(anchor);
  const shown=new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStart=startOfMonth(shown);
  const firstCell=startOfWeek(monthStart); // Monday alignment
  const label=document.getElementById('periodLabel'); label.textContent = shown.toLocaleDateString(undefined,{month:'long', year:'numeric'});

  const currentWeekStart=startOfWeek(new Date());
  for(let i=0;i<42;i++) renderDayCell(addDays(firstCell,i), shown.getMonth(), currentWeekStart, grid);
}

function buildWeek(){
  const grid=document.getElementById('grid'); grid.innerHTML='';
  const weekStart=startOfWeek(anchor);
  const label=document.getElementById('periodLabel');
  const weekEnd=addDays(weekStart,6);
  label.textContent = `${weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
  for(let i=0;i<7;i++) renderDayCell(addDays(weekStart,i), weekStart.getMonth(), weekStart, grid);
}

function renderDayCell(day, shownMonth, currentWeekStart, grid){
  const cell=document.createElement('div'); cell.className='cell';
  if(day.getMonth()!==shownMonth) cell.classList.add('dim');
  const isCurrentWeek = startOfWeek(day).getTime()===currentWeekStart.getTime();
  if(isCurrentWeek) cell.classList.add('current-week');
  const today = new Date(); today.setHours(0,0,0,0);
  const isToday = day.getTime()===today.getTime();
  if(isToday) cell.classList.add('today-cell');

  const dateTag=document.createElement('div'); dateTag.className='date-tag';
  const dateNum=document.createElement('span'); dateNum.textContent=fmtDayLabel(day);
  const todayBadge=document.createElement('span'); if(isToday){ todayBadge.className='today-dot'; }
  dateTag.appendChild(dateNum); if(isToday) dateTag.appendChild(todayBadge); cell.appendChild(dateTag);
  // Add hover button to create shift
  const add=document.createElement('button'); add.className='add-btn'; add.type='button'; add.textContent='Add';
  add.addEventListener('click', (e)=>{ e.stopPropagation(); openWizardWithDate(day); });
  cell.appendChild(add);
  const pills=document.createElement('div'); pills.className='pills'; cell.appendChild(pills);

  const dayStr=localDateStr(day);
  const items = dayIndex[dayStr] || [];
  const dayShifts = items.map(s=>({
      id:s.id, name:s.name, start:new Date(s.shift_time), end: s.end_time ? new Date(`${dayStr}T${s.end_time.slice(11,16)}`) : null, series_id:s.series_id, employee_id:s.employee_id
  }));

  // Coverage gap check using configurable window
  const cov=getCov(); const ATT_START=cov.a, ATT_END=cov.b;
  let intervals=[];
  for(const sh of dayShifts){
      const st=sh.start.getHours()*60 + sh.start.getMinutes();
      const et=sh.end ? sh.end.getHours()*60 + sh.end.getMinutes() : (st+60);
      const a=Math.max(ATT_START, st), b=Math.min(ATT_END, et);
      if(b>a) intervals.push([a,b]);
  }
  intervals.sort((x,y)=>x[0]-y[0]);
  let merged=[]; for(const iv of intervals){ if(!merged.length || iv[0]>merged[merged.length-1][1]) merged.push(iv); else merged[merged.length-1][1]=Math.max(merged[merged.length-1][1], iv[1]); }
  let covered=0; merged.forEach(([a,b])=> covered+= (b-a));
  if(covered < (ATT_END-ATT_START)){
  const badge=document.createElement('span'); badge.className='gap-badge'; badge.textContent='Coverage gap'; cell.classList.add('needs-attention'); cell.appendChild(badge);
  }

  dayShifts.forEach(sh=>{
      const cls=nameToEventClass(sh.name);
      const ev=document.createElement('div'); ev.className='event '+cls;
      const timelabel = `${to12h(sh.start)}${sh.end? '–'+to12h(sh.end): ''}`;
      ev.innerHTML = `<span>${timelabel} ${sh.name}</span>`;
      ev.dataset.shiftId=sh.id; ev.dataset.seriesId=sh.series_id||''; ev.dataset.employeeId=sh.employee_id;
      ev.addEventListener('click', (e)=>{ e.stopPropagation(); if(selectionMode){ toggleSelect(ev, sh.id, sh.series_id); } else { openMenu(e, sh); } });
      ev.addEventListener('contextmenu', (e)=>{ e.preventDefault(); e.stopPropagation(); if(selectionMode){ toggleSelect(ev, sh.id, sh.series_id); } else { openMenu(e, sh); } });
      pills.appendChild(ev);
  });

  grid.appendChild(cell);
}

// --- Selection mode & batch delete ---
let selectionMode=false;
const selected=new Set();
const selectedMap=new Map(); // id -> series_id|null
function updateDeleteSelectedLabel(){ const b=document.getElementById('btnDeleteSelected'); if(b) b.textContent=`Delete selected (${selected.size})`; }
function toggleSelect(pill, id, seriesId){ if(selected.has(id)){ selected.delete(id); selectedMap.delete(id); pill.classList.remove('selected'); } else { selected.add(id); selectedMap.set(id, seriesId||null); pill.classList.add('selected'); } updateDeleteSelectedLabel(); }

document.getElementById('btnSelectMode').addEventListener('click', ()=>{
  selectionMode = !selectionMode;
  document.getElementById('btnDeleteSelected').classList.toggle('hidden', !selectionMode);
  document.getElementById('btnSelectMode').textContent = selectionMode ? 'Cancel selection' : 'Select shifts';
  selected.clear(); selectedMap.clear(); updateDeleteSelectedLabel();
  document.querySelectorAll('.pill.selected').forEach(el=> el.classList.remove('selected'));
});

document.getElementById('btnDeleteSelected').addEventListener('click', async ()=>{
  if(!selected.size) return alert('No shifts selected');
  const hasSeries = [...selectedMap.values()].some(v=>!!v);
  let deleteSeriesToo=false;
  if(hasSeries){
    deleteSeriesToo = confirm('Some selected shifts are part of a series. Press OK to delete entire series for those; Cancel to delete only selected occurrences.');
  }
  try{
    const ops=[];
    if(deleteSeriesToo){
      const seriesIds=[...new Set([...selectedMap.values()].filter(Boolean))];
      seriesIds.forEach(sid=> ops.push(postJSON(API.deleteSeries, { series_id: sid })));
      const singles=[...selectedMap.entries()].filter(([id,sid])=>!sid).map(([id])=>id);
      singles.forEach(id=> ops.push(postJSON(API.deleteShift, { shift_id: id })));
    } else {
      [...selected].forEach(id=> ops.push(postJSON(API.deleteShift, { shift_id: id })));
    }
    await Promise.all(ops);
    location.reload();
  }catch(e){ alert('Failed to delete selected: '+e.message); }
});

document.addEventListener('keydown', (e)=>{ if(e.key==='Escape' && selectionMode){ document.getElementById('btnSelectMode').click(); }});

// --- Menu ---
let currentShift=null;
const menu=document.getElementById('shiftMenu');
let menuAnchor = { x: 0, y: 0 };
// Ensure positioning helper exists before use
function positionMenuNear(x, y){
  if(!menu) return;
  // Show to measure
  menu.style.display='block';
  // Reset first to get accurate size
  menu.style.left='0px';
  menu.style.top='0px';
  const rect = menu.getBoundingClientRect();
  const w = rect.width || menu.offsetWidth;
  const h = rect.height || menu.offsetHeight;
  const pad = 8;
  const left = Math.min(Math.max(pad, (typeof x==='number'? x : pad)), Math.max(pad, window.innerWidth - w - pad));
  const top = Math.min(Math.max(pad, (typeof y==='number'? y : pad)), Math.max(pad, window.innerHeight - h - pad));
  menu.style.left = left + 'px';
  menu.style.top = top + 'px';
}
function openMenu(evt, sh){
  currentShift=sh;
  document.getElementById('menuTitle').textContent = `${sh.name} • ${sh.start.toLocaleString()}`;
  const btnSeries=document.getElementById('btnDeleteSeries'); btnSeries.classList.toggle('hidden', !sh.series_id);
  // Show/hide Edit Series row based on whether this is part of a series
  const editRow = document.getElementById('editSeriesRow'); if(editRow){ editRow.classList.toggle('is-hidden', !sh.series_id); }
  const sel=document.getElementById('swapSelect'); sel.innerHTML='<option value="">Swap to…</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  // Prefill coverage window selects from stored minutes
  const cov=getCov();
  const shh = pad2(Math.floor(cov.a/60)), smm = pad2(cov.a%60);
  const ehh = pad2(Math.floor(cov.b/60)), emm = pad2(cov.b%60);
  const csH=document.getElementById('covStartHour'), csM=document.getElementById('covStartMin');
  const ceH=document.getElementById('covEndHour'), ceM=document.getElementById('covEndMin');
  if(csH) csH.value = shh; if(csM) csM.value = smm;
  if(ceH) ceH.value = ehh; if(ceM) ceM.value = emm;
  // Position within viewport
  menuAnchor = { x: evt.clientX, y: evt.clientY };
  positionMenuNear(menuAnchor.x, menuAnchor.y);
  // focus for accessibility
  menu.setAttribute('tabindex','-1');
  menu.focus();
}
function closeMenu(preserveShift=false){ menu.style.display='none'; if(!preserveShift) currentShift=null; }

async function postJSON(url, payload){
  const res = await fetch(url, { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify(payload) });
  if(!res.ok){ const t=await res.text(); throw new Error(t); }
  return res.json();
}

// --- Menu ---
// Replace Delete button node to clear any prior listeners, then attach series-aware delete
(function(){
  const oldBtn = document.getElementById('btnDeleteShift');
  if(oldBtn){
    const newBtn = oldBtn.cloneNode(true);
    oldBtn.parentNode.replaceChild(newBtn, oldBtn);
    newBtn.addEventListener('click', async ()=>{
      if(!currentShift) return;
      try {
        if(currentShift.series_id){
          if(!confirm('Delete this shift occurrence?')) return;
          await postJSON(API.deleteShift, { shift_id: currentShift.id });
        } else {
          if(!confirm('Delete this shift?')) return;
          await postJSON(API.deleteShift, { shift_id: currentShift.id });
        }
        location.reload();
      } catch(e){ alert('Failed to delete: '+e.message); }
    });
  }
})();

document.getElementById('btnDeleteSeries').addEventListener('click', async ()=>{
  if(!currentShift || !currentShift.series_id) return;
  if(!confirm('Delete ALL occurrences in this series? This cannot be undone.')) return;
  try { await postJSON(API.deleteSeries, { series_id: currentShift.series_id }); location.reload(); } catch(e){ alert('Failed to delete series: '+e.message); }
});

document.getElementById('btnSwap').addEventListener('click', async ()=>{
  if(!currentShift) return; const sel=document.getElementById('swapSelect'); const val=sel.value; if(!val) return alert('Select a caregiver to swap to');
  try{ await postJSON(API.swapShift, { shift_id: currentShift.id, new_employee_id: parseInt(val,10) }); location.reload(); }catch(e){ alert('Failed to swap: '+e.message); }
});

// Remove legacy inline series update handler if element not present
(function(){
  const btn = document.getElementById('btnUpdateSeries');
  if(btn){
    btn.addEventListener('click', async ()=>{
      if(!currentShift || !currentShift.series_id) return alert('Series not available');
      const time = document.getElementById('seriesTime').value; if(!time) return alert('Time required');
      const end = document.getElementById('seriesEnd').value; const until = document.getElementById('seriesUntil').value || null;
      const wds = Array.from(document.querySelectorAll('.series-wd:checked')).map(el=>parseInt(el.value,10)); if(!wds.length) return alert('Select weekdays');
      const startDate = localDateStr(startOfWeek(currentShift.start));
      try{ await postJSON(API.updateSeries, { series_id: currentShift.series_id, start_date: startDate, time, end_time:end||null, weekdays:wds, repeat_until: until }); location.reload(); }catch(e){ alert('Failed to update series: '+e.message); }
    });
  }
})();

document.getElementById('btnSaveCoverage').addEventListener('click', ()=>{
  // Read 15-min dropdowns
  const sh = document.getElementById('covStartHour').value || '09';
  const sm = document.getElementById('covStartMin').value || '00';
  const eh = document.getElementById('covEndHour').value || '21';
  const em = document.getElementById('covEndMin').value || '00';
  const a = parseInt(sh,10)*60 + parseInt(sm,10);
  const b = parseInt(eh,10)*60 + parseInt(em,10);
  if(b<=a) return alert('Coverage end must be after start');
  setCov(a,b); closeMenu(); render();
});

document.getElementById('btnCloseMenu').addEventListener('click', ()=> closeMenu());
window.addEventListener('click', (e)=>{ if(menu.style.display==='block' && !menu.contains(e.target) && !e.target.closest('.pill')) { if(typeof eOverlay !== 'undefined' && eOverlay && eOverlay.style.display==='flex' && !eOverlay.classList.contains('is-hidden')) closeMenu(true); else closeMenu(); } });
window.addEventListener('resize', ()=>{ if(menu.style.display==='block'){ positionMenuNear(menuAnchor.x, menuAnchor.y); } });

document.addEventListener('keydown', (e)=>{
  if(e.key === 'Escape'){
    if(menu.style.display==='block') closeMenu();
    else if(overlay && overlay.style.display==='flex') closeWizard();
    else if(typeof eOverlay !== 'undefined' && eOverlay && !eOverlay.classList.contains('is-hidden')) eClose();
  }
});

// --- Inline Calendar Widget ---
const calState = { currentMonth: new Date(), selectedDate: null };

function renderInlineCalendar() {
  const monthEl = document.getElementById('wizCalMonth');
  const daysEl = document.getElementById('wizCalDays');
  if (!monthEl || !daysEl) return;

  const now = new Date();
  const month = calState.currentMonth.getMonth();
  const year = calState.currentMonth.getFullYear();
  
  // Update month header
  monthEl.textContent = new Date(year, month).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  
  // Clear days
  daysEl.innerHTML = '';
  
  // Get first day of month and last day of month
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
  
  // Generate 42 days (6 weeks)
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    
    const dayEl = document.createElement('button');
    dayEl.type = 'button';
    dayEl.className = 'cal-day';
    dayEl.textContent = date.getDate();
    dayEl.setAttribute('tabindex', '-1');
    
    const isCurrentMonth = date.getMonth() === month;
    const isToday = date.toDateString() === now.toDateString();
    const isSelected = calState.selectedDate && date.toDateString() === calState.selectedDate.toDateString();
    
    if (!isCurrentMonth) dayEl.classList.add('other-month');
    if (isToday) dayEl.classList.add('today');
    if (isSelected) dayEl.classList.add('selected');
    
    dayEl.setAttribute('aria-label', date.toLocaleDateString());
    dayEl.addEventListener('click', () => selectCalendarDate(date));
    
    daysEl.appendChild(dayEl);
  }
}

function selectCalendarDate(date) {
  calState.selectedDate = new Date(date);
  
  // Update date input
  const dateInput = document.getElementById('wizStartDate');
  if (dateInput) {
    dateInput.value = `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
  }
  
  // Re-render to show selection
  renderInlineCalendar();
  
  // Update wiz state
  if (typeof updateStartFromControls === 'function') {
    updateStartFromControls();
  }
}

function initInlineCalendar() {
  const prevBtn = document.getElementById('wizCalPrev');
  const nextBtn = document.getElementById('wizCalNext');
  const dateInput = document.getElementById('wizStartDate');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      calState.currentMonth.setMonth(calState.currentMonth.getMonth() - 1);
      renderInlineCalendar();
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      calState.currentMonth.setMonth(calState.currentMonth.getMonth() + 1);
      renderInlineCalendar();
    });
  }
  
  // Sync calendar with date input
  if (dateInput) {
    dateInput.addEventListener('change', (e) => {
      if (e.target.value) {
        const date = new Date(e.target.value + 'T00:00:00');
        calState.selectedDate = date;
        calState.currentMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        renderInlineCalendar();
      }
    });
  }
  
  // Keyboard navigation for calendar
  const daysContainer = document.getElementById('wizCalDays');
  if (daysContainer) {
    daysContainer.addEventListener('keydown', (e) => {
      const currentFocus = document.activeElement;
      if (!currentFocus.classList.contains('cal-day')) return;
      
      const days = Array.from(daysContainer.querySelectorAll('.cal-day'));
      const currentIndex = days.indexOf(currentFocus);
      let nextIndex = currentIndex;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          nextIndex = Math.max(0, currentIndex - 1);
          break;
        case 'ArrowRight':
          e.preventDefault();
          nextIndex = Math.min(days.length - 1, currentIndex + 1);
          break;
        case 'ArrowUp':
          e.preventDefault();
          nextIndex = Math.max(0, currentIndex - 7);
          break;
        case 'ArrowDown':
          e.preventDefault();
          nextIndex = Math.min(days.length - 1, currentIndex + 7);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          currentFocus.click();
          return;
        case 'PageUp':
          e.preventDefault();
          calState.currentMonth.setMonth(calState.currentMonth.getMonth() - 1);
          renderInlineCalendar();
          return;
        case 'PageDown':
          e.preventDefault();
          calState.currentMonth.setMonth(calState.currentMonth.getMonth() + 1);
          renderInlineCalendar();
          return;
      }
      
      if (nextIndex !== currentIndex) {
        days[nextIndex].focus();
        days[nextIndex].setAttribute('tabindex', '0');
        currentFocus.setAttribute('tabindex', '-1');
      }
    });
    
    // Set initial focus on first day when calendar is focused
    daysContainer.addEventListener('focus', (e) => {
      if (e.target === daysContainer) {
        const firstDay = daysContainer.querySelector('.cal-day');
        if (firstDay) {
          firstDay.focus();
          firstDay.setAttribute('tabindex', '0');
        }
      }
    });
  }
  
  // Set default to today
  const today = new Date();
  calState.selectedDate = today;
  calState.currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  
  // Set date input to today
  if (dateInput) {
    dateInput.value = `${today.getFullYear()}-${pad2(today.getMonth() + 1)}-${pad2(today.getDate())}`;
  }
  
  renderInlineCalendar();
}

// --- Wizard ---
const overlay = document.getElementById('wizardOverlay');
const wiz = { step:1, employeeId:null, start:null, end:null, repeat:false, days:new Set(), until:null };

function showStep(n){
  wiz.step=n;
  for(let i=1;i<=3;i++) document.getElementById('step'+i).classList.toggle('hidden', i!==n);
  document.getElementById('wizBack').classList.toggle('hidden', n===1);
  document.getElementById('wizNext').textContent = (n===3?'Create':'Next');
  if(n===3) buildReview();
}

function openWizard(){
  // Build employee button list
  const list = document.getElementById('wizEmployeeList');
  if(list){
    list.innerHTML = '';
    employeesData.forEach(e=>{
      const b=document.createElement('button');
      b.type='button'; b.className='chip emp-btn'; b.textContent=e.name; b.dataset.id=e.id; b.setAttribute('aria-pressed','false');
      b.addEventListener('click', ()=>{
        // clear previous selection
        list.querySelectorAll('.emp-btn').forEach(x=>{ x.classList.remove('active'); x.setAttribute('aria-pressed','false'); });
        b.classList.add('active'); b.setAttribute('aria-pressed','true'); wiz.employeeId = String(e.id);
      });
      list.appendChild(b);
    });
  }
  // Build weekdays chips
  const daysCtn=document.getElementById('wizDays');
  if(daysCtn && !daysCtn.dataset.built){
    const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    labels.forEach((lb,idx)=>{ 
      const btn=document.createElement('button'); 
      btn.type='button'; 
      btn.className='chip day-chip'; 
      btn.textContent=lb; 
      btn.dataset.value=idx;
      btn.setAttribute('aria-pressed','false');
      btn.addEventListener('click', ()=>{ 
        const isPressed = btn.getAttribute('aria-pressed') === 'true';
        btn.setAttribute('aria-pressed', !isPressed ? 'true' : 'false');
        btn.classList.toggle('active', !isPressed);
        if(!isPressed) wiz.days.add(idx); else wiz.days.delete(idx); 
      });
      daysCtn.appendChild(btn); 
    });
    daysCtn.dataset.built='1';
  }
  overlay.style.display='flex';
  setTimeout(()=>{ try{ const firstBtn=list && list.querySelector('.emp-btn'); if(firstBtn) firstBtn.focus(); }catch{} }, 0);
  initInlineCalendar(); // Initialize calendar widget
  showStep(1);
}
function closeWizard(){ overlay.style.display='none'; }

function openWizardWithDate(day){
  openWizard();
  // Prefill the date controls
  const dStr = `${day.getFullYear()}-${pad2(day.getMonth()+1)}-${pad2(day.getDate())}`;
  const dInput = document.getElementById('wizStartDate'); if(dInput){ dInput.value = dStr; }
  // Keep default 09:00 unless changed
  updateStartFromControls && updateStartFromControls();
}

function buildReview(){
  const emp = employeesData.find(e=> String(e.id)===String(wiz.employeeId));
  const startStr = wiz.start ? new Date(wiz.start).toLocaleString() : 'Not set';
  const endStr = wiz.end || 'None';
  let rec='No'; if(wiz.repeat){ const days=[...wiz.days].sort().map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', '); rec=`Yes • ${days || 'Base day'}${wiz.until? ' • until '+wiz.until: ''}`; }
  document.getElementById('wizReview').textContent = `${emp?emp.name:'(none)'} • ${startStr} • End ${endStr} • Repeat ${rec}`;
}

// Compute start/end from selects (15-minute increments enforced); convert 12h to 24h internally
function to24h(h12, ampm){ let h=parseInt(h12||'0',10); if(isNaN(h)) return ''; if(ampm==='AM'){ if(h===12) h=0; } else { if(h!==12) h+=12; } return pad2(h); }
function getSelectedAmPm(prefix){ const amBtn=document.getElementById(prefix+'AM'); const pmBtn=document.getElementById(prefix+'PM'); return amBtn && amBtn.classList.contains('active') ? 'AM' : 'PM'; }
function updateStartFromControls(){ const d=document.getElementById('wizStartDate').value; const hh12=document.getElementById('wizStartHour12').value; const mm=document.getElementById('wizStartMin').value; const ap=getSelectedAmPm('wizStart'); const hh=to24h(hh12, ap); wiz.start = (d && hh && mm) ? `${d}T${hh}:${mm}` : null; }
function updateEndFromControls(){ const hh12=document.getElementById('wizEndHour12').value; const mm=document.getElementById('wizEndMin').value; const ap=getSelectedAmPm('wizEnd'); const hh=to24h(hh12, ap); wiz.end = (hh && mm) ? `${hh}:${mm}` : null; }

function to12h(dateObj){
  let h = dateObj.getHours();
  const m = pad2(dateObj.getMinutes());
  const am = h < 12;
  h = h % 12; if(h===0) h = 12;
  return `${h}:${m} ${am?'AM':'PM'}`;
}

function fmtDayLabel(d){
  const w = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(d.getDay()+6)%7];
  return `${w} ${pad2(d.getMonth()+1)}/${pad2(d.getDate())}`;
}

// Buttons
 document.getElementById('btnNewShift').addEventListener('click', openWizard);
 document.getElementById('wizCancel').addEventListener('click', closeWizard);
 document.getElementById('wizBack').addEventListener('click', ()=> showStep(Math.max(1, wiz.step-1)) );
 document.getElementById('wizNext').addEventListener('click', ()=>{
    if(wiz.step===1){ if(!wiz.employeeId) return alert('Select an employee'); showStep(2); return; }
    if(wiz.step===2){
      updateStartFromControls(); updateEndFromControls();
      if(!wiz.start) return alert('Pick a start date & time');
      if(wiz.end){ const st=new Date(wiz.start); const [eh,em]=wiz.end.split(':'); const et=new Date(wiz.start); et.setHours(parseInt(eh,10), parseInt(em,10), 0, 0); if(et<=st) return alert('End time must be after start'); }
      showStep(3); return;
    }
    if(wiz.step===3){
      const form=document.getElementById('addShiftForm');
      document.getElementById('employee_id_select').value = wiz.employeeId;
      document.getElementById('shift_time_input').value = wiz.start;
      document.getElementById('end_time_input').value = wiz.end || '';
      document.getElementById('repeat_until_input').value = wiz.until || '';
      // cleanup previous dynamic fields
      [...form.querySelectorAll('input[name="selected_days"]'), ...form.querySelectorAll('input[name="repeat_weekly"]')].forEach(n=>n.remove());
      if(wiz.repeat){ const rw=document.createElement('input'); rw.type='hidden'; rw.name='repeat_weekly'; rw.value='on'; form.appendChild(rw); wiz.days.forEach(d=>{ const hid=document.createElement('input'); hid.type='hidden'; hid.name='selected_days'; hid.value=String(d); form.appendChild(hid); }); }
      form.requestSubmit(); closeWizard();
    }
  });

// New event wiring for selects and AM/PM buttons
['wizStartDate','wizStartHour12','wizStartMin'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', updateStartFromControls); });
['wizEndHour12','wizEndMin'].forEach(id=>{ const el=document.getElementById(id); if(el) el.addEventListener('change', updateEndFromControls); });

// AM/PM button handlers
function setupAmPmButtons(prefix, updateFn) {
  const amBtn = document.getElementById(prefix + 'AM');
  const pmBtn = document.getElementById(prefix + 'PM');
  if (amBtn && pmBtn) {
    [amBtn, pmBtn].forEach(btn => {
      btn.addEventListener('click', () => {
        // Toggle active state
        amBtn.classList.toggle('active', btn === amBtn);
        pmBtn.classList.toggle('active', btn === pmBtn);
        amBtn.setAttribute('aria-pressed', btn === amBtn ? 'true' : 'false');
        pmBtn.setAttribute('aria-pressed', btn === pmBtn ? 'true' : 'false');
        updateFn();
      });
      
      // Keyboard support
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault();
          const other = btn === amBtn ? pmBtn : amBtn;
          other.click();
          other.focus();
        } else if (e.key === ' ' || e.key === 'Enter') {
          e.preventDefault();
          btn.click();
        }
      });
    });
  }
}

setupAmPmButtons('wizStart', updateStartFromControls);
setupAmPmButtons('wizEnd', updateEndFromControls);

// Set up AM/PM buttons for edit wizards
setupAmPmButtons('eStart', () => {});
setupAmPmButtons('eEnd', () => {});
setupAmPmButtons('dStart', () => {});
setupAmPmButtons('dEnd', () => {});

// Repeat controls (now on step2) - using toggle chip
document.getElementById('wizRepeatToggle').addEventListener('click', (e)=>{ 
  const isPressed = e.target.getAttribute('aria-pressed') === 'true';
  const newPressed = !isPressed;
  e.target.setAttribute('aria-pressed', newPressed ? 'true' : 'false');
  wiz.repeat = newPressed; 
  document.getElementById('wizDaysCtn').classList.toggle('hidden', !newPressed); 
  document.getElementById('wizUntilCtn').classList.toggle('hidden', !newPressed); 
});
document.getElementById('wizUntil').addEventListener('change', (e)=>{ wiz.until = e.target.value || null; });

// After DOM defined: prefill wiz.start from defaults on open
function prefillWizardDefaults(){
  const hSel=document.getElementById('wizStartHour');
  const mSel=document.getElementById('wizStartMin');
  if(hSel && !hSel.value) hSel.value='09';
  if(mSel && !mSel.value) mSel.value='00';
  // Reset repeat UI each time wizard opens
  wiz.repeat = false;
  wiz.days.clear();
  const toggle = document.getElementById('wizRepeatToggle');
  if(toggle) toggle.setAttribute('aria-pressed','false');
  const daysCtn = document.getElementById('wizDaysCtn');
  const untilCtn = document.getElementById('wizUntilCtn');
  if(daysCtn) daysCtn.classList.add('hidden');
  if(untilCtn) untilCtn.classList.add('hidden');
}
const _openWizard = openWizard; openWizard = function(){ _openWizard(); prefillWizardDefaults(); if(typeof updateStartFromControls==='function') updateStartFromControls(); };

// --- Init calendar controls and first render ---
(function initCalendar(){
  try{ buildLegend(); }catch(e){ console.error('Legend build failed', e); }
  try{ render(); }catch(e){ console.error('Render failed', e); }
  const prev = document.getElementById('prevPeriod');
  const next = document.getElementById('nextPeriod');
  const today = document.getElementById('todayBtn');
  const mbtn = document.getElementById('viewMonth');
  const wbtn = document.getElementById('viewWeek');
  if(prev) prev.addEventListener('click', ()=>{ anchor = (view==='month') ? new Date(anchor.getFullYear(), anchor.getMonth()-1, 1) : addDays(anchor, -7); render(); });
  if(next) next.addEventListener('click', ()=>{ anchor = (view==='month') ? new Date(anchor.getFullYear(), anchor.getMonth()+1, 1) : addDays(anchor, 7); render(); });
  if(today) today.addEventListener('click', ()=>{ anchor = new Date(); render(); });
  if(mbtn) mbtn.addEventListener('click', ()=>{ view='month'; localStorage.setItem('view','month'); render(); });
  if(wbtn) wbtn.addEventListener('click', ()=>{ view='week'; localStorage.setItem('view','week'); render(); });
})();

// --- Dark mode: hardwire to local sunset for Marietta, SC 29661 ---
// Approx coords: 35.0260°N, -82.5115°W; simple fixed sunset times by month as a heuristic.
// This avoids external APIs. Adjust as desired.
(function sunsetDarkMode(){
  const sunsetByMonth = {1:'17:35',2:'18:02',3:'19:23',4:'19:51',5:'20:17',6:'20:35',7:'20:34',8:'20:11',9:'19:31',10:'18:51',11:'17:25',12:'17:17'};
  function shouldDark(){
    try{
      const now=new Date(); const mm=now.getMonth()+1; const s=sunsetByMonth[mm]||'19:00';
      const [sh,sm]=s.split(':').map(x=>parseInt(x,10));
      const sunset=new Date(now); sunset.setHours(sh,sm,0,0);
  const sunrise=new Date(now); sunrise.setHours(6,45,0,0);
      return (now>=sunset || now<sunrise);
    }catch{ return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; }
  }
  function apply(){ document.documentElement.classList.toggle('dark', shouldDark()); }
  apply();
  setInterval(apply, 60*1000);
})();

// --- Edit Series Wizard logic ---
const btnOpenEditSeries = document.getElementById('btnOpenEditSeries');
const eSelect = document.getElementById('eEmployee');
const eDaysCtn = document.getElementById('eDays');
const eOverlay = document.getElementById('editSeriesOverlay');
const eBackBtn = document.getElementById('eBack');
const eNextBtn = document.getElementById('eNext');
const eCancelBtn = document.getElementById('eCancel');
const eStartHour12 = document.getElementById('eStartHour12');
const eStartMin = document.getElementById('eStartMin');
const eEndHour12 = document.getElementById('eEndHour12');
const eEndMin = document.getElementById('eEndMin');
const eUntil = document.getElementById('eUntil');
const eReview = document.getElementById('eReview');

const eWiz = { step:1, employeeId:null, time:null, end:null, days:new Set(), until:null };

function eShowStep(n){
  eWiz.step=n;
  for(let i=1;i<=5;i++){
    const stepEl = document.getElementById('eStep'+i);
    if(stepEl) stepEl.classList.toggle('hidden', i!==n);
  }
  eBackBtn.classList.toggle('hidden', n===1);
  eNextBtn.textContent = (n===5? 'Update series' : 'Next');
  if(n===5) eBuildReview();
}

// Convert 24h time to 12h + AM/PM for edit wizards
function to12hFormat(hour24) {
  const h = parseInt(hour24, 10);
  const hour12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const ampm = h < 12 ? 'AM' : 'PM';
  return { hour12: pad2(hour12), ampm };
}

// Set AM/PM buttons for edit wizards
function setAmPmButtons(prefix, ampm) {
  const amBtn = document.getElementById(prefix + 'AM');
  const pmBtn = document.getElementById(prefix + 'PM');
  if (amBtn && pmBtn) {
    amBtn.classList.toggle('active', ampm === 'AM');
    pmBtn.classList.toggle('active', ampm === 'PM');
    amBtn.setAttribute('aria-pressed', ampm === 'AM' ? 'true' : 'false');
    pmBtn.setAttribute('aria-pressed', ampm === 'PM' ? 'true' : 'false');
  }
}

// Get selected AM/PM value for edit wizards
function getEditAmPm(prefix) {
  const amBtn = document.getElementById(prefix + 'AM');
  const pmBtn = document.getElementById(prefix + 'PM');
  return amBtn && amBtn.classList.contains('active') ? 'AM' : 'PM';
}

function openEditWizard(){
  if(!currentShift || !currentShift.series_id) return;
  // Hide the context menu but preserve the selected shift for the wizard flow
  if(menu && menu.style.display==='block') closeMenu(true);
  // populate employees select
  if(eSelect){
    eSelect.innerHTML = '<option value="">Keep current</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  }
  // build weekday chips once
  if(eDaysCtn && !eDaysCtn.dataset.built){
    const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
    labels.forEach((lb,idx)=>{ const lab=document.createElement('label'); lab.className='chip'; lab.innerHTML=`<input type="checkbox" value="${idx}" class="e-day"> ${lb}`; eDaysCtn.appendChild(lab); });
    eDaysCtn.dataset.built='1';
    eDaysCtn.addEventListener('change', (e)=>{ if(e.target && e.target.classList.contains('e-day')){ const v=parseInt(e.target.value,10); if(e.target.checked) eWiz.days.add(v); else eWiz.days.delete(v); } });
  }
  // reset selections
  eWiz.step=1; eWiz.employeeId=null; eWiz.time=null; eWiz.end=null; eWiz.days.clear(); eWiz.until=null;
  if(eSelect) eSelect.value='';
  
  // Convert current shift times to 12-hour format
  if(eStartHour12 && eStartMin) {
    const startTime = to12hFormat(currentShift.start.getHours());
    eStartHour12.value = startTime.hour12;
    eStartMin.value = pad2(currentShift.start.getMinutes());
    setAmPmButtons('eStart', startTime.ampm);
  }
  
  if(eEndHour12 && eEndMin) {
    if(currentShift.end) {
      const endTime = to12hFormat(currentShift.end.getHours());
      eEndHour12.value = endTime.hour12;
      eEndMin.value = pad2(currentShift.end.getMinutes());
      setAmPmButtons('eEnd', endTime.ampm);
    } else {
      eEndHour12.value = '';
      eEndMin.value = '';
      setAmPmButtons('eEnd', 'AM');
    }
  }
  
  if(eUntil) eUntil.value = '';
  // preselect weekday of current shift
  const curWd = (currentShift.start.getDay()+6)%7; // 0=Mon
  eDaysCtn.querySelectorAll('input.e-day').forEach((cb,idx)=>{ cb.checked = (idx===curWd); if(idx===curWd) eWiz.days.add(idx); else eWiz.days.delete(idx); });

  // Explicitly show overlay (base .overlay has display:none)
  eOverlay.classList.remove('is-hidden');
  eOverlay.style.display='flex';
  eShowStep(1);
}

function eClose(){ eOverlay.classList.add('is-hidden'); eOverlay.style.display='none'; }

function eBuildReview(){
  const empId = eSelect && eSelect.value ? parseInt(eSelect.value,10) : null;
  const empName = empId ? (employeesData.find(e=>e.id===empId)||{}).name : 'Keep current';
  const startAmpm = getEditAmPm('eStart');
  const timeStr = `${eStartHour12.value}:${eStartMin.value} ${startAmpm}`;
  let endStr = 'None';
  if(eEndHour12.value && eEndMin.value) {
    const endAmpm = getEditAmPm('eEnd');
    endStr = `${eEndHour12.value}:${eEndMin.value} ${endAmpm}`;
  }
  const days=[...eWiz.days].sort().map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', ');
  const untilStr = eUntil.value || 'End of year';
  eReview.textContent = `${empName} • ${timeStr} – ${endStr} • ${days||'none'} • until ${untilStr}`;
}

if(btnOpenEditSeries){ btnOpenEditSeries.addEventListener('click', (ev)=>{ ev.stopPropagation(); openEditWizard(); }); }
if(eCancelBtn){ eCancelBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); eClose(); }); }
if(eBackBtn){ eBackBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); eShowStep(Math.max(1, eWiz.step-1)); }); }
if(eNextBtn){ eNextBtn.addEventListener('click', async (ev)=>{
  ev.stopPropagation();
  if(eWiz.step===1){
    eWiz.employeeId = eSelect && eSelect.value ? parseInt(eSelect.value,10) : null; eShowStep(2); return;
  }
  if(eWiz.step===2){
    const sh12 = eStartHour12 ? eStartHour12.value : '';
    const sm = eStartMin ? eStartMin.value : '';
    const sAmpm = getEditAmPm('eStart');
    if(!sh12 || !sm) return alert('Pick a start time');
    
    // Validate end time if provided
    if(eEndHour12 && eEndMin && eEndHour12.value && eEndMin.value){
      const eh12 = eEndHour12.value;
      const em = eEndMin.value;
      const eAmpm = getEditAmPm('eEnd');
      
      // Convert to 24h for comparison
      const startHour24 = to24h(sh12, sAmpm);
      const endHour24 = to24h(eh12, eAmpm);
      const st = parseInt(startHour24,10)*60 + parseInt(sm,10);
      const et = parseInt(endHour24,10)*60 + parseInt(em,10);
      if(et<=st) return alert('End must be after start');
    }
    eShowStep(3); return;
  }
  if(eWiz.step===3){ if(!eWiz.days.size) return alert('Select at least one weekday'); eShowStep(4); return; }
  if(eWiz.step===4){ eWiz.until = eUntil && eUntil.value ? eUntil.value : null; eShowStep(5); return; }
  if(eWiz.step===5){
    try{
      const startDate = (function(){ const d=new Date(currentShift.start); const w=(d.getDay()+6)%7; d.setHours(0,0,0,0); d.setDate(d.getDate()-w); return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; })();
      
      // Convert 12-hour format to 24-hour for backend
      const sh12 = eStartHour12 ? eStartHour12.value : '';
      const sm = eStartMin ? eStartMin.value : '';
      const sAmpm = getEditAmPm('eStart');
      const sh24 = to24h(sh12, sAmpm);
      const time = `${sh24}:${sm}`;
      
      let end_time = null;
      if(eEndHour12 && eEndMin && eEndHour12.value && eEndMin.value) {
        const eh12 = eEndHour12.value;
        const em = eEndMin.value;
        const eAmpm = getEditAmPm('eEnd');
        const eh24 = to24h(eh12, eAmpm);
        end_time = `${eh24}:${em}`;
      }
      
      const payload = {
        series_id: currentShift.series_id,
        start_date: startDate,
        time,
        end_time,
        weekdays: [...eWiz.days].sort(),
        repeat_until: eWiz.until,
      };
      if(eWiz.employeeId) payload.employee_id = eWiz.employeeId;
      console.log('[EditSeries] POST', API.updateSeries, payload);
      const resp = await postJSON(API.updateSeries, payload);
      console.log('[EditSeries] response', resp);
      location.reload();
    }catch(err){ console.error('[EditSeries] failed', err); alert('Failed to update series: '+(err && err.message ? err.message : err)); }
  }
}); }

// --- Edit Day Wizard logic ---
const btnOpenEditDay = document.getElementById('btnOpenEditDay');
const dSelect = document.getElementById('dEmployee');
const dOverlay = document.getElementById('editDayOverlay');
const dBackBtn = document.getElementById('dBack');
const dNextBtn = document.getElementById('dNext');
const dCancelBtn = document.getElementById('dCancel');
const dStartHour12 = document.getElementById('dStartHour12');
const dStartMin = document.getElementById('dStartMin');
const dEndHour12 = document.getElementById('dEndHour12');
const dEndMin = document.getElementById('dEndMin');
const dReview = document.getElementById('dReview');

const dWiz = { step:1, employeeId:null, time:null, end:null };

function dShowStep(n){
  dWiz.step=n;
  for(let i=1;i<=3;i++){
    const stepEl = document.getElementById('dStep'+i);
    if(stepEl) stepEl.classList.toggle('hidden', i!==n);
  }
  dBackBtn.classList.toggle('hidden', n===1);
  dNextBtn.textContent = (n===3? 'Update day' : 'Next');
  if(n===3) dBuildReview();
}

function openEditDayWizard(){
  if(!currentShift) return;
  // Hide the context menu but preserve the selected shift for the wizard flow
  if(menu && menu.style.display==='block') closeMenu(true);
  // populate employees select
  if(dSelect){
    dSelect.innerHTML = '<option value="">Keep current</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join('');
  }
  // reset selections
  dWiz.step=1; dWiz.employeeId=null; dWiz.time=null; dWiz.end=null;
  if(dSelect) dSelect.value='';
  
  // Convert current shift times to 12-hour format
  if(dStartHour12 && dStartMin) {
    const startTime = to12hFormat(currentShift.start.getHours());
    dStartHour12.value = startTime.hour12;
    dStartMin.value = pad2(currentShift.start.getMinutes());
    setAmPmButtons('dStart', startTime.ampm);
  }
  
  if(dEndHour12 && dEndMin) {
    if(currentShift.end) {
      const endTime = to12hFormat(currentShift.end.getHours());
      dEndHour12.value = endTime.hour12;
      dEndMin.value = pad2(currentShift.end.getMinutes());
      setAmPmButtons('dEnd', endTime.ampm);
    } else {
      dEndHour12.value = '';
      dEndMin.value = '';
      setAmPmButtons('dEnd', 'AM');
    }
  }

  // Explicitly show overlay
  dOverlay.classList.remove('is-hidden');
  dOverlay.style.display='flex';
  dShowStep(1);
}

function dClose(){ dOverlay.classList.add('is-hidden'); dOverlay.style.display='none'; }

function dBuildReview(){
  const empId = dSelect && dSelect.value ? parseInt(dSelect.value,10) : null;
  const empName = empId ? (employeesData.find(e=>e.id===empId)||{}).name : 'Keep current';
  const startAmpm = getEditAmPm('dStart');
  const timeStr = `${dStartHour12.value}:${dStartMin.value} ${startAmpm}`;
  let endStr = 'None';
  if(dEndHour12.value && dEndMin.value) {
    const endAmpm = getEditAmPm('dEnd');
    endStr = `${dEndHour12.value}:${dEndMin.value} ${endAmpm}`;
  }
  const dateStr = currentShift.start.toLocaleDateString();
  dReview.textContent = `${empName} • ${dateStr} • ${timeStr} – ${endStr} • Single day only`;
}

if(btnOpenEditDay){ btnOpenEditDay.addEventListener('click', (ev)=>{ ev.stopPropagation(); openEditDayWizard(); }); }
if(dCancelBtn){ dCancelBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); dClose(); }); }
if(dBackBtn){ dBackBtn.addEventListener('click', (ev)=>{ ev.stopPropagation(); dShowStep(Math.max(1, dWiz.step-1)); }); }
if(dNextBtn){ dNextBtn.addEventListener('click', async (ev)=>{
  ev.stopPropagation();
  if(dWiz.step===1){
    dWiz.employeeId = dSelect && dSelect.value ? parseInt(dSelect.value,10) : null; dShowStep(2); return;
  }
  if(dWiz.step===2){
    const sh12 = dStartHour12 ? dStartHour12.value : '';
    const sm = dStartMin ? dStartMin.value : '';
    const sAmpm = getEditAmPm('dStart');
    if(!sh12 || !sm) return alert('Pick a start time');
    
    // Validate end time if provided
    if(dEndHour12 && dEndMin && dEndHour12.value && dEndMin.value){
      const eh12 = dEndHour12.value;
      const em = dEndMin.value;
      const eAmpm = getEditAmPm('dEnd');
      
      // Convert to 24h for comparison
      const startHour24 = to24h(sh12, sAmpm);
      const endHour24 = to24h(eh12, eAmpm);
      const st = parseInt(startHour24,10)*60 + parseInt(sm,10);
      const et = parseInt(endHour24,10)*60 + parseInt(em,10);
      if(et<=st) return alert('End must be after start');
    }
    dShowStep(3); return;
  }
  if(dWiz.step===3){
    try{
      // Convert 12-hour format to 24-hour for backend
      const sh12 = dStartHour12 ? dStartHour12.value : '';
      const sm = dStartMin ? dStartMin.value : '';
      const sAmpm = getEditAmPm('dStart');
      const sh24 = to24h(sh12, sAmpm);
      const time = `${sh24}:${sm}`;
      
      let end_time = null;
      if(dEndHour12 && dEndMin && dEndHour12.value && dEndMin.value) {
        const eh12 = dEndHour12.value;
        const em = dEndMin.value;
        const eAmpm = getEditAmPm('dEnd');
        const eh24 = to24h(eh12, eAmpm);
        end_time = `${eh24}:${em}`;
      }
      
      // Create the payload for single day edit
      const shiftDate = currentShift.start.toISOString().split('T')[0]; // YYYY-MM-DD format
      const payload = {
        shift_id: currentShift.id,
        shift_date: shiftDate,
        time,
        end_time,
      };
      if(dWiz.employeeId) payload.employee_id = dWiz.employeeId;
      
      console.log('[EditDay] POST', '/api/edit_day', payload);
      const resp = await postJSON('/api/edit_day', payload);
      console.log('[EditDay] response', resp);
      location.reload();
    }catch(err){ console.error('[EditDay] failed', err); alert('Failed to update day: '+(err && err.message ? err.message : err)); }
  }
}); }

// Close edit day wizard when clicking outside modal
if(dOverlay){ dOverlay.addEventListener('click', (e)=>{ if(e.target===dOverlay) dClose(); }); }

// Close edit wizard when clicking outside modal
if(eOverlay){ eOverlay.addEventListener('click', (e)=>{ if(e.target===eOverlay) eClose(); }); }
