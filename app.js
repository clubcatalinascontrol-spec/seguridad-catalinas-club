// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, serverTimestamp 
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

/* ----------------------------- Contraseñas ----------------------------- */
const MASTER_PASS = "9999";
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234");

function checkPass(pass) {
  return pass === MASTER_PASS || pass === localStorage.getItem("adminPass");
}

/* ----------------------------- Helpers ----------------------------- */
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

/* ----------------------------- Navegación SPA ----------------------------- */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");

navBtns.forEach(btn => btn.addEventListener("click", () => {
  const target = btn.dataset.section;
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(target).classList.add("active");
  navBtns.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}));
/* ----------------------------- Gestión de USUARIOS ----------------------------- */
const formNuevoUsuario = document.getElementById("formNuevoUsuario");
const listaUsuarios = document.getElementById("listaUsuarios");

// Placeholder guía: "Lote - Nombre Completo - DNI - Celular - Autorizante - Tipo"
function generarPlaceholders() {
  document.getElementById("inputLote").placeholder = "Lote - Nombre Completo - DNI - Celular - Autorizante - Tipo";
  document.getElementById("inputTipo").placeholder = "Tipo: Propietario, Admin, Empleado...";
  document.getElementById("inputNombre").placeholder = "Nombre Completo";
  document.getElementById("inputDNI").placeholder = "DNI";
  document.getElementById("inputCelular").placeholder = "Celular";
  document.getElementById("inputAutorizante").placeholder = "Autorizante";
}

generarPlaceholders();

// Cargar todos los usuarios
async function cargarUsuarios() {
  listaUsuarios.innerHTML = "";
  const snapshot = await getDocs(usuariosRef);
  snapshot.forEach(docu => {
    const u = docu.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.lote || ""}</td>
      <td>${u.nombre || ""}</td>
      <td>${u.dni || ""}</td>
      <td>${u.celular || ""}</td>
      <td>${u.autorizante || ""}</td>
      <td>${u.tipo || ""}</td>
      <td>
        <button class="editarUsuario">Editar</button>
        <button class="eliminarUsuario" style="background-color:#ff4d4f;">Eliminar</button>
      </td>`;
    listaUsuarios.appendChild(tr);

    // Editar
    tr.querySelector(".editarUsuario").addEventListener("click", () => {
      document.getElementById("inputLote").value = u.lote || "";
      document.getElementById("inputNombre").value = u.nombre || "";
      document.getElementById("inputDNI").value = u.dni || "";
      document.getElementById("inputCelular").value = u.celular || "";
      document.getElementById("inputAutorizante").value = u.autorizante || "";
      document.getElementById("inputTipo").value = u.tipo || "";
      formNuevoUsuario.dataset.id = docu.id;
    });

    // Eliminar
    tr.querySelector(".eliminarUsuario").addEventListener("click", async () => {
      await deleteDoc(doc(db, "usuarios", docu.id));
      cargarUsuarios();
    });
  });
}

// Guardar o actualizar usuario
formNuevoUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    lote: document.getElementById("inputLote").value.trim(),
    nombre: document.getElementById("inputNombre").value.trim(),
    dni: document.getElementById("inputDNI").value.trim(),
    celular: document.getElementById("inputCelular").value.trim(),
    autorizante: document.getElementById("inputAutorizante").value.trim(),
    tipo: document.getElementById("inputTipo").value.trim()
  };
  const id = formNuevoUsuario.dataset.id;
  if (id) {
    await updateDoc(doc(db, "usuarios", id), data);
    delete formNuevoUsuario.dataset.id;
  } else {
    await addDoc(usuariosRef, data);
  }
  formNuevoUsuario.reset();
  cargarUsuarios();
});

cargarUsuarios();
/* ----------------------------- Gestión de NOVEDADES ----------------------------- */
const formNovedad = document.getElementById("formNovedad");
const listaNovedades = document.getElementById("listaNovedades");

// Cargar novedades
async function cargarNovedades() {
  listaNovedades.innerHTML = "";
  const snapshot = await getDocs(novedadesRef);
  snapshot.forEach(docu => {
    const n = docu.data();
    const tr = document.createElement("tr");
    const fechaHora = n.fecha ? new Date(n.fecha.seconds * 1000) : new Date();
    const fechaStr = fechaHora.toLocaleDateString();
    const horaStr = fechaHora.getHours().toString().padStart(2,'0') + ":" + fechaHora.getMinutes().toString().padStart(2,'0');

    tr.innerHTML = `
      <td>${n.usuario || ""}</td>
      <td>${n.accion || ""}</td>
      <td>${fechaStr} ${horaStr}</td>
      <td>
        <button class="editarNovedad" style="background-color:#1890ff;">Editar</button>
        <button class="eliminarNovedad" style="background-color:#ff4d4f;">Eliminar</button>
      </td>`;
    listaNovedades.appendChild(tr);

    tr.querySelector(".editarNovedad").addEventListener("click", () => {
      document.getElementById("inputUsuario").value = n.usuario || "";
      document.getElementById("inputAccion").value = n.accion || "";
      formNovedad.dataset.id = docu.id;
    });

    tr.querySelector(".eliminarNovedad").addEventListener("click", async () => {
      await deleteDoc(doc(db, "novedades", docu.id));
      cargarNovedades();
    });
  });
}

formNovedad.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = {
    usuario: document.getElementById("inputUsuario").value.trim(),
    accion: document.getElementById("inputAccion").value.trim(),
    fecha: new Date()
  };
  const id = formNovedad.dataset.id;
  if (id) {
    await updateDoc(doc(db, "novedades", id), data);
    delete formNovedad.dataset.id;
  } else {
    await addDoc(novedadesRef, data);
  }
  formNovedad.reset();
  cargarNovedades();
});

cargarNovedades();

/* ----------------------------- Expirados ----------------------------- */
const listaExpirados = document.getElementById("listaExpirados");

async function cargarExpirados() {
  listaExpirados.innerHTML = "";
  const snapshot = await getDocs(expiradosRef);
  snapshot.forEach(docu => {
    const e = docu.data();
    const fechaElim = e.fechaEliminacion ? new Date(e.fechaEliminacion.seconds * 1000) : "";
    const fechaStr = fechaElim ? fechaElim.toLocaleDateString() : "";
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.usuario || ""}</td>
      <td>${fechaStr}</td>`;
    listaExpirados.appendChild(tr);
  });
}

cargarExpirados();

/* ----------------------------- PANEL ----------------------------- */
const botonesPanel = document.querySelectorAll("#panelBotones button");
botonesPanel.forEach(btn => {
  if(btn.textContent === "ESCANEAR" || btn.textContent === "IMPRIMIR"){
    // mantener amarillo para resaltar
    btn.style.color = "#f4cf19";
  } else {
    // botones negros
    btn.style.color = "#000";
  }
});
