// Variables globales
let users = [];
let movements = [];
let expiredUsers = [];
let novedades = [];
let currentTipo = 'todos';

// Helpers
function $(id){ return document.getElementById(id); }
function createRow(table, data, index, acciones=true){
  const tr = document.createElement('tr');
  Object.values(data).forEach((val,i)=>{
    const td=document.createElement('td'); td.textContent=val; tr.appendChild(td);
  });
  if(acciones){
    const td = document.createElement('td');
    const fichaBtn = document.createElement('button'); fichaBtn.textContent='FICHA';
    fichaBtn.onclick = ()=>showFicha(data);
    td.appendChild(fichaBtn);
    tr.appendChild(td);
  }
  table.querySelector('tbody').appendChild(tr);
  return tr;
}

// Render usuarios
function renderUsers(){
  const tbody = $('usersTable').querySelector('tbody');
  tbody.innerHTML='';
  users.forEach((u,i)=>{
    createRow($('usersTable'), { "#L":i+1, Nombre:u.nombre, DNI:u.dni, Tipo:u.tipo });
  });
}

// Ficha
function showFicha(user){
  $('fichaContent').innerHTML = `
    <p><b>Nombre:</b> ${user.nombre}</p>
    <p><b>DNI:</b> ${user.dni}</p>
    <p><b>Celular:</b> ${user.celular || ''}</p>
    <p><b>Autorizante:</b> ${user.autorizante || ''}</p>
    <p><b>Tipo:</b> ${user.tipo}</p>
  `;
  $('fichaModal').classList.add('active');
}

// Navegación
document.querySelectorAll('.nav-btn').forEach(btn=>{
  btn.addEventListener('click', e=>{
    document.querySelectorAll('.nav-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    $(btn.dataset.section).classList.add('active');
  });
});

// Agregar usuario
$('addUserBtn').addEventListener('click', ()=>{
  const nombre=$('userNombre').value.trim().toUpperCase();
  const dni=$('userDni').value.trim();
  const celular=$('userCelular').value.trim();
  const autorizante=$('userAutorizante').value.trim();
  const tipo=$('userTipo').value;

  if(!nombre || !dni || !tipo){ $('userMessage').textContent='Faltan campos'; return; }
  if(dni.length!==8 || isNaN(dni)){ $('userMessage').textContent='DNI inválido'; return; }
  if(celular && (celular.length!==10 || isNaN(celular))){ $('userMessage').textContent='Celular inválido'; return; }

  users.push({ nombre,dni,tipo,celular,autorizante });
  $('userMessage').textContent='Usuario agregado';
  renderUsers();
  $('userNombre').value=''; $('userDni').value=''; $('userCelular').value=''; $('userAutorizante').value=''; $('userTipo').value='';
});

// Modal Ficha
$('closeFichaBtn').addEventListener('click', ()=>$('fichaModal').classList.remove('active'));
