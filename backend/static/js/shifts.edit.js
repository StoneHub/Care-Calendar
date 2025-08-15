// Phase 2 split: Edit Series & Edit Day wizards
const btnOpenEditSeries=document.getElementById('btnOpenEditSeries');
const eSelect=document.getElementById('eEmployee');
const eDaysCtn=document.getElementById('eDays');
const eOverlay=document.getElementById('editSeriesOverlay');
const eBackBtn=document.getElementById('eBack');
const eNextBtn=document.getElementById('eNext');
const eCancelBtn=document.getElementById('eCancel');
const eStartHour12=document.getElementById('eStartHour12');
const eStartMin=document.getElementById('eStartMin');
const eEndHour12=document.getElementById('eEndHour12');
const eEndMin=document.getElementById('eEndMin');
const eUntil=document.getElementById('eUntil');
const eReview=document.getElementById('eReview');
const eWiz={ step:1, employeeId:null, time:null, end:null, days:new Set(), until:null };

function eShowStep(n){ eWiz.step=n; for(let i=1;i<=5;i++){ const stepEl=document.getElementById('eStep'+i); if(stepEl) stepEl.classList.toggle('hidden', i!==n); } eBackBtn.classList.toggle('hidden', n===1); eNextBtn.textContent=(n===5? 'Update series':'Next'); if(n===5) eBuildReview(); }
function to12hFormat(hour24){ const h=parseInt(hour24,10); const hour12=h===0?12: h>12? h-12:h; const ampm=h<12?'AM':'PM'; return {hour12:pad2(hour12), ampm}; }
function setAmPmButtons(prefix, ampm){ const amBtn=document.getElementById(prefix+'AM'); const pmBtn=document.getElementById(prefix+'PM'); if(amBtn && pmBtn){ amBtn.classList.toggle('active', ampm==='AM'); pmBtn.classList.toggle('active', ampm==='PM'); amBtn.setAttribute('aria-pressed', ampm==='AM'?'true':'false'); pmBtn.setAttribute('aria-pressed', ampm==='PM'?'true':'false'); } }
function getEditAmPm(prefix){ const amBtn=document.getElementById(prefix+'AM'); const pmBtn=document.getElementById(prefix+'PM'); return amBtn && amBtn.classList.contains('active')? 'AM':'PM'; }

function openEditWizard(){ if(!currentShift || !currentShift.series_id) return; if(menu && menu.style.display==='block') closeMenu(true); if(eSelect){ eSelect.innerHTML='<option value="">Keep current</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join(''); }
  if(eDaysCtn && !eDaysCtn.dataset.built){ const labels=['Mon','Tue','Wed','Thu','Fri','Sat','Sun']; labels.forEach((lb,idx)=>{ const lab=document.createElement('label'); lab.className='chip'; lab.innerHTML=`<input type="checkbox" value="${idx}" class="e-day"> ${lb}`; eDaysCtn.appendChild(lab); }); eDaysCtn.dataset.built='1'; eDaysCtn.addEventListener('change',(e)=>{ if(e.target && e.target.classList.contains('e-day')){ const v=parseInt(e.target.value,10); if(e.target.checked) eWiz.days.add(v); else eWiz.days.delete(v); } }); }
  eWiz.step=1; eWiz.employeeId=null; eWiz.time=null; eWiz.end=null; eWiz.days.clear(); eWiz.until=null; if(eSelect) eSelect.value='';
  if(eStartHour12 && eStartMin){ const startTime=to12hFormat(currentShift.start.getHours()); eStartHour12.value=startTime.hour12; eStartMin.value=pad2(currentShift.start.getMinutes()); setAmPmButtons('eStart', startTime.ampm); }
  if(eEndHour12 && eEndMin){ if(currentShift.end){ const endTime=to12hFormat(currentShift.end.getHours()); eEndHour12.value=endTime.hour12; eEndMin.value=pad2(currentShift.end.getMinutes()); setAmPmButtons('eEnd', endTime.ampm); } else { eEndHour12.value=''; eEndMin.value=''; setAmPmButtons('eEnd','AM'); } }
  if(eUntil) eUntil.value=''; const curWd=(currentShift.start.getDay()+6)%7; eDaysCtn.querySelectorAll('input.e-day').forEach((cb,idx)=>{ cb.checked=(idx===curWd); if(idx===curWd) eWiz.days.add(idx); else eWiz.days.delete(idx); }); eOverlay.classList.remove('is-hidden'); eOverlay.style.display='flex'; eShowStep(1); }
function eClose(){ eOverlay.classList.add('is-hidden'); eOverlay.style.display='none'; }
function eBuildReview(){ const empId=eSelect && eSelect.value? parseInt(eSelect.value,10):null; const empName=empId? (employeesData.find(e=>e.id===empId)||{}).name:'Keep current'; const startAmpm=getEditAmPm('eStart'); const timeStr=`${eStartHour12.value}:${eStartMin.value} ${startAmpm}`; let endStr='None'; if(eEndHour12.value && eEndMin.value){ const endAmpm=getEditAmPm('eEnd'); endStr=`${eEndHour12.value}:${eEndMin.value} ${endAmpm}`; } const days=[...eWiz.days].sort().map(d=>['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][d]).join(', '); const untilStr=eUntil.value||'End of year'; eReview.textContent=`${empName} • ${timeStr} – ${endStr} • ${days||'none'} • until ${untilStr}`; }

if(btnOpenEditSeries){ btnOpenEditSeries.addEventListener('click',(ev)=>{ ev.stopPropagation(); openEditWizard(); }); }
if(eCancelBtn){ eCancelBtn.addEventListener('click',(ev)=>{ ev.stopPropagation(); eClose(); }); }
if(eBackBtn){ eBackBtn.addEventListener('click',(ev)=>{ ev.stopPropagation(); eShowStep(Math.max(1, eWiz.step-1)); }); }
if(eNextBtn){ eNextBtn.addEventListener('click', async (ev)=>{ ev.stopPropagation(); if(eWiz.step===1){ eWiz.employeeId=eSelect && eSelect.value? parseInt(eSelect.value,10):null; eShowStep(2); return; } if(eWiz.step===2){ const sh12=eStartHour12? eStartHour12.value:''; const sm=eStartMin? eStartMin.value:''; const sAmpm=getEditAmPm('eStart'); if(!sh12 || !sm) return alert('Pick a start time'); if(eEndHour12 && eEndMin && eEndHour12.value && eEndMin.value){ const eh12=eEndHour12.value; const em=eEndMin.value; const eAmpm=getEditAmPm('eEnd'); const startHour24=to24h(sh12, sAmpm); const endHour24=to24h(eh12, eAmpm); const st=parseInt(startHour24,10)*60+parseInt(sm,10); const et=parseInt(endHour24,10)*60+parseInt(em,10); if(et<=st) return alert('End must be after start'); } eShowStep(3); return; } if(eWiz.step===3){ eShowStep(4); return; } if(eWiz.step===4){ eShowStep(5); return; } if(eWiz.step===5){ try{ const weekdays=[...eWiz.days]; const startDate=localDateStr(startOfWeek(currentShift.start)); const time=`${to24h(eStartHour12.value, getEditAmPm('eStart'))}:${eStartMin.value}`; let endTime=null; if(eEndHour12.value && eEndMin.value){ endTime=`${to24h(eEndHour12.value, getEditAmPm('eEnd'))}:${eEndMin.value}`; } const repeat_until=eUntil.value||null; await postJSON(API.updateSeries,{ series_id: currentShift.series_id, start_date:startDate, time, end_time:endTime, weekdays, repeat_until }); location.reload(); }catch(e){ alert('Failed to update series: '+e.message); } } }); }

// Edit Day wizard (d*)
const dOverlay=document.getElementById('editDayOverlay'); const dBack=document.getElementById('dBack'); const dNext=document.getElementById('dNext'); const dCancel=document.getElementById('dCancel'); const dStartHour12=document.getElementById('dStartHour12'); const dStartMin=document.getElementById('dStartMin'); const dEndHour12=document.getElementById('dEndHour12'); const dEndMin=document.getElementById('dEndMin'); const dReview=document.getElementById('dReview'); const dEmployee=document.getElementById('dEmployee'); const dStartAM=document.getElementById('dStartAM'); const dStartPM=document.getElementById('dStartPM'); const dEndAM=document.getElementById('dEndAM'); const dEndPM=document.getElementById('dEndPM');
const dWiz={ step:1, employeeId:null, end:null };
function dShowStep(n){ dWiz.step=n; for(let i=1;i<=3;i++) document.getElementById('dStep'+i).classList.toggle('hidden', i!==n); dBack.classList.toggle('hidden', n===1); dNext.textContent=(n===3?'Save':'Next'); if(n===3) dBuildReview(); }
function dBuildReview(){ const empName=dWiz.employeeId? (employeesData.find(e=>e.id===dWiz.employeeId)||{}).name:'Keep current'; const startAmpm=dStartAM.classList.contains('active')?'AM':'PM'; const startStr=`${dStartHour12.value}:${dStartMin.value} ${startAmpm}`; let endStr='None'; if(dEndHour12.value && dEndMin.value){ const endAmpm=dEndAM.classList.contains('active')?'AM':'PM'; endStr=`${dEndHour12.value}:${dEndMin.value} ${endAmpm}`; } dReview.textContent=`${empName} • ${startStr} – ${endStr}`; }

// Keep existing global escape handler from wizard module; no changes needed here.

// End edit module
