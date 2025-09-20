import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, updateDoc, onSnapshot, query, orderBy, limit } from "firebase/firestore";

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

let CONTRASEÑA_GLOBAL = "0000"; // password master permanente
let contraseñaActual = "1234"; // editable

// Secciones
const sectionPanel = document.getElementById("sectionPanel");
const sectionUsuarios = document.getElementById("sectionUsuarios");
const sectionConfig = document.getElementById("sectionConfig");

// Botones navegación
document.getElementById("btnPanel").onclick = () => showSection(sectionPanel);
document.getElementById("btnUsuarios").onclick = () => showSection(sectionUsuarios);
document.getElementById("btnConfig").onclick = () => showSection(sectionConfig);

function showSection(section) {
  [sectionPanel, sectionUsuarios, sectionConfig].forEach(s => s.style.display = "none");
  section.style.display = "block";
}

// PANEL: Movimientos en tiempo real
const tablaMovimientos = document.getElementById("tablaMovimientos").getElementsByTagName("tbody")[0];
const btnImprimirUltima = document.getElementById("btnImprimirUltima");

const movCollection = collection(db, "movimientos");
const movQuery = query(movCollection, orderBy("timestamp","desc"), limit(25));

onSnapshot(movQuery, snapshot => {
  tablaMovimientos.innerHTML = "";
  snapshot.forEach(docSnap => {
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${data.L}</td><td>${data.nombre}</td><td>${data.dni}</td><td>${data.hEntrada}</td><td>${data.hSalida}</td><td>${data.tipo}</td>
    <td><button onclick="eliminarMovimiento('${docSnap.id}')">X</button></td>`;
    tablaMovimientos.appendChild(tr);
  });
});

window.eliminarMovimiento = async (id) => {
  const pin = prompt("Ingrese contraseña para eliminar:");
  if(pin === CONTRASEÑA_GLOBAL || pin === contraseñaActual){
    await deleteDoc(doc(db,"movimientos",id));
    alert("Movimiento eliminado.");
  } else alert("Contraseña incorrecta.");
}

btnImprimirUltima.onclick = () => {
  window.print();
}

// USUARIOS
const inpL = document.getElementById("inpL");
const inpNombre = document.getElementById("inpNombre");
const inpDNI = document.getElementById("inpDNI");
const inpTipo = document.getElementById("inpTipo");
const btnAgregarUsuario = document.getElementById("btnAgregarUsuario");
const mensajeUsuario = document.getElementById("mensajeUsuario");
const listaUsuarios = document.getElementById("listaUsuarios");

const usuariosCollection = collection(db,"usuarios");

btnAgregarUsuario.onclick = async () => {
  if(!inpL.value || !inpNombre.value || !inpDNI.value || !inpTipo.value) {
    mensajeUsuario.innerText = "Complete todos los campos.";
    return;
  }
  if(inpDNI.value.length > 8){
    mensajeUsuario.innerText = "DNI máximo 8 dígitos.";
    return;
  }
  try{
    const nuevoUsuario = {
      L: inpL.value,
      nombre: inpNombre.value,
      dni: inpDNI.value,
      tipo: inpTipo.value,
      codigoEntrada: Math.random().toString(36).substr(2,8),
      codigoSalida: Math.random().toString(36).substr(2,8)
    }
    await addDoc(usuariosCollection,nuevoUsuario);
    mensajeUsuario.innerText = "Usuario agregado con éxito";
    inpL.value=""; inpNombre.value=""; inpDNI.value=""; inpTipo.value="";
  } catch(e){
    mensajeUsuario.innerText = "Error al agregar usuario";
  }
}

// Listado de usuarios en tiempo real
onSnapshot(usuariosCollection, snapshot=>{
  listaUsuarios.innerHTML="";
  snapshot.forEach(docSnap=>{
    const u = docSnap.data();
    const div = document.createElement("div");
    div.innerHTML = `<strong>#${u.L} ${u.nombre} (${u.dni}) Tipo: ${u.tipo}</strong>
      <button onclick="imprimirTarjeta('${docSnap.id}')">Imprimir Tarjeta</button>
      <button onclick="editarUsuario('${docSnap.id}')">Editar</button>
      <button onclick="eliminarUsuario('${docSnap.id}')">Eliminar</button>`;
    listaUsuarios.appendChild(div);
  });
});

window.imprimirTarjeta = async (id) => {
  const docu = await getDocs(usuariosCollection);
  docu.forEach(docSnap=>{
    if(docSnap.id===id){
      const u = docSnap.data();
      const pin = prompt("Ingrese contraseña para imprimir tarjeta:");
      if(pin===CONTRASEÑA_GLOBAL || pin===contraseñaActual){
        const ventana = window.open();
        ventana.document.write(`<h2>${u.L} - ${u.nombre} - ${u.dni} - ${u.tipo}</h2>
        <p>Entrada: ${u.codigoEntrada}</p><p>Salida: ${u.codigoSalida}</p>`);
        ventana.print();
      } else alert("Contraseña incorrecta.");
    }
  });
}

window.editarUsuario = async (id) => {
  const pin = prompt("Ingrese contraseña para editar usuario:");
  if(pin!==CONTRASEÑA_GLOBAL && pin!==contraseñaActual){
    alert("Contraseña incorrecta."); return;
  }
  const docRef = doc(db,"usuarios",id);
  const nuevoNombre = prompt("Ingrese nuevo nombre:");
  if(nuevoNombre) await updateDoc(docRef,{nombre:nuevoNombre});
}

// ELIMINAR USUARIO
window.eliminarUsuario = async (id) => {
  const pin = prompt("Ingrese contraseña para eliminar usuario:");
  if(pin!==CONTRASEÑA_GLOBAL && pin!==contraseñaActual){ alert("Contraseña incorrecta."); return; }
  await deleteDoc(doc(db,"usuarios",id));
}

// CONFIG: cambiar contraseña
document.getElementById("btnCambiarContraseña").onclick = () => {
  const nueva = document.getElementById("inpNuevaContraseña").value;
  if(nueva.length!==4){ document.getElementById("mensajeConfig").innerText="Debe ser 4 dígitos"; return; }
  contraseñaActual = nueva;
  document.getElementById("mensajeConfig").innerText="Contraseña cambiada con éxito";
}

// ESCANEAR
document.getElementById("btnEscanear").onclick = async () => {
  const codigo = prompt("Ingrese código de escaneo:");
  const usuariosSnap = await getDocs(usuariosCollection);
  let encontrado=false;
  usuariosSnap.forEach(docSnap=>{
    const u = docSnap.data();
    if(codigo===u.codigoEntrada || codigo===u.codigoSalida){
      const now = new Date();
      const h = now.getHours().toString().padStart(2,"0")+":"+now.getMinutes().toString().padStart(2,"0");
      const fecha = `(${now.getDate()}/${now.getMonth()+1}/${now.getFullYear()})`;
      const mov = {
        L:u.L, nombre:u.nombre, dni:u.dni,
        hEntrada: codigo===u.codigoEntrada?h: "",
        hSalida: codigo===u.codigoSalida?h: "",
        tipo:u.tipo,
        timestamp: now
      }
      addDoc(movCollection,mov);
      encontrado=true;
    }
  });
  if(!encontrado) alert("Código no encontrado.");
}
