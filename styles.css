// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// Variables
const MASTER_PASSWORD = "9999"; // fija, siempre funciona
let currentPassword = "1234";   // editable en config

// Navegación
function showSection(id) {
  document.querySelectorAll("section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(id).classList.add("active");
}
window.showSection = showSection;

// --- Usuarios ---
const usuarioForm = document.getElementById("usuarioForm");
usuarioForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const codigo = document.getElementById("codigo").value.trim();
  const nombre = document.getElementById("nombre").value.trim();

  if (codigo && nombre) {
    await setDoc(doc(db, "usuarios", codigo), { codigo, nombre });
    usuarioForm.reset();
  }
});

async function cargarUsuarios() {
  const list = document.getElementById("usuariosList");
  list.innerHTML = "";
  const query = await getDocs(collection(db, "usuarios"));
  query.forEach(docu => {
    const li = document.createElement("li");
    li.textContent = `${docu.data().codigo} - ${docu.data().nombre}`;
    list.appendChild(li);
  });
}
cargarUsuarios();

// --- Movimientos ---
const movimientosTable = document.getElementById("movimientosTable");

onSnapshot(collection(db, "movimientos"), (snapshot) => {
  movimientosTable.innerHTML = "";
  snapshot.forEach((docu) => {
    const mov = docu.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${docu.id}</td>
      <td>${mov.usuario}</td>
      <td>${mov.tipo}</td>
      <td>${mov.hora}</td>
      <td><button onclick="eliminarMovimiento('${docu.id}')">❌</button></td>
    `;
    movimientosTable.appendChild(tr);
  });
});

async function eliminarMovimiento(id) {
  const pass = prompt("Introduce contraseña (4 dígitos):");
  if (pass === currentPassword || pass === MASTER_PASSWORD) {
    await deleteDoc(doc(db, "movimientos", id));
  } else {
    alert("Contraseña incorrecta");
  }
}
window.eliminarMovimiento = eliminarMovimiento;

// --- Escaneo ---
const modal = document.getElementById("scannerModal");
const scannerInput = document.getElementById("scannerInput");

function openScanner() {
  modal.style.display = "flex";
  scannerInput.value = "";
  scannerInput.focus();
}
window.openScanner = openScanner;

function cancelScan() {
  modal.style.display = "none";
}
window.cancelScan = cancelScan;

scannerInput.addEventListener("input", async () => {
  if (scannerInput.value.length === 8) {
    await addDoc(collection(db, "movimientos"), {
      usuario: "UsuarioEscaneado",
      tipo: "Entrada",
      hora: new Date().toLocaleString()
    });
    modal.style.display = "none";
  }
});

// --- Config ---
function changePassword() {
  const newPass = document.getElementById("newPassword").value.trim();
  if (/^\d{4}$/.test(newPass)) {
    currentPassword = newPass;
    alert("Contraseña cambiada correctamente");
  } else {
    alert("Debe tener exactamente 4 dígitos");
  }
}
window.changePassword = changePassword;

// --- Imprimir ---
function printMovements() {
  window.print();
}
window.printMovements = printMovements;
