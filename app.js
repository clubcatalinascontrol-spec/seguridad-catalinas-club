import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, onSnapshot } from "firebase/firestore";

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

// Master password permanente
const MASTER_PASSWORD = "9999";

// Secciones
const sections = { panel: document.getElementById("panel"), usuarios: document.getElementById("usuarios"), config: document.getElementById("config") };
document.getElementById("btnPanel").addEventListener("click", () => showSection("panel"));
document.getElementById("btnUsuarios").addEventListener("click", () => { showSection("usuarios"); cargarUsuarios(); });
document.getElementById("btnConfig").addEventListener("click", () => showSection("config"));

function showSection(name){
  Object.values(sections).forEach(sec => sec.classList.remove("active"));
  sections[name].classList.add("active");
}

// ------------------- USUARIOS -------------------
const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const mensajeUsuario = document.getElementById("mensajeUsuario");
const listaUsuariosDiv = document.getElementById("listaUsuarios");

btnAgregarUsuario.addEventListener("click", async () => {
  const inputL = document.getElementById("inputL").value;
  const inputNombre = document.getElementById("inputNombre").value;
  const inputDNI = document.getElementById("inputDNI").value;
  const inputTipo = document.getElementById("inputTipo").value;

  if(!inputL || !inputNombre || !inputDNI || !inputTipo){
    mensajeUsuario.textContent = "Todos los campos son obligatorios";
    mensajeUsuario.style.color = "red";
    return;
  }

  try {
    await addDoc(collection(db, "usuarios"), {
      L: Number(inputL),
      nombre: inputNombre,
      dni: Number(inputDNI),
      tipo: inputTipo,
      codigoEntrada: Math.floor(Math.random()*10000000),
      codigoSalida: Math.floor(Math.random()*10000000)
    });
    mensajeUsuario.textContent = "Usuario agregado con éxito";
    mensajeUsuario.style.color = "#4CAF50";
    cargarUsuarios();
  } catch(err){
    mensajeUsuario.textContent = "Error al agregar usuario";
    mensajeUsuario.style.color = "red";
    console.error(err);
  }
});

async function cargarUsuarios(){
  listaUsuariosDiv.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "usuarios"));
  querySnapshot.forEach(docu => {
    const user = docu.data();
    const div = document.createElement("div");
    div.textContent = `#${user.L} - ${user.nombre} - ${user.dni} - Tipo: ${user.tipo}`;
    listaUsuariosDiv.appendChild(div);
  });
}

// ------------------- CONFIG -------------------
document.getElementById("btnGuardarPass").addEventListener("click", async () => {
  const nuevaPass = document.getElementById("inputNuevaPass").value;
  if(!nuevaPass || nuevaPass.length !== 4){
    document.getElementById("mensajeConfig").textContent = "La contraseña debe tener 4 dígitos";
    document.getElementById("mensajeConfig").style.color = "red";
    return;
  }
  try{
    await updateDoc(doc(db, "config", "contraseña"), {clave: nuevaPass});
    document.getElementById("mensajeConfig").textContent = "Contraseña guardada con éxito";
    document.getElementById("mensajeConfig").style.color = "#4CAF50";
  }catch(err){
    console.error(err);
    document.getElementById("mensajeConfig").textContent = "Error al guardar contraseña";
    document.getElementById("mensajeConfig").style.color = "red";
  }
});

// ------------------- PANEL -------------------
// Funcionalidad de escaneo, movimientos en tiempo real e impresión automática se integrará aquí
showSection("panel");
