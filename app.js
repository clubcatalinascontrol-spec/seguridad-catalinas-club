import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy 
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
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- Movimientos ---
let currentPage = 1;
const pageSize = 25;
let movementsCache = [];
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");

function renderTable(page){
  movimientosTableBody.innerHTML = "";
  const start = (page-1)*pageSize;
  const end = start + pageSize;
  const pageData = movementsCache.slice(start,end);
  pageData.forEach(mov=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${mov.L}</td><td>${mov.nombre}</td><td>${mov.dni}</td>
      <td>${mov.horaEntrada||'-'}</td><td>${mov.horaSalida||'-'}</td><td>${mov.tipo}</td>
      <td><button class="delete-mov" data-id="${mov.id}">Eliminar</button></td>
    `;
    movimientosTableBody.appendChild(tr);
  });
  renderPagination(page);
}

function renderPagination(activePage){
  paginationDiv.innerHTML = "";
  const totalPages = Math.min(Math.ceil(movementsCache.length/pageSize), 10);
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent = i;
    if(i===activePage) btn.classList.add("active");
    btn.addEventListener("click", ()=>{currentPage=i; renderTable(currentPage)});
    paginationDiv.appendChild(btn);
  }
}

// Movimientos en tiempo real
onSnapshot(query(collection(db,"movimientos"), orderBy("timestamp","desc")), snapshot=>{
  movementsCache = snapshot.docs.map(doc => ({id:doc.id, ...doc.data()}));
  renderTable(currentPage);
});

// --- PIN Maestro ---
const pinModal = document.getElementById("pinModal");
let deleteTargetId = null;
document.body.addEventListener("click", e=>{
  if(e.target.classList.contains("delete-mov")){
    deleteTargetId = e.target.dataset.id;
    pinModal.classList.add("active");
  }
});
document.getElementById("cancelPin").addEventListener("click", ()=>{
  pinModal.classList.remove("active");
  deleteTargetId=null;
  document.getElementById("pinInput").value="";
});
document.getElementById("confirmPin").addEventListener("click", async ()=>{
  const pinInput = document.getElementById("pinInput").value;
  const pinDoc = await getDocs(collection(db,"config"));
  let pin="1234";
  pinDoc.forEach(d => { pin = d.data().pin; });
  if(pinInput===pin){
    await deleteDoc(doc(db,"movimientos",deleteTargetId));
    alert("Movimiento eliminado");
  }else alert("PIN incorrecto");
  pinModal.classList.remove("active");
  deleteTargetId=null;
  document.getElementById("pinInput").value="";
});

// --- Guardar PIN ---
document.getElementById("savePin").addEventListener("click", async()=>{
  const newPin = document.getElementById("newPin").value;
  if(/^\d{4}$/.test(newPin)){
    await setDoc(doc(db,"config","pin"),{pin:newPin});
    alert("PIN guardado");
  }else alert("PIN inválido, debe tener 4 dígitos");
});

// --- Reimprimir última página ---
document.getElementById("reprintLastPage").addEventListener("click", ()=>{
  const latestPage = movementsCache.slice(0,pageSize);
  printPage(latestPage);
});

// --- Imprimir 25 movimientos visibles ---
document.getElementById("printPageBtn").addEventListener("click", ()=>{
  const start = (currentPage-1)*pageSize;
  const end = start + pageSize;
  const pageData = movementsCache.slice(start,end);
  printPage(pageData);
});

// --- Usuarios ---
const addUserBtn = document.getElementById("addUserBtn");
const userListContainer = document.getElementById("userListContainer");
const userMessage = document.getElementById("userMessage");

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

// --- Agregar Usuario ---
addUserBtn.addEventListener("click", async()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;
  if(!L||!nombre||!dni||!tipo) return alert("Complete todos los campos");
  if(!/^\d+$/.test(L)) return alert("#L debe ser solo números");
  if(!/^\d{1,8}$/.test(dni)) return alert("DNI debe tener máximo 8 dígitos");

  const codigoIngreso = generarCodigo();
  const codigoSalida = generarCodigo();

  await addDoc(collection(db,"usuarios"),{L,nombre,dni,tipo,codigoIngreso,codigoSalida});
  document.getElementById("userL").value=""; 
  document.getElementById("userNombre").value=""; 
  document.getElementById("userDni").value="";
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>{userMessage.textContent="";},3000);
});

// --- Listado usuarios en tiempo real ---
onSnapshot(collection(db,"usuarios"), snapshot=>{
  userListContainer.innerHTML="";
  snapshot.docs.forEach(doc=>{
    const data = doc.data();
    const div = document.createElement("div");
    div.className="userItem";
    div.style.border="1px solid #222"; 
    div.style.padding="5px"; 
    div.style.margin="5px"; 
    div.style.display="flex"; 
    div.style.alignItems="center"; 
    div.style.justifyContent="space-between";
    div.innerHTML=`
      <div>
        <input value="${data.L}" size="3" data-field="L">
        <input value="${data.nombre}" size="15" data-field="nombre">
        <input value="${data.dni}" size="8" data-field="dni">
        <select data-field="tipo">
          <option value="propietario" ${data.tipo==="propietario"?"selected":""}>Propietario</option>
          <option value="administracion" ${data.tipo==="administracion"?"selected":""}>Administración</option>
          <option value="empleado" ${data.tipo==="empleado"?"selected":""}>Empleado</option>
          <option value="obrero" ${data.tipo==="obrero"?"selected":""}>Obrero</option>
          <option value="invitado" ${data.tipo==="invitado"?"selected":""}>Invitado</option>
          <option value="guardia" ${data.tipo==="guardia"?"selected":""}>Guardia</option>
          <option value="otro" ${data.tipo==="otro"?"selected":""}>Otro</option>
        </select>
      </div>
      <div>
        <button class="saveUserBtn" data-id="${doc.id}">Guardar</button>
        <button class="printUserBtn" data-id="${doc.id}">Imprimir</button>
      </div>
    `;
    userListContainer.appendChild(div);
  });

  // Guardar cambios de usuario
  document.querySelectorAll(".saveUserBtn").forEach(btn=>{
    btn.addEventListener("click", async()=>{
      const id = btn.dataset.id;
      const parent = btn.closest(".userItem");
      const inputs = parent.querySelectorAll("input, select");
      const updated = {};
      inputs.forEach(i=> updated[i.dataset.field] = i.value);
      await setDoc(doc(db,"usuarios",id), updated, {merge:true});
      alert("Usuario actualizado");
    });
  });

  // Imprimir tarjeta usuario
  document.querySelectorAll(".printUserBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      const data = snapshot.docs.find(d=>d.id===id).data();
      printUserCard(data);
    });
  });
});

// --- Funciones de impresión ---
function printPage(data){
  const win = window.open("","PRINT","width=900,height=600");
  win.document.write("<html><head><title>Movimientos</title></head><body>");
  win.document.write("<table border='1' style='border-collapse:collapse;width:100%'>");
  win.document.write("<tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr>");
  data.forEach(m=>{
    win.document.write(`<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.horaEntrada||'-'}</td><td>${m.horaSalida||'-'}</td><td>${m.tipo}</td></tr>`);
  });
  win.document.write("</table></body></html>");
  win.document.close();
  win.print();
}

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
  win.print();
}
