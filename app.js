// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ----------------------------- Firebase config ----------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBmgexrB3aDlx5XARYqigaPoFsWX5vDz_4",
  authDomain: "seguridad-catalinas-club.firebaseapp.com",
  projectId: "seguridad-catalinas-club",
  storageBucket: "seguridad-catalinas-club.firebasestorage.app",
  messagingSenderId: "980866194296",
  appId: "1:980866194296:web:3fefc2a107d0ec6052468d"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* ----------------------------- Colecciones ----------------------------- */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes");
const novedadesRef = collection(db, "novedades");

/* ----------------------------- Contraseña inicial única ----------------------------- */
const INITIAL_PASS = "1409";
let isUnlocked = localStorage.getItem("unlocked") === "true";

/* ----------------------------- Helpers ----------------------------- */
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActualStr(){ const d=new Date(); const hh=d.getHours().toString().padStart(2,"0"); const mm=d.getMinutes().toString().padStart(2,"0"); const dd=d.getDate().toString().padStart(2,"0"); const mo=(d.getMonth()+1).toString().padStart(2,"0"); const yyyy=d.getFullYear(); return `${hh}:${mm} (${dd}/${mo}/${yyyy})`; }
function fechaDDMMYYYY(dateIso){ const d = dateIso ? new Date(dateIso) : new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `(${dd}/${mm}/${yyyy})`; }
function isoNow(){ return new Date().toISOString(); }

/* ----------------------------- UI elementos globales ----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

/* función para bloquear/desbloquear acciones del UI */
function toggleActionsDisabled(disabled){
  const selectors = [
    '#movimientosTable button',
    '#usersTable button',
    '#expiredTable button',
    '#novedadesTable button',
    '#scanBtn',
    '#printActiveBtn',
    '#addUserBtn',
    '#guardarNovedadBtn'
  ];
  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(b=>{
      b.disabled = !!disabled;
      if(disabled) b.classList.add('disabled');
      else b.classList.remove('disabled');
    });
  });
  if(disabled){
    document.querySelector('.topbar').style.display = 'none';
    passwordBanner.style.display = 'flex';
    pages.forEach(p=>p.classList.remove('active'));
    const el = document.getElementById('panel'); if(el) el.classList.add('active');
  } else {
    document.querySelector('.topbar').style.display = 'flex';
    passwordBanner.style.display = 'none';
  }
}

toggleActionsDisabled(!isUnlocked);

/* evento ingreso de contraseña inicial */
initPassBtn.addEventListener('click', ()=>{
  const v = (initPassInput.value || "").trim();
  if(v === INITIAL_PASS){
    isUnlocked = true;
    localStorage.setItem("unlocked", "true");
    initPassMsg.style.color = 'green';
    initPassMsg.textContent = 'Desbloqueado';
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color = 'red';
    initPassMsg.textContent = 'Contraseña incorrecta';
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 1200);
  }
});

/* ----------------------------- Navegación SPA ----------------------------- */
navBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  const target=btn.dataset.section;
  pages.forEach(p=>p.classList.remove("active"));
  const el = document.getElementById(target);
  if(el) el.classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* ----------------------------- Select #L desplegable ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  userL.innerHTML = "";
  editUserL.innerHTML = "";
  const optNN = document.createElement("option"); optNN.value="NN"; optNN.textContent="NN"; userL.appendChild(optNN);
  const optNN2 = document.createElement("option"); optNN2.value="NN"; optNN2.textContent="NN"; editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option"); opt.value=val; opt.textContent=val; userL.appendChild(opt);
    const opt2 = document.createElement("option"); opt2.value=val; opt2.textContent=val; editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* ----------------------------- USUARIOS (añadidos: celular, autorizante, fechaExpedicion) ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// Agregar usuario
addUserBtn.addEventListener("click",async ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  const L=userL.value.trim();
  let nombre=userNombre.value.trim();
  const dni=userDni.value.trim();
  const tipo=userTipo.value;
  const celular=userCelular.value.trim();
  const autorizante=userAutorizante.value.trim();
  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){
    userMessage.style.color="red";
    userMessage.textContent="Debe cargar un nombre, un número de Lote y un Tipo para continuar";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 3000);
    return;
  }
  if(dni && !/^\d{8}$/.test(dni)){
    userMessage.style.color="red";
    userMessage.textContent="Si ingresa DNI, debe tener 8 dígitos";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
    return;
  }
  if(celular && !/^\d{10}$/.test(celular)){
    userMessage.style.color="red";
    userMessage.textContent="Celular debe tener 10 dígitos si se ingresa";
    setTimeout(()=>{ userMessage.textContent=""; }, 2500);
    return;
  }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){
    userMessage.style.color="red";
    userMessage.textContent="Autorizante: solo letras (max 12)";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
    return;
  }
  nombre = nombre.toUpperCase();
  try{
    if(dni){
      const qDni = query(usuariosRef, where("dni","==",dni));
      const existing = await getDocs(qDni);
      if(!existing.empty){
        userMessage.style.color = "red";
        userMessage.textContent = "DNI ya registrado";
        setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
        return;
      }
    }
    const fechaExpIso = isoNow();
    await addDoc(usuariosRef,{
      L, nombre, dni: dni || "", tipo, celular: celular || "", autorizante: autorizante || "", fechaExpedicion: fechaExpIso,
      codigoIngreso: generarCodigo(), codigoSalida: generarCodigo()
    });
    userMessage.style.color = "green";
    userMessage.textContent="Usuario agregado";
    userNombre.value=""; userDni.value=""; userTipo.value="NN"; userCelular.value=""; userAutorizante.value="";
  }catch(e){ console.error(e); userMessage.style.color="red"; userMessage.textContent="Error al agregar usuario"; }
});

// Función para renderizar tabla de usuarios
async function renderUsers(){
  const snapshot = await getDocs(query(usuariosRef, orderBy("nombre")));
  usersTableBody.innerHTML = "";
  snapshot.forEach(docu=>{
    const u = docu.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni || ""}</td>
      <td>${u.tipo}</td>
      <td>${u.celular || ""}</td>
      <td>${fechaDDMMYYYY(u.fechaExpedicion)}</td>
      <td>
        <button class="btnEditUser" data-id="${docu.id}">Editar</button>
        <button class="btnDelUser" data-id="${docu.id}">Eliminar</button>
      </td>
    `;
    usersTableBody.appendChild(tr);
  });
}
renderUsers();
