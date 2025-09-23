// app.js - completo y funcional
// Firebase v9 modular imports (coincide con la versión usada inicialmente)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  doc,
  onSnapshot,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ----------------------------- Firebase config ----------------------------- */
/* Usé la configuración original que compartiste en la versión larga del app.js */
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
const usuariosRef   = collection(db, "usuarios");
const movimientosRef= collection(db, "movimientos");
const expiredRef    = collection(db, "expiredCodes");
const novedadesRef  = collection(db, "novedades");

/* ----------------------------- Overlay de contraseña (bloqueo inicial) ----------------------------- */
const PASSWORD_FIXED = "1409"; // contraseña fija requerida para desbloquear la app (según tu pedido)

let unlocked = false;
const overlay = document.getElementById("passwordOverlay");
const passwordInput = document.getElementById("passwordInput");
const passwordBtn = document.getElementById("passwordBtn");
const passwordError = document.getElementById("passwordError");

// Si no existe el overlay en el HTML, creamos una variable segura para que el código no falle
if (!overlay) {
  console.warn("No se encontró #passwordOverlay en el DOM. Asegurate que tu index.html contiene ese div.");
}

// Mostrar overlay al inicio (si existe)
if (overlay) {
  overlay.style.display = "flex";
  if (passwordInput) passwordInput.focus();
}

// Funcion para desbloquear (oculta overlay y permite operar)
function unlockApp() {
  unlocked = true;
  if (overlay) overlay.style.display = "none";
  // Enfocar el primer control si lo deseas
  const possibleScan = document.getElementById("scanBtn");
  if (possibleScan) possibleScan.focus();
}

// Verificar contraseña (la que pediste: "1409")
function checkPasswordAndUnlock(val) {
  if (String(val) === PASSWORD_FIXED) {
    unlockApp();
  } else {
    if (passwordError) {
      passwordError.textContent = "Contraseña incorrecta, intente nuevamente.";
    } else {
      alert("Contraseña incorrecta.");
    }
  }
}

// Eventos para overlay
if (passwordBtn && passwordInput) {
  passwordBtn.addEventListener("click", () => checkPasswordAndUnlock(passwordInput.value));
  passwordInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") checkPasswordAndUnlock(passwordInput.value);
  });
}

/* ----------------------------- Helpers ----------------------------- */
function generarCodigo() {
  return Math.random().toString(36).substring(2,10).toUpperCase();
}
function horaActualStr() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2,"0");
  const mm = d.getMinutes().toString().padStart(2,"0");
  const dd = d.getDate().toString().padStart(2,"0");
  const mo = (d.getMonth()+1).toString().padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
}
function fechaHoyFormato() {
  const d = new Date();
  const dd = d.getDate().toString().padStart(2,"0");
  const mo = (d.getMonth()+1).toString().padStart(2,"0");
  const yyyy = d.getFullYear();
  return `(${dd}/${mo}/${yyyy})`;
}
function formatTimestampToStr(ts) {
  if (!ts) return "";
  try {
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const hh = d.getHours().toString().padStart(2,"0");
    const mm = d.getMinutes().toString().padStart(2,"0");
    const dd = d.getDate().toString().padStart(2,"0");
    const mo = (d.getMonth()+1).toString().padStart(2,"0");
    const yyyy = d.getFullYear();
    return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
  } catch(e) { return ""; }
}
function esSoloLetras(text) {
  return /^[A-Za-zÀ-ÿ\s]+$/.test(text);
}

/* ----------------------------- UTIL: obtener usuario por L (devuelve docSnap o null) ----------------------------- */
async function getUsuarioByL(L) {
  if (!L) return null;
  try {
    const q = query(usuariosRef, where("L", "==", L));
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0];
    return null;
  } catch(e) {
    console.error("Error buscando usuario por L", e);
    return null;
  }
}

/* ----------------------------- RENDER USUARIOS (soporta dos tipos de tabla) ----------------------------- */
async function initUsuariosRendering() {
  // Si existe tabla 'usersTable' (completa) o 'usuariosTable' (simple)
  const usersTableFull = document.getElementById("usersTable");      // versión larga (Gestión)
  const usuariosTableSimple = document.getElementById("usuariosTable"); // versión simple que envié antes

  if (!usersTableFull && !usuariosTableSimple) return; // nada que hacer

  // Escuchar usuarios ordenados por L
  onSnapshot(query(usuariosRef, orderBy("L")), snapshot => {
    const docs = snapshot.docs;

    // Render para tabla completa (si existe)
    if (usersTableFull) {
      const tbody = usersTableFull.querySelector("tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      docs.forEach(docSnap => {
        const u = docSnap.data();
        const tr = document.createElement("tr");

        // Autorizante se visualiza solo si tipo === "invitado"
        const autorizanteDisplay = (u.tipo === "invitado") ? (u.autorizante || "") : "";

        tr.innerHTML = `
          <td>${u.L || ""}</td>
          <td>${(u.nombre || "").toUpperCase()}</td>
          <td>${u.dni || ""}</td>
          <td>${u.celular || ""}</td>
          <td>${u.fechaExpedicion || ""}</td>
          <td>${autorizanteDisplay}</td>
          <td>${u.tipo || ""}</td>
          <td>
            <button class="action-ficha" data-id="${docSnap.id}" data-L="${u.L||""}">FICHA</button>
            <button class="action-edit" data-id="${docSnap.id}">EDITAR</button>
            <button class="action-delete" data-id="${docSnap.id}">ELIMINAR</button>
            <button class="print-btn" data-id="${docSnap.id}">IMPRIMIR</button>
          </td>
        `;
        tbody.appendChild(tr);

        // Asignar eventos (protegidos por 'unlocked' flag)
        const fichaBtn = tr.querySelector(".action-ficha");
        if (fichaBtn) fichaBtn.addEventListener("click", () => openFichaByUserId(docSnap.id));

        const editBtn = tr.querySelector(".action-edit");
        if (editBtn) editBtn.addEventListener("click", () => {
          if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
          openEditUserModal(docSnap.id, u);
        });

        const delBtn = tr.querySelector(".action-delete");
        if (delBtn) delBtn.addEventListener("click", async () => {
          if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
          if (!confirm("Eliminar usuario permanentemente? Esto invalidará sus códigos.")) return;
          try {
            // Guardar en expirados y luego eliminar
            await addDoc(expiredRef, {
              L: u.L||"", nombre: u.nombre||"", dni: u.dni||"", tipo: u.tipo||"",
              codigoIngreso: u.codigoIngreso||"", codigoSalida: u.codigoSalida||"",
              celular: u.celular||"", autorizante: u.autorizante||"", when: serverTimestamp()
            });
            await deleteDoc(doc(db,"usuarios", docSnap.id));
            alert("Usuario eliminado y códigos invalidados.");
          } catch(e) {
            console.error("Error eliminando usuario", e);
            alert("Error eliminando usuario");
          }
        });

        const printBtn = tr.querySelector(".print-btn");
        if (printBtn) printBtn.addEventListener("click", () => {
          if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
          printUserCard(u);
        });
      });
    }

    // Render para tabla simple (si existe). column headers: ID | Nombre | Email
    if (usuariosTableSimple) {
      const tbody = usuariosTableSimple.querySelector("tbody");
      if (!tbody) return;
      tbody.innerHTML = "";
      docs.forEach(docSnap => {
        const u = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${docSnap.id}</td>
          <td>${(u.nombre || "").toUpperCase()}</td>
          <td>${u.email || (u.dni || "")}</td>
          <td>
            <button class="btn-ficha" data-id="${docSnap.id}">Ficha</button>
          </td>
        `;
        tbody.appendChild(tr);
      });

      // eventos FICHA (simple)
      document.querySelectorAll("#usuariosTable .btn-ficha").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          const id = e.currentTarget.dataset.id;
          openFichaByUserId(id);
        });
      });
    }

  }, err => { console.error("Error al suscribirse a usuarios:", err); });
}

/* ----------------------------- RENDER MOVIMIENTOS (PANEL) ----------------------------- */
function initMovimientosRendering() {
  const movTable = document.getElementById("movimientosTable");
  if (!movTable) return;

  const tbody = movTable.querySelector("tbody");
  if (!tbody) return;

  onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot => {
    const docs = snapshot.docs;
    tbody.innerHTML = "";
    docs.forEach(docSnap => {
      const m = docSnap.data();
      const tr = document.createElement("tr");

      // DNI NO se visualiza en PANEL: (si la tabla original tenía columna DNI se la omitimos aquí)
      tr.innerHTML = `
        <td>${m.L || ""}</td>
        <td>${(m.nombre || "").toUpperCase()}</td>
        <td>${m.entrada || ""}</td>
        <td>${m.salida || ""}</td>
        <td>${m.tipo || ""}</td>
        <td>
          <button class="action-ficha" data-L="${m.L || ""}">FICHA</button>
          <button class="delMov">Eliminar</button>
        </td>
      `;
      tbody.appendChild(tr);

      // Events: ficha (busca usuario por L y abre ficha)
      const fichaBtn = tr.querySelector(".action-ficha");
      if (fichaBtn) {
        fichaBtn.addEventListener("click", async () => {
          if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
          const L = fichaBtn.dataset.L;
          const userDoc = await getUsuarioByL(L);
          if (userDoc) openFichaByUserDoc(userDoc);
          else {
            // Si no se encuentra usuario por L, mostrar info básica de movimiento
            openFichaByMovement(m);
          }
        });
      }

      // Eliminar movimiento
      const delBtn = tr.querySelector(".delMov");
      if (delBtn) {
        delBtn.addEventListener("click", async () => {
          if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
          if (!confirm("Eliminar movimiento permanentemente?")) return;
          try {
            await deleteDoc(doc(db,"movimientos", docSnap.id));
          } catch(e) {
            console.error("Error eliminando movimiento", e);
            alert("Error eliminando movimiento");
          }
        });
      }
    });
  }, err => { console.error("Error escuchando movimientos:", err); });
}

/* ----------------------------- FICHA: abrir por userId o por docSnap ----------------------------- */
const modalFicha = document.getElementById("modalFicha");
const closeFichaBtn = document.getElementById("closeFicha");
const fichaContent = document.getElementById("fichaContent");

function openFichaByUserId(userId) {
  if (!userId) return;
  getDocs(query(usuariosRef, where("__name__", "==", userId)))
    .then(snap => {
      if (!snap.empty) openFichaByUserDoc(snap.docs[0]);
      else {
        // intentar leer doc directamente
        getDocs(query(usuariosRef, where("L","==", userId))).then(snap2 => {
          if (!snap2.empty) openFichaByUserDoc(snap2.docs[0]);
          else {
            // Fallback
            fichaContent.innerHTML = `<p>Ficha no disponible</p>`;
            if (modalFicha) modalFicha.classList.remove("hidden");
          }
        });
      }
    }).catch(e => {
      console.error("openFichaByUserId error", e);
      fichaContent.innerHTML = `<p>Ficha no disponible (error).</p>`;
      if (modalFicha) modalFicha.classList.remove("hidden");
    });
}

function openFichaByUserDoc(docSnap) {
  const u = docSnap.data();
  // Mostrar campos según tus reglas:
  // - Autorizante solo visible si tipo === 'invitado'
  const autorizanteRow = (u.tipo === "invitado") ? `<p><strong>Autorizante:</strong> ${u.autorizante || ""}</p>` : "";
  const dniRow = u.dni ? `<p><strong>DNI:</strong> ${u.dni}</p>` : "";
  fichaContent.innerHTML = `
    <p><strong>#L:</strong> ${u.L || ""}</p>
    <p><strong>Nombre:</strong> ${(u.nombre||"").toUpperCase()}</p>
    ${dniRow}
    <p><strong>Celular:</strong> ${u.celular || ""}</p>
    <p><strong>F. Expedición:</strong> ${u.fechaExpedicion || ""}</p>
    ${autorizanteRow}
    <p><strong>Tipo:</strong> ${u.tipo || ""}</p>
  `;
  if (modalFicha) modalFicha.classList.remove("hidden");
}

function openFichaByMovement(mov) {
  // si no hay usuario, mostramos movimiento básico
  fichaContent.innerHTML = `
    <p><strong>#L:</strong> ${mov.L || ""}</p>
    <p><strong>Nombre (registro):</strong> ${(mov.nombre || "").toUpperCase()}</p>
    <p><strong>Entrada:</strong> ${mov.entrada || ""}</p>
    <p><strong>Salida:</strong> ${mov.salida || ""}</p>
    <p><strong>Tipo:</strong> ${mov.tipo || ""}</p>
  `;
  if (modalFicha) modalFicha.classList.remove("hidden");
}

if (closeFichaBtn) {
  closeFichaBtn.addEventListener("click", () => {
    if (modalFicha) modalFicha.classList.add("hidden");
  });
}

/* ----------------------------- EDITAR USUARIO (modal básico inline) ----------------------------- */
/* Nota: tu index.html no incluía modal editar completo; si querés lo creo. Aquí dejo un helper no intrusivo. */
function openEditUserModal(userId, userData) {
  // Esto abre un prompt por simplicidad (evita crear HTML adicional aquí).
  // Si querés un modal con formulario completo lo genero al instante.
  try {
    const newNombre = prompt("Editar nombre:", userData.nombre || "");
    if (newNombre === null) return; // cancel
    let newDni = prompt("Editar DNI (8 dígitos):", userData.dni || "");
    if (newDni === null) return;
    // Validaciones mínimas
    newDni = newDni.trim();
    if (newDni && !/^\d{8}$/.test(newDni)) { alert("DNI inválido. Debe tener 8 dígitos."); return; }
    const newCel = prompt("Editar Celular (10 dígitos, opcional):", userData.celular || "");
    if (newCel === null) return;
    if (newCel && !/^\d{10}$/.test(newCel.trim())) { alert("Celular inválido. Debe tener 10 dígitos."); return; }
    const newAut = prompt("Editar Autorizante (solo letras, max 12) - visible si tipo=INVITADO:", userData.autorizante || "");
    if (newAut === null) return;
    if (newAut && !esSoloLetras(newAut.trim())) { alert("Autorizante: solo letras."); return; }
    // Forzar mayúsculas en nombre y autorizante
    const finalNombre = (newNombre || "").toUpperCase().trim();
    const finalAut = newAut ? newAut.toUpperCase().trim() : "";

    updateDoc(doc(db,"usuarios", userId), {
      nombre: finalNombre,
      dni: newDni || "",
      celular: newCel || "",
      autorizante: finalAut
    }).then(()=> alert("Usuario actualizado.")).catch(e => { console.error(e); alert("Error actualizando usuario."); });

  } catch(e) {
    console.error("Error en openEditUserModal", e);
    alert("Error abriendo edición.");
  }
}

/* ----------------------------- IMPRIMIR TARJETA (básico, sin códigos de barras) ----------------------------- */
function printUserCard(u) {
  const borderColor = {"propietario":"violet","administracion":"orange","empleado":"green","obrero":"yellow","invitado":"cyan","guardia":"red"}[u.tipo] || "gray";
  const w = window.open("","_blank","width=600,height=380");
  const html = `
    <html><head><title>Tarjeta ${u.L||""}</title>
    <style>body{font-family:Arial;text-align:center;padding:12px} .card{width:100%;border:12px solid ${borderColor};padding:8px;box-sizing:border-box}</style>
    </head><body>
    <div class="card">
      <h2>${u.L || ""} — ${(u.nombre||"").toUpperCase()}</h2>
      <p>DNI: ${u.dni || ""}</p>
      <p>Tipo: ${u.tipo || ""}</p>
      <p>Celular: ${u.celular || ""}</p>
    </div>
    <script>window.print(); setTimeout(()=>window.close(),700);</script>
    </body></html>
  `;
  w.document.write(html);
}

/* ----------------------------- NOVEDADES (si existe UI) ----------------------------- */
function initNovedades() {
  const saveBtn = document.getElementById("saveNovedadBtn");
  const textArea = document.getElementById("novedadText");
  const novTable = document.getElementById("novedadesTable");

  if (!saveBtn || !textArea || !novTable) return;

  saveBtn.addEventListener("click", async () => {
    if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
    const text = textArea.value || "";
    if (!text.trim()) { alert("Ingrese una novedad"); return; }
    try {
      await addDoc(novedadesRef, { text, createdAt: serverTimestamp() });
      textArea.value = "";
    } catch(e) { console.error("Error guardando novedad", e); alert("Error guardando novedad"); }
  });

  const tbody = novTable.querySelector("tbody");
  onSnapshot(query(novedadesRef, orderBy("createdAt","desc")), snapshot => {
    tbody.innerHTML = "";
    snapshot.docs.forEach(docSnap => {
      const n = docSnap.data();
      const hora = n.createdAt ? formatTimestampToStr(n.createdAt) : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${hora}</td><td style="text-align:left;white-space:pre-wrap;">${n.text || ""}</td><td><button class="edit-novedad" data-id="${docSnap.id}">Editar</button></td>`;
      tbody.appendChild(tr);
      tr.querySelector(".edit-novedad").addEventListener("click", () => {
        if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
        const nuevo = prompt("Editar novedad", n.text || "");
        if (nuevo === null) return;
        updateDoc(doc(db,"novedades", docSnap.id), { text: nuevo }).catch(e => { console.error(e); alert("Error editando"); });
      });
    });
  });
}

/* ----------------------------- EXPIRADOS (si existe UI) ----------------------------- */
function initExpirados() {
  const table = document.getElementById("expiradosTable");
  if (!table) return;
  const tbody = table.querySelector("tbody");
  onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot => {
    tbody.innerHTML = "";
    snapshot.docs.forEach(docSnap => {
      const e = docSnap.data();
      const fecha = e.when ? formatTimestampToStr(e.when) : "";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.L || ""}</td>
        <td>${(e.nombre || "").toUpperCase()}</td>
        <td>${e.dni || ""}</td>
        <td>${fecha}</td>
        <td>${e.tipo || ""}</td>
        <td>${e.codigoIngreso || ""}</td>
        <td>${e.codigoSalida || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  });
}

/* ----------------------------- SCAN (si existe UI) ----------------------------- */
function initScanner() {
  const scanBtn = document.getElementById("scanBtn");
  const scanModal = document.getElementById("scanModal");
  const scanInput = document.getElementById("scanInput");
  const cancelScanBtn = document.getElementById("cancelScanBtn");
  const scanMessage = document.getElementById("scanMessage");
  const scanOk = document.getElementById("scanOk");

  if (!scanBtn || !scanModal || !scanInput) return;

  scanBtn.addEventListener("click", () => {
    if (!unlocked) { alert("Ingrese la contraseña para operar."); return; }
    scanModal.classList.add("active");
    scanInput.value = "";
    scanInput.focus();
  });
  if (cancelScanBtn) cancelScanBtn.addEventListener("click", () => { scanModal.classList.remove("active"); });

  let scanProcessing = false;
  scanInput.addEventListener("input", async () => {
    const raw = scanInput.value.trim();
    if (scanProcessing) return;
    if (raw.length < 8) return;
    scanProcessing = true;
    const code = raw.substring(0,8).toUpperCase();
    try {
      let userDoc = null;
      let actionType = "entrada";
      const qIngreso = query(usuariosRef, where("codigoIngreso", "==", code));
      let snap = await getDocs(qIngreso);
      if (!snap.empty) { userDoc = snap.docs[0]; actionType = "entrada"; }
      else {
        const qSalida = query(usuariosRef, where("codigoSalida", "==", code));
        let snap2 = await getDocs(qSalida);
        if (!snap2.empty) { userDoc = snap2.docs[0]; actionType = "salida"; }
      }
      if (!userDoc) {
        if (scanMessage) { scanMessage.style.color = "red"; scanMessage.textContent = "Código no válido"; setTimeout(()=>scanMessage.textContent = "", 1800); }
        scanProcessing = false;
        return;
      }
      const u = userDoc.data();
      if (actionType === "entrada") {
        await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, entrada: horaActualStr(), salida: "", hora: serverTimestamp() });
      } else {
        // SALIDA: buscar mov sin salida
        const movQ = query(movimientosRef, where("L","==",u.L), where("salida","==",""));
        const movSnap = await getDocs(movQ);
        if (!movSnap.empty) {
          // elegir el mas reciente según campo hora
          let chosen = movSnap.docs[0];
          let chosenTime = chosen.data().hora && chosen.data().hora.toDate ? chosen.data().hora.toDate() : new Date(0);
          movSnap.docs.forEach(d => {
            const t = d.data().hora && d.data().hora.toDate ? d.data().hora.toDate() : new Date(0);
            if (t > chosenTime) { chosen = d; chosenTime = t; }
          });
          await updateDoc(doc(db,"movimientos", chosen.id), { salida: horaActualStr() });
        } else {
          await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, entrada: "", salida: horaActualStr(), hora: serverTimestamp() });
        }
      }
      if (scanOk) { scanOk.style.display = "inline-block"; setTimeout(()=>scanOk.style.display = "none", 900); }
      scanModal.classList.remove("active");
      scanInput.value = "";
    } catch(e) {
      console.error("Error en scanner:", e);
      if (scanMessage) { scanMessage.style.color = "red"; scanMessage.textContent = "Error al registrar"; setTimeout(()=>scanMessage.textContent="",1800); }
    } finally {
      scanProcessing = false;
    }
  });
}

/* ----------------------------- INICIALIZACIÓN: arrancar listeners según DOM disponible ----------------------------- */
function initApp() {
  // Usuarios
  initUsuariosRendering();

  // Movimientos (PANEL)
  initMovimientosRendering();

  // Novedades & Expirados & Scanner (si existen)
  initNovedades();
  initExpirados();
  initScanner();

  // Si la app no tiene overlay en el DOM la dejamos desbloqueada por compatibilidad
  if (!overlay) unlocked = true;
}

// Ejecutar init
initApp();

/* ----------------------------- NOTAS FINALES --------------------------------
 - El overlay de contraseña fijo "1409" es la ÚNICA contraseña que se solicita al inicio.
 - Mientras no se ingrese correctamente, la aplicación no permite operar (overlay visible).
 - Una vez desbloqueada (overlay oculto) la app funciona sin pedir más contraseñas.
 - El código está escrito para ser tolerante a distintos HTML: detecta si existen tablas/elementos antes de operar.
 - Si querés que alguna acción (p. ej. eliminar usuario) vuelva a pedir contraseña, lo implemento inmediatamente.
 - Si preferís que el overlay recuerde el desbloqueo durante la sesión (por ejemplo con sessionStorage), lo agrego.
--------------------------------------------------------------------------------*/

