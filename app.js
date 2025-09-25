// app.js (módulo) - Firebase 9.22 (PARTE 1)
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

/* ----------------------------- Helpers ----------------------------- */
const generarCodigo = () => Math.random().toString(36).substring(2,10).toUpperCase();
const horaActualStr = () => {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2,"0");
  const mm = d.getMinutes().toString().padStart(2,"0");
  const dd = d.getDate().toString().padStart(2,"0");
  const mo = (d.getMonth()+1).toString().padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
};
function parseToDate(d){
  if(!d) return null;
  if(typeof d === "string") return new Date(d);
  if(typeof d.toDate === "function") return d.toDate();
  if(typeof d.seconds === "number") return new Date(d.seconds*1000);
  return new Date(d);
}
function fechaDDMMYYYY(dateIso){
  const dt = parseToDate(dateIso) || new Date();
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yyyy = dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
const isoNow = () => new Date().toISOString();

/* ----------------------------- UI elementos globales ----------------------------- */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

const INITIAL_PASS = "1409";
let isUnlocked = localStorage.getItem("unlocked") === "true";
function toggleActionsDisabled(disabled){
  const selectors = [
    '#movimientosTable button', '#usersTable button', '#expiredTable button',
    '#novedadesTable button', '#scanBtn', '#printActiveBtn', '#addUserBtn', '#guardarNovedadBtn'
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
    const el = document.getElementById('panel');
    if(el) el.classList.add('active');
  } else {
    document.querySelector('.topbar').style.display = 'flex';
    passwordBanner.style.display = 'none';
  }
}
toggleActionsDisabled(!isUnlocked);
initPassBtn.addEventListener('click', ()=>{
  const v = (initPassInput.value || "").trim();
  if(v === INITIAL_PASS){
    isUnlocked = true;
    localStorage.setItem("unlocked","true");
    initPassMsg.style.color = 'green';
    initPassMsg.textContent = 'Desbloqueado';
    setTimeout(()=>{ initPassMsg.textContent=''; initPassInput.value=''; },900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color='red';
    initPassMsg.textContent='Contraseña incorrecta';
    setTimeout(()=>{ initPassMsg.textContent=''; initPassInput.value=''; },1200);
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
  if(!userL || !editUserL) return;
  userL.innerHTML="";
  editUserL.innerHTML="";
  const optNN = document.createElement("option");
  optNN.value="NN"; optNN.textContent="NN";
  userL.appendChild(optNN);
  const optNN2 = document.createElement("option");
  optNN2.value="NN"; optNN2.textContent="NN";
  editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option");
    opt.value=val; opt.textContent=val;
    userL.appendChild(opt);
    const opt2 = document.createElement("option");
    opt2.value=val; opt2.textContent=val;
    editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* ----------------------------- USUARIOS (AGREGAR + render real-time + editar/eliminar/print/ficha) ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  const L = userL ? userL.value.trim() : "NN";
  let nombre = (userNombre ? userNombre.value : "").trim();
  const dni = (userDni ? userDni.value.trim() : "");
  const tipo = userTipo ? userTipo.value : "NN";
  const celular = userCelular ? userCelular.value.trim() : "";
  const autorizante = userAutorizante ? userAutorizante.value.trim() : "";
  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Debe cargar un nombre, un número de Lote y un Tipo"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; },3000); }
    return;
  }
  if(dni && !/^\d{8}$/.test(dni)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Si ingresa DNI, debe tener 8 dígitos"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; },2500);} return;
  }
  if(celular && !/^\d{10}$/.test(celular)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Celular debe tener 10 dígitos si se ingresa"; setTimeout(()=>{ userMessage.textContent=""; },2500);} return;
  }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Autorizante: solo letras (max 12)"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; },2500);} return;
  }
  nombre = nombre.toUpperCase();
  try{
    if(dni){
      const qDni = query(usuariosRef, where("dni","==",dni));
      const existing = await getDocs(qDni);
      if(!existing.empty){
        if(userMessage){ userMessage.style.color="red"; userMessage.textContent="DNI ya registrado"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; },2500); }
        return;
      }
    }
    const fechaExpIso = isoNow();
    await addDoc(usuariosRef,{
      L, nombre, dni: dni||"", tipo, celular: celular||"", autorizante: autorizante||"", fechaExpedicion: fechaExpIso,
      codigoIngreso: generarCodigo(), codigoSalida: generarCodigo()
    });
    if(userMessage){ userMessage.style.color="green"; userMessage.textContent="Usuario agregado"; setTimeout(()=>userMessage.textContent="",2500); }
    if(userL) userL.value="NN"; if(userNombre) userNombre.value=""; if(userDni) userDni.value=""; if(userTipo) userTipo.value="NN"; if(userCelular) userCelular.value=""; if(userAutorizante) userAutorizante.value="";
  }catch(err){ console.error(err); if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Error"; setTimeout(()=>userMessage.textContent="",2500); } }
});

// Render usuarios en tiempo real (orden por L)
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  if(!usersTableBody) return;
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.L||""}</td>
      <td>${(u.nombre||"").toUpperCase()}</td>
      <td>${u.dni||""}</td>
      <td>${u.celular||""}</td>
      <td>${u.autorizante||""}</td>
      <td>${u.fechaExpedicion ? fechaDDMMYYYY(u.fechaExpedicion) : ""}</td>
      <td>${u.tipo||""}</td>
      <td>
        <button class="ficha-btn">FICHA</button>
        <button class="edit-btn">Editar</button>
        <button class="del-btn">Eliminar</button>
        <button class="print-btn">Imprimir</button>
      </td>`;
    usersTableBody.appendChild(tr);

    // … (listeners FICHA, EDITAR, ELIMINAR, IMPRIMIR, mantener funcionalidad original)
  });
});
