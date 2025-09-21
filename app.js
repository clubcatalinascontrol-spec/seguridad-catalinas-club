// Firestore
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// Secciones
function mostrarSeccion(id) {
  document.querySelectorAll('.seccion').forEach(s => s.classList.remove('activa'));
  document.getElementById(id).classList.add('activa');
}
window.mostrarSeccion = mostrarSeccion;

// Escáner
function mostrarEscaner() {
  document.getElementById('overlay').classList.remove('hidden');
  document.getElementById('codigoEscaneo').value = "";
  document.getElementById('resultadoEscaneo').innerText = "";
  document.getElementById('codigoEscaneo').focus();
}
window.mostrarEscaner = mostrarEscaner;

function cancelarEscaneo() {
  document.getElementById('overlay').classList.add('hidden');
}
window.cancelarEscaneo = cancelarEscaneo;

document.getElementById('codigoEscaneo').addEventListener('input', async (e) => {
  if (e.target.value.length === 8) {
    const codigo = e.target.value;
    const usuarioSnap = await getDocs(collection(db, "usuarios"));
    let encontrado = null;
    usuarioSnap.forEach(docu => {
      if (docu.data().codigo === codigo) {
        encontrado = { id: docu.id, ...docu.data() };
      }
    });

    if (!encontrado) {
      document.getElementById('resultadoEscaneo').innerText = "Tarjeta expirada, debe imprimir una nueva, este usuario no existe en la base de datos";
      document.getElementById('resultadoEscaneo').className = "error";
    } else {
      await addDoc(collection(db, "movimientos"), {
        ...encontrado,
        fecha: new Date().toLocaleString()
      });
      document.getElementById('resultadoEscaneo').innerText = "OK";
      document.getElementById('resultadoEscaneo').className = "ok";
    }

    setTimeout(() => {
      cancelarEscaneo();
    }, 1500);
  }
});

// Usuarios
const formUsuario = document.getElementById("form-usuario");
formUsuario.addEventListener("submit", async (e) => {
  e.preventDefault();
  const lote = document.getElementById("lote").value;
  const nombre = document.getElementById("nombre").value;
  const dni = document.getElementById("dni").value;
  const tipo = document.getElementById("tipo").value;

  if (!lote || !nombre || !dni || !tipo) {
    alert("Complete todos los campos");
    return;
  }

  const codigo = Math.random().toString(36).substring(2, 10).toUpperCase();
  await addDoc(collection(db, "usuarios"), {
    lote, nombre, dni, tipo, codigo
  });
  formUsuario.reset();
  cargarUsuarios();
});

async function cargarUsuarios() {
  const tbody = document.getElementById("tabla-usuarios");
  tbody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  querySnapshot.forEach(docu => {
    const u = docu.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.lote}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>${u.codigo}</td>
      <td>
        <button onclick="editarUsuario('${docu.id}')">Editar</button>
        <button onclick="eliminarUsuario('${docu.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}
window.cargarUsuarios = cargarUsuarios;

// Editar usuario
let usuarioEditando = null;
async function editarUsuario(id) {
  usuarioEditando = id;
  const docRef = doc(db, "usuarios", id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const u = docSnap.data();
    document.getElementById("edit-lote").value = u.lote;
    document.getElementById("edit-nombre").value = u.nombre;
    document.getElementById("edit-dni").value = u.dni;
    document.getElementById("edit-tipo").value = u.tipo;
    document.getElementById("overlay-editar").classList.remove("hidden");
    document.getElementById("resultadoEditar").innerText = "";
  }
}
window.editarUsuario = editarUsuario;

function cancelarEdicion() {
  document.getElementById("overlay-editar").classList.add("hidden");
}
window.cancelarEdicion = cancelarEdicion;

async function finalizarEdicion() {
  const lote = document.getElementById("edit-lote").value;
  const nombre = document.getElementById("edit-nombre").value;
  const dni = document.getElementById("edit-dni").value;
  const tipo = document.getElementById("edit-tipo").value;

  if (!lote || !nombre || !dni || !tipo) {
    document.getElementById("resultadoEditar").innerText = "Faltan datos, por favor complete todos los campos";
    document.getElementById("resultadoEditar").className = "error";
    return;
  }

  await setDoc(doc(db, "usuarios", usuarioEditando), {
    lote, nombre, dni, tipo, codigo: (await getDoc(doc(db,"usuarios",usuarioEditando))).data().codigo
  });

  document.getElementById("resultadoEditar").innerText = "Usuario editado con éxito";
  document.getElementById("resultadoEditar").className = "ok";
  setTimeout(() => {
    cancelarEdicion();
    cargarUsuarios();
  }, 1500);
}
window.finalizarEdicion = finalizarEdicion;

// Eliminar usuario
async function eliminarUsuario(id) {
  const pass = prompt("Ingrese contraseña:");
  if (pass === "1234" || pass === "9999") {
    await deleteDoc(doc(db, "usuarios", id));
    cargarUsuarios();
  } else {
    alert("Contraseña incorrecta");
  }
}
window.eliminarUsuario = eliminarUsuario;

// Movimientos
async function cargarMovimientos() {
  const tbody = document.getElementById("tabla-movimientos");
  tbody.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "movimientos"));
  querySnapshot.forEach(docu => {
    const m = docu.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${docu.id}</td>
      <td>${m.lote}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.tipo}</td>
      <td>${m.fecha}</td>
      <td><button onclick="eliminarMovimiento('${docu.id}')">Eliminar</button></td>
    `;
    tbody.appendChild(tr);
  });
}
window.cargarMovimientos = cargarMovimientos;

async function eliminarMovimiento(id) {
  const pass = prompt("Ingrese contraseña:");
  if (pass === "1234" || pass === "9999") {
    await deleteDoc(doc(db, "movimientos", id));
    cargarMovimientos();
  } else {
    alert("Contraseña incorrecta");
  }
}
window.eliminarMovimiento = eliminarMovimiento;

function imprimirMovimientos() {
  const contenido = document.getElementById("tabla-movimientos").outerHTML;
  const ventana = window.open("", "", "width=800,height=600");
  ventana.document.write("<html><head><title>Movimientos</title></head><body>");
  ventana.document.write(contenido);
  ventana.document.write("</body></html>");
  ventana.document.close();
  ventana.print();
}
window.imprimirMovimientos = imprimirMovimientos;

// Config: restaurar contraseña
async function restaurarContrasena() {
  const pass = prompt("Ingrese contraseña maestra para continuar:");
  if (pass === "9999") {
    alert("La contraseña ahora es 1234");
  } else {
    alert("Contraseña maestra incorrecta");
  }
}
window.restaurarContrasena = restaurarContrasena;

// Inicial
cargarUsuarios();
cargarMovimientos();
