// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* -----------------------------
   Firebase config (tu config)
----------------------------- */
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

/* -----------------------------
   Colecciones
----------------------------- */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes"); // códigos expirados para detectar escaneos de tarjetas ya eliminadas

/* -----------------------------
   Contraseñas: maestra permanente + editable
----------------------------- */
const MASTER_PASS = "9999"; // contraseña inmutable que SIEMPRE funciona
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234"); // editable

function checkPass(pass) {
  return pass === MASTER_PASS || pass === localStorage.getItem("adminPass");
}

/* -----------------------------
   Helpers
----------------------------- */
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

/* -----------------------------
   Navegación SPA
----------------------------- */
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

/* -----------------------------
   USUARIOS: agregar, render, editar, eliminar (eliminar invalida códigos)
----------------------------- */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userTipo = document.getElementById("userTipo");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async () => {
  const L = userL.value.trim();
  const nombre = userNombre.value.trim();
  const dni = userDni.value.trim();
  const tipo = userTipo.value;
  if (!L || !nombre || !dni || !tipo) { userMessage.textContent = "Complete todos los campos"; return; }
  if (!/^\d{1,3}$/.test(L)) { userMessage.textContent = "#L debe ser hasta 3 dígitos"; return; }
  if (!/^\d{8}$/.test(dni)) { userMessage.textContent = "DNI debe tener 8 dígitos"; return; }
  try {
    await addDoc(usuariosRef, {
      L, nombre, dni, tipo,
      codigoIngreso: generarCodigo(),
      codigoSalida: generarCodigo()
    });
    userMessage.textContent = "Usuario agregado";
    userL.value = ""; userNombre.value = ""; userDni.value = ""; userTipo.value = "";
    setTimeout(() => userMessage.textContent = "", 2500);
  } catch (err) { console.error(err); userMessage.textContent = "Error"; }
});

/* render usuarios en tiempo real */
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
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    // EDITAR (requiere contraseña)
    tr.querySelector(".edit-btn").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if (!checkPass(pass)) { alert("Contraseña incorrecta"); return; }

      const newL = prompt("Nuevo #L (hasta 3 dígitos):", u.L);
      if (newL === null) return;
      if (!/^\d{1,3}$/.test(newL)) { alert("#L inválido"); return; }

      const newNombre = prompt("Nuevo nombre (max 30):", u.nombre);
      if (newNombre === null) return;
      if (newNombre.trim().length === 0 || newNombre.trim().length > 30) { alert("Nombre inválido"); return; }

      const newDni = prompt("Nuevo DNI (8 dígitos):", u.dni);
      if (newDni === null) return;
      if (!/^\d{8}$/.test(newDni)) { alert("DNI inválido"); return; }

      const newTipo = prompt("Nuevo tipo (propietario|administracion|empleado|obrero|invitado|guardia|otro):", u.tipo);
      if (newTipo === null) return;

      try {
        await updateDoc(doc(db, "usuarios", id), { L: newL.trim(), nombre: newNombre.trim(), dni: newDni.trim(), tipo: newTipo.trim() });
      } catch (err) { console.error("Error editando usuario:", err); alert("Error editando"); }
    });

    // ELIMINAR (requiere contraseña) -> invalida códigos y borra usuario
    tr.querySelector(".del-btn").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if (!checkPass(pass)) { alert("Contraseña incorrecta"); return; }
      if (!confirm("Eliminar usuario permanentemente? (esto invalidará sus códigos)")) return;
      try {
        // Añadir sus códigos a expiredCodes (si existen)
        if (u.codigoIngreso) await addDoc(expiredRef, { code: u.codigoIngreso, reason: "usuario_eliminado", L: u.L, nombre: u.nombre, when: new Date() });
        if (u.codigoSalida) await addDoc(expiredRef, { code: u.codigoSalida, reason: "usuario_eliminado", L: u.L, nombre: u.nombre, when: new Date() });
        // eliminar doc del usuario
        await deleteDoc(doc(db, "usuarios", id));
        alert("Usuario eliminado y códigos invalidados.");
      } catch (err) { console.error("Error eliminando usuario:", err); alert("Error eliminando usuario"); }
    });

    // IMPRIMIR TARJETA (requiere contraseña)
    tr.querySelector(".print-btn").addEventListener("click", async (e) => {
      const id = e.currentTarget.dataset.id;
      const pass = prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if (!checkPass(pass)) { alert("Contraseña incorrecta"); return; }

      // obtener datos actuales del usuario
      // buscamos por doc id
      try {
        const userDoc = await getDocs(query(usuariosRef)); // fallback si se quiere buscar diferente - usamos u directamente
      } catch (err) { /* noop */ }

      // usamos u directamente para imprimir (está en snapshot)
      const borderColor = (t => {
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

      const w = window.open("", "_blank", "width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>body{font-family:Arial;text-align:center} .card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:8px}</style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
          <div class="card">
            <svg id="codeIn" style="display:block;margin:6px auto"></svg>
            <div style="font-size:16px;font-weight:700;margin:6px 0">${u.L} — ${u.nombre}<br>DNI: ${u.dni}<br>${u.tipo}</div>
            <svg id="codeOut" style="display:block;margin:6px auto"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'), "${u.codigoIngreso || ''}", {format:'CODE128', width:2, height:40});
            JsBarcode(document.getElementById('codeOut'), "${u.codigoSalida || ''}", {format:'CODE128', width:2, height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          <\/script>
        </body></html>
      `);
    });
  });
});

/* -----------------------------
   MOVIMIENTOS: realtime, paginación y render
----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [];
let currentPage = 1;

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
    tr.innerHTML = `<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td>
      <td>${item.entrada || ""}</td><td>${item.salida || ""}</td><td>${item.tipo}</td>
      <td><button class="delMov" data-id="${item.__id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click", async e => {
      const pass = prompt("Ingrese la contraseña administradora (4 dígitos):");
      if (!checkPass(pass)) { alert("Contraseña incorrecta"); return; }
      if (!confirm("Eliminar movimiento permanentemente?")) return;
      try { await deleteDoc(doc(db, "movimientos", e.currentTarget.dataset.id)); } catch (err) { console.error("Error eliminando mov:", err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}

onSnapshot(query(movimientosRef, orderBy("hora", "desc")), snapshot => {
  movimientosCache = snapshot.docs.map(d => ({ __id: d.id, ...d.data() }));
  const totalPages = Math.min(10, Math.max(1, Math.ceil(movimientosCache.length / MOV_LIMIT)));
  if (currentPage > totalPages) currentPage = totalPages;
  renderMovsPage();
});

/* -----------------------------
   ESCANEAR: modal + lógica (ahora chequea expiredCodes)
----------------------------- */
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const scanBtn = document.getElementById("scanBtn");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");

scanBtn.addEventListener("click", () => {
  scanModal.classList.add("active");
  scanInput.value = "";
  scanInput.focus();
  scanMessage.textContent = "";
  scanOk.style.display = "none";
});

cancelScanBtn.addEventListener("click", () => {
  scanModal.classList.remove("active");
  scanInput.value = "";
  scanMessage.textContent = "";
});

// helper para buscar codigo en expiredCodes
async function isExpiredCode(code) {
  try {
    const snap = await getDocs(query(expiredRef, where("code", "==", code)));
    return !snap.empty;
  } catch (err) {
    console.error("Error consultando expiredCodes:", err);
    return false;
  }
}

// Detectar input completo (8 chars) y registrar movimiento
scanInput.addEventListener("input", async () => {
  const code = scanInput.value.trim();
  if (code.length !== 8) return; // esperar 8 caracteres exactos

  try {
    // 1) ¿es un código expirado (de usuario eliminado)?
    const expired = await isExpiredCode(code);
    if (expired) {
      scanMessage.textContent = "Tarjeta expirada, debe imprimir una nueva, este usuario no existe en la base de datos";
      scanMessage.style.color = "red";
      return;
    }

    // 2) buscar por codigoIngreso
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso", "==", code)));
    let tipoMov = "entrada";
    if (snap.empty) {
      // buscar por codigoSalida
      snap = await getDocs(query(usuariosRef, where("codigoSalida", "==", code)));
      if (snap.empty) {
        scanMessage.textContent = "Código no reconocido";
        scanMessage.style.color = "red";
        return;
      }
      tipoMov = "salida";
    }

    // 3) registrar movimiento(s)
    for (const d of snap.docs) {
      const u = d.data();
      const mov = { L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, hora: new Date() };
      if (tipoMov === "entrada") mov.entrada = horaActualStr();
      else mov.salida = horaActualStr();
      await addDoc(movimientosRef, mov);
    }

    // 4) confirmar OK, cerrar modal
    scanMessage.innerHTML = "<span style='font-weight:700;color:green'>OK</span>";
    scanInput.blur();
    scanOk.style.display = "inline-block";
    setTimeout(() => {
      scanModal.classList.remove("active");
      scanInput.value = "";
      scanMessage.textContent = "";
      scanOk.style.display = "none";
    }, 700);

  } catch (err) {
    console.error("Error en escaneo/registro:", err);
    scanMessage.textContent = "Error";
    scanMessage.style.color = "red";
  }
});

/* -----------------------------
   CONFIG: cambiar contraseña admin (acepta master o current)
----------------------------- */
document.getElementById("savePassBtn").addEventListener("click", () => {
  const current = document.getElementById("currentPass").value.trim();
  const nuevo = document.getElementById("newPass").value.trim();
  if (!checkPass(current)) { alert("Contraseña actual incorrecta"); return; }
  if (!/^\d{4}$/.test(nuevo)) { alert("Nueva contraseña debe tener 4 dígitos"); return; }
  localStorage.setItem("adminPass", nuevo);
  alert("Contraseña actualizada correctamente");
  document.getElementById("currentPass").value = "";
  document.getElementById("newPass").value = "";
});
