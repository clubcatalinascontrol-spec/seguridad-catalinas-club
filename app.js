// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ---------- FIREBASE ----------
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

const usuariosRef = collection(db,"usuarios");
const movimientosRef = collection(db,"movimientos");
const expiredRef = collection(db,"expiredCodes");
const novedadesRef = collection(db,"novedades");

// ---------- CONTRASEÑA ÚNICA ----------
const MASTER_PASS="1409";
const passOverlay = document.getElementById("passOverlay");
const initInput = document.getElementById("initPassInput");
const initBtn = document.getElementById("initPassBtn");
const initMsg = document.getElementById("initPassMsg");

passOverlay.classList.add("active");
initBtn.onclick = ()=>{
  if(initInput.value.trim()===MASTER_PASS){
    passOverlay.classList.remove("active");
  } else {
    initMsg.style.color="red";
    initMsg.textContent="Contraseña incorrecta";
    setTimeout(()=>initMsg.textContent="",2000);
    initInput.value="";
  }
};

// ---------- NAV ----------
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
navBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  const target=btn.dataset.section;
  pages.forEach(p=>p.classList.remove("active"));
  document.getElementById(target).classList.add("active");
}));

// ---------- TAB FILTROS PANEL ----------
const tabBtns=document.querySelectorAll(".tab-btn");
let tipoFiltro="todos";
tabBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  tabBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  tipoFiltro=btn.dataset.tipo;
  renderMovimientos();
}));

// ---------- TAB FILTROS USUARIOS ----------
const filterBtns=document.querySelectorAll(".filter-btn");
let userFiltro="todos";
filterBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  filterBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
  userFiltro=btn.dataset.tipo;
  renderUsuarios();
}));

// ---------- MOVIMIENTOS ----------
const movimientosTable=document.querySelector("#movimientosTable tbody");
async function renderMovimientos(){
  movimientosTable.innerHTML="";
  const q = query(movimientosRef, orderBy("timestamp","desc"), limit(100));
  const snapshot = await getDocs(q);
  let i=1;
  snapshot.forEach(docSnap=>{
    const d=docSnap.data();
    if(tipoFiltro==="todos" || d.tipo===tipoFiltro){
      const tr=document.createElement("tr");
      tr.innerHTML=`<td>${i}</td><td>${d.nombre}</td><td>${d.horaEntrada||""}</td><td>${d.horaSalida||""}</td><td>${d.tipo}</td><td></td>`;
      movimientosTable.appendChild(tr);
      i++;
    }
  });
}
renderMovimientos();

// ---------- USUARIOS ----------
const usersTable=document.querySelector("#usersTable tbody");
async function renderUsuarios(){
  usersTable.innerHTML="";
  const snapshot=await getDocs(usuariosRef);
  let i=1;
  snapshot.forEach(docSnap=>{
    const u=docSnap.data();
    if(userFiltro==="todos" || u.tipo===userFiltro){
      const tr=document.createElement("tr");
      let fichaBtn=`<button class="ficha-btn" onclick="mostrarFicha('${docSnap.id}')">FICHA</button>`;
      tr.innerHTML=`<td>${i}</td><td>${u.nombre}</td><td>${u.dni||""}</td><td>${u.celular||""}</td><td>${u.autorizante||""}</td><td>${u.fechaExp||""}</td><td>${u.tipo}</td>
      <td>${fichaBtn}<button class="edit-btn" onclick="editarUsuario('${docSnap.id}')">EDITAR</button><button class="del-btn" onclick="eliminarUsuario('${docSnap.id}')">ELIMINAR</button></td>`;
      usersTable.appendChild(tr);
      i++;
    }
  });
}
renderUsuarios();

// ---------- FUNCIONES FICHA ----------
window.mostrarFicha = async function(id){
  const docSnap = await getDocs(query(usuariosRef, where("__name__","==",id)));
  docSnap.forEach(d=>{
    const data=d.data();
    document.getElementById("fichaL").textContent=id;
    document.getElementById("fichaNombre").textContent=data.nombre;
    document.getElementById("fichaDni").textContent=data.dni||"";
    document.getElementById("fichaCelular").textContent=data.celular||"";
    document.getElementById("fichaAutorizante").textContent=data.autorizante||"";
    document.getElementById("fichaFechaExp").textContent=data.fechaExp||"";
    document.getElementById("fichaTipo").textContent=data.tipo;
    document.getElementById("fichaModal").classList.add("active");
  });
};
document.getElementById("closeFichaBtn").onclick=()=>document.getElementById("fichaModal").classList.remove("active");

// ---------- ELIMINAR USUARIO ----------
window.eliminarUsuario = async function(id){
  if(confirm("¿Desea eliminar este usuario?")){
    const docRef = doc(db,"usuarios",id);
    const docSnap = await getDocs(query(usuariosRef, where("__name__","==",id)));
    docSnap.forEach(d=>{
      addDoc(expiredRef,{...d.data(),fechaElim:new Date().toLocaleString()});
    });
    await deleteDoc(docRef);
    renderUsuarios();
  }
};

// ---------- AGREGAR USUARIO ----------
document.getElementById("addUserBtn").onclick = async ()=>{
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const celular = document.getElementById("userCelular").value.trim();
  const autorizante = document.getElementById("userAutorizante").value.trim();
  const tipo = document.getElementById("userTipo").value;
  if(!nombre){ alert("Nombre obligatorio"); return; }
  await addDoc(usuariosRef,{
    nombre,dni,celular,autorizante,tipo,fechaExp:new Date().toLocaleDateString()
  });
  document.getElementById("userNombre").value="";
  renderUsuarios();
};

// ---------- NOVEDADES ----------
const novedadesTable=document.querySelector("#novedadesTable tbody");
async function renderNovedades(){
  novedadesTable.innerHTML="";
  const snapshot = await getDocs(query(novedadesRef, orderBy("timestamp","desc"), limit(50)));
  snapshot.forEach(docSnap=>{
    const n = docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${n.hora}</td><td>${n.texto}</td><td><button class="del-btn" onclick="eliminarNovedad('${docSnap.id}')">ELIMINAR</button></td>`;
    novedadesTable.appendChild(tr);
  });
}
renderNovedades();

document.getElementById("guardarNovedadBtn").onclick=async ()=>{
  const texto = document.getElementById("novedadTexto").value.trim();
  if(!texto)return;
  await addDoc(novedadesRef,{texto,hora:new Date().toLocaleTimeString(),timestamp:serverTimestamp()});
  document.getElementById("novedadTexto").value="";
  renderNovedades();
};

window.eliminarNovedad = async function(id){
  if(confirm("Eliminar novedad?")){ await deleteDoc(doc(db,"novedades",id)); renderNovedades(); }
};
