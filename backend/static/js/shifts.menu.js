// Phase 2 split: Selection mode & context menu
let selectionMode=false; const selected=new Set(); const selectedMap=new Map();
function updateDeleteSelectedLabel(){ const b=document.getElementById('btnDeleteSelected'); if(b) b.textContent=`Delete selected (${selected.size})`; }
function toggleSelect(pill,id,seriesId){ if(selected.has(id)){ selected.delete(id); selectedMap.delete(id); pill.classList.remove('selected'); } else { selected.add(id); selectedMap.set(id, seriesId||null); pill.classList.add('selected'); } updateDeleteSelectedLabel(); }

document.getElementById('btnSelectMode').addEventListener('click',()=>{ selectionMode=!selectionMode; document.getElementById('btnDeleteSelected').classList.toggle('hidden', !selectionMode); document.getElementById('btnSelectMode').textContent=selectionMode? 'Cancel selection':'Select shifts'; selected.clear(); selectedMap.clear(); updateDeleteSelectedLabel(); document.querySelectorAll('.pill.selected').forEach(el=>el.classList.remove('selected')); });

document.getElementById('btnDeleteSelected').addEventListener('click', async ()=>{ if(!selected.size) return alert('No shifts selected'); const hasSeries=[...selectedMap.values()].some(v=>!!v); let deleteSeriesToo=false; if(hasSeries){ deleteSeriesToo=confirm('Some selected shifts are part of a series. OK=delete entire series; Cancel=only selected occurrences.'); } try{ const ops=[]; if(deleteSeriesToo){ const seriesIds=[...new Set([...selectedMap.values()].filter(Boolean))]; seriesIds.forEach(sid=>ops.push(postJSON(API.deleteSeries,{series_id:sid}))); const singles=[...selectedMap.entries()].filter(([id,sid])=>!sid).map(([id])=>id); singles.forEach(id=>ops.push(postJSON(API.deleteShift,{shift_id:id}))); } else { [...selected].forEach(id=>ops.push(postJSON(API.deleteShift,{shift_id:id}))); } await Promise.all(ops); location.reload(); }catch(e){ alert('Failed to delete selected: '+e.message); } });

document.addEventListener('keydown',(e)=>{ if(e.key==='Escape' && selectionMode){ document.getElementById('btnSelectMode').click(); }});

let currentShift=null; const menu=document.getElementById('shiftMenu'); let menuAnchor={x:0,y:0};
function positionMenuNear(x,y){ if(!menu) return; menu.style.display='block'; menu.style.left='0px'; menu.style.top='0px'; const rect=menu.getBoundingClientRect(); const w=rect.width||menu.offsetWidth; const h=rect.height||menu.offsetHeight; const pad=8; const left=Math.min(Math.max(pad, (typeof x==='number'? x:pad)), Math.max(pad, window.innerWidth-w-pad)); const top=Math.min(Math.max(pad, (typeof y==='number'? y:pad)), Math.max(pad, window.innerHeight-h-pad)); menu.style.left=left+'px'; menu.style.top=top+'px'; }
function openMenu(evt, sh){ currentShift=sh; document.getElementById('menuTitle').textContent=`${sh.name} • ${sh.start.toLocaleString()}`; const btnSeries=document.getElementById('btnDeleteSeries'); btnSeries.classList.toggle('hidden', !sh.series_id); const editRow=document.getElementById('editSeriesRow'); if(editRow) editRow.classList.toggle('is-hidden', !sh.series_id); const sel=document.getElementById('swapSelect'); sel.innerHTML='<option value="">Swap to…</option>' + employeesData.map(e=>`<option value="${e.id}">${e.name}</option>`).join(''); const cov=getCov(); const shh=pad2(Math.floor(cov.a/60)), smm=pad2(cov.a%60); const ehh=pad2(Math.floor(cov.b/60)), emm=pad2(cov.b%60); const csH=document.getElementById('covStartHour'), csM=document.getElementById('covStartMin'); const ceH=document.getElementById('covEndHour'), ceM=document.getElementById('covEndMin'); if(csH) csH.value=shh; if(csM) csM.value=smm; if(ceH) ceH.value=ehh; if(ceM) ceM.value=emm; menuAnchor={x:evt.clientX,y:evt.clientY}; positionMenuNear(menuAnchor.x, menuAnchor.y); menu.setAttribute('tabindex','-1'); menu.focus(); }
function closeMenu(preserveShift=false){ menu.style.display='none'; if(!preserveShift) currentShift=null; }

// Delete single shift button (clear listeners then attach)
(function(){ const oldBtn=document.getElementById('btnDeleteShift'); if(oldBtn){ const newBtn=oldBtn.cloneNode(true); oldBtn.parentNode.replaceChild(newBtn, oldBtn); newBtn.addEventListener('click', async ()=>{ if(!currentShift) return; try{ if(currentShift.series_id){ if(!confirm('Delete this shift occurrence?')) return; await postJSON(API.deleteShift,{shift_id:currentShift.id}); } else { if(!confirm('Delete this shift?')) return; await postJSON(API.deleteShift,{shift_id:currentShift.id}); } location.reload(); }catch(e){ alert('Failed to delete: '+e.message); } }); } })();

document.getElementById('btnDeleteSeries').addEventListener('click', async ()=>{ if(!currentShift || !currentShift.series_id) return; if(!confirm('Delete ALL occurrences in this series? This cannot be undone.')) return; try{ await postJSON(API.deleteSeries,{series_id:currentShift.series_id}); location.reload(); }catch(e){ alert('Failed to delete series: '+e.message); } });
document.getElementById('btnSwap').addEventListener('click', async ()=>{ if(!currentShift) return; const sel=document.getElementById('swapSelect'); const val=sel.value; if(!val) return alert('Select a caregiver to swap to'); try{ await postJSON(API.swapShift,{ shift_id:currentShift.id, new_employee_id: parseInt(val,10)}); location.reload(); }catch(e){ alert('Failed to swap: '+e.message); } });

document.getElementById('btnSaveCoverage').addEventListener('click',()=>{ const sh=document.getElementById('covStartHour').value||'09'; const sm=document.getElementById('covStartMin').value||'00'; const eh=document.getElementById('covEndHour').value||'21'; const em=document.getElementById('covEndMin').value||'00'; const a=parseInt(sh,10)*60+parseInt(sm,10); const b=parseInt(eh,10)*60+parseInt(em,10); if(b<=a) return alert('Coverage end must be after start'); setCov(a,b); closeMenu(); render(); });
document.getElementById('btnCloseMenu').addEventListener('click',()=> closeMenu());
window.addEventListener('click',(e)=>{ if(menu.style.display==='block' && !menu.contains(e.target) && !e.target.closest('.pill')){
	// Preserve selected shift if any edit overlay (series or day) is open
	const isSeriesOpen = (typeof eOverlay!=='undefined' && eOverlay && eOverlay.style.display==='flex' && !eOverlay.classList.contains('is-hidden'));
	const dayOverlay = document.getElementById('editDayOverlay');
	const isDayOpen = (dayOverlay && dayOverlay.style.display==='flex' && !dayOverlay.classList.contains('is-hidden'));
	if(isSeriesOpen || isDayOpen) closeMenu(true); else closeMenu();
} });
window.addEventListener('resize',()=>{ if(menu.style.display==='block'){ positionMenuNear(menuAnchor.x, menuAnchor.y); } });

// End menu module
