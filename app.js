// app.js - usa CDN modular Firebase 9.x (tal como pediste)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ---------- CONFIG FIREBASE (usa tu config) ---------- */
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

const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");

/* ---------- PIN maestro (localStorage) ---------- */
if (!localStorage.getItem("pinMaestro")) localStorage.setItem("pinMaestro", "1234");

/* ---------- HELPERS ---------- */
function generarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
function horaActualStr() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const dd = d.getDate().toString().padStart(2, "0");
  const mo = (d.getMonth() + 1).toString().padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
}

/* ---------- USUARIOS POR DEFECTO (asegurar existencia) ---------- */
const defaultUsers = [
  { L: "999", nombre: "Prueba A", dni: "11222333", tipo: "otro", codigoIngreso: generarCodigo(), codigoSalida: generarCodigo() },
  { L: "998", nombre: "Prueba B", dni: "44555666", tipo: "empleado", codigoIngreso: generarCodigo(), codigoSalida: generarCodigo() }
];

async function loadDefaultUsers() {
  try {
    const snap = await getDocs(usuariosRef);
    const existingL = snap.docs.map(d => d.data().L);
    for (const u of defaultUsers) {
      if (!existingL.includes(u.L)) {
        await addDoc(usuariosRef, u);
      }
    }
  } catch (err) {
    console.error("Error al cargar usuarios por defecto:", err);
  }
}
loadDefaultUsers();

/* ---------- NAVEGACIÓN (SPA) ---------- */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    pages.forEach(p => p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* ---------- ELEMENTOS USUARIOS ---------- */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userTipo = document.getElementById("userTipo");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

/* Agregar usuario */
addUserBtn.addEventListener("click", async () => {
  const L = userL.value.trim();
  const nombre = userNombre.value.trim();
  const dni = userDni.value.trim();
  const tipo = userTipo.value;
  if (!L || !nombre || !dni || !tipo) {
    userMessage.textContent = "Complete todos los campos";
    return;
  }
  if (!/^\d{1,3}$/.test(L)) { userMessage.textContent = "#L debe ser hasta 3 dígitos"; return; }
  if (!/^\d{8}$/.test(dni)) { userMessage.textContent = "DNI debe tener 8 dígitos"; return; }
  try {
    await addDoc(usuariosRef, {
      L, nombre, dni, tipo,
      codigoIngreso: generarCodigo(),
      codigoSalida: generarCodigo()
    });
    userMessage.textContent = "Usuario agregado con éxito";
    userL.value = ""; userNombre.value = ""; userDni.value = ""; userTipo.value = "";
    setTimeout(() => userMessage.textContent = "", 3000);
  } catch (err) {
    console.error(err);
    userMessage.textContent = "Error al agregar usuario";
  }
});

/* Render usuarios (real-time) */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot => {
  usersTableBody.innerHTML = "";
  snapshot.docs.forEach(docSnap => {
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="editUser">Editar</button>
        <button class="delUser">Eliminar</button>
        <button class="printUser">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    /* Editar (PIN requerido) */
    tr.querySelector(".editUser").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      const newNombre = prompt("Nombre completo:", u.nombre);
      if (newNombre === null) return;
      const newDni = prompt("DNI (8 dígitos):", u.dni);
      if (newDni === null) return;
      if (!/^\d{8}$/.test(newDni)) { alert("DNI inválido"); return; }
      const newTipo = prompt("Tipo (propietario|administracion|empleado|obrero|invitado|guardia|otro):", u.tipo);
      if (newTipo === null) return;
      try {
        await updateDoc(doc(db, "usuarios", docSnap.id), { nombre: newNombre, dni: newDni, tipo: newTipo });
      } catch (err) { console.error(err); alert("Error editando usuario"); }
    });

    /* Eliminar (PIN requerido) */
    tr.querySelector(".delUser").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      if (!confirm("Eliminar usuario permanentemente?")) return;
      try { await deleteDoc(doc(db, "usuarios", docSnap.id)); } catch (err) { console.error(err); alert("Error eliminando usuario"); }
    });

    /* Imprimir tarjeta (PIN requerido) */
    tr.querySelector(".printUser").addEventListener("click", () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      const w = window.open("", "_blank", "width=600,height=350");
      const borderColor = (function (t) {
        switch (t) {
          case "propietario": return "violet";
          case "administracion": return "orange";
          case "empleado": return "green";
          case "obrero": return "yellow";
          case "invitado": return "cyan";
          case "guardia": return "red";
          default: return "gray";
        }
      })(u.tipo);
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
          <style>body{font-family:Arial;text-align:center} .card{width:15cm;height:6cm;border:1cm solid ${borderColor};padding:8px;box-sizing:border-box}</style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
        <div class="card">
          <div style="font-size:14px;margin-bottom:6px">#L ${u.L} - ${u.nombre} - ${u.dni} - ${u.tipo}</div>
          <svg id="codeIn" style="display:block;margin:6px auto"></svg>
          <div style="height:8px"></div>
          <svg id="codeOut" style="display:block;margin:6px auto"></svg>
        </div>
        <script>
          JsBarcode(document.getElementById('codeIn'), "${u.codigoIngreso}", {format:'CODE128', width:2, height:40});
          JsBarcode(document.getElementById('codeOut'), "${u.codigoSalida}", {format:'CODE128', width:2, height:40});
          window.print();
          setTimeout(()=>window.close(), 600);
        <\/script>
        </body></html>
      `);
    });
  });
});

/* ---------- MOVIMIENTOS (real-time, paginación y auto-print) ---------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [];
let currentPage = 1;
let prevMovCount = 0;

function renderPagination(totalItems) {
  const totalPages = Math.min(10, Math.max(1, Math.ceil(totalItems / MOV_LIMIT)));
  paginationDiv.innerHTML = "";
  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === currentPage) { btn.style.background = "#d8a800"; btn.style.color = "#111"; }
    btn.addEventListener("click", () => { currentPage = p; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

function renderMovsPage() {
  movimientosTableBody.innerHTML = "";
  const start = (currentPage - 1) * MOV_LIMIT;
  const page = movimientosCache.slice(start, start + MOV_LIMIT);
  page.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td><td><button class="delMov">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      if (!confirm("Eliminar movimiento permanentemente?")) return;
      try { await deleteDoc(doc(db, "movimientos", item.__id)); } catch (err) { console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}

/* printing helper for movements */
function printMovementsPage(pageData) {
  const w = window.open("", "_blank");
  let html = `<html><head><title>Movimientos</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body>`;
  html += `<h3>Últimos ${pageData.length} movimientos</h3>`;
  html += `<table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr></thead><tbody>`;
  pageData.forEach(m => { html += `<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`; });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
  w.close();
}

/* onSnapshot movimientos (orden descendente por hora) */
onSnapshot(query(movimientosRef, orderBy("hora", "desc")), snapshot => {
  movimientosCache = snapshot.docs.map(d => ({ __id: d.id, ...d.data() }));
  // si llegó nueva data y el total es múltiplo exacto de MOV_LIMIT -> imprimir automáticamente últimos MOV_LIMIT
  const newCount = movimientosCache.length;
  if (newCount > prevMovCount && (newCount % MOV_LIMIT) === 0) {
    // imprimir los últimos MOV_LIMIT (página 1)
    const pageToPrint = movimientosCache.slice(0, MOV_LIMIT);
    try { printMovementsPage(pageToPrint); } catch (err) { console.error("Error auto-print:", err); }
  }
  prevMovCount = newCount;
  // ajustar currentPage si es necesario y renderizar
  const totalPages = Math.min(10, Math.max(1, Math.ceil(movimientosCache.length / MOV_LIMIT)));
  if (currentPage > totalPages) currentPage = totalPages;
  renderMovsPage();
});

/* ---------- ESCANEO (un solo botón) ---------- */
document.getElementById("scanBtn").addEventListener("click", async () => {
  const codigo = prompt("Escanee código de barra:");
  if (!codigo) return;
  try {
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso", "==", codigo)));
    let tipoMov = "entrada";
    if (snap.empty) {
      snap = await getDocs(query(usuariosRef, where("codigoSalida", "==", codigo)));
      if (snap.empty) { alert("Código no reconocido"); return; }
      tipoMov = "salida";
    }
    for (const d of snap.docs) {
      const u = d.data();
      const mov = { L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, hora: new Date() };
      if (tipoMov === "entrada") mov.entrada = horaActualStr();
      else mov.salida = horaActualStr();
      await addDoc(movimientosRef, mov);
    }
    alert("Movimiento registrado");
  } catch (err) {
    console.error("Error en escaneo:", err);
    alert("Error registrando movimiento");
  }
});

/* ---------- IMPRIMIR ÚLTIMA PÁGINA (manual) ---------- */
document.getElementById("printPageBtn").addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(movimientosRef, orderBy("hora", "desc"), limit(MOV_LIMIT)));
    const data = snap.docs.map(d => d.data());
    printMovementsPage(data);
  } catch (err) {
    console.error("Error imprimiendo última página:", err);
    alert("Error imprimiendo última página");
  }
});

/* ---------- CONFIG: cambiar PIN (requiere PIN actual) ---------- */
document.getElementById("savePin").addEventListener("click", () => {
  const current = document.getElementById("currentPin").value.trim();
  const nuevo = document.getElementById("newPin").value.trim();
  if (current !== localStorage.getItem("pinMaestro")) { alert("PIN actual incorrecto"); return; }
  if (!/^\d{4}$/.test(nuevo)) { alert("Nuevo PIN debe tener 4 dígitos"); return; }
  localStorage.setItem("pinMaestro", nuevo);
  alert("PIN maestro actualizado");
  document.getElementById("currentPin").value = "";
  document.getElementById("newPin").value = "";
});
