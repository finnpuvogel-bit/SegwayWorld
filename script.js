const $ = (id) => document.getElementById(id);
const outputMap = { 'iqfw-range':['iqfw-val',' A'], 'engage-range':['engage-val',' km/h'], 'scale-range':['scale-val',''], 'fw-amp-range':['fw-amp-val',' A'], 'fw-cap-range':['fw-cap-val',' A'], 'fw-startspeed-range':['fw-startspeed-val',' km/h'], 'fw-ramp-range':['fw-ramp-val',' mA/km/h'], 'overdrive-range':['overdrive-val',' %'], 'tacho-range':['tacho-val',''] };
Object.entries(outputMap).forEach(([inputId,[outputId,suffix]]) => { const input=$(inputId), output=$(outputId); if(!input||!output)return; const update=()=>output.textContent=`${input.value}${suffix}`; input.addEventListener('input',update); update(); });
const terminal=$('terminal-out');
function log(message){ if(!terminal)return; const line=document.createElement('div'); line.textContent=`[action] ${message}`; terminal.appendChild(line); terminal.scrollTop=terminal.scrollHeight; }
function setConnection(connected){ const status=$('connection-status'); if(!status)return; status.className=`status-pill ${connected?'status-connected':'status-disconnected'}`; status.textContent=connected?'● Verbunden':'● Nicht verbunden'; }
$('btn-connect')?.addEventListener('click',()=>{ const connected=$('connection-status').classList.contains('status-connected'); setConnection(!connected); $('btn-connect').textContent=connected?'⚡ Scooter Verbinden':'Trennen'; log(connected?'Scooter getrennt':'Simulation/Verbindung aktiviert'); });
$('btn-sim')?.addEventListener('click',(event)=>{ event.currentTarget.textContent='Simulation aktiv'; setConnection(true); log('Simulation aktiv - keine Hardware verbunden'); });
$('btn-clear-term')?.addEventListener('click',()=>{ if(terminal)terminal.textContent=''; });
$('btn-panic')?.addEventListener('click',()=>{ $('police-mode').checked=false; document.querySelectorAll('.switch input').forEach((input)=>{if(input.id!=='iqfw-toggle')input.checked=false}); log('Sicherheitsmodus zurückgesetzt'); });
$('btn-flash-mcu')?.addEventListener('click',()=>log('MCU-Parameter vorbereitet (Simulation)'));
$('btn-welcome-seq')?.addEventListener('click',()=>log('Welcome-Sequenz vorbereitet (Simulation)'));
document.querySelectorAll('.action-buttons-stack .btn').forEach((button)=>button.addEventListener('click',()=>log(`${button.textContent.trim()} ausgeführt`)));
document.querySelectorAll('.checkbox-item input,.switch input,.matrix-box input').forEach((input)=>input.addEventListener('change',()=>log(`${input.id||'Matrixwert'} geändert`)));
