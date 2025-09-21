// Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, setDoc, doc,
  deleteDoc, updateDoc, getDoc, query, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.appspot.com",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables
let usuarios = [];
let movimientos = [];
let password = "1234";
const passwordMaestra = "9999";
let usuarioEditandoId = null;

// Elementos DOM
const seccionMovimientos = document.getElementById("seccion-movimientos");
const seccionUsuarios = document.getElementById("seccion-usuarios");
const seccionConfig = document.getElementById("seccion-config");
const tablaUsuarios = document.getElementById("tabla-usuarios");
const tablaMovimientos = document.getElementById("tabla-movimientos");
const paginacionDiv = document.getElementById("paginacion");

const modalEscanear = document.getElementById("modal-escanear");
const inputCodigo = document.getElementById("input-codigo");
const mensajeEscanear = document.getElementById("mensaje-escanear");

const modalEditar = document.getElementById("modal-editar");
const formEditar = document.getElementById("form-editar-usuario");
const editarLote = document.getElementById("editarLote");
const editarNombre = document.getElementById("editarNombre");
const editarDni = document.getElementById("editarDni");
const editarTipo = document.getElementById("editarTipo");
const mensajeEditar = document.getElementById("mensaje-editar");

// Navegación
document.getElementById("btn-movimientos").onclick = () => mostrarSeccion("movimientos");
document.getElementById("btn-usuarios").onclick = () => mostrarSeccion("usuarios");
document.getElementById("btn-config").onclick = () => mostrarSeccion("config");

function mostrarSeccion(seccion) {
  seccionMovimientos.classList.remove("activa");
  seccionUsuarios.classList.remove("activa");
  seccionConfig.classList.remove("activa");
  if (seccion === "movimientos") seccionMovimientos.classList.add("activa");
  if (seccion === "usuarios") seccionUsuarios.classList.add("activa");
  if (seccion === "config") seccionConfig.classList.add("activa");
}

// Escanear
document.getElementById("btn-escanear").onclick = () => {
  modalEscanear.style.display = "block";
  inputCodigo.value = "";
  mensajeEscanear.textContent = "";
  inputCodigo.focus();
};
document.getElementById("btn-cancelar-escanear").onclick = () => {
  modalEscanear.style.display = "none";
};

// Escucha de input sin necesidad de Enter
inputCodigo.addEventListener("input", async () => {
  if (inputCodigo.value.length >= 8) {
    await registrarMovimiento(inputCodigo.value.trim());
    inputCodigo.value = "";
  }
});

// Registrar movimiento
async function registrarMovimiento(codigo) {
  try {
    // Buscar usuario por entrada o salida
    const usuario = usuarios.find(u => u.codigoEntrada === codigo || u.codigoSalida === codigo);

    if (!usuario) {
      mensajeEscanear.textContent = "Tarjeta expirada, este usuario no existe";
      mensajeEscanear.className = "error";
      return;
    }

    const accion = (usuario.codigoEntrada === codigo) ? "entrada" : "salida";

    const ahora = new Date();
    const fecha = ahora.toLocaleDateString("es-AR");
    const hora = ahora.toLocaleTimeString("es-AR");

    await addDoc(collection(db, "movimientos"), {
      lote: usuario.lote,
      nombre: usuario.nombre,
      dni: usuario.dni,
      tipo: usuario.tipo,
      accion,
      fecha,
      hora,
      timestamp: ahora.getTime()
    });

    mensajeEscanear.textContent = "OK";
    mensajeEscanear.className = "ok";
    cargarMovimientos();
  } catch (e) {
    console.error("Error al registrar:", e);
    mensajeEscanear.textContent = "Error al registrar";
    mensajeEscanear.className = "error";
  }
}

// Cargar usuarios
async function cargarUsuarios() {
  const snapshot = await getDocs(collection(db, "usuarios"));
  usuarios = [];
  snapshot.forEach(docu => usuarios.push({ id: docu.id, ...docu.data() }));
  renderUsuarios();
}

// Render usuarios
function renderUsuarios() {
  tablaUsuarios.innerHTML = "";
  usuarios.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.lote}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button onclick="editarUsuario('${u.id}')">Editar</button>
        <button onclick="eliminarUsuario('${u.id}')">Eliminar</button>
        <button onclick="imprimirTarjeta('${u.id}')">Imprimir Tarjeta</button>
      </td>`;
    tablaUsuarios.appendChild(tr);
  });
}

// Agregar usuario
document.getElementById("form-usuario").addEventListener("submit", async e => {
  e.preventDefault();
  const lote = document.getElementById("numeroLote").value;
  const nombre = document.getElementById("nombreCompleto").value;
  const dni = document.getElementById("dni").value;
  const tipo = document.getElementById("tipoUsuario").value;

  if (!lote || !nombre || !dni || !tipo) return;

  const codigoEntrada = `${dni}-IN`;
  const codigoSalida = `${dni}-OUT`;

  await addDoc(collection(db, "usuarios"), { lote, nombre, dni, tipo, codigoEntrada, codigoSalida });
  cargarUsuarios();
  e.target.reset();
});

// Editar usuario
window.editarUsuario = id => {
  const u = usuarios.find(us => us.id === id);
  if (!u) return;
  usuarioEditandoId = id;
  editarLote.value = u.lote;
  editarNombre.value = u.nombre;
  editarDni.value = u.dni;
  editarTipo.value = u.tipo;
  mensajeEditar.textContent = "";
  modalEditar.style.display = "block";
};
document.getElementById("btn-cancelar-editar").onclick = () => modalEditar.style.display = "none";

formEditar.addEventListener("submit", async e => {
  e.preventDefault();
  if (!usuarioEditandoId) return;
  const lote = editarLote.value;
  const nombre = editarNombre.value;
  const dni = editarDni.value;
  const tipo = editarTipo.value;
  if (!lote || !nombre || !dni || !tipo) {
    mensajeEditar.textContent = "Faltan datos, por favor complete todos los campos";
    mensajeEditar.className = "error";
    return;
  }
  const codigoEntrada = `${dni}-IN`;
  const codigoSalida = `${dni}-OUT`;
  await updateDoc(doc(db, "usuarios", usuarioEditandoId), { lote, nombre, dni, tipo, codigoEntrada, codigoSalida });
  mensajeEditar.textContent = "Usuario editado con éxito";
  mensajeEditar.className = "ok";
  setTimeout(() => { modalEditar.style.display = "none"; cargarUsuarios(); }, 1000);
});

// Eliminar usuario
window.eliminarUsuario = async id => {
  const clave = prompt("Ingrese contraseña para eliminar:");
  if (clave !== password && clave !== passwordMaestra) {
    alert("Contraseña incorrecta");
    return;
  }
  await deleteDoc(doc(db, "usuarios", id));
  cargarUsuarios();
};

// Imprimir tarjeta
window.imprimirTarjeta = id => {
  const u = usuarios.find(us => us.id === id);
  if (!u) return;
  const w = window.open("", "PRINT", "height=400,width=600");
  w.document.write(`<h1>Tarjeta de ${u.nombre}</h1>`);
  w.document.write(`<p>#L: ${u.lote}</p>`);
  w.document.write(`<p>DNI: ${u.dni}</p>`);
  w.document.write(`<p>Entrada: ${u.codigoEntrada}</p>`);
  w.document.write(`<p>Salida: ${u.codigoSalida}</p>`);
  w.print();
};

// Cargar movimientos
async function cargarMovimientos() {
  const q = query(collection(db, "movimientos"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  movimientos = [];
  snapshot.forEach(docu => movimientos.push({ id: docu.id, ...docu.data() }));
  renderMovimientos();
}

// Render movimientos con paginación
const porPagina = 25;
let paginaActual = 1;

function renderMovimientos() {
  tablaMovimientos.innerHTML = "";
  const inicio = (paginaActual - 1) * porPagina;
  const paginados = movimientos.slice(inicio, inicio + porPagina);
  paginados.forEach(m => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.lote}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.tipo}</td>
      <td>${m.accion}</td>
      <td>${m.fecha}</td>
      <td>${m.hora}</td>
      <td><button onclick="eliminarMovimiento('${m.id}')">Eliminar</button></td>`;
    tablaMovimientos.appendChild(tr);
  });

  // Paginación
  paginacionDiv.innerHTML = "";
  const totalPaginas = Math.ceil(movimientos.length / porPagina);
  for (let i = 1; i <= totalPaginas; i++) {
    const btn = document.createElement("button");
    btn.textContent = i;
    btn.disabled = (i === paginaActual);
    btn.onclick = () => { paginaActual = i; renderMovimientos(); };
    paginacionDiv.appendChild(btn);
  }
}

// Eliminar movimiento
window.eliminarMovimiento = async id => {
  const clave = prompt("Ingrese contraseña para eliminar:");
  if (clave !== password && clave !== passwordMaestra) {
    alert("Contraseña incorrecta");
    return;
  }
  await deleteDoc(doc(db, "movimientos", id));
  cargarMovimientos();
};

// Cambiar contraseña
document.getElementById("btn-cambiar-password").onclick = () => {
  const nueva = document.getElementById("nuevaPassword").value;
  if (nueva) {
    password = nueva;
    alert("Contraseña cambiada");
  }
};
document.getElementById("btn-restaurar-password").onclick = () => {
  password = "1234";
  alert("Contraseña restaurada");
};

// Imprimir movimientos
document.getElementById("btn-imprimir-movimientos").onclick = () => {
  const w = window.open("", "PRINT", "height=400,width=600");
  w.document.write("<h1>Movimientos</h1>");
  w.document.write("<table border='1'><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Tipo</th><th>Acción</th><th>Fecha</th><th>Hora</th></tr>");
  movimientos.forEach(m => {
    w.document.write(`<tr>
      <td>${m.lote}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.tipo}</td>
      <td>${m.accion}</td>
      <td>${m.fecha}</td>
      <td>${m.hora}</td>
    </tr>`);
  });
  w.document.write("</table>");
  w.print();
};

// Inicial
cargarUsuarios();
cargarMovimientos();
