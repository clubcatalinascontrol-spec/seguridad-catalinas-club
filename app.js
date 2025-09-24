// app.js - PARTE 1/2

// =======================
// Inicializar Firebase
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs,
  query, orderBy, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

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

// =======================
// Referencias a elementos
// =======================
const panelSection = document.getElementById("panel");
const usuariosSection = document.getElementById("usuarios");
const expiradosSection = document.getElementById("expirados");

const panelTableBody = document.querySelector("#panelTable tbody");
const usuariosTableBody = document.querySelector("#usuariosTable tbody");
const expiradosTableBody = document.querySelector("#expiradosTable tbody");

const filterButtons = document.querySelectorAll(".filter-btn");

// =======================
// Navegación entre secciones
// =======================
function showSection(sectionId) {
  [panelSection, usuariosSection, expiradosSection].forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => showSection(btn.dataset.target));
});

// =======================
// Cargar movimientos (PANEL)
// =======================
function renderPanelRow(docSnap) {
  const data = docSnap.data();
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${data.codigo || "-"}</td>
    <td>${data.nombre || "-"}</td>
    <td>${data.tipo || "-"}</td>
    <td>${data.fecha || "-"}</td>
    <td>${data.hora || "-"}</td>
  `;
  panelTableBody.appendChild(tr);
}

function loadPanel() {
  const q = query(collection(db, "movimientos"), orderBy("timestamp", "desc"));
  onSnapshot(q, (snapshot) => {
    panelTableBody.innerHTML = "";
    snapshot.forEach(docSnap => renderPanelRow(docSnap));
  });
}
loadPanel();

// =======================
// Filtro por tipo (PANEL)
// =======================
filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const tipo = btn.dataset.tipo;
    const q = query(
      collection(db, "movimientos"),
      orderBy("timestamp", "desc")
    );
    onSnapshot(q, (snapshot) => {
      panelTableBody.innerHTML = "";
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (tipo === "todos" || data.tipo === tipo) {
          renderPanelRow(docSnap);
        }
      });
    });
  });
});
// app.js - PARTE 2/2

// =======================
// Cargar Usuarios
// =======================
function renderUsuarioRow(docSnap) {
  const data = docSnap.data();
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${data.nombre || "-"}</td>
    <td>${data.tipo || "-"}</td>
    <td>${data.codigo || "-"}</td>
    <td>
      <button class="btn-eliminar" data-id="${docSnap.id}">Eliminar</button>
    </td>
  `;
  usuariosTableBody.appendChild(tr);
}

function loadUsuarios() {
  const q = query(collection(db, "usuarios"), orderBy("nombre"));
  onSnapshot(q, (snapshot) => {
    usuariosTableBody.innerHTML = "";
    snapshot.forEach(docSnap => renderUsuarioRow(docSnap));
    attachDeleteListeners();
  });
}
loadUsuarios();

function attachDeleteListeners() {
  document.querySelectorAll(".btn-eliminar").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "usuarios", id));
    });
  });
}

// =======================
// Cargar Expirados con paginación
// =======================
let currentPage = 1;
const rowsPerPage = 25;

function renderExpiradoRow(docSnap) {
  const data = docSnap.data();
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td>${data.codigo || "-"}</td>
    <td>${data.nombre || "-"}</td>
    <td>${data.tipo || "-"}</td>
    <td>${data.fechaEliminacion || "-"}</td>
  `;
  expiradosTableBody.appendChild(tr);
}

function loadExpirados() {
  const q = query(collection(db, "expirados"), orderBy("fechaEliminacion", "desc"));
  onSnapshot(q, (snapshot) => {
    const docs = snapshot.docs;
    renderExpiradosPage(docs, currentPage);
    setupPagination(docs);
  });
}
loadExpirados();

function renderExpiradosPage(docs, page) {
  expiradosTableBody.innerHTML = "";
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  docs.slice(start, end).forEach(docSnap => renderExpiradoRow(docSnap));
}

function setupPagination(docs) {
  const paginationDiv = document.getElementById("expiradosPagination");
  paginationDiv.innerHTML = "";
  const totalPages = Math.ceil(docs.length / rowsPerPage);

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderExpiradosPage(docs, currentPage);
    });
    paginationDiv.appendChild(btn);
  }
}

// =======================
// Escanear (Entrada de códigos)
// =======================
const escanearBtn = document.getElementById("btnEscanear");
const cancelarBtn = document.getElementById("btnCancelar");
const escanearDiv = document.getElementById("escanearDiv");
const inputCodigo = document.getElementById("inputCodigo");

escanearBtn.addEventListener("click", () => {
  escanearDiv.style.display = "block"; // se mantiene visible
  inputCodigo.focus();
});

cancelarBtn.addEventListener("click", () => {
  escanearDiv.style.display = "none";
  inputCodigo.value = "";
});

// Registrar código al presionar Enter
inputCodigo.addEventListener("keypress", async (e) => {
  if (e.key === "Enter") {
    const codigo = inputCodigo.value.trim();
    if (codigo !== "") {
      await addDoc(collection(db, "movimientos"), {
        codigo,
        nombre: "Desconocido",  // aquí debe venir de usuarios si existe
        tipo: "OTROS",
        fecha: new Date().toLocaleDateString(),
        hora: new Date().toLocaleTimeString(),
        timestamp: Date.now()
      });
      inputCodigo.value = "";
    }
  }
});

// =======================
// Impresión
// =======================
document.getElementById("btnImprimir").addEventListener("click", () => {
  window.print();
});
