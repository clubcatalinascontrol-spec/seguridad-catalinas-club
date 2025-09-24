import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import { getFirestore, collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, getDocs, where, updateDoc, limit } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.appspot.com",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const novedadesRef = collection(db, "novedades");
const movimientosRef = collection(db, "movimientos");
const usuariosRef = collection(db, "usuarios");
const expiradosRef = collection(db, "expirados");

let isUnlocked = false;
let editingNovedadId = null;
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const expiredTableBody = document.querySelector("#expiredTable tbody");
const paginationDiv = document.getElementById("pagination");

const MOV_LIMIT = 25;
let movimientosCache = [], currentPage = 1;
let activeTipo = "todos";

const tabBtns = document.querySelectorAll(".tab-btn");
tabBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    tabBtns.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo = btn.dataset.tipo;
    currentPage = 1;
    renderMovsPage();
  });
});

// RENDER NOVEDADES con boton ELIMINAR
onSnapshot(query(novedadesRef, orderBy("when","desc")), snapshot=>{
  novedadesTableBody.innerHTML = "";
  snapshot.docs.forEach(d=>{
    const n = d.data();
    const tr = document.createElement("tr");

    let horaFecha = "";
    if (n.when) {
      const date = n.when.toDate ? n.when.toDate() : new Date(n.when);
      const hora = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
      const fecha = date.toLocaleDateString("es-AR");
      horaFecha = `${hora}<br><small>${fecha}</small>`;
    }

    tr.innerHTML = `<td style="white-space:nowrap">${horaFecha}</td>
      <td style="text-align:left; padding-left:8px;">${n.texto || ""}</td>
      <td>
        <button class="edit-nov" data-id="${d.id}">Editar</button>
        <button class="del-nov" data-id="${d.id}">Eliminar</button>
      </td>`;

    novedadesTableBody.appendChild(tr);

    tr.querySelector(".edit-nov").addEventListener("click", ()=>{
      document.getElementById("novedadTexto").value = n.texto || "";
      editingNovedadId = d.id;
      document.querySelector('#novedades').scrollIntoView({behavior:'smooth'});
    });

    tr.querySelector(".del-nov").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      if(!confirm("Eliminar novedad?")) return;
      try{ await deleteDoc(doc(db,"novedades",d.id)); } catch(err){ console.error(err); alert("Error eliminando novedad"); }
    });
  });
});

// ====================== MOVIMIENTOS ======================

// Escanear modal
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const scanBtn = document.getElementById("scanBtn");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");

scanBtn.addEventListener("click", ()=>{
  scanModal.classList.add("active");
  scanInput.focus();
});

cancelScanBtn.addEventListener("click", ()=>{
  scanModal.classList.remove("active");
  scanInput.value = "";
  scanMessage.textContent = "";
  scanOk.style.display = "none";
});

// Función para renderizar página de movimientos según tipo y paginación
function renderMovsPage() {
  movimientosTableBody.innerHTML = "";
  let filtered = movimientosCache;
  if(activeTipo!=="todos") filtered = movimientosCache.filter(m=>m.tipo===activeTipo);

  // Orden descendente por hora
  filtered.sort((a,b)=> b.hora?.toMillis() - a.hora?.toMillis());

  // Paginación
  const start = (currentPage-1)*MOV_LIMIT;
  const end = start + MOV_LIMIT;
  const pageItems = filtered.slice(start,end);

  pageItems.forEach(m=>{
    const tr = document.createElement("tr");
    tr.classList.add("recent");
    tr.innerHTML = `<td>${m.id}</td>
      <td>${m.nombre}</td>
      <td>${m.hora?.toDate ? m.hora.toDate().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}) : ""}</td>
      <td>${m.salida ? m.salida.toDate().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"}) : ""}</td>
      <td>${m.tipo}</td>
      <td class="autorizante-td" style="display:none;">${m.autorizante||""}</td>
      <td><button class="del-btn" data-id="${m.docId}">X</button></td>`;
    movimientosTableBody.appendChild(tr);

    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Contraseña requerida"); return; }
      if(!confirm("Eliminar movimiento?")) return;
      try{ await deleteDoc(doc(db,"movimientos",m.docId)); } catch(err){ console.error(err); alert("Error"); }
    });
  });

  // Paginación visual
  paginationDiv.innerHTML = "";
  const totalPages = Math.ceil(filtered.length/MOV_LIMIT);
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent = i;
    if(i===currentPage) btn.style.fontWeight="700";
    btn.addEventListener("click", ()=>{ currentPage=i; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

// Escuchar cambios en movimientos y mantener cache
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>{
    const data = d.data();
    return { ...data, docId:d.id, hora:data.hora || serverTimestamp() };
  });
  renderMovsPage();
});

// Procesar código escaneado
scanInput.addEventListener("keydown", async (e)=>{
  if(e.key==="Enter"){
    const val = scanInput.value.trim();
    if(!val){ scanMessage.textContent="Ingrese código válido"; return; }
    try{
      // Buscar usuario por DNI o código
      const userQuery = query(usuariosRef, where("dni","==",val));
      const userSnap = await getDocs(userQuery);
      if(userSnap.empty){ scanMessage.textContent="Usuario no encontrado"; scanOk.style.display="none"; return; }
      const user = userSnap.docs[0].data();

      // Agregar nuevo movimiento
      const docRef = await addDoc(movimientosRef,{
        nombre: user.nombre,
        tipo: user.tipo,
        autorizante: user.autorizante||"",
        hora: serverTimestamp()
      });

      scanMessage.textContent = "Código registrado";
      scanOk.style.display="inline-block";
      scanInput.value="";
      scanInput.focus();
    }catch(err){ console.error(err); scanMessage.textContent="Error al registrar"; }
  }
});
// ====================== USUARIOS ======================
const usersTableBody = document.querySelector("#usersTable tbody");
const userFilterButtons = document.querySelectorAll(".user-filter-btn");
let activeUserTipo = "todos";
let usuariosCache = [];

userFilterButtons.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    userFilterButtons.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeUserTipo = btn.dataset.tipo;
    renderUsersPage();
  });
});

function renderUsersPage(){
  usersTableBody.innerHTML="";
  let filtered = usuariosCache;
  if(activeUserTipo!=="todos") filtered = usuariosCache.filter(u=>u.tipo===activeUserTipo);

  filtered.forEach(u=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.id}</td><td>${u.nombre}</td><td>${u.dni||""}</td><td>${u.celular||""}</td><td>${u.autorizante||""}</td><td>${u.fechaExp?.toDate().toLocaleDateString()||""}</td><td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${u.docId}">Editar</button>
        <button class="del-btn" data-id="${u.docId}">X</button>
        <button class="ficha-btn" data-id="${u.docId}">Ficha</button>
      </td>`;
    usersTableBody.appendChild(tr);

    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Contraseña requerida"); return; }
      if(!confirm("Eliminar usuario?")) return;
      try{
        await deleteDoc(doc(db,"usuarios",u.docId));
        await addDoc(expiradosRef,{
          nombre:u.nombre, dni:u.dni||"", tipo:u.tipo,
          codigoIngreso:"", codigoSalida:"", fechaElim:serverTimestamp()
        });
      }catch(err){ console.error(err); alert("Error"); }
    });
    tr.querySelector(".edit-btn").addEventListener("click", ()=>{ openEditModal(u); });
    tr.querySelector(".ficha-btn").addEventListener("click", ()=>{ openFichaModal(u); });
  });
}

// Cache usuarios en tiempo real
onSnapshot(usuariosRef, snapshot=>{
  usuariosCache = snapshot.docs.map(d=>({...d.data(), docId:d.id}));
  renderUsersPage();
  renderExpiredPage();
});

// ====================== EXPIRADOS ======================
const expiredTableBody = document.querySelector("#expiredTable tbody");
const EXPIRED_LIMIT = 25;
let expiredCache = [];
let expiredPage = 1;

function renderExpiredPage(){
  expiredTableBody.innerHTML="";
  expiredCache.sort((a,b)=> b.fechaElim?.toMillis() - a.fechaElim?.toMillis());
  const start = (expiredPage-1)*EXPIRED_LIMIT;
  const end = start+EXPIRED_LIMIT;
  const pageItems = expiredCache.slice(start,end);

  pageItems.forEach(u=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.id}</td><td>${u.nombre}</td><td>${u.dni||""}</td><td>${u.codigoIngreso||""}</td><td>${u.codigoSalida||""}</td><td>${u.tipo}</td><td>${u.fechaElim?.toDate().toLocaleString()||""}</td>`;
    expiredTableBody.appendChild(tr);
  });

  // Paginación
  const paginationDivExp = document.querySelector("#expirados + .pagination") || document.createElement("div");
  paginationDivExp.classList.add("pagination");
  document.querySelector("#expirados").appendChild(paginationDivExp);
  paginationDivExp.innerHTML="";
  const totalPages = Math.ceil(expiredCache.length/EXPIRED_LIMIT);
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===expiredPage) btn.style.fontWeight="700";
    btn.addEventListener("click", ()=>{ expiredPage=i; renderExpiredPage(); });
    paginationDivExp.appendChild(btn);
  }
}

// Cache expirados en tiempo real
onSnapshot(expiradosRef, snapshot=>{
  expiredCache = snapshot.docs.map(d=>({...d.data(), docId:d.id}));
  renderExpiredPage();
});

// ====================== IMPRESIÓN ======================
const printActiveBtn = document.getElementById("printActiveBtn");
printActiveBtn.addEventListener("click", ()=>{
  const activePage = document.querySelector(".page.active .table-wrap table");
  if(!activePage) return;
  const printWindow = window.open("","_blank");
  printWindow.document.write(`<html><head><title>Imprimir</title><style>
    table{border-collapse:collapse;width:100%;font-size:10px;}
    th, td{border:1px solid #000;padding:1px;text-align:center;}
    body{color:#000;background:#fff;}
  </style></head><body>${activePage.outerHTML}</body></html>`);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
});
