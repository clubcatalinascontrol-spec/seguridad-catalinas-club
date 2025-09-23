// app.js
const MASTER_PASS = "1409";

// ELEMENTOS
const passOverlay = document.getElementById('passOverlay');
const masterPassInput = document.getElementById('masterPassInput');
const masterPassBtn = document.getElementById('masterPassBtn');
const masterPassMsg = document.getElementById('masterPassMsg');

const navBtns = document.querySelectorAll('.nav-btn');
const pages = document.querySelectorAll('.page');

const tabBtns = document.querySelectorAll('.tab-btn');
const movimientosTableBody = document.querySelector('#movimientosTable tbody');
const scanBtn = document.getElementById('scanBtn');
const printActiveBtn = document.getElementById('printActiveBtn');
const scanOk = document.getElementById('scanOk');

const usersTableBody = document.querySelector('#usersTable tbody');
const addUserBtn = document.getElementById('addUserBtn');
const userMessage = document.getElementById('userMessage');
const filterBtns = document.querySelectorAll('.filter-btn');

const expiredTableBody = document.querySelector('#expiredTable tbody');

const novedadesTableBody = document.querySelector('#novedadesTable tbody');
const guardarNovedadBtn = document.getElementById('guardarNovedadBtn');
const novedadTexto = document.getElementById('novedadTexto');
const novedadMsg = document.getElementById('novedadMsg');

// MODALES
const scanModal = document.getElementById('scanModal');
const scanInput = document.getElementById('scanInput');
const cancelScanBtn = document.getElementById('cancelScanBtn');
const scanMessage = document.getElementById('scanMessage');

const editUserModal = document.getElementById('editUserModal');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const finalizeEditBtn = document.getElementById('finalizeEditBtn');
const editUserMsg = document.getElementById('editUserMsg');

// FICHA
const fichaModal = document.getElementById('fichaModal');
const closeFichaBtn = document.getElementById('closeFichaBtn');

// DATOS
let movimientos = [];
let users = [];
let expirados = [];
let novedades = [];
let scanCount = 0;

// =========================
// FUNCIONES
// =========================
function showPage(name) {
  pages.forEach(p => p.classList.remove('active'));
  document.getElementById(name).classList.add('active');
  navBtns.forEach(btn => btn.classList.remove('active'));
  document.querySelector(`.nav-btn[data-section="${name}"]`).classList.add('active');
}

navBtns.forEach(btn => btn.addEventListener('click',()=>showPage(btn.dataset.section)));

// =========================
// LOGIN MASTER
// =========================
masterPassBtn.addEventListener('click',()=>{
  if(masterPassInput.value === MASTER_PASS){
    passOverlay.style.display='none';
    masterPassMsg.textContent='';
    renderMovimientos();
    renderUsers();
    renderExpirados();
    renderNovedades();
  }else{
    masterPassMsg.textContent='Contraseña incorrecta';
  }
});

// =========================
// PANEL TAB
// =========================
tabBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    tabBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderMovimientos(btn.dataset.tipo);
  });
});

function renderMovimientos(tipo='todos'){
  movimientosTableBody.innerHTML='';
  let filtered = tipo==='todos'?movimientos:movimientos.filter(m=>m.tipo===tipo);
  filtered.forEach((m,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${m.nombre}</td><td>${m.hEntrada||''}</td><td>${m.hSalida||''}</td><td>${m.tipo}</td><td>---</td>`;
    movimientosTableBody.appendChild(tr);
  });
}

// =========================
// ESCANEAR
// =========================
scanBtn.addEventListener('click',()=>scanModal.style.display='flex');
cancelScanBtn.addEventListener('click',()=>scanModal.style.display='none');

scanInput.addEventListener('keydown',(e)=>{
  if(e.key==='Enter'){
    let code = scanInput.value.trim();
    if(code.length>0){
      scanModal.style.display='none';
      scanInput.value='';
      scanOk.style.display='inline';
      setTimeout(()=>scanOk.style.display='none',1000);
      // SIMULA INGRESO
      movimientos.push({nombre:`Usuario ${code}`,tipo:'propietario',hEntrada:new Date().toLocaleTimeString()});
      scanCount++;
      if(scanCount%25===0) window.print();
      renderMovimientos(document.querySelector('.tab-btn.active').dataset.tipo);
    }
  }
});

// =========================
// USUARIOS
// =========================
addUserBtn.addEventListener('click',()=>{
  let nombre=document.getElementById('userNombre').value.trim();
  if(!nombre){userMessage.textContent='Falta nombre';return;}
  let dni=document.getElementById('userDni').value.trim();
  let celular=document.getElementById('userCelular').value.trim();
  let tipo=document.getElementById('userTipo').value;
  let autorizante=document.getElementById('userAutorizante').value.trim();
  let fechaExp=new Date().toLocaleDateString();
  let l = users.length+1;
  users.push({l,nombre,dni,celular,autorizante,fechaExp,tipo});
  userMessage.textContent='Usuario agregado';
  renderUsers();
});

function renderUsers(filter='todos'){
  usersTableBody.innerHTML='';
  let filtered = filter==='todos'?users:users.filter(u=>u.tipo===filter);
  filtered.forEach(u=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${u.l}</td><td>${u.nombre}</td><td>${u.dni||''}</td><td>${u.celular||''}</td><td>${u.autorizante||''}</td><td>${u.fechaExp}</td><td>${u.tipo}</td>
    <td>
      <button onclick="showFicha(${u.l})">FICHA</button>
    </td>`;
    usersTableBody.appendChild(tr);
  });
}

filterBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    filterBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    renderUsers(btn.dataset.tipo);
  });
});

// =========================
// EXPIRADOS
// =========================
function renderExpirados(){
  expiredTableBody.innerHTML='';
  expirados.forEach((e,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${i+1}</td><td>${e.nombre}</td><td>${e.dni||''}</td><td>${e.codigoIn||''}</td><td>${e.codigoOut||''}</td><td>${e.tipo}</td><td>${e.fElim||''}</td>`;
    expiredTableBody.appendChild(tr);
  });
}

// =========================
// NOVEDADES
// =========================
guardarNovedadBtn.addEventListener('click',()=>{
  let text = novedadTexto.value.trim();
  if(!text){novedadMsg.textContent='Escriba novedad';return;}
  novedades.push({hora:new Date().toLocaleTimeString(),text});
  novedadTexto.value='';
  novedadMsg.textContent='OK';
  renderNovedades();
});

function renderNovedades(){
  novedadesTableBody.innerHTML='';
  novedades.forEach((n,i)=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${n.hora}</td><td>${n.text}</td><td><button onclick="eliminarNovedad(${i})">ELIMINAR</button></td>`;
    novedadesTableBody.appendChild(tr);
  });
}

window.eliminarNovedad = function(i){
  novedades.splice(i,1);
  renderNovedades();
}

// =========================
// FICHA USUARIO
// =========================
window.showFicha=function(l){
  let u = users.find(u=>u.l===l);
  if(!u) return;
  document.getElementById('fichaL').textContent=u.l;
  document.getElementById('fichaNombre').textContent=u.nombre;
  document.getElementById('fichaDni').textContent=u.dni||'';
  document.getElementById('fichaCelular').textContent=u.celular||'';
  document.getElementById('fichaAutorizante').textContent=u.autorizante||'';
  document.getElementById('fichaFechaExp').textContent=u.fechaExp;
  document.getElementById('fichaTipo').textContent=u.tipo;
  fichaModal.style.display='flex';
}

closeFichaBtn.addEventListener('click',()=>fichaModal.style.display='none');
