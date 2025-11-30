/* ------------------ DATOS BASE ------------------ */
const pilots = [
  { id:'norris', name:'Lando Norris', team:'McLaren', basePoints:408, baseWins:7, points:0, wins:0, imgUrl:'https://i.ibb.co/jv621jZ0/Norris.jpg' },
  { id:'verstappen', name:'Max Verstappen', team:'Red Bull', basePoints:396, baseWins:7, points:0, wins:0, imgUrl:'https://i.ibb.co/VWLdQwhf/Verstappen.jpg' },
  { id:'piastri', name:'Oscar Piastri', team:'McLaren', basePoints:392, baseWins:7, points:0, wins:0, imgUrl:'https://i.ibb.co/tGw36PM/Piastri.jpg' },
];

const teams = [
  { id:'mclaren', name:'McLaren', basePoints:800, baseWins:14 },
  { id:'mercedes', name:'Mercedes', basePoints:459, baseWins:2 },
  { id:'redbull', name:'Red Bull', basePoints:426, baseWins:7 },
  { id:'ferrari', name:'Ferrari', basePoints:382, baseWins:0 },
];

const racePoints = [25,18,15,12,10,8,6,4,2,1];
const sprintPoints = [8,7,6,5,4,3,2,1];

const events = [
  
  { id:'abudhabi', label:'🇦🇪 GP Abu Dhabi', type:'race' }
];

/* ------------------ SIMULADOR PILOTOS ------------------ */
const selections = {};
events.forEach(ev => { selections[ev.id] = {}; pilots.forEach(p => selections[ev.id][p.id] = ''); });

function buildControls(){
  const eventsList = document.getElementById('eventsList');
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
      const optEmpty = document.createElement('option'); optEmpty.value=''; optEmpty.textContent='-'; sel.appendChild(optEmpty);
      for(let i=1;i<=20;i++){ const o=document.createElement('option'); o.value=i; o.textContent=i; sel.appendChild(o); }
      sel.addEventListener('change', onSelectChange);
      row.appendChild(lbl); row.appendChild(sel); box.appendChild(row);
    });
    eventsList.appendChild(box);
  });
}

function onSelectChange(e){
  const sel=e.target; const evId=sel.dataset.event; const pid=sel.dataset.pilot; const newVal=sel.value;
  const prevVal=selections[evId][pid];
  selections[evId][pid]=newVal;
  updateStandings();
}

function calculateStandingsSorted(){
  pilots.forEach(p=>{ p.points=p.basePoints; p.wins=p.baseWins; });
  events.forEach(ev=>{
    const scheme = ev.type==='sprint'? sprintPoints : racePoints;
    const posMap={};
    pilots.forEach(p=>{
      const posStr=selections[ev.id][p.id];
      if(posStr){ const pos=parseInt(posStr,10); posMap[pos]=p.id; }
    });
    for(let pos=1; pos<=scheme.length; pos++){
      const pid=posMap[pos];
      if(pid){
        const pilot=pilots.find(x=>x.id===pid);
        pilot.points+=scheme[pos-1];
        if(ev.type==='race' && pos===1) pilot.wins++;
      }
    }
  });
  return [...pilots].sort((a,b)=> b.points!==a.points ? b.points-a.points : b.wins-a.wins);
}

const standingsBody=document.getElementById('standingsBody');
const podiumEl=document.getElementById('podium');
const summaryEl=document.getElementById('summary');

function renderTableAndPodium(){
  const sorted=calculateStandingsSorted();
  standingsBody.innerHTML='';
  sorted.forEach(p=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td><strong>${p.name}</strong></td><td>${p.points}</td><td>${p.wins}</td>`;
    standingsBody.appendChild(tr);
  });

  const [first,second,third]=sorted;
  const order=[second,first,third];
  podiumEl.innerHTML='';
  order.forEach((p,idx)=>{
    if(!p) return;
    const medal = idx===1?'🥇':(idx===0?'🥈':'🥉');
    const posClass = idx===1?'podium-pos-1':(idx===0?'podium-pos-2':'podium-pos-3');
    const box=document.createElement('div');
    box.className=`podium-box ${posClass}`;
    box.innerHTML=`
      <img src="${p.imgUrl}" class="podium-image">
      <div class="podium-step">${medal}</div>
      <div class="podium-name">${p.name}</div>
      <div class="podium-info">${p.points} pts • ${p.wins} vict.</div>`;
    podiumEl.appendChild(box);
  });

  summaryEl.innerHTML=sorted.map((p,i)=>`${i+1}. <strong>${p.name}</strong> — ${p.points} pts (${p.wins} vict.)`).join('<br>');
}

/* --------- SIMULADOR DE CONSTRUCTORES (completo con tabla) --------- */
const teamSelections = {};
events.forEach(ev => {
  teamSelections[ev.id] = {};
  teams.forEach(t => teamSelections[ev.id][t.id] = { pos1: '', pos2: '' });
});

function buildTeamControls() {
  const list = document.getElementById('teamEventsList');
  list.innerHTML = '';

  events.forEach(ev => {
    const box = document.createElement('div');
    box.className = 'event';
    const h = document.createElement('h3');
    h.textContent = ev.label + (ev.type === 'sprint' ? ' — Sprint' : ' — Carrera');
    box.appendChild(h);

    teams.forEach(t => {
      const row = document.createElement('div');
      row.className = 'row';
      const lbl = document.createElement('label');
      lbl.textContent = t.name;

      const sel1 = document.createElement('select');
      const sel2 = document.createElement('select');

      [sel1, sel2].forEach((sel, idx) => {
        sel.dataset.event = ev.id;
        sel.dataset.team = t.id;
        sel.dataset.car = idx + 1;

        const optEmpty = document.createElement('option');
        optEmpty.value = '';
        optEmpty.textContent = '-';
        sel.appendChild(optEmpty);

        for (let i = 1; i <= 20; i++) {
          const o = document.createElement('option');
          o.value = i;
          o.textContent = i;
          sel.appendChild(o);
        }

        sel.addEventListener('change', onTeamSelectChange);
      });

      row.appendChild(lbl);
      row.appendChild(sel1);
      row.appendChild(sel2);
      box.appendChild(row);
    });

    list.appendChild(box);
  });

  // reflejar valores existentes
  document.querySelectorAll('#teamEventsList select').forEach(sel => {
    const ev = sel.dataset.event, tid = sel.dataset.team, car = sel.dataset.car;
    sel.value = teamSelections[ev][tid][`pos${car}`] || '';
  });
}

function onTeamSelectChange(e) {
  const sel = e.target;
  const evId = sel.dataset.event;
  const tid = sel.dataset.team;
  const car = sel.dataset.car;
  const newVal = sel.value;
  const prevVal = teamSelections[evId][tid][`pos${car}`] || '';

  if (newVal === prevVal) return;

  // busca colisiones en el mismo evento
  const allSelects = [...document.querySelectorAll(`#teamEventsList select[data-event="${evId}"]`)];
  if (newVal !== '') {
    let collided = null;
    for (const s of allSelects) {
      if (s !== sel && s.value === newVal) {
        collided = s;
        break;
      }
    }
    if (collided) {
      // intercambio
      collided.value = prevVal;
      const otherTid = collided.dataset.team;
      const otherCar = collided.dataset.car;
      teamSelections[evId][otherTid][`pos${otherCar}`] = prevVal;
    }
  }

  teamSelections[evId][tid][`pos${car}`] = newVal;
  renderConstructors();
}

/* --------- CÁLCULO DEL CAMPEONATO DE CONSTRUCTORES --------- */
function calculateTeamStandings() {
  const results = teams.map(t => ({
    id: t.id,
    name: t.name,
    points: t.basePoints,
    wins: t.baseWins
  }));

  events.forEach(ev => {
    const scheme = ev.type === 'sprint' ? sprintPoints : racePoints;
    const posList = [];

    // construir lista de posiciones
    teams.forEach(t => {
      const s = teamSelections[ev.id][t.id];
      ['pos1', 'pos2'].forEach(k => {
        const v = parseInt(s[k], 10);
        if (v && !isNaN(v)) posList.push({ team: t.id, pos: v });
      });
    });

    // ordenar posiciones del 1 al 20
    posList.sort((a, b) => a.pos - b.pos);

    // asignar puntos
    for (let i = 0; i < posList.length && i < scheme.length; i++) {
      const teamObj = results.find(x => x.id === posList[i].team);
      teamObj.points += scheme[i];
      if (ev.type === 'race' && i === 0) teamObj.wins++;
    }
  });

  return results.sort((a, b) =>
    b.points !== a.points ? b.points - a.points : b.wins - a.wins
  );
}

/* --------- RENDER TABLA --------- */
const constructorsBody = document.getElementById('constructorsBody');
const constructorsSummary = document.getElementById('constructorsSummary');

function renderConstructors() {
  const sorted = calculateTeamStandings();

  constructorsBody.innerHTML = '';
  sorted.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${t.name}</strong></td><td>${t.points}</td><td>${t.wins}</td>`;
    constructorsBody.appendChild(tr);
  });

  constructorsSummary.innerHTML = sorted
    .map((t, i) => `${i + 1}. <strong>${t.name}</strong> — ${t.points} pts (${t.wins} vict.)`)
    .join('<br>');
}

/* --------- BOTONES Y EJEMPLOS --------- */
document.getElementById('clearTeamsBtn').addEventListener('click', () => {
  if (confirm('¿Limpiar posiciones de los equipos?')) {
    events.forEach(ev => teams.forEach(t => (teamSelections[ev.id][t.id] = { pos1: '', pos2: '' })));
    buildTeamControls();
    renderConstructors();
  }
});

document.getElementById('autoTeamsBtn').addEventListener('click', () => {
  const sample = [
    [1, 2],
    [3, 4],
    [5, 6],
    [7, 8]
  ];
  events.forEach((ev, idx) => {
    const vals = sample[idx % sample.length];
    teams.forEach((t, i) => {
      teamSelections[ev.id][t.id] = { pos1: vals[0] + i * 2, pos2: vals[1] + i * 2 };
    });
  });
  buildTeamControls();
  renderConstructors();
});


/* ------------------ INICIALIZACIÓN ------------------ */
buildControls();
buildTeamControls();
renderTableAndPodium();
renderConstructors();

document.getElementById('clearBtn').addEventListener('click',()=>{ if(confirm('Limpiar pilotos?')){ events.forEach(ev=>pilots.forEach(p=>selections[ev.id][p.id]='')); buildControls(); updateStandings(); }});
document.getElementById('autoBtn').addEventListener('click',()=>{ autoExample(); });
document.getElementById('clearTeamsBtn').addEventListener('click',()=>{ if(confirm('Limpiar equipos?')){ events.forEach(ev=>teams.forEach(t=>teamSelections[ev.id][t.id]={pos1:'',pos2:''})); buildTeamControls(); renderConstructors(); }});
document.getElementById('autoTeamsBtn').addEventListener('click',()=>{ autoTeamsExample(); });

function updateStandings(){ renderTableAndPodium(); }

/* --------- AUTO EXAMPLES --------- */
function autoExample(){
  const perms=[['1','2','3'],['2','1','3'],['3','2','1'],['2','3','1']];
  events.forEach((ev,idx)=>{ const perm=perms[idx%perms.length]; pilots.forEach((p,i)=> selections[ev.id][p.id]=perm[i]); });
  buildControls(); updateStandings();
}
function autoTeamsExample(){
  const sample=[[1,2],[3,4],[5,6],[7,8]];
  events.forEach((ev,idx)=>{
    const vals=sample[idx%sample.length];
    teams.forEach((t,i)=> teamSelections[ev.id][t.id]={pos1:vals[0]+i*2,pos2:vals[1]+i*2});
  });
  buildTeamControls(); renderConstructors();
}




