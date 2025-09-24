// ===================== PARTE 1 =====================
// app.js - Control de ingreso completo

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, doc, deleteDoc, updateDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

// Configuración Firebase (tu proyecto)
const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.firebasestorage.app",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===================== ELEMENTOS DOM =====================
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const usersTableBody = document.querySelector("#usersTable tbody");
const expiredTableBody = document.querySelector("#expiredTable tbody");
const novedadesTableBody = document.querySelector("#novedadesTable tbody");

const scanBtn = document.getElementById("scanBtn");
const printActiveBtn = document.getElementById("printActiveBtn");
const scanOk = document.getElementById("scanOk");

const userFilterBtns = document.querySelectorAll(".user-filter-btn");
const tabBtns = document.querySelectorAll(".tab-btn");

// MODALES
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");

const editUserModal = document.getElementById("editUserModal");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const finalizeEditBtn = document.getElementById("finalizeEditBtn");

// ===================== FUNCIONES GENERALES =====================
function showPage(pageId) {
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  navBtns.forEach(b => b.classList.remove("active"));
  document.querySelector(`.nav-btn[data-section="${pageId}"]`).classList.add("active");
}

navBtns.forEach(btn => {
  btn.addEventListener("click", () => showPage(btn.dataset.section));
});

// ===================== UTILIDADES =====================
function clearTableBody(tbody) {
  tbody.innerHTML = "";
}

function formatTime(date) {
  const d = new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString();
}

function addRowToTable(tbody, rowData, type = "movimiento") {
  const tr = document.createElement("tr");
  if(type === "movimiento") tr.classList.add("recent");

  Object.values(rowData).forEach(value => {
    const td = document.createElement("td");
    td.textContent = value;
    tr.appendChild(td);
  });

  tbody.prepend(tr);
  setTimeout(() => tr.classList.remove("recent"), 4000);
}

// ===================== FIN PARTE 1 =====================

// ===================== PARTE 2 =====================
// MOVIMIENTOS - carga y registro

const movimientosCol = collection(db, "movimientos");

// Cargar movimientos desde Firebase en orden cronológico descendente
async function loadMovimientos(tipoFiltro = "todos") {
  clearTableBody(movimientosTableBody);

  let q = query(movimientosCol, orderBy("fecha", "desc"));
  if(tipoFiltro !== "todos") {
    q = query(movimientosCol, where("tipo", "==", tipoFiltro), orderBy("fecha", "desc"));
  }

  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    addRowToTable(movimientosTableBody, {
      "#L": data.id || docSnap.id,
      "Nombre": data.nombre,
      "H. Entrada": data.horaEntrada || "",
      "H. Salida": data.horaSalida || "",
      "Tipo": data.tipo,
      "Autorizante": data.autorizante || "",
      "Acción": "" // botones se agregan más adelante si deseas
    });
  });
}

// Escaneo de código
scanBtn.addEventListener("click", () => {
  scanModal.classList.add("active");
  scanInput.value = "";
  scanInput.focus();
});

cancelScanBtn.addEventListener("click", () => {
  scanModal.classList.remove("active");
  scanMessage.textContent = "";
});

scanInput.addEventListener("keydown", async (e) => {
  if(e.key === "Enter") {
    const code = scanInput.value.trim();
    if(!code) return;

    // Buscar usuario por código (campo 'codigo')
    const usersCol = collection(db, "usuarios");
    const q = query(usersCol, where("codigo", "==", code));
    const snapshot = await getDocs(q);

    if(snapshot.empty) {
      scanMessage.textContent = "Código no encontrado";
      scanMessage.style.color = "red";
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const now = new Date();

    // Registrar movimiento
    await addDoc(movimientosCol, {
      nombre: userData.nombre,
      tipo: userData.tipo,
      autorizante: userData.autorizante || "",
      horaEntrada: formatTime(now),
      horaSalida: "",
      fecha: now
    });

    scanMessage.textContent = "Registro OK";
    scanMessage.style.color = "green";
    scanOk.style.display = "inline-block";

    // Recargar tabla con nuevo registro
    loadMovimientos();
  }
});

// FILTROS TAB PANEL
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadMovimientos(btn.dataset.tipo);
  });
});

// ===================== USUARIOS =====================
const usersCol = collection(db, "usuarios");

// Cargar usuarios
async function loadUsers(tipoFiltro = "todos") {
  clearTableBody(usersTableBody);

  let q = query(usersCol, orderBy("fechaExpedicion", "desc"));
  if(tipoFiltro !== "todos") {
    q = query(usersCol, where("tipo", "==", tipoFiltro), orderBy("fechaExpedicion", "desc"));
  }

  const snapshot = await getDocs(q);
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    addRowToTable(usersTableBody, {
      "#L": data.id || docSnap.id,
      "Nombre": data.nombre,
      "DNI": data.dni || "",
      "Celular": data.celular || "",
      "Autorizante": data.autorizante || "",
      "F. Expedición": formatDate(data.fechaExpedicion),
      "Tipo": data.tipo,
      "Acciones": "" // botones agregar aquí si quieres editar/eliminar
    }, "usuario");
  });
}

// FILTROS USUARIOS
userFilterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    userFilterBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    loadUsers(btn.dataset.tipo);
  });
});

// Agregar usuario
const addUserBtn = document.getElementById("addUserBtn");
addUserBtn.addEventListener("click", async () => {
  const nombre = document.getElementById("userNombre").value.trim();
  if(!nombre) return;

  const newUser = {
    nombre,
    dni: document.getElementById("userDni").value.trim(),
    celular: document.getElementById("userCelular").value.trim(),
    autorizante: document.getElementById("userAutorizante").value.trim(),
    tipo: document.getElementById("userTipo").value,
    fechaExpedicion: new Date()
  };

  await addDoc(usersCol, newUser);

  document.getElementById("userMessage").textContent = "Usuario agregado!";
  loadUsers();
});

// ===================== FIN PARTE 2 =====================

// ===================== PARTE 3 =====================
// EXPIRADOS / ELIMINADOS
const expiredCol = collection(db, "expirados");

async function loadExpired() {
  clearTableBody(expiredTableBody);
  const snapshot = await getDocs(query(expiredCol, orderBy("fechaEliminacion", "desc")));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    addRowToTable(expiredTableBody, {
      "#L": data.id || docSnap.id,
      "Nombre": data.nombre,
      "DNI": data.dni || "",
      "Código Ingreso": data.codigoIngreso || "",
      "Código Salida": data.codigoSalida || "",
      "Tipo": data.tipo,
      "F. Eliminación": formatDate(data.fechaEliminacion)
    });
  });
}

// ELIMINAR USUARIO
async function deleteUser(userId) {
  // Mover a expirados
  const userDocRef = doc(db, "usuarios", userId);
  const userSnap = await getDoc(userDocRef);
  if(userSnap.exists()) {
    const data = userSnap.data();
    await addDoc(expiredCol, {
      ...data,
      fechaEliminacion: new Date()
    });
    await deleteDoc(userDocRef);
    loadUsers();
    loadExpired();
  }
}

// ===================== NOVEDADES =====================
const novedadesCol = collection(db, "novedades");

async function loadNovedades() {
  clearTableBody(novedadesTableBody);
  const snapshot = await getDocs(query(novedadesCol, orderBy("fecha", "desc")));
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    addRowToTable(novedadesTableBody, {
      "Hora": formatTime(data.fecha),
      "Novedad": data.texto,
      "Acción": ""
    });
  });
}

// Guardar novedad
guardarNovedadBtn.addEventListener("click", async () => {
  const texto = novedadTexto.value.trim();
  if(!texto) return;
  await addDoc(novedadesCol, { texto, fecha: new Date() });
  novedadTexto.value = "";
  novedadMsg.textContent = "OK!";
  loadNovedades();
});

// ===================== FUNCIONES AUXILIARES =====================
function clearTableBody(tbody) {
  while(tbody.firstChild) tbody.removeChild(tbody.firstChild);
}

function addRowToTable(tbody, data, tipo = "movimiento") {
  const tr = document.createElement("tr");
  tr.classList.add("recent");

  for(const key in data) {
    const td = document.createElement("td");
    td.textContent = data[key];
    if(key === "Autorizante") td.classList.add("autorizante-td");
    tr.appendChild(td);
  }

  tbody.appendChild(tr);
  setTimeout(() => tr.classList.remove("recent"), 4000);
}

function formatDate(d) {
  if(!d) return "";
  const date = d.toDate ? d.toDate() : d;
  return date.toLocaleDateString();
}

function formatTime(d) {
  if(!d) return "";
  const date = d.toDate ? d.toDate() : d;
  return date.toLocaleTimeString();
}

// ===================== FIN PARTE 3 =====================
