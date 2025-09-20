// app.js - usa CDN modular Firebase 9.x (tal como pediste)
// app.js (módulo) - usa Firebase modular 9.22.0 (el SDK que proporcionaste)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ---------- CONFIG FIREBASE (usa tu config) ---------- */
/* -----------------------------
   Firebase config (tu config)
   ----------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBmgexrB3aDlx5XARYqigaPoFsWX5vDz_4",
  authDomain: "seguridad-catalinas-club.firebaseapp.com",
@@ -17,13 +19,20 @@ const firebaseConfig = {
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/* colecciones */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");

/* ---------- PIN maestro (localStorage) ---------- */
if (!localStorage.getItem("pinMaestro")) localStorage.setItem("pinMaestro", "1234");
/* -----------------------------
   Contraseña admin (4 dígitos)
   - almacenada en localStorage con la clave 'adminPass'
   - por defecto '1234' (puedes cambiarla en CONFIG)
   ----------------------------- */
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234");

/* ---------- HELPERS ---------- */
/* -----------------------------
   Helpers
   ----------------------------- */
function generarCodigo() {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}
@@ -37,7 +46,9 @@ function horaActualStr() {
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
}

/* ---------- USUARIOS POR DEFECTO (asegurar existencia) ---------- */
/* -----------------------------
   Usuarios por defecto (garantizar existencia)
   ----------------------------- */
const defaultUsers = [
  { L: "999", nombre: "Prueba A", dni: "11222333", tipo: "otro", codigoIngreso: generarCodigo(), codigoSalida: generarCodigo() },
  { L: "998", nombre: "Prueba B", dni: "44555666", tipo: "empleado", codigoIngreso: generarCodigo(), codigoSalida: generarCodigo() }
@@ -53,12 +64,14 @@ async function loadDefaultUsers() {
      }
    }
  } catch (err) {
    console.error("Error al cargar usuarios por defecto:", err);
    console.error("Error cargando usuarios por defecto:", err);
  }
}
loadDefaultUsers();

/* ---------- NAVEGACIÓN (SPA) ---------- */
/* -----------------------------
   Navegación SPA (botones en topbar)
   ----------------------------- */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn => {
@@ -71,7 +84,9 @@ navBtns.forEach(btn => {
  });
});

/* ---------- ELEMENTOS USUARIOS ---------- */
/* -----------------------------
   USUARIOS: agregar, render y acciones
   ----------------------------- */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
@@ -80,7 +95,6 @@ const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

/* Agregar usuario */
addUserBtn.addEventListener("click", async () => {
  const L = userL.value.trim();
  const nombre = userNombre.value.trim();
@@ -92,6 +106,7 @@ addUserBtn.addEventListener("click", async () => {
  }
  if (!/^\d{1,3}$/.test(L)) { userMessage.textContent = "#L debe ser hasta 3 dígitos"; return; }
  if (!/^\d{8}$/.test(dni)) { userMessage.textContent = "DNI debe tener 8 dígitos"; return; }

  try {
    await addDoc(usuariosRef, {
      L, nombre, dni, tipo,
@@ -100,14 +115,14 @@ addUserBtn.addEventListener("click", async () => {
    });
    userMessage.textContent = "Usuario agregado con éxito";
    userL.value = ""; userNombre.value = ""; userDni.value = ""; userTipo.value = "";
    setTimeout(() => userMessage.textContent = "", 3000);
    setTimeout(() => userMessage.textContent = "", 2800);
  } catch (err) {
    console.error(err);
    userMessage.textContent = "Error al agregar usuario";
    console.error("Error agregar usuario:", err);
    userMessage.textContent = "Error al agregar";
  }
});

/* Render usuarios (real-time) */
/* Render usuarios en tiempo real (orden por L) */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot => {
  usersTableBody.innerHTML = "";
  snapshot.docs.forEach(docSnap => {
@@ -119,42 +134,58 @@ onSnapshot(query(usuariosRef, orderBy("L")), snapshot => {
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="editUser">Editar</button>
        <button class="delUser">Eliminar</button>
        <button class="printUser">Imprimir Tarjeta</button>
        <button class="editUser" data-id="${docSnap.id}">Editar</button>
        <button class="delUser" data-id="${docSnap.id}">Eliminar</button>
        <button class="printUser" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    /* Editar (PIN requerido) */
    tr.querySelector(".editUser").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      const newNombre = prompt("Nombre completo:", u.nombre);
    // Editar usuario (requiere contraseña admin)
    tr.querySelector(".editUser").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administradora (4 dígitos):");
      if (pass !== localStorage.getItem("adminPass")) { alert("Contraseña incorrecta"); return; }

      const newL = prompt("Nuevo #L (hasta 3 dígitos):", u.L);
      if (newL === null) return;
      if (!/^\d{1,3}$/.test(newL)) { alert("#L inválido"); return; }

      const newNombre = prompt("Nuevo nombre (max 30):", u.nombre);
      if (newNombre === null) return;
      const newDni = prompt("DNI (8 dígitos):", u.dni);
      if (newNombre.trim().length === 0 || newNombre.trim().length > 30) { alert("Nombre inválido"); return; }

      const newDni = prompt("Nuevo DNI (8 dígitos):", u.dni);
      if (newDni === null) return;
      if (!/^\d{8}$/.test(newDni)) { alert("DNI inválido"); return; }
      const newTipo = prompt("Tipo (propietario|administracion|empleado|obrero|invitado|guardia|otro):", u.tipo);

      const newTipo = prompt("Nuevo tipo (propietario|administracion|empleado|obrero|invitado|guardia|otro):", u.tipo);
      if (newTipo === null) return;

      try {
        await updateDoc(doc(db, "usuarios", docSnap.id), { nombre: newNombre, dni: newDni, tipo: newTipo });
      } catch (err) { console.error(err); alert("Error editando usuario"); }
        await updateDoc(doc(db, "usuarios", id), { L: newL.trim(), nombre: newNombre.trim(), dni: newDni.trim(), tipo: newTipo.trim() });
      } catch (err) { console.error("Error editando usuario:", err); alert("Error editando"); }
    });

    /* Eliminar (PIN requerido) */
    tr.querySelector(".delUser").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
    // Eliminar usuario (requiere contraseña admin)
    tr.querySelector(".delUser").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administradora (4 dígitos):");
      if (pass !== localStorage.getItem("adminPass")) { alert("Contraseña incorrecta"); return; }
      if (!confirm("Eliminar usuario permanentemente?")) return;
      try { await deleteDoc(doc(db, "usuarios", docSnap.id)); } catch (err) { console.error(err); alert("Error eliminando usuario"); }
      try { await deleteDoc(doc(db, "usuarios", id)); } catch (err) { console.error("Error eliminar usuario:", err); alert("Error eliminando"); }
    });

    /* Imprimir tarjeta (PIN requerido) */
    tr.querySelector(".printUser").addEventListener("click", () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
      const w = window.open("", "_blank", "width=600,height=350");
    // Imprimir tarjeta (requiere contraseña admin)
    tr.querySelector(".printUser").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administradora (4 dígitos):");
      if (pass !== localStorage.getItem("adminPass")) { alert("Contraseña incorrecta"); return; }

      // obtener usuario (puede confiar en u pero leer del doc es más seguro)
      const docRef = doc(db, "usuarios", id);
      const ds = await getDocs(query(usuariosRef, where("L", "==", u.L))); // optional fallback - but we'll use u directly
      // Abrir ventana con tarjeta
      const borderColor = (function (t) {
        switch (t) {
          case "propietario": return "violet";
@@ -166,34 +197,38 @@ onSnapshot(query(usuariosRef, orderBy("L")), snapshot => {
          default: return "gray";
        }
      })(u.tipo);

      const w = window.open("", "_blank", "width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
          <style>body{font-family:Arial;text-align:center} .card{width:15cm;height:6cm;border:1cm solid ${borderColor};padding:8px;box-sizing:border-box}</style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        <style>body{font-family:Arial;text-align:center} .card{width:15cm;height:6cm;border:${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-border-width') || 12)}px solid ${borderColor};box-sizing:border-box;padding:8px}</style>
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
          <div class="card">
            <div style="font-size:14px;margin-bottom:6px">#L ${u.L} - ${u.nombre} - ${u.dni} - ${u.tipo}</div>
            <svg id="codeIn" style="display:block;margin:6px auto"></svg>
            <div style="height:6px"></div>
            <svg id="codeOut" style="display:block;margin:6px auto"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'), "${u.codigoIngreso}", {format:'CODE128', width:2, height:40});
            JsBarcode(document.getElementById('codeOut'), "${u.codigoSalida}", {format:'CODE128', width:2, height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          <\/script>
        </body></html>
      `);
    });
  });
});

/* ---------- MOVIMIENTOS (real-time, paginación y auto-print) ---------- */
/* -----------------------------
   MOVIMIENTOS: real-time, paginación y auto-print en cada 25
   ----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [];
let movimientosCache = []; // array con {__id, ...data} orden descendente por hora
let currentPage = 1;
let prevMovCount = 0;

@@ -215,23 +250,22 @@ function renderMovsPage() {
  const page = movimientosCache.slice(start, start + MOV_LIMIT);
  page.forEach(item => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td><td><button class="delMov">Eliminar</button></td>`;
    tr.innerHTML = `<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td><td><button class="delMov" data-id="${item.__id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click", async () => {
      const pin = prompt("Ingrese PIN maestro:");
      if (pin !== localStorage.getItem("pinMaestro")) { alert("PIN incorrecto"); return; }
    tr.querySelector(".delMov").addEventListener("click", async (e) => {
      const pass = prompt("Ingrese la contraseña administradora (4 dígitos):");
      if (pass !== localStorage.getItem("adminPass")) { alert("Contraseña incorrecta"); return; }
      if (!confirm("Eliminar movimiento permanentemente?")) return;
      try { await deleteDoc(doc(db, "movimientos", item.__id)); } catch (err) { console.error(err); alert("Error eliminando movimiento"); }
      try { await deleteDoc(doc(db, "movimientos", e.currentTarget.dataset.id)); } catch (err) { console.error("Error eliminando mov:", err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}

/* printing helper for movements */
function printMovementsPage(pageData) {
  const w = window.open("", "_blank");
  let html = `<html><head><title>Movimientos</title><style>table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body>`;
  html += `<h3>Últimos ${pageData.length} movimientos</h3>`;
  let html = `<html><head><title>Movimientos</title><style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body>`;
  html += `<h3>Movimientos (últimos ${pageData.length})</h3>`;
  html += `<table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr></thead><tbody>`;
  pageData.forEach(m => { html += `<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`; });
  html += `</tbody></table></body></html>`;
@@ -240,26 +274,27 @@ function printMovementsPage(pageData) {
  w.close();
}

/* onSnapshot movimientos (orden descendente por hora) */
/* escucha realtime de movimientos (orden by hora desc) */
onSnapshot(query(movimientosRef, orderBy("hora", "desc")), snapshot => {
  movimientosCache = snapshot.docs.map(d => ({ __id: d.id, ...d.data() }));
  // si llegó nueva data y el total es múltiplo exacto de MOV_LIMIT -> imprimir automáticamente últimos MOV_LIMIT
  const newCount = movimientosCache.length;
  // Auto-imprimir cada vez que el total llega a un múltiplo de MOV_LIMIT (25, 50, 75...)
  if (newCount > prevMovCount && (newCount % MOV_LIMIT) === 0) {
    // imprimir los últimos MOV_LIMIT (página 1)
    const pageToPrint = movimientosCache.slice(0, MOV_LIMIT);
    const pageToPrint = movimientosCache.slice(0, MOV_LIMIT); // últimos 25
    try { printMovementsPage(pageToPrint); } catch (err) { console.error("Error auto-print:", err); }
  }
  prevMovCount = newCount;
  // ajustar currentPage si es necesario y renderizar
  // ajustar página actual y render
  const totalPages = Math.min(10, Math.max(1, Math.ceil(movimientosCache.length / MOV_LIMIT)));
  if (currentPage > totalPages) currentPage = totalPages;
  renderMovsPage();
});

/* ---------- ESCANEO (un solo botón) ---------- */
/* -----------------------------
   ESCANEAR — un solo botón detecta ingreso o salida
   ----------------------------- */
document.getElementById("scanBtn").addEventListener("click", async () => {
  const codigo = prompt("Escanee código de barra:");
  const codigo = prompt("Escanee el código de barras (pega aquí el valor):");
  if (!codigo) return;
  try {
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso", "==", codigo)));
@@ -276,14 +311,20 @@ document.getElementById("scanBtn").addEventListener("click", async () => {
      else mov.salida = horaActualStr();
      await addDoc(movimientosRef, mov);
    }
    // notificación breve
    alert("Movimiento registrado");
  } catch (err) {
    console.error("Error en escaneo:", err);
    alert("Error registrando movimiento");
  }
});

/* ---------- IMPRIMIR ÚLTIMA PÁGINA (manual) ---------- */
/* Necesitamos getDocs y addDoc en este archivo: import arriba */
import { getDocs, addDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* -----------------------------
   IMPRIMIR ÚLTIMA PÁGINA (manual)
   ----------------------------- */
document.getElementById("printPageBtn").addEventListener("click", async () => {
  try {
    const snap = await getDocs(query(movimientosRef, orderBy("hora", "desc"), limit(MOV_LIMIT)));
@@ -295,14 +336,16 @@ document.getElementById("printPageBtn").addEventListener("click", async () => {
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
/* -----------------------------
   CONFIG: cambiar contraseña admin (requiere contraseña actual)
   ----------------------------- */
document.getElementById("savePassBtn").addEventListener("click", () => {
  const current = document.getElementById("currentPass").value.trim();
  const nuevo = document.getElementById("newPass").value.trim();
  if (current !== localStorage.getItem("adminPass")) { alert("Contraseña actual incorrecta"); return; }
  if (!/^\d{4}$/.test(nuevo)) { alert("Nueva contraseña debe tener 4 dígitos"); return; }
  localStorage.setItem("adminPass", nuevo);
  alert("Contraseña actualizada correctamente");
  document.getElementById("currentPass").value = "";
  document.getElementById("newPass").value = "";
});
