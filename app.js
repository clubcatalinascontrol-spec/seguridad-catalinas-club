// app.js
// Data storage simulada
let movimientos = [];
let users = [];
let expirados = [];
let novedades = [];
let currentPanelTipo = 'todos';
let currentUsuariosTipo = 'todos';
let expiredPage = 1;
const itemsPerPage = 25;

// SELECTORES
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');
const scanInput = document.getElementById('scanInput');
const panelTipoSelect = document.getElementById('panelTipoSelect');
const usuariosTipoSelect = document.getElementById('usuariosTipoSelect');
const movimientosTable = document.querySelector('#movimientosTable tbody');
const usersTable = document.querySelector('#usersTable tbody');
const expiredTable = document.querySelector('#expiredTable tbody');
const paginationDiv = document.getElementById('pagination');
const expiredPaginationDiv = document.getElementById('expiredPagination');
const scanOk = document.getElementById('scanOk');

// NAV
navBtns.forEach(btn=>{
  btn.addEventListener('click',()=>{
    navBtns.forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    const target = btn.dataset.section;
    pages.forEach(p=>p.classList.remove('active'));
    document.getElementById(target).classList.add('active');
    if(target==='expirados') renderExpired();
    if(target==='panel') renderMovimientos();
    if(target==='usuarios') renderUsers();
  });
});

// FILTROS
panelTipoSelect.addEventListener('change',()=>{
  currentPanelTipo = panelTipoSelect.value;
  renderMovimientos();
});
usuariosTipoSelect.addEventListener('change',()=>{
  currentUsuariosTipo = usuariosTipoSelect.value;
  renderUsers();
});

// ESCANEO AUTOMATICO
scanInput.addEventListener('input',()=>{
  const code = scanInput.value.trim();
  if(code.length===8){
    registrarMovimiento(code);
    scanInput.value='';
    scanOk.style.display='inline';
    setTimeout(()=>scanOk.style.display='none',800);
  }
});

// FUNCIONES
function renderMovimientos(){
  movimientosTable.innerHTML='';
  let filtered = movimientos;
  if(currentPanelTipo!=='todos') filtered = movimientos.filter(m=>m.tipo===currentPanelTipo);
  filtered.forEach((m,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i+1}</td><td>${m.nombre}</td><td>${m.entrada||''}</td><td>${m.salida||''}</td><td>${m.tipo}</td>
    <td style="display:none;">${m.autorizante||''}</td>
    <td><button onclick="verFicha(${m.userL})">FICHA</button></td>`;
    movimientosTable.appendChild(tr);
  });
}

function renderUsers(){
  usersTable.innerHTML='';
  let filtered = users;
  if(currentUsuariosTipo!=='todos') filtered = users.filter(u=>u.tipo===currentUsuariosTipo);
  filtered.forEach(u=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${u.l}</td><td>${u.nombre}</td><td>${u.dni||''}</td><td>${u.celular||''}</td><td>${u.autorizante||''}</td>
    <td>${u.fechaExp||''}</td><td>${u.tipo}</td><td><button onclick="editarUser(${u.l})">EDIT</button><button onclick="eliminarUser(${u.l})">DEL</button></td>`;
    usersTable.appendChild(tr);
  });
}

function renderExpired(){
  expiredTable.innerHTML='';
  const start = (expiredPage-1)*itemsPerPage;
  const paginated = expirados.slice(start,start+itemsPerPage);
  paginated.forEach((e,i)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${start+i+1}</td><td>${e.nombre}</td><td>${e.dni||''}</td><td>${e.codigoIngreso||''}</td><td>${e.codigoSalida||''}</td><td>${e.tipo}</td><td>${e.fechaElim||''}</td>`;
    expiredTable.appendChild(tr);
  });
  renderExpiredPagination();
}

function renderExpiredPagination(){
  expiredPaginationDiv.innerHTML='';
  const totalPages = Math.ceil(expirados.length/itemsPerPage);
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement('button');
    btn.textContent=i;
    if(i===expiredPage) btn.disabled=true;
    btn.addEventListener('click',()=>{expiredPage=i; renderExpired();});
    expiredPaginationDiv.appendChild(btn);
  }
}

// REGISTRO
function registrarMovimiento(code){
  const u = users.find(x=>x.l==parseInt(code));
  if(!u) return alert('Código no encontrado');
  const now = new Date().toLocaleTimeString();
  const mov = movimientos.find(m=>m.userL===u.l && !m.salida);
  if(mov){ mov.salida=now; }
  else{ movimientos.push({userL:u.l,nombre:u.nombre,tipo:u.tipo,autorizante:u.autorizante,entrada:now}); }
  renderMovimientos();
}

// FICHA
function verFicha(l){
  const u = users.find(x=>x.l===l);
  if(!u) return;
  document.getElementById('fichaL').textContent=u.l;
  document.getElementById('fichaNombre').textContent=u.nombre;
  document.getElementById('fichaDni').textContent=u.dni||'';
  document.getElementById('fichaCelular').textContent=u.celular||'';
  document.getElementById('fichaAutorizante').textContent=u.autorizante||'';
  document.getElementById('fichaFechaExp').textContent=u.fechaExp||'';
  document.getElementById('fichaTipo').textContent=u.tipo;
  document.getElementById('fichaModal').style.display='flex';
}
document.getElementById('closeFichaBtn').addEventListener('click',()=>{document.getElementById('fichaModal').style.display='none';});

// IMPRIMIR
document.getElementById('printActiveBtn').addEventListener('click',()=>{window.print();});
