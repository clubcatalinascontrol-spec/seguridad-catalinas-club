import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy, limit
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
function colorTipo(tipo){
  switch(tipo){
    case "propietario": return "#8A2BE2";
    case "administracion": return "#FFA500";
    case "empleado": return "#008000";
    case "obrero": return "#FFD700";
    case "invitado": return "#00FFFF";
    case "guardia": return "#FF0000";
    default: return "#808080";
  }
}

// --- Crear usuarios por defecto ---
async function crearUsuariosPorDefecto(){
  const usuariosRef = collection(db,"usuarios");
  const docs = await getDocs(usuariosRef);
  if(docs.empty){
    await addDoc(usuariosRef,{L:"999",nombre:"Prueba A",dni:"11222333",tipo:"otro",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    await addDoc(usuariosRef,{L:"998",nombre:"Prueba B",dni:"44555666",tipo:"empleado",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  }
}
crearUsuariosPorDefecto();

// ------------------- USUARIOS -------------------
const addUserBtn = document.getElementById("addUserBtn");
const userTableBody = document.querySelector("#userTable tbody");
const userMessage = document.getElementById("userMessage");

addUserBtn.addEventListener("click", async ()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;

  if(!L||!nombre||!dni||!tipo){ alert("Complete todos los campos"); return; }
  if(!/^\d+$/.test(L)){ alert("#L debe ser solo números"); return; }
  if(!/^\d{1,8}$/.test(dni)){ alert("DNI debe tener máximo 8 dígitos"); return; }

  const codigoIngreso = generarCodigo();
  const codigoSalida = generarCodigo();
  await addDoc(collection(db,"usuarios"),{L,nombre,dni,tipo,codigoIngreso,codigoSalida});

  document.getElementById("userL").value="";
  document.getElementById("userNombre").value="";
  document.getElementById("userDni").value="";
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>{userMessage.textContent="";},3000);
});

// Mostrar usuarios en tiempo real
onSnapshot(collection(db,"usuarios"), snapshot=>{
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
        <button class="userTableBtn saveUserBtn" data-id="${docSnap.id}">Guardar</button>
        <button class="userTableBtn printUserBtn" data-id="${docSnap.id}">Imprimir</button>
        <button class="userTableBtn deleteUserBtn" data-id="${docSnap.id}">Eliminar</button>
      </td>
    `;
    userTableBody.appendChild(tr);
  });

  // Eventos dinámicos
  document.querySelectorAll(".saveUserBtn").forEach(btn=>{
    btn.onclick = async ()=>{
      const id = btn.dataset.id;
      const tr = btn.closest("tr");
      const nombre = tr.querySelector('input[data-field="nombre"]').value;
      const dni = tr.querySelector('input[data-field="dni"]').value;
      const tipo = tr.querySelector('select[data-field="tipo"]').value;
      await setDoc(doc(db,"usuarios",id), {nombre,dni,tipo}, {merge:true});
      alert("Usuario actualizado");
    };
  });

  document.querySelectorAll(".printUserBtn").forEach(btn=>{
    btn.onclick = ()=>{
      let pin = prompt("Ingrese PIN maestro para imprimir tarjeta:");
      if(pin==="1234"){
        const id = btn.dataset.id;
        const data = snapshot.docs.find(d=>d.id===id).data();
        printUserCard(data);
      } else alert("PIN incorrecto");
    };
  });

  document.querySelectorAll(".deleteUserBtn").forEach(btn=>{
    btn.onclick = async ()=>{
      let pin = prompt("Ingrese PIN maestro para eliminar usuario:");
      if(pin==="1234"){
        const id = btn.dataset.id;
        await deleteDoc(doc(db,"usuarios",id));
        alert("Usuario eliminado");
      } else alert("PIN incorrecto");
    };
  });
});

// ------------------- IMPRESIÓN TARJETAS -------------------
function printUserCard(data){
  const win = window.open("","PRINT","width=400,height=300");
  const color = colorTipo(data.tipo);
  win.document.write(`<div style="border:1cm solid ${color};padding:10px;width:15cm;height:6cm;text-align:center">`);
  win.document.write(`<p>#${data.L} - ${data.nombre} - ${data.dni} - ${data.tipo}</p>`);
  win.document.write(`<svg id="barcode" jsbarcode-value="${data.codigoIngreso}" jsbarcode-height="40"></svg><br>`);
  win.document.write(`<svg id="barcode2" jsbarcode-value="${data.codigoSalida}" jsbarcode-height="40"></svg>`);
  win.document.write("</div>");
  win.document.close();
  JsBarcode(win.document.querySelector("#barcode")).init();
  JsBarcode(win.document.querySelector("#barcode2")).init();
}

// ------------------- PANEL MOVIMIENTOS -------------------
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
let movimientosPagina = 1;
const movimientosPorPagina = 25;
const movimientosMaxPaginas = 10;
let movimientosArray = [];

// Simulación escaneo
document.getElementById("scanBtn").onclick = async ()=>{
  const codigo = prompt("Ingrese código de barras escaneado:");
  if(!codigo) return;

  const usuariosSnap = await getDocs(collection(db,"usuarios"));
  const usuario = usuariosSnap.docs.map(d=>d.data()).find(u=>u.codigoIngreso===codigo || u.codigoSalida===codigo);
  if(!usuario){ alert("Código no corresponde a ningún usuario"); return; }

  const fecha = new Date();
  const hora = fecha.getHours().toString().padStart(2,"0")+":"+fecha.getMinutes().toString().padStart(2,"0");
  const fechaStr = `(${fecha.getDate()}/${fecha.getMonth()+1}/${fecha.getFullYear()})`;

  let entrada="", salida="";
  if(codigo===usuario.codigoIngreso){ entrada = hora+" "+fechaStr; }
  if(codigo===usuario.codigoSalida){ salida = hora+" "+fechaStr; }

  const movimiento = {L:usuario.L,nombre:usuario.nombre,dni:usuario.dni,entrada,salida,tipo:usuario.tipo};
  movimientosArray.unshift(movimiento);
  if(movimientosArray.length>movimientosPorPagina*movimientosMaxPaginas){ movimientosArray.pop(); }

  actualizarTablaMovimientos();
};

// Actualiza tabla y paginación
function actualizarTablaMovimientos(){
  const start = (movimientosPagina-1)*movimientosPorPagina;
  const end = start+movimientosPorPagina;
  const paginaMov = movimientosArray.slice(start,end);

  movimientosTableBody.innerHTML="";
  paginaMov.forEach((m,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.entrada}</td>
      <td>${m.salida}</td>
      <td style="color:${colorTipo(m.tipo)}">${m.tipo}</td>
      <td><button class="userTableBtn" onclick="eliminarMovimiento(${start+i})">Eliminar</button></td>
    `;
    movimientosTableBody.appendChild(tr);
  });

  // Paginación
  const paginationDiv = document.getElementById("pagination");
  paginationDiv.innerHTML="";
  const totalPaginas = Math.ceil(movimientosArray.length/movimientosPorPagina);
  for(let i=1;i<=totalPaginas;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===movimientosPagina) btn.classList.add("active");
    btn.onclick=()=>{ movimientosPagina=i; actualizarTablaMovimientos(); };
    paginationDiv.appendChild(btn);
  }

  // Imprimir automáticamente si se llenó la página
  if(paginaMov.length===movimientosPorPagina) imprimirPagina();
}

// Eliminar movimiento
window.eliminarMovimiento = (index)=>{
  const pin = prompt("Ingrese PIN maestro para eliminar movimiento:");
  if(pin==="1234"){
    movimientosArray.splice(index,1);
    actualizarTablaMovimientos();
  } else alert("PIN incorrecto");
};

// Imprimir página
function imprimirPagina(){
  const start = (movimientosPagina-1)*movimientosPorPagina;
  const end = start+movimientosPorPagina;
  const paginaMov = movimientosArray.slice(start,end);

  const win = window.open("","PRINT","width=800,height=600");
  win.document.write("<h2>Movimientos - Página "+movimientosPagina+"</h2>");
  win.document.write("<table border='1' style='width:100%;border-collapse:collapse;'>");
  win.document.write("<tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr>");
  paginaMov.forEach(m=>{
    win.document.write(`<tr>
      <td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada}</td><td>${m.salida}</td><td>${m.tipo}</td>
    </tr>`);
  });
  win.document.write("</table>");
  win.document.close();
  win.print();
}

// Botón manual
document.getElementById("printPageBtn").onclick = imprimirPagina;

// ------------------- CONFIG -------------------
document.getElementById("savePin").onclick = ()=>{
  const newPin = document.getElementById("newPin").value.trim();
  if(!/^\d{4}$/.test(newPin)){ alert("PIN debe tener 4 dígitos"); return; }
  localStorage.setItem("pinMaestro",newPin);
  alert("PIN maestro guardado");
};
