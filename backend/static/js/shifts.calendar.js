// Phase 2 split: Calendar rendering
let view = (function(){ const saved=localStorage.getItem('view'); if(saved) return saved; const v = window.innerWidth<800 ? 'week':'month'; localStorage.setItem('view', v); return v; })();
let anchor = new Date();

function render(){ if(view==='month') buildMonth(); else buildWeek(); }

function buildMonth(){
  const grid=document.getElementById('grid'); if(!grid) return; grid.innerHTML='';
  const today=new Date(anchor); const shown=new Date(today.getFullYear(), today.getMonth(), 1);
  const monthStart=startOfMonth(shown); const firstCell=startOfWeek(monthStart);
  const label=document.getElementById('periodLabel'); if(label) label.textContent=shown.toLocaleDateString(undefined,{month:'long',year:'numeric'});
  const currentWeekStart=startOfWeek(new Date());
  for(let i=0;i<42;i++) renderDayCell(addDays(firstCell,i), shown.getMonth(), currentWeekStart, grid);
}

function buildWeek(){
  const grid=document.getElementById('grid'); if(!grid) return; grid.innerHTML='';
  const weekStart=startOfWeek(anchor); const weekEnd=addDays(weekStart,6);
  const label=document.getElementById('periodLabel'); if(label) label.textContent=`${weekStart.toLocaleDateString(undefined,{month:'short',day:'numeric'})} – ${weekEnd.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'})}`;
  for(let i=0;i<7;i++) renderDayCell(addDays(weekStart,i), weekStart.getMonth(), weekStart, grid);
}

function renderDayCell(day, shownMonth, currentWeekStart, grid){
  const cell=document.createElement('div'); cell.className='cell';
  if(day.getMonth()!==shownMonth) cell.classList.add('dim');
  const isCurrentWeek=startOfWeek(day).getTime()===currentWeekStart.getTime(); if(isCurrentWeek) cell.classList.add('current-week');
  const today=new Date(); today.setHours(0,0,0,0); const isToday=day.getTime()===today.getTime(); if(isToday) cell.classList.add('today-cell');
  const dateTag=document.createElement('div'); dateTag.className='date-tag';
  const dateNum=document.createElement('span'); dateNum.textContent=fmtDayLabel(day); dateTag.appendChild(dateNum);
  if(isToday){ const todayBadge=document.createElement('span'); todayBadge.className='today-dot'; dateTag.appendChild(todayBadge); }
  cell.appendChild(dateTag);
  const add=document.createElement('button'); add.className='add-btn'; add.type='button'; add.textContent='Add'; add.addEventListener('click',(e)=>{ e.stopPropagation(); openWizardWithDate(day); }); cell.appendChild(add);
  const pills=document.createElement('div'); pills.className='pills'; cell.appendChild(pills);
  const dayStr=localDateStr(day); const items=dayIndex[dayStr]||[];
  const dayShifts=items.map(s=>({ id:s.id,name:s.name,start:new Date(s.shift_time), end:s.end_time? new Date(`${dayStr}T${s.end_time.slice(11,16)}`):null, series_id:s.series_id, employee_id:s.employee_id }));
  const cov=getCov(); const ATT_START=cov.a, ATT_END=cov.b;
  let intervals=[]; for(const sh of dayShifts){ const st=sh.start.getHours()*60+sh.start.getMinutes(); const et=sh.end? sh.end.getHours()*60+sh.end.getMinutes():(st+60); const a=Math.max(ATT_START,st), b=Math.min(ATT_END,et); if(b>a) intervals.push([a,b]); }
  intervals.sort((x,y)=>x[0]-y[0]); let merged=[]; for(const iv of intervals){ if(!merged.length||iv[0]>merged[merged.length-1][1]) merged.push(iv); else merged[merged.length-1][1]=Math.max(merged[merged.length-1][1],iv[1]); }
  let covered=0; merged.forEach(([a,b])=>covered+=(b-a)); if(covered<(ATT_END-ATT_START)){ const badge=document.createElement('span'); badge.className='gap-badge'; badge.textContent='Coverage gap'; cell.classList.add('needs-attention'); cell.appendChild(badge); }
  dayShifts.forEach(sh=>{ const cls=nameToEventClass(sh.name); const ev=document.createElement('div'); ev.className='event '+cls; const timelabel=`${to12h(sh.start)}${sh.end?'–'+to12h(sh.end):''}`; ev.innerHTML=`<span>${timelabel} ${sh.name}</span>`; ev.dataset.shiftId=sh.id; ev.dataset.seriesId=sh.series_id||''; ev.dataset.employeeId=sh.employee_id; ev.addEventListener('click',(e)=>{ e.stopPropagation(); if(selectionMode){ toggleSelect(ev, sh.id, sh.series_id); } else { openMenu(e, sh); } }); ev.addEventListener('contextmenu',(e)=>{ e.preventDefault(); e.stopPropagation(); if(selectionMode){ toggleSelect(ev, sh.id, sh.series_id); } else { openMenu(e, sh); } }); pills.appendChild(ev); });
  grid.appendChild(cell);
}

function buildLegend(){ const legend=document.getElementById('calendarLegend'); if(!legend) return; legend.innerHTML=''; const names=[...new Set(shiftsData.map(s=>s.name))].sort((a,b)=>a.localeCompare(b)); names.forEach(n=>{ const cls=nameToEventClass(n); const item=document.createElement('div'); item.className='legend-item'; const sw=document.createElement('span'); sw.className='legend-swatch '+cls; const label=document.createElement('span'); label.textContent=n; item.append(sw,label); legend.appendChild(item); }); }

// Init calendar & navigation
(function initCalendar(){ try{ buildLegend(); }catch(e){ console.error('Legend build failed', e); } try{ render(); }catch(e){ console.error('Render failed', e); } const prev=document.getElementById('prevPeriod'); const next=document.getElementById('nextPeriod'); const today=document.getElementById('todayBtn'); const mbtn=document.getElementById('viewMonth'); const wbtn=document.getElementById('viewWeek'); if(prev) prev.addEventListener('click',()=>{ anchor=(view==='month')? new Date(anchor.getFullYear(), anchor.getMonth()-1,1): addDays(anchor,-7); render(); }); if(next) next.addEventListener('click',()=>{ anchor=(view==='month')? new Date(anchor.getFullYear(), anchor.getMonth()+1,1): addDays(anchor,7); render(); }); if(today) today.addEventListener('click',()=>{ anchor=new Date(); render(); }); if(mbtn) mbtn.addEventListener('click',()=>{ view='month'; localStorage.setItem('view','month'); render(); }); if(wbtn) wbtn.addEventListener('click',()=>{ view='week'; localStorage.setItem('view','week'); render(); }); })();

// End calendar module
