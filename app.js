// Firebase inicialización
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

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

// --- MOVIMIENTOS ---
const movimientosLista = document.getElementById("movimientos-lista");
const imprimirMovimientosBtn = document.getElementById("imprimirMovimientos");

onSnapshot(collection(db, "movimientos"), (snapshot) => {
  movimientosLista.innerHTML = "";
  snapshot.forEach((doc) => {
    const mov = doc.data();
    const div = document.createElement("div");
    div.textContent = `ID: ${doc.id} - ${mov.accion} - ${mov.fecha}`;
    movimientosLista.appendChild(div);
  });
});

imprimirMovimientosBtn.addEventListener("click", () => {
  const ventana = window.open("", "_blank");
  ventana.document.write("<h1>Movimientos</h1>");
  movimientosLista.querySelectorAll("div").forEach(div => {
    ventana.document.write(`<p>${div.textContent}</p>`);
  });
  ventana.print();
});

// --- USUARIOS ---
const usuariosLista = document.getElementById("usuarios-lista");
const modalEditar = document.getElementById("modal-editar");
const editarL = document.getElementById("editarL");
const editarNombre = document.getElementById("editarNombre");
const editarDni = document.getElementById("editarDni");
const editarTipo = document.getElementById("editarTipo");
const cancelarEdicion = document.getElementById("cancelarEdicion");
const finalizarEdicion = document.getElementById("finalizarEdicion");
const mensajeEdicion = document.getElementById("mensajeEdicion");

let usuarioActualId = null;

onSnapshot(collection(db, "usuarios"), (snapshot) => {
  usuariosLista.innerHTML = "";
  snapshot.forEach((docu) => {
    const usuario = docu.data();
    const div = document.createElement("div");
    div.textContent = `#L: ${usuario.l} - ${usuario.nombre} - DNI: ${usuario.dni} - Tipo: ${usuario.tipo}`;

    const btnEditar = document.createElement("button");
    btnEditar.textContent = "Editar";
    btnEditar.addEventListener("click", () => {
      usuarioActualId = docu.id;
      editarL.value = usuario.l;
      editarNombre.value = usuario.nombre;
      editarDni.value = usuario.dni;
      editarTipo.value = usuario.tipo;
      modalEditar.style.display = "flex";
    });

    div.appendChild(btnEditar);
    usuariosLista.appendChild(div);
  });
});

cancelarEdicion.addEventListener("click", () => {
  modalEditar.style.display = "none";
});

finalizarEdicion.addEventListener("click", async () => {
  if (!editarL.value || !editarNombre.value || !editarDni.value || !editarTipo.value) {
    mensajeEdicion.textContent = "Faltan datos, por favor complete todos los campos";
    mensajeEdicion.className = "error";
    return;
  }
  await updateDoc(doc(db, "usuarios", usuarioActualId), {
    l: editarL.value,
    nombre: editarNombre.value,
    dni: editarDni.value,
    tipo: editarTipo.value
  });
  mensajeEdicion.textContent = "Usuario editado con éxito";
  mensajeEdicion.className = "exito";
  setTimeout(() => { modalEditar.style.display = "none"; }, 1000);
});

// --- CONFIG: Restaurar contraseña ---
const restaurarBtn = document.getElementById("restaurarContrasena");
const modalRestaurar = document.getElementById("modal-restaurar");
const cancelarRestaurar = document.getElementById("cancelarRestaurar");
const confirmarRestaurar = document.getElementById("confirmarRestaurar");
const inputContrasenaMaestra = document.getElementById("inputContrasenaMaestra");
const mensajeRestaurar = document.getElementById("mensajeRestaurar");

restaurarBtn.addEventListener("click", () => {
  modalRestaurar.style.display = "flex";
});

cancelarRestaurar.addEventListener("click", () => {
  modalRestaurar.style.display = "none";
});

confirmarRestaurar.addEventListener("click", async () => {
  if (inputContrasenaMaestra.value === "9999") {
    await setDoc(doc(db, "config", "contrasena"), { valor: "1234" });
    mensajeRestaurar.textContent = "La contraseña ahora es 1234";
    mensajeRestaurar.className = "exito";
  } else {
    mensajeRestaurar.textContent = "Contraseña maestra incorrecta";
    mensajeRestaurar.className = "error";
  }
});
