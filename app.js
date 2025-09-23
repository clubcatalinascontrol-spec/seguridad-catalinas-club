// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Firebase config
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

// Elementos
const codigoInput = document.getElementById("codigoInput");
const filtroPanel = document.getElementById("filtroPanel");
const filtroUsuarios = document.getElementById("filtroUsuarios");
const imprimirBtn = document.getElementById("imprimirBtn");

const tablaTodos = document.getElementById("tablaTodos");
const tablaPropietarios = document.getElementById("tablaPropietarios");
const tablaOtros = document.getElementById("tablaOtros");
const tablaUsuarios = document.getElementById("tablaUsuarios").querySelector("tbody");

// Funciones auxiliares
function generarID() {
  return Math.floor(Math.random() * 9999) + 1;
}

// Cargar datos de Firebase
async function cargarTickets() {
  const snapshot = await getDocs(collection(db, "tickets"));
  const tickets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  return tickets;
}

async function cargarUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// Renderizar tablas PANEL
async function renderizarPanel() {
  const tickets = await cargarTickets();
  const tipo = filtroPanel.value;

  // Vaciar tablas
  [tablaTodos, tablaPropietarios, tablaOtros].forEach(t => t.querySelector("tbody").innerHTML = "");

  tickets.forEach(t => {
    const fila = `<tr>
      <td>${t.id}</td>
      <td>${t.nombre}</td>
      <td>${t.fechaEliminacion || ""}</td>
      <td>
        <button onclick="eliminarTicket('${t.id}')">Eliminar</button>
      </td>
    </tr>`;

    tablaTodos.querySelector("tbody").innerHTML += fila;
    if (t.tipo === "propietario") tablaPropietarios.querySelector("tbody").innerHTML += fila;
    else tablaOtros.querySelector("tbody").innerHTML += fila;
  });

  // Mostrar solo la tabla seleccionada
  tablaTodos.style.display = tipo === "todos" ? "" : "none";
  tablaPropietarios.style.display = tipo === "propietarios" ? "" : "none";
  tablaOtros.style.display = tipo === "otros" ? "" : "none";
}

// Renderizar tabla USUARIOS
async function renderizarUsuarios() {
  const usuarios = await cargarUsuarios();
  const tipo = filtroUsuarios.value;
  tablaUsuarios.innerHTML = "";

  usuarios.forEach(u => {
    if (tipo === "todos" || (tipo === "propietarios" && u.tipo === "propietario") || (tipo === "otros" && u.tipo !== "propietario")) {
      const fila = `<tr>
        <td>${u.id}</td>
        <td>${u.nombre}</td>
        <td>${u.tipo}</td>
        <td>
          <button onclick="verFicha('${u.id}')">Ficha</button>
        </td>
      </tr>`;
      tablaUsuarios.innerHTML += fila;
    }
  });
}

// Eliminar ticket
window.eliminarTicket = async function(id) {
  await deleteDoc(doc(db, "tickets", id));
  renderizarPanel();
}

// Ver ficha usuario
window.verFicha = function(id) {
  alert("Ficha usuario: " + id);
}

// Escanear código
codigoInput.addEventListener("keypress", async e => {
  if (e.key === "Enter") {
    const codigo = codigoInput.value.trim();
    if (codigo) {
      await addDoc(collection(db, "tickets"), {
        id: generarID(),
        nombre: codigo,
        tipo: "otro",
        fechaEliminacion: new Date().toLocaleDateString()
      });
      codigoInput.value = "";
      renderizarPanel();
    }
  }
});

// Filtros
filtroPanel.addEventListener("change", renderizarPanel);
filtroUsuarios.addEventListener("change", renderizarUsuarios);

// Imprimir
imprimirBtn.addEventListener("click", () => window.print());

// Inicializar
renderizarPanel();
renderizarUsuarios();
codigoInput.focus();
