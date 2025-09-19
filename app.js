import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, deleteDoc, doc, onSnapshot, updateDoc
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- Firebase ---
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

// --- SPA Navigation ---
const sections = document.querySelectorAll("main section");
const navButtons = document.querySelectorAll(".nav-btn");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- PIN maestro ---
if(!localStorage.getItem("pinMaestro")) localStorage.setItem("pinMaestro","1234");

// --- USUARIOS ---
const userTableBody = document.querySelector("#userTable tbody");
const userMessage = document.getElementById("userMessage");
const usuariosRef = collection(db,"usuarios");

function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }

// Cargar usuarios por defecto si colección vacía
async function cargarUsuariosPorDefecto(){
  const snapshot = await getDocs(usuariosRef);
  if(snapshot.empty){
    await addDoc(usuariosRef,{L:"999",nombre:"Prueba A",dni:"11222333",tipo:"otro",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    await addDoc(usuariosRef,{L:"998",nombre:"Prueba B",dni:"44555666",tipo:"empleado",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  }
}
await cargarUsuariosPorDefecto();

// Render tabla usuarios
function renderUsuarios(snapshot){
  userTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${data.L}</td>
      <td><input type="text" value="${data.nombre}" size="25" data-field="nombre"></td>
      <td><input type="text" value="${data.dni}" size="8" data-field="dni"></td>
      <td>
        <select data-field="tipo">
          <option value="propietario" ${data.tipo==="propietario"?"selected":""}>Propietario</option>
          <option value="administracion" ${data.tipo==="administracion"?"selected":""}>Administración</option>
          <option value="empleado" ${data.tipo==="empleado"?"selected":""}>Empleado</option>
          <option value="obrero" ${data.tipo==="obrero"?"selected":""}>Obrero</option>
          <option value="invitado" ${data.tipo==="invitado"?"selected":""}>Invitado</option>
          <option value="guardia" ${data.tipo==="guardia"?"selected":""}>Guardia</option>
          <option value="otro" ${data.tipo==="otro"?"selected":""}>Otro</option>
        </select>
      </td>
      <td>
        <button class="userTableBtn deleteUserBtn" data-id="${docSnap.id}">Eliminar</button>
        <button class="userTableBtn printUserBtn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    userTableBody.appendChild(tr);

    tr.querySelector(".deleteUserBtn").onclick = async ()=>{
      const pin = prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
      await deleteDoc(doc(db,"usuarios",docSnap.id));
    };

    tr.querySelector(".printUserBtn").onclick = async ()=>{
      const pin = prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
      imprimirTarjeta(data);
    };

    tr.querySelectorAll("input,select").forEach(input=>{
      input.addEventListener("change", async ()=>{
        const field = input.dataset.field;
        const value = input.value;
        await updateDoc(doc(db,"usuarios",docSnap.id),{[field]:value});
      });
    });
  });
}

// Escuchar cambios en Firestore
onSnapshot(usuariosRef,snapshot=>renderUsuarios(snapshot));

// Agregar usuario
document.getElementById("addUserBtn").onclick=async ()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;
  if(!L || !nombre || !dni || !tipo){ userMessage.textContent="Complete todos los campos"; return; }
  await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>userMessage.textContent="",3000);
  document.getElementById("userL").value="";
  document.getElementById("userNombre").value="";
  document.getElementById("userDni").value="";
};

// --- IMPRESIÓN TARJETA ---
function imprimirTarjeta(user){
  const w = window.open("","_blank","width=400,height=300");
  const color = colorTipo(user.tipo);
  w.document.write(`<div style="width:15cm;height:6cm;border:0.5cm solid ${color};text-align:center;">
    <p>#${user.L} - ${user.nombre} - ${user.dni} - ${user.tipo}</p>
    <svg id="codeIngreso"></svg>
    <svg id="codeSalida"></svg>
  </div>`);
  JsBarcode(w.document.getElementById("codeIngreso"), user.codigoIngreso, {format:"CODE128"});
  JsBarcode(w.document.getElementById("codeSalida"), user.codigoSalida, {format:"CODE128"});
  w.print(); w.close();
}
function colorTipo(tipo){
  switch(tipo){
    case "propietario": return "violet";
    case "administracion": return "orange";
    case "empleado": return "green";
    case "obrero": return "yellow";
    case "invitado": return "cyan";
    case "guardia": return "red";
    default: return "gray";
  }
}

// --- PANEL Movimientos ---
const movimientosRef = collection(db,"movimientos");
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const MOV_LIMIT = 25;

function horaActual(){ 
  const d=new Date(); 
  return d.getHours().toString().padStart(2,'0')+":"+d.getMinutes().toString().padStart(2,'0')+" ("+d.toLocaleDateString()+")";
}

function renderMovimientos(snapshot){
  movimientosTableBody.innerHTML="";
  const docs = snapshot.docs.reverse();
  docs.forEach(docSnap=>{
    const data = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${data.L}</td>
      <td>${data.nombre}</td>
      <td>${data.dni}</td>
      <td>${data.entrada||""}</td>
      <td>${data.salida||""}</td>
      <td>${data.tipo}</td>
      <td><button class="deleteMovBtn">Eliminar</button></td>
    `;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".deleteMovBtn").onclick=async()=>{
      const pin = prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
      await deleteDoc(doc(db,"movimientos",docSnap.id));
    };
  });
}
onSnapshot(movimientosRef,snapshot=>renderMovimientos(snapshot));

// ESCANEAR
document.getElementById("scanBtn").onclick=async ()=>{
  const codigo = prompt("Escanee código de barras:");
  const snapshot = await getDocs(usuariosRef);
  let usuario = null;
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    if(u.codigoIngreso===codigo || u.codigoSalida===codigo) usuario={...u,id:docSnap.id};
  });
  if(!usuario){ alert("Código no reconocido"); return; }
  const now = horaActual();
  let mov = {L:usuario.L,nombre:usuario.nombre,dni:usuario.dni,tipo:usuario.tipo};
  if(codigo===usuario.codigoIngreso) mov.entrada=now;
  if(codigo===usuario.codigoSalida) mov.salida=now;
  await addDoc(movimientosRef,mov);
};

// IMPRIMIR ÚLTIMA PÁGINA
document.getElementById("printPageBtn").onclick = async()=>{
  const snapshot = await getDocs(movimientosRef);
  const data = snapshot.docs.map(d=>d.data()).reverse().slice(0,MOV_LIMIT);
  const w = window.open("","_blank","width=800,height=600");
  let html=`<table border="1" style="width:100%;border-collapse:collapse;">
    <thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr></thead><tbody>`;
  data.forEach(m=>{ html+=`<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`; });
  html+="</tbody></table>";
  w.document.write(html); w.print(); w.close();
};

// CONFIG guardar PIN
document.getElementById("savePin").onclick=()=>{
  const val=document.getElementById("newPin").value.trim();
  if(val.length!==4 || isNaN(val)){ alert("PIN inválido"); return; }
  localStorage.setItem("pinMaestro",val);
  alert("PIN actualizado");
};
