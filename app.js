import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";

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

// Master password fija e inmutable
const MASTER_PASSWORD = "9999";

// DOM Elements
const sections = {
  panel: document.getElementById("panel"),
  usuarios: document.getElementById("usuarios"),
  config: document.getElementById("config")
};

const btnPanel = document.getElementById("btnPanel");
const btnUsuarios = document.getElementById("btnUsuarios");
const btnConfig = document.getElementById("btnConfig");

const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const mensajeUsuario = document.getElementById("mensajeUsuario");
const listaUsuariosDiv = document.getElementById("listaUsuarios");

const btnGuardarPass = document.getElementById("btnGuardarPass");
const mensajeConfig = document.getElementById("mensajeConfig");

// Navegación
btnPanel.addEventListener("click", () => showSection("panel"));
btnUsuarios.addEventListener("click", () => { showSection("usuarios"); cargarUsuarios(); });
btnConfig.addEventListener("click", () => showSection("config"));

function showSection(name){
  Object.values(sections).forEach(sec => sec.classList.remove("active"));
  sections[name].classList.add("active");
}

// Validación contraseña (normal + master)
async function validarContraseña(input){
  if(input === MASTER_PASSWORD) return true;
  const docRef = doc(db, "config", "contraseña");
  const docSnap = await getDoc(docRef);
  if(docSnap.exists()){
    return input === docSnap.data().clave;
  }
  return false;
}

// Agregar usuario
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

// Cargar usuarios
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

// Guardar contraseña normal
btnGuardarPass.addEventListener("click", async () => {
  const nuevaPass = document.getElementById("inputNuevaPass").value;
  if(!nuevaPass || nuevaPass.length !== 4){
    mensajeConfig.textContent = "La contraseña debe tener 4 dígitos";
    mensajeConfig.style.color = "red";
    return;
  }
  try{
    await updateDoc(doc(db, "config", "contraseña"), {clave: nuevaPass});
    mensajeConfig.textContent = "Contraseña guardada con éxito";
    mensajeConfig.style.color = "#4CAF50";
  }catch(err){
    console.error(err);
    mensajeConfig.textContent = "Error al guardar contraseña";
    mensajeConfig.style.color = "red";
  }
});

// Inicialmente mostrar panel
showSection("panel");
