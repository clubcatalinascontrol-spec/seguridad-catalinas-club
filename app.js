import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, setDoc, updateDoc, deleteDoc, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.appspot.com",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// VARIABLES GLOBALES
let movimientos = [], usuarios = [], expirados = [], novedades = [];
let currentPage = 1, rowsPerPage = 25;
const PASSWORD_MASTER = "123456789";

// PASSWORD OVERLAY
const passwordOverlay = document.getElementById("passwordOverlay");
const initPassBtn = document.getElementById("initPassBtn");
initPassBtn.addEventListener("click", ()=>{
  const val = document.getElementById("initPassInput").value;
  if(val === PASSWORD_MASTER){ passwordOverlay.style.display="none"; loadAll(); } 
  else document.getElementById("initPassMsg").innerText="Contraseña incorrecta";
});

// NAV
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    const sec = btn.dataset.section;
    document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));
    document.getElementById(sec).classList.add("active");
  });
});

// TAB PANEL
document.querySelectorAll(".tab-btn").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    renderMovimientos(tab.dataset.tipo);
  });
});

// USER FILTER PANEL
document.querySelectorAll(".user-filter-btn").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".user-filter-btn").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    renderUsers(tab.dataset.tipo);
  });
});

// ESCANEO
document.getElementById("scanBtn").addEventListener("click", ()=>{
  const codigo = prompt("Ingrese código de usuario:");
  if(!codigo) return;
  const user = usuarios.find(u=>u.codigoIngreso===codigo || u.codigoSalida===codigo);
  if(!user){ alert("Usuario no encontrado"); return; }
  const tipoRegistro = user.codigoIngreso===codigo ? "entrada" : "salida";
  const now = new Date();
  const registro = {
    nombre:user.nombre,
    tipo:user.tipo,
    autorizante:user.autorizante,
    horaEntrada: tipoRegistro==="entrada" ? now.toLocaleString() : "",
    horaSalida: tipoRegistro==="salida" ? now.toLocaleString() : "",
    codigo:codigo
  };
  movimientos.unshift(registro);
  if(movimientos.length>1000) movimientos.pop();
  document.getElementById("scanOk").style.display="inline";
  setTimeout(()=>document.getElementById("scanOk").style.display="none",1200);
  renderMovimientos();
});

// IMPRIMIR
document.getElementById("printActiveBtn").addEventListener("click", ()=>printMovimientos());

// ADD USER
document.getElementById("addUserBtn").addEventListener("click", ()=>{
  const nombre = document.getElementById("userNombre").value.trim();
  if(!nombre){ alert("Ingrese nombre"); return; }
  const dni = document.getElementById("userDni").value.trim();
  const celular = document.getElementById("userCelular").value.trim();
  const autorizante = document.getElementById("userAutorizante").value.trim();
  const tipo = document.getElementById("userTipo").value;
  const codigoIngreso = Math.floor(Math.random()*9999+1).toString().padStart(4,"0");
  const codigoSalida = Math.floor(Math.random()*9999+1).toString().padStart(4,"0");
  const usuario = {nombre,dni,celular,autorizante,tipo,codigoIngreso,codigoSalida};
  usuarios.push(usuario);
  renderUsers();
});

// NOVEDADES
document.getElementById("guardarNovedadBtn").addEventListener("click", ()=>{
  const text = document.getElementById("novedadTexto").value.trim();
  if(!text) return;
  novedades.unshift({hora:new Date().toLocaleString(), texto:text});
  document.getElementById("novedadTexto").value="";
  renderNovedades();
});

// RENDER MOVIMIENTOS
function renderMovimientos(filter="todos"){
  const tbody = document.querySelector("#movimientosTable tbody");
  tbody.innerHTML="";
  let data = movimientos;
  if(filter!=="todos") data = data.filter(m=>m.tipo===filter);
  const start = (currentPage-1)*rowsPerPage;
  const end = start+rowsPerPage;
  data.slice(start,end).forEach((m,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td>
      <td>${m.nombre}</td>
      <td>${m.horaEntrada}</td>
      <td>${m.horaSalida}</td>
      <td>${m.tipo}</td>
      <td>${m.autorizante}</td>
      <td><button onclick="alert('Ficha: ${m.nombre}')">FICHA</button></td>`;
    tbody.appendChild(tr);
  });
}

// RENDER USUARIOS
function renderUsers(filter="todos"){
  const tbody = document.querySelector("#usersTable tbody");
  tbody.innerHTML="";
  let data = usuarios;
  if(filter!=="todos") data = data.filter(u=>u.tipo===filter);
  data.forEach((u,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td>
      <td>${u.nombre}</td>
      <td>${u.dni||""}</td>
      <td>${u.celular||""}</td>
      <td>${u.autorizante||""}</td>
      <td>${new Date().toLocaleDateString()}</td>
      <td>${u.tipo}</td>
      <td><button onclick="eliminarUsuario(${i})">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

// ELIMINAR USUARIO
window.eliminarUsuario = function(idx){
  const u = usuarios.splice(idx,1)[0];
  expirados.push({...u, fechaEliminacion:new Date().toLocaleString()});
  renderUsers();
  renderExpirados();
}

// RENDER EXPIRADOS
function renderExpirados(){
  const tbody = document.querySelector("#expiredTable tbody");
  tbody.innerHTML="";
  expirados.forEach((u,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${i+1}</td>
      <td>${u.nombre}</td>
      <td>${u.dni||""}</td>
      <td>${u.codigoIngreso}</td>
      <td>${u.codigoSalida}</td>
      <td>${u.tipo}</td>
      <td>${u.fechaEliminacion}</td>`;
    tbody.appendChild(tr);
  });
}

// RENDER NOVEDADES
function renderNovedades(){
  const tbody = document.querySelector("#novedadesTable tbody");
  tbody.innerHTML="";
  novedades.forEach((n,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${n.hora}</td><td>${n.texto}</td><td><button onclick="eliminarNovedad(${i})">Eliminar</button></td>`;
    tbody.appendChild(tr);
  });
}

window.eliminarNovedad = function(idx){
  novedades.splice(idx,1);
  renderNovedades();
}

// PRINT MOVIMIENTOS
function printMovimientos(){
  const data = movimientos.slice(0,25);
  let html = `<html><head><title>Movimientos</title><style>
  body{font-family:Arial;color:#000;} table{width:100%;border-collapse:collapse;}
  th,td{border:1px solid #000;padding:4px;text-align:center;}
  </style></head><body>`;
  html += "<h2>Últimos 25 Movimientos</h2><table><tr><th>#</th><th>Nombre</th><th>Entrada</th><th>Salida</th><th>Tipo</th><th>Autorizante</th></tr>";
  data.forEach((m,i)=>{
    html += `<tr><td>${i+1}</td><td>${m.nombre}</td><td>${m.horaEntrada}</td><td>${m.horaSalida}</td><td>${m.tipo}</td><td>${m.autorizante}</td></tr>`;
  });
  html += "</table></body></html>";
  const w = window.open();
  w.document.write(html);
  w.document.close();
  w.print();
}

// CARGA INICIAL
function loadAll(){
  renderMovimientos();
  renderUsers();
  renderExpirados();
  renderNovedades();
}
