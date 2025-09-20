import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Config Firebase
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
const usuariosRef = collection(db, "usuarios");

// Secciones
function mostrarSeccion(id) {
  document.querySelectorAll(".seccion").forEach(sec => sec.classList.add("oculto"));
  document.getElementById(id).classList.remove("oculto");
}
window.mostrarSeccion = mostrarSeccion;

// Listar usuarios
async function cargarUsuarios() {
  const snapshot = await getDocs(usuariosRef);
  const lista = document.getElementById("listaUsuarios");
  lista.innerHTML = "";

  snapshot.forEach(docSnap => {
    const user = docSnap.data();
    lista.innerHTML += `
      <div>
        <strong>${user.nombre}</strong> (Contraseña: ${user.clave})
        <button onclick="editarUsuario('${docSnap.id}', '${user.nombre}', '${user.clave}')">Editar</button>
        <button onclick="imprimirTarjeta('${docSnap.id}')">Imprimir tarjeta</button>
      </div>
    `;
  });
}
window.cargarUsuarios = cargarUsuarios;

// Agregar usuario
async function agregarUsuario() {
  const nombre = document.getElementById("nombreUsuario").value.trim();
  const clave = document.getElementById("claveUsuario").value.trim();

  if (!/^\d{4}$/.test(clave)) {
    alert("La contraseña debe ser exactamente 4 dígitos (0000-9999).");
    return;
  }

  const entrada = Math.floor(Math.random() * 100000);
  const salida = Math.floor(Math.random() * 100000);

  await addDoc(usuariosRef, { nombre, clave, entrada, salida });
  cargarUsuarios();
}
window.agregarUsuario = agregarUsuario;

// Editar usuario
async function editarUsuario(id, nombre, clave) {
  const nuevoNombre = prompt("Nuevo nombre:", nombre);
  const nuevaClave = prompt("Nueva contraseña (4 dígitos):", clave);

  if (!nuevaClave || !/^\d{4}$/.test(nuevaClave)) {
    alert("Contraseña inválida. Debe ser de 4 dígitos.");
    return;
  }

  await updateDoc(doc(db, "usuarios", id), {
    nombre: nuevoNombre,
    clave: nuevaClave
  });

  cargarUsuarios();
}
window.editarUsuario = editarUsuario;

// Imprimir tarjeta
async function imprimirTarjeta(id) {
  const snapshot = await getDocs(usuariosRef);
  let user = null;
  snapshot.forEach(docSnap => {
    if (docSnap.id === id) user = docSnap.data();
  });

  if (!user) return;

  const win = window.open("", "_blank");
  win.document.write(`
    <html><body style="font-family:Arial;text-align:center;">
      <h2>Tarjeta de Usuario</h2>
      <p><strong>${user.nombre}</strong></p>
      <div style="margin:20px;">Código Entrada: ${user.entrada}</div>
      <hr>
      <div style="margin:20px;">Código Salida: ${user.salida}</div>
    </body></html>
  `);
  win.print();
}
window.imprimirTarjeta = imprimirTarjeta;

// Inicial
cargarUsuarios();
