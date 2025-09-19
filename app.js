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

// --- Auxiliares ---
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActual(){ 
  const d=new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} (${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()})`;
}

// --- PIN maestro ---
if(!localStorage.getItem("pinMaestro")) localStorage.setItem("pinMaestro","1234");

// --- USUARIOS ---
const userTableBody = document.querySelector("#userTable tbody");
const userMessage = document.getElementById("userMessage");

const usuariosRef = collection(db,"usuarios");

// Cargar usuarios por defecto si no existen
async function cargarUsuariosPorDefecto(){
  const snapshot = await getDocs(usuariosRef);
  if(snapshot.empty){
    await addDoc(usuariosRef,{L:"999",nombre:"Prueba A",dni:"11222333",tipo:"otro",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    await addDoc(usuariosRef,{L:"998",nombre:"Prueba B",dni:"44555666",tipo:"empleado",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  }
}
cargarUsuariosPorDefecto();

// Función para renderizar tabla de usuarios
function renderUsuarios(snapshot){
    userTableBody.innerHTML="";
    snapshot.docs.forEach(docSnap=>{
        const data = docSnap.data();
        const tr = document.createElement("tr");
        tr.innerHTML=`
          <td>${data.L}</td>
          <td><input type="text" value="${data.nombre}" size="30" data-field="nombre"></td>
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

        // Eliminar usuario con PIN
        tr.querySelector(".deleteUserBtn").onclick = async ()=>{
            const pin = prompt("Ingrese PIN maestro:");
            if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
            await deleteDoc(doc(db,"usuarios",docSnap.id));
        };

        // Imprimir tarjeta con PIN
        tr.querySelector(".printUserBtn").onclick = async ()=>{
            const pin = prompt("Ingrese PIN maestro:");
            if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
            imprimirTarjeta(data);
        };

        // Editar usuario
        tr.querySelectorAll("input,select").forEach(input=>{
            input.addEventListener("change", async ()=>{
                const field = input.dataset.field;
                const value = input.value;
                await updateDoc(doc(db,"usuarios",docSnap.id),{[field]:value});
            });
        });
    });
}

// Listener en tiempo real para usuarios
onSnapshot(usuariosRef, snapshot => renderUsuarios(snapshot));

// Agregar usuario
document.getElementById("addUserBtn").onclick = async()=>{
    const L = document.getElementById("userL").value.trim();
    const nombre = document.getElementById("userNombre").value.trim();
    const dni = document.getElementById("userDni").value.trim();
    const tipo = document.getElementById("userTipo").value;
    if(!L || !nombre || !dni){ alert("Completa todos los campos"); return; }
    if(dni.length>8){ alert("DNI máximo 8 dígitos"); return; }
    await addDoc(usuariosRef,{
        L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()
    });
    document.getElementById("userL").value="";
    document.getElementById("userNombre").value="";
    document.getElementById("userDni").value="";
    userMessage.textContent="Usuario agregado con éxito";
    setTimeout(()=>userMessage.textContent="",3000);
};

// Guardar PIN maestro
document.getElementById("savePin").onclick = ()=>{
  const newPin = document.getElementById("newPin").value.trim();
  if(!/^\d{4}$/.test(newPin)){ alert("PIN debe tener 4 dígitos"); return; }
  localStorage.setItem("pinMaestro",newPin);
  alert("PIN maestro guardado");
};

// --- MOVIMIENTOS ---
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const movimientosRef = collection(db,"movimientos");
let currentPage = 1;
const MOV_LIMIT = 25;

// Cargar movimientos en tiempo real con paginación
onSnapshot(movimientosRef, snapshot=>{
  const movimientos = snapshot.docs.map(docSnap=>({id:docSnap.id,...docSnap.data()})).reverse();
  mostrarMovimientos(movimientos,currentPage);
});

function mostrarMovimientos(movs,page){
  movimientosTableBody.innerHTML="";
  const start = (page-1)*MOV_LIMIT;
  const pag = movs.slice(start,start+MOV_LIMIT);
  pag.forEach(m=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.entrada||""}</td>
      <td>${m.salida||""}</td>
      <td>${m.tipo}</td>
      <td><button data-id="${m.id}">Eliminar</button></td>
    `;
    movimientosTableBody.appendChild(tr);
    tr.querySelector("button").onclick=async()=>{
      const pin = prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){ alert("PIN incorrecto"); return; }
      await deleteDoc(doc(db,"movimientos",m.id));
    };
  });

  // Paginación
  const totalPages = Math.min(10,Math.ceil(movs.length/MOV_LIMIT));
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML="";
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===page) btn.classList.add("active");
    btn.onclick=()=>{currentPage=i; mostrarMovimientos(movs,currentPage);}
    paginationDiv.appendChild(btn);
  }

  // Auto imprimir si hay 25
  if(pag.length===MOV_LIMIT){ imprimirTabla(pag); }
}

// --- ESCANEO ---
document.getElementById("scanBtn").onclick = async()=>{
  const codigo = prompt("Escanee código de barra:");
  if(!codigo) return;

  const snapshot = await getDocs(usuariosRef);
  const userDoc = snapshot.docs.find(d=>d.data().codigoIngreso===codigo || d.data().codigoSalida===codigo);
  if(!userDoc){ alert("Usuario no encontrado"); return; }

  const userData = userDoc.data();
  const isIngreso = userData.codigoIngreso===codigo;
  await addDoc(movimientosRef,{
    L:userData.L,
    nombre:userData.nombre,
    dni:userData.dni,
    tipo:userData.tipo,
    entrada:isIngreso?horaActual():"",
    salida:!isIngreso?horaActual():""
  });
  alert("Movimiento registrado correctamente");
};

// --- IMPRESIÓN ---
function imprimirTarjeta(user){
  const w = window.open("","_blank","width=800,height=400");
  w.document.write(`<div class="print-card" style="border-color:${colorTipo(user.tipo)}">
    <h4>#L: ${user.L} - ${user.nombre} - ${user.dni} - ${user.tipo}</h4>
    <svg id="codeIngreso"></svg>
    <svg id="codeSalida"></svg>
  </div>`);
  JsBarcode(w.document.getElementById("codeIngreso"),user.codigoIngreso,{format:"CODE128"});
  JsBarcode(w.document.getElementById("codeSalida"),user.codigoSalida,{format:"CODE128"});
  w.print();
  w.close();
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

// --- IMPRESIÓN TABLA ---
function imprimirTabla(movs){
  const w = window.open("","_blank","width=1200,height=800");
  let html=`<table border="1" style="border-collapse:collapse;"><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr>`;
  movs.forEach(m=>{
    html+=`<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`;
  });
  html+="</table>";
  w.document.write(html);
  w.print();
  w.close();
}

// Botón imprimir última página
document.getElementById("printPageBtn").onclick=()=>{
  onSnapshot(movimientosRef, snapshot=>{
    const movimientos = snapshot.docs.map(d=>({id:d.id,...d.data()})).reverse();
    const start = (currentPage-1)*MOV_LIMIT;
    const pag = movimientos.slice(start,start+MOV_LIMIT);
    imprimirTabla(pag);
  });
};
