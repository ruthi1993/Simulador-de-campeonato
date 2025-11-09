/* --------- Configuración inicial (datos base hasta 24/10/2025) --------- */
const pilots = [

  {
    id: 'norris',
    name: 'Lando Norris',
    team: 'McLaren',
    basePoints: 390,
    baseWins: 7,
    points: 0,
    wins: 0,
    imgUrl: 'https://i.ibb.co/jv621jZ0/Norris.jpg'
  },
  {
    id: 'piastri',
    name: 'Oscar Piastri',
    team: 'McLaren',
    basePoints: 366,
    baseWins: 7,
    points: 0,
    wins: 0,
    imgUrl: 'https://i.ibb.co/tGw36PM/Piastri.jpg'
  },
  {
    id: 'verstappen',
    name: 'Max Verstappen',
    team: 'Red Bull',
    basePoints: 341,
    baseWins: 5,
    points: 0,
    wins: 0,
    imgUrl: 'https://i.ibb.co/VWLdQwhf/Verstappen.jpg'
  },
];

const racePoints = [25,18,15,12,10,8,6,4,2,1]; // 1..10
const sprintPoints = [8,7,6,5,4,3,2,1]; // 1..8

// Eventos restantes (con emoji de bandera)
const events = [
  { id:'lasvegas',      label:'🇺🇸 GP Las Vegas',  type:'race'   },
  { id:'sprint_qatar',  label:'🇶🇦 Sprint Qatar',  type:'sprint' },
  { id:'qatar',         label:'🇶🇦 GP Qatar',      type:'race'   },
  { id:'abudhabi',      label:'🇦🇪 GP Abu Dhabi',   type:'race'   }
];

// selections[eventId][pilotId] = string position ('1'..'20' or '')
const selections = {};
events.forEach(ev => { selections[ev.id] = {}; pilots.forEach(p => selections[ev.id][p.id] = ''); });

/* --------- Render controles (selects) --------- */
const eventsList = document.getElementById('eventsList');

function buildControls(){
  eventsList.innerHTML = '';
  events.forEach(ev => {
    const box = document.createElement('div');
    box.className = 'event';
    const h = document.createElement('h3'); h.textContent = ev.label + (ev.type==='sprint' ? ' — Sprint' : ' — Carrera');
    box.appendChild(h);

    pilots.forEach(p => {
      const row = document.createElement('div'); row.className = 'row';
      const lbl = document.createElement('label'); lbl.textContent = p.name;
      const sel = document.createElement('select');
      sel.dataset.event = ev.id; sel.dataset.pilot = p.id;
      // opciones  (vacío + 1..20)
      const optEmpty = document.createElement('option'); optEmpty.value=''; optEmpty.textContent='-'; sel.appendChild(optEmpty);
      for(let i=1;i<=20;i++){
        const o = document.createElement('option'); o.value = String(i); o.textContent = String(i);
        sel.appendChild(o);
      }
      sel.addEventListener('change', onSelectChange);
      row.appendChild(lbl); row.appendChild(sel); box.appendChild(row);
    });

    eventsList.appendChild(box);
  });
}

/* --------- Manejo de selección: evita duplicados (swapping) --------- */
function onSelectChange(e){
  const sel = e.target;
  const evId = sel.dataset.event;
  const pid = sel.dataset.pilot;
  const newVal = sel.value; // '' or '1'..'20'

  const otherSelects = [...document.querySelectorAll(`select[data-event="${evId}"]`)];
  const prevVal = selections[evId][pid] || '';

  if(newVal === prevVal) return;

  // Si la nueva posición es un número (1..20), chequeamos si hay colisión
  if(newVal !== ''){
    let collided = null;
    for(const s of otherSelects){
      if(s.dataset.pilot !== pid && s.value === newVal){
        collided = s; break;
      }
    }
    if(collided){
      // intercambiamos: collided toma prevVal (puede ser ''), y su DOM value se actualiza
      collided.value = prevVal;
      selections[evId][collided.dataset.pilot] = prevVal;
    }
  }

  selections[evId][pid] = newVal;
  // actualizamos inmediatamente la tabla y el podio
  updateStandings();
}

/* --------- Cálculo de la clasificación --------- */
function calculateStandingsSorted(){
  // reset con base
  pilots.forEach(p => { p.points = p.basePoints || 0; p.wins = p.baseWins || 0; });

  // aplicar cada evento
  events.forEach(ev => {
    const scheme = ev.type === 'sprint' ? sprintPoints : racePoints;
    // map pos->pilot
    const posMap = {};
    pilots.forEach(p => {
      const posStr = selections[ev.id][p.id];
      if(posStr && posStr !== '') {
        const pos = parseInt(posStr,10);
        if(!isNaN(pos)) posMap[pos] = p.id;
      }
    });
    // asignar según el esquema (solo hasta scheme.length). posiciones fuera de rango no suman.
    for(let pos=1; pos<=scheme.length; pos++){
      const pid = posMap[pos];
      if(pid){
        const pilot = pilots.find(x=>x.id===pid);
        pilot.points += scheme[pos-1];
        // victorias solo si es carrera y pos === 1
        if(ev.type === 'race' && pos === 1) pilot.wins += 1;
      }
    }
    // posiciones > scheme.length (ej. 11..20 en carrera o 9..20 en sprint) no suman puntos ni victorias
  });

  // ordenar por puntos desc, luego victorias desc (victorias solo de carreras)
  const sorted = [...pilots].sort((a,b) => {
    if(b.points !== a.points) return b.points - a.points;
    return b.wins - a.wins;
  });
  return sorted;
}

/* --------- Render tabla y podio (el podio centra al líder) --------- */
const standingsBody = document.getElementById('standingsBody');
const podiumEl = document.getElementById('podium');
const summaryEl = document.getElementById('summary');

function renderTableAndPodium(){
  const sorted = calculateStandingsSorted();

  // tabla
  standingsBody.innerHTML = '';
  sorted.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${p.name}</strong></td><td>${p.points}</td><td>${p.wins}</td>`;
    standingsBody.appendChild(tr);
  });

  // podio: queremos [2° , 1° , 3°] (visual) donde el primero está en el centro
  const first = sorted[0] || pilots[0];
  const second = sorted[1] || pilots[1];
  const third = sorted[2] || pilots[2];

  // construimos en ese orden: left=second, center=first, right=third
  const order = [second, first, third];

  // animación: añadimos clase 'pulse' al podio antes de reemplazar para efecto visual
  podiumEl.querySelectorAll('*').forEach(n => n.classList.remove('pulse'));

  podiumEl.innerHTML = '';
  order.forEach((p, idx) => {
    if(!p) return;
    const posClass = idx === 1 ? 'podium-pos-1' : (idx === 0 ? 'podium-pos-2' : 'podium-pos-3');
    const box = document.createElement('div');
    box.className = `podium-box ${posClass} pulse`;
    // icono medalla opcional
    const medal = idx === 1 ? '🥇' : (idx === 0 ? '🥈' : '🥉');
    // USO DE p.imgUrl (CORREGIDO)
    box.innerHTML = `
      <img src="${p.imgUrl}" alt="${p.name}" class="podium-image">
      <div class="podium-step">${medal}</div>
      <div class="podium-name">${p.name}</div>
      <div class="podium-info">${p.points} pts • ${p.wins} vict.</div>
    `;
    podiumEl.appendChild(box);
    // pequeña pausa para animación de escala (repaint)
    setTimeout(()=> box.classList.remove('pulse'), 500);
  });

  // summary textual
  summaryEl.innerHTML = sorted.map((p,i)=>`${i+1}. <strong>${p.name}</strong> — ${p.points} pts (${p.wins} vict.)`).join('<br>');
}


/* --------- Helpers de UI (limpiar, ejemplo, export) --------- */
function updateStandings(){ renderTableAndPodium(); }

function clearSelections(){
  events.forEach(ev => {
    pilots.forEach(p => { selections[ev.id][p.id] = ''; });
  });
  // reset selects in DOM
  document.querySelectorAll('#eventsList select').forEach(s => s.value = '');
  updateStandings();
}

function autoExample(){
  // ejemplo simple: permutaciones para que se vean cambios
  const perms = [
    ['1','2','3'], ['2','1','3'], ['3','1','2'],
    ['1','3','2'], ['2','3','1'], ['3','2','1']
  ];
  events.forEach((ev, idx) => {
    const perm = perms[idx % perms.length];
    pilots.forEach((p,i) => {
      selections[ev.id][p.id] = perm[i];
    });
  });
  // reflect in DOM
  document.querySelectorAll('#eventsList select').forEach(sel => {
    const ev = sel.dataset.event, pid = sel.dataset.pilot;
    sel.value = selections[ev][pid] || '';
  });
  updateStandings();
}

function exportState(){
  const data = { pilotsBase: pilots.map(p=>({id:p.id, basePoints:p.basePoints, baseWins:p.baseWins})), selections };
  const txt = JSON.stringify(data, null, 2);
  const blob = new Blob([txt], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'simulador_export.json';
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

/* --------- Inicialización: construir controles y asignar listeners --------- */
buildControls();
updateStandings();

// listeners botones
document.getElementById('clearBtn').addEventListener('click', ()=>{ if(confirm('Limpiar todas las posiciones?')) clearSelections(); });
document.getElementById('autoBtn').addEventListener('click', autoExample);
document.getElementById('exportBtn').addEventListener('click', exportState);
