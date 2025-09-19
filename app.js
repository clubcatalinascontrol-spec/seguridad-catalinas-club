import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
navButtons.forEach(btn=>{
  btn.addEventListener("click",()=>{
    sections.forEach(sec=>sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    navButtons.forEach(b=>b.classList.remove("active"));
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
    tr.innerHTML = `<td>${mov.L}</td><td>${mov.nombre}</td><td>${mov.dni}</td>
    <td>${mov.horaEntrada||'-'}</td><td>${mov.horaSalida||'-'}</td><td>${mov.tipo}</td>
    <td><button class="delete-mov" data-id="${mov.id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
  });
  renderPagination(page);
}

function renderPagination(activePage){
  paginationDiv.innerHTML="";
  const totalPages = Math.min(Math.ceil(movementsCache.length/pageSize),10);
  for(let i=1;i<=totalPages;i++){
    const btn=document.createElement("button");
    btn.textContent=i;
    if(i===activePage) btn.classList.add("active");
    btn.addEventListener("click",()=>{currentPage=i; renderTable(currentPage)});
    paginationDiv.appendChild(btn);
  }
}

// Movimientos en tiempo real
onSnapshot(query(collection(db,"movimientos"),orderBy("timestamp","desc")),snapshot=>{
  movementsCache = snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  renderTable(currentPage);
});

// --- Eliminar con PIN ---
const pinModal=document.getElementById("pinModal");
let deleteTargetId=null;
document.body.addEventListener("click",e=>{
  if(e.target.classList.contains("delete-mov")){
    deleteTargetId=e.target.dataset.id;
    pinModal.classList.remove("hidden");
  }
});
document.getElementById("cancelPin").addEventListener("click",()=>{
  pinModal.classList.add("hidden"); deleteTargetId=null;
});
document.getElementById("confirmPin").addEventListener("click",async()=>{
  const pinInput=document.getElementById("pinInput").value;
  const pinDoc=await getDocs(collection(db,"config"));
  let pin="1234";
  pinDoc.forEach(d=>{pin=d.data().pin});
  if(pinInput===pin){
    await deleteDoc(doc(db,"movimientos",deleteTargetId));
    alert("Movimiento eliminado");
  } else {
    alert("PIN incorrecto");
  }
  pinModal.classList.add("hidden");
  deleteTargetId=null;
});

// --- Guardar PIN maestro ---
document.getElementById("savePin").addEventListener("click", async()=>{
  const newPin=document.getElementById("newPin").value;
  if(/^\d{4}$/.test(newPin)){
    await setDoc(doc(db,"config","pin"),{pin:newPin});
    alert("PIN guardado");
  }else{
    alert("PIN inválido, debe tener 4 dígitos");
  }
});

// --- Reimprimir última página ---
document.getElementById("reprintLastPage").addEventListener("click",()=>{
  const latestPage=movementsCache.slice(0,pageSize);
  printPage(latestPage);
});

// --- Usuarios y Tarjetas ---
const addUserBtn=document.getElementById("addUserBtn");
const userList=document.getElementById("userList");

function generarCodigo() { return Math.random().toString(36).substring(2,10).toUpperCase(); }
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

// --- Agregar usuario con validación ---
addUserBtn.addEventListener("click", async()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;

  if(!L || !nombre || !dni || !tipo) return alert("Complete todos los campos");
  if(!/^\d+$/.test(L)) return alert("#L debe ser solo números");
  if(!/^\d{1,8}$/.test(dni)) return alert("DNI debe tener máximo 8 dígitos");

  const codigoIngreso = generarCodigo();
  const codigoSalida = generarCodigo();

  await addDoc(collection(db,"usuarios"),{
    L, nombre, dni, tipo, codigoIngreso, codigoSalida
  });

  // Limpiar campos
  document.getElementById("userL").value = "";
  document.getElementById("userNombre").value = "";
  document.getElementById("userDni").value = "";
});

// --- Lista de usuarios en tiempo real ---
onSnapshot(collection(db,"usuarios"), snapshot=>{
  userList.innerHTML="";
  snapshot.docs.forEach(doc=>{
    const data=doc.data();
    const li=document.createElement("li");
    li.innerHTML=`
      <div class="tarjeta" style="border:3px solid ${colorTipo(data.tipo)}; padding:10px; margin:5px; display:inline-block; width:15cm; height:6cm; position:relative;">
        <div style="text-align:left;">#${data.L} - ${data.nombre} - ${data.dni} - ${data.tipo}</div>
        <svg id="barcodeIngreso${doc.id}"></svg>
        <svg id="barcodeSalida${doc.id}"></svg>
        <button class="printUserBtn" data-id="${doc.id}" style="position:absolute; top:5px; right:5px;">Imprimir tarjeta</button>
      </div>
    `;
    userList.appendChild(li);
    JsBarcode(`#barcodeIngreso${doc.id}`, data.codigoIngreso, {format:"CODE128", width:2, height:40});
    JsBarcode(`#barcodeSalida${doc.id}`, data.codigoSalida, {format:"CODE128", width:2, height:40});
  });

  document.querySelectorAll(".printUserBtn").forEach(btn=>{
    btn.addEventListener("click", async()=>{
      const userDoc = await getDocs(collection(db,"usuarios"));
      const usuario = userDoc.docs.find(d=>d.id===btn.dataset.id).data();
      printUserCard(usuario);
    });
  });
});

// --- Función imprimir tarjeta ---
function printUserCard(usuario){
  const w = window.open("","PRINT","height=600,width=800");
  const color = colorTipo(usuario.tipo);
  w.document.write(`
    <html>
      <head>
        <title>Tarjeta de Usuario</title>
        <style>
          body{margin:0; padding:0;}
          .tarjeta{
            width:15cm;
            height:6cm;
            border:1cm solid ${color};
            display:flex;
            flex-direction:column;
            justify-content:space-between;
            font-family: Arial, sans-serif;
            padding:5px;
            box-sizing:border-box;
          }
          .datos{font-size:16px;}
          svg{display:block; margin:0 auto;}
        </style>
      </head>
      <body>
        <div class="tarjeta">
          <div class="datos">
            #${usuario.L} - ${usuario.nombre} - ${usuario.dni} - ${usuario.tipo}
          </div>
          <svg id="barcodeIngresoPrint"></svg>
          <svg id="barcodeSalidaPrint"></svg>
        </div>
        <script src="https://cdn.jsdelivr.net/jsbarcode/3.11.5/JsBarcode.all.min.js"></script>
        <script>
          JsBarcode("#barcodeIngresoPrint","${usuario.codigoIngreso}",{format:"CODE128",width:2,height:40});
          JsBarcode("#barcodeSalidaPrint","${usuario.codigoSalida}",{format:"CODE128",width:2,height:40});
          window.print();
        </script>
      </body>
    </html>
  `);
  w.document.close();
}

// --- ESCANEAR único ---
document.getElementById("scanBtn").addEventListener("click", async()=>{
  const codigo = prompt("Ingrese código de barras escaneado (simulado)");
  if(!codigo) return;

  const usuariosSnapshot = await getDocs(collection(db,"usuarios"));
  const usuarioDoc = usuariosSnapshot.docs.find(d=>{
    const u = d.data();
    return u.codigoIngreso===codigo || u.codigoSalida===codigo;
  });
  if(!usuarioDoc) return alert("Código no reconocido");

  const usuario = usuarioDoc.data();
  const now = new Date();
  let horaEntrada=null;
  let horaSalida=null;
  if(codigo===usuario.codigoIngreso) horaEntrada=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} (${now.toLocaleDateString()})`;
  if(codigo===usuario.codigoSalida) horaSalida=`${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} (${now.toLocaleDateString()})`;

  await addDoc(collection(db,"movimientos"),{
    L:usuario.L,
    nombre:usuario.nombre,
    dni:usuario.dni,
    tipo:usuario.tipo,
    horaEntrada,
    horaSalida,
    timestamp:Date.now()
  });
});

// --- Función imprimir página de movimientos ---
function printPage(data){
  const win=window.open("","PRINT","height=600,width=800");
  win.document.write("<html><head><title>Movimientos</title></head><body>");
  win.document.write("<table border='1' style='border-collapse:collapse;width:100%'>");
  win.document.write("<tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr>");
  data.forEach(mov=>{win.document.write(`<tr><td>${mov.L}</td><td>${mov.nombre}</td><td>${mov.dni}</td><td>${mov.horaEntrada||'-'}</td><td>${mov.horaSalida||'-'}</td><td>${mov.tipo}</td></tr>`);});
  win.document.write("</table></body></html>");
  win.document.close();
  win.print();
}
