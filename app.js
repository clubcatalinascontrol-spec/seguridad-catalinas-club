// =======================
// Firebase Configuración
// =======================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc,
  setDoc, updateDoc, deleteDoc, onSnapshot, query,
  orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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
// Mostrar/Ocultar Secciones
// =======================
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
window.showSection = showSection;

// =======================
// Funciones Utilitarias
// =======================
function getFecha() {
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getHora() {
  const hoy = new Date();
  const hh = String(hoy.getHours()).padStart(2, "0");
  const mi = String(hoy.getMinutes()).padStart(2, "0");
  return `${hh}:${mi}`;
}
// =======================
// Usuarios
// =======================
const userForm = document.getElementById("userForm");
const usuariosTable = document.getElementById("usuariosTable").querySelector("tbody");
const expiradosTable = document.getElementById("expiradosTable").querySelector("tbody");

userForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const lote = document.getElementById("lote").value.trim();
  const nombre = document.getElementById("nombre").value.trim();
  const dni = document.getElementById("dni").value.trim();
  const celular = document.getElementById("celular").value.trim();
  const autorizante = document.getElementById("autorizante").value.trim();
  const tipo = document.getElementById("tipo").value;

  await addDoc(collection(db, "usuarios"), {
    lote, nombre, dni, celular, autorizante, tipo,
    fechaExpedicion: getFecha(),
    createdAt: serverTimestamp()
  });

  userForm.reset();
});

async function loadUsuarios() {
  const q = query(collection(db, "usuarios"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    usuariosTable.innerHTML = "";
    snap.forEach((docu) => {
      const data = docu.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.lote}</td>
        <td>${data.nombre}</td>
        <td>${data.dni}</td>
        <td>${data.tipo}</td>
        <td>
          <button class="edit" onclick="openFicha('${docu.id}')">Ficha</button>
          <button class="delete" onclick="deleteUsuario('${docu.id}')">Eliminar</button>
        </td>
      `;
      usuariosTable.appendChild(tr);
    });
  });
}
loadUsuarios();

// Eliminar Usuario → pasa a expirados
window.deleteUsuario = async (id) => {
  const ref = doc(db, "usuarios", id);
  const snap = await getDocs(collection(db, "usuarios"));
  let data;
  snap.forEach(d => { if (d.id === id) data = d.data(); });

  if (data) {
    await addDoc(collection(db, "expirados"), {
      ...data,
      eliminadoEn: getFecha() + " " + getHora()
    });
    await deleteDoc(ref);
  }
};

// =======================
// Expirados
// =======================
function loadExpirados() {
  const q = query(collection(db, "expirados"), orderBy("eliminadoEn", "desc"));
  onSnapshot(q, (snap) => {
    expiradosTable.innerHTML = "";
    snap.forEach((docu) => {
      const data = docu.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.lote}</td>
        <td>${data.nombre}</td>
        <td>${data.dni}</td>
        <td>${data.celular}</td>
        <td>${data.autorizante}</td>
        <td>${data.tipo}</td>
        <td>${data.eliminadoEn}</td>
      `;
      expiradosTable.appendChild(tr);
    });
  });
}
loadExpirados();
// =======================
// Panel
// =======================
const panelTable = document.getElementById("panelTable").querySelector("tbody");

function addMovimiento(usuario, accion) {
  const tr = document.createElement("tr");
  tr.classList.add("highlight");
  tr.innerHTML = `
    <td>${Math.floor(Math.random()*9999)}</td>
    <td>${usuario.lote}</td>
    <td>${usuario.nombre}</td>
    <td>${usuario.tipo}</td>
    <td>${getFecha()}</td>
    <td>${getHora()}</td>
    <td>${accion}</td>
    <td>
      <button class="edit" onclick="openFicha('${usuario.id}')">Ficha</button>
      <button class="delete" onclick="deleteUsuario('${usuario.id}')">Eliminar</button>
    </td>
  `;
  panelTable.prepend(tr);
  setTimeout(() => tr.classList.remove("highlight"), 4000);
}

window.filterPanel = (tipo) => {
  // futuro: filtrar por tipo
};

window.openScan = () => {
  alert("Escaneo simulado - asignar flujo real con lector de códigos");
};

// =======================
// Ficha
// =======================
const fichaModal = document.getElementById("fichaModal");
window.openFicha = async (id) => {
  const ref = doc(db, "usuarios", id);
  const snap = await getDocs(collection(db, "usuarios"));
  snap.forEach(d => {
    if (d.id === id) {
      const u = d.data();
      document.getElementById("fichaLote").innerText = u.lote;
      document.getElementById("fichaNombre").innerText = u.nombre;
      document.getElementById("fichaDni").innerText = u.dni;
      document.getElementById("fichaCelular").innerText = u.celular;
      document.getElementById("fichaAutorizante").innerText = u.autorizante;
      document.getElementById("fichaFecha").innerText = u.fechaExpedicion;
      document.getElementById("fichaTipo").innerText = u.tipo;
    }
  });
  fichaModal.style.display = "block";
};
window.closeFicha = () => fichaModal.style.display = "none";

// =======================
// Novedades
// =======================
const novedadForm = document.getElementById("novedadForm");
const novedadesTable = document.getElementById("novedadesTable").querySelector("tbody");

novedadForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const desc = document.getElementById("novedadDesc").value.trim();
  const fecha = document.getElementById("novedadFecha").value;
  const hora = document.getElementById("novedadHora").value;

  await addDoc(collection(db, "novedades"), { desc, fecha, hora, createdAt: serverTimestamp() });
  novedadForm.reset();
});

function loadNovedades() {
  const q = query(collection(db, "novedades"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    novedadesTable.innerHTML = "";
    snap.forEach((docu) => {
      const data = docu.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${data.desc}</td>
        <td>${data.fecha}</td>
        <td>${data.hora}</td>
        <td>
          <button class="edit" onclick="editNovedad('${docu.id}')">Editar</button>
          <button class="delete" onclick="deleteNovedad('${docu.id}')">Eliminar</button>
        </td>
      `;
      novedadesTable.appendChild(tr);
    });
  });
}
loadNovedades();

window.deleteNovedad = async (id) => {
  await deleteDoc(doc(db, "novedades", id));
};
window.editNovedad = async (id) => {
  const nuevo = prompt("Editar novedad:");
  if (nuevo) {
    await updateDoc(doc(db, "novedades", id), { desc: nuevo });
  }
};

// =======================
// Configuración
// =======================
window.resetPassword = () => {
  alert("Contraseña restaurada a: 123456789");
};
