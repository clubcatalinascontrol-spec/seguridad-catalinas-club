// app.js — PARTE 1

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// ------------------- CONFIGURACIÓN FIREBASE -------------------
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

// ------------------- SECCIÓN / NAVEGACIÓN -------------------
const navButtons = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;

    // Activar botón
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    // Mostrar sección
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
  });
});

// ------------------- PASSWORD OVERLAY -------------------
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

const MASTER_PASSWORD = "123456789"; // Contraseña maestra

function unlockApp() {
  passwordBanner.style.display = "none";
}

initPassBtn.addEventListener("click", () => {
  if (initPassInput.value === MASTER_PASSWORD) {
    unlockApp();
  } else {
    initPassMsg.textContent = "Contraseña incorrecta";
    initPassMsg.style.color = "#c0392b";
    setTimeout(() => { initPassMsg.textContent = ""; }, 2000);
  }
});

// También desbloquea con Enter
initPassInput.addEventListener("keypress", e => {
  if (e.key === "Enter") initPassBtn.click();
});

// ------------------- UTILS -------------------
export function formatDateTime(dateObj) {
  const pad = n => n.toString().padStart(2, "0");
  return `${pad(dateObj.getDate())}/${pad(dateObj.getMonth()+1)}/${dateObj.getFullYear()} ${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
}
// app.js — PARTE 2

import { db, formatDateTime } from "./app.js"; // asumimos que Parte 1 ya cargada

// ------------------- USUARIOS -------------------
const usersTableBody = document.querySelector("#usersTable tbody");
const addUserBtn = document.getElementById("addUserBtn");
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userCelular = document.getElementById("userCelular");
const userAutorizante = document.getElementById("userAutorizante");
const userTipo = document.getElementById("userTipo");
const userMessage = document.getElementById("userMessage");
const userFilterButtons = document.querySelectorAll(".user-filter-btn");

let usersData = [];
let currentUserFilter = "todos";

// Cargar usuarios desde Firebase
async function loadUsers() {
  const q = query(collection(db, "usuarios"), orderBy("fechaExpedicion","desc"));
  const snapshot = await getDocs(q);
  usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderUsersTable();
}

// Renderizar tabla de usuarios
function renderUsersTable() {
  usersTableBody.innerHTML = "";
  const filtered = usersData.filter(u => currentUserFilter === "todos" || u.tipo === currentUserFilter);
  filtered.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.nombre}</td>
      <td>${u.dni || ""}</td>
      <td>${u.celular || ""}</td>
      <td>${u.autorizante || ""}</td>
      <td>${u.fechaExpedicion || ""}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${u.id}">Editar</button>
        <button class="del-btn" data-id="${u.id}">Eliminar</button>
      </td>`;
    usersTableBody.appendChild(tr);
  });

  // Asignar eventos a botones
  usersTableBody.querySelectorAll(".del-btn").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db,"usuarios",id));
      await loadUsers();
    });
  });
}

// Agregar usuario
addUserBtn.addEventListener("click", async () => {
  if (!userNombre.value.trim()) {
    userMessage.textContent = "Debe ingresar nombre";
    return;
  }
  const newId = Date.now().toString(); // ID único
  const newUser = {
    nombre: userNombre.value,
    dni: userDni.value || "",
    celular: userCelular.value || "",
    autorizante: userAutorizante.value || "",
    tipo: userTipo.value,
    fechaExpedicion: formatDateTime(new Date())
  };
  await setDoc(doc(db,"usuarios",newId), newUser);
  userNombre.value=""; userDni.value=""; userCelular.value=""; userAutorizante.value="";
  userMessage.textContent = "Usuario agregado";
  setTimeout(()=>userMessage.textContent="",2000);
  await loadUsers();
});

// Filtrar usuarios por tipo
userFilterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    currentUserFilter = btn.dataset.tipo;
    userFilterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    renderUsersTable();
  });
});

// ------------------- EXPIRADOS -------------------
const expiredTableBody = document.querySelector("#expiredTable tbody");
let expiredData = [];

async function loadExpired() {
  const q = query(collection(db,"expirados"), orderBy("fechaEliminacion","desc"));
  const snapshot = await getDocs(q);
  expiredData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderExpiredTable();
}

function renderExpiredTable() {
  expiredTableBody.innerHTML = "";
  expiredData.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.nombre}</td>
      <td>${u.dni || ""}</td>
      <td>${u.codigoIngreso || ""}</td>
      <td>${u.codigoSalida || ""}</td>
      <td>${u.tipo}</td>
      <td>${u.fechaEliminacion || ""}</td>`;
    expiredTableBody.appendChild(tr);
  });
}

// Inicializar carga
loadUsers();
loadExpired();
// app.js — PARTE 3

import { db, formatDateTime } from "./app.js"; // asumimos que Parte 1 ya cargada

// ------------------- PANEL -------------------
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const tabButtons = document.querySelectorAll(".tab-btn");
let movimientosData = [];
let currentTipoFilter = "todos";

// Cargar movimientos
async function loadMovimientos() {
  const q = query(collection(db,"movimientos"), orderBy("horaEntrada","desc"));
  const snapshot = await getDocs(q);
  movimientosData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderMovimientosTable();
}

// Renderizar tabla de movimientos
function renderMovimientosTable() {
  movimientosTableBody.innerHTML = "";
  const filtered = movimientosData.filter(m => currentTipoFilter==="todos" || m.tipo===currentTipoFilter);
  filtered.forEach(m => {
    const tr = document.createElement("tr");
    tr.classList.add("recent");
    tr.innerHTML = `
      <td>${m.id}</td>
      <td>${m.nombre}</td>
      <td>${m.horaEntrada || ""}</td>
      <td>${m.horaSalida || ""}</td>
      <td>${m.tipo}</td>
      <td class="autorizante-td" style="display:none;">${m.autorizante || ""}</td>
      <td>
        <button class="print-btn" data-id="${m.id}">Imprimir</button>
      </td>`;
    movimientosTableBody.appendChild(tr);
  });
  // Desaparecer highlight
  setTimeout(() => {
    movimientosTableBody.querySelectorAll(".recent").forEach(r=>r.classList.remove("recent"));
  },4000);
}

// Filtrar por tipo
tabButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    currentTipoFilter = btn.dataset.tipo;
    tabButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderMovimientosTable();
  });
});

// Abrir modal escaneo
scanBtn.addEventListener("click",()=>{
  scanModal.classList.add("active");
  scanInput.value="";
  scanMessage.textContent="";
  scanInput.focus();
});

// Cancelar escaneo
cancelScanBtn.addEventListener("click",()=>{
  scanModal.classList.remove("active");
});

// Registrar código escaneado
scanInput.addEventListener("keypress", async (e)=>{
  if(e.key==="Enter"){
    const code = scanInput.value.trim();
    if(!code) return;
    scanMessage.textContent="Procesando...";
    
    // Buscar usuario por código o DNI
    const q = query(collection(db,"usuarios"), where("dni","==",code), limit(1));
    const snapshot = await getDocs(q);
    if(snapshot.empty){
      scanMessage.textContent="Código no encontrado";
      return;
    }
    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const movimientoId = Date.now().toString();
    const horaActual = formatDateTime(new Date());
    
    // Crear registro de movimiento
    const movimiento = {
      id: movimientoId,
      nombre: userData.nombre,
      tipo: userData.tipo,
      autorizante: userData.autorizante || "",
      horaEntrada: horaActual,
      horaSalida: "",
    };
    await setDoc(doc(db,"movimientos",movimientoId), movimiento);
    
    scanMessage.textContent="OK";
    scanInput.value="";
    scanModal.classList.remove("active");
    await loadMovimientos();
  }
});

// Imprimir movimiento
movimientosTableBody.addEventListener("click", (e)=>{
  if(e.target.classList.contains("print-btn")){
    const tr = e.target.closest("tr");
    const content = tr.innerHTML;
    const w = window.open();
    w.document.write(`<table>${content}</table>`);
    w.print();
    w.close();
  }
});

// Inicializar carga
loadMovimientos();
