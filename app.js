// app.js (módulo) - Firebase 9.22 (PARTE 1)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* ----------------------------- Firebase config ----------------------------- */
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

/* ----------------------------- Colecciones ----------------------------- */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes");
const novedadesRef = collection(db, "novedades");

/* ----------------------------- Helpers ----------------------------- */
const generarCodigo = ()=> Math.random().toString(36).substring(2,10).toUpperCase();
const horaActualStr = ()=>{
  const d=new Date();
  const hh=d.getHours().toString().padStart(2,"0");
  const mm=d.getMinutes().toString().padStart(2,"0");
  const dd=d.getDate().toString().padStart(2,"0");
  const mo=(d.getMonth()+1).toString().padStart(2,"0");
  const yyyy=d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
};
function parseToDate(d){
  if(!d) return null;
  if(typeof d==="string") return new Date(d);
  if(typeof d.toDate==="function") return d.toDate();
  if(typeof d.seconds==="number") return new Date(d.seconds*1000);
  return new Date(d);
}
function fechaDDMMYYYY(dateIso){
  const dt=parseToDate(dateIso)||new Date();
  const dd=String(dt.getDate()).padStart(2,'0');
  const mm=String(dt.getMonth()+1).padStart(2,'0');
  const yyyy=dt.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
const isoNow = ()=> new Date().toISOString();

/* ----------------------------- UI elementos globales ----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

const INITIAL_PASS = "1409";
let isUnlocked = localStorage.getItem("unlocked")==="true";

function toggleActionsDisabled(disabled){
  const selectors = [
    '#movimientosTable button',
    '#usersTable button',
    '#expiredTable button',
    '#novedadesTable button',
    '#scanBtn',
    '#printActiveBtn',
    '#addUserBtn',
    '#guardarNovedadBtn'
  ];
  selectors.forEach(sel=>{
    document.querySelectorAll(sel).forEach(b=>{
      b.disabled = !!disabled;
      if(disabled) b.classList.add('disabled');
      else b.classList.remove('disabled');
    });
  });
  if(disabled){
    document.querySelector('.topbar').style.display='none';
    passwordBanner.style.display='flex';
    pages.forEach(p=>p.classList.remove('active'));
    const el=document.getElementById('panel');
    if(el) el.classList.add('active');
  } else {
    document.querySelector('.topbar').style.display='flex';
    passwordBanner.style.display='none';
  }
}
toggleActionsDisabled(!isUnlocked);

initPassBtn.addEventListener('click', ()=>{
  const v=(initPassInput.value||"").trim();
  if(v===INITIAL_PASS){
    isUnlocked=true;
    localStorage.setItem("unlocked","true");
    initPassMsg.style.color='green';
    initPassMsg.textContent='Desbloqueado';
    setTimeout(()=>{
      initPassMsg.textContent='';
      initPassInput.value='';
    },900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color='red';
    initPassMsg.textContent='Contraseña incorrecta';
    setTimeout(()=>{
      initPassMsg.textContent='';
      initPassInput.value='';
    },1200);
  }
});

/* ----------------------------- Navegación SPA ----------------------------- */
navBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const target=btn.dataset.section;
    pages.forEach(p=>p.classList.remove("active"));
    const el=document.getElementById(target);
    if(el) el.classList.add("active");
    navBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* ----------------------------- Select #L desplegable ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  if(!userL || !editUserL) return;
  userL.innerHTML = ""; editUserL.innerHTML="";
  const optNN=document.createElement("option"); optNN.value="NN"; optNN.textContent="NN"; userL.appendChild(optNN);
  const optNN2=document.createElement("option"); optNN2.value="NN"; optNN2.textContent="NN"; editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val=i.toString().padStart(3,"0");
    const opt=document.createElement("option"); opt.value=val; opt.textContent=val; userL.appendChild(opt);
    const opt2=document.createElement("option"); opt2.value=val; opt2.textContent=val; editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* ----------------------------- USUARIOS (AGREGAR + render real-time + editar/eliminar/print/ficha) ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// --- Aquí continúa la parte de USUARIOS sin cambios ---
// app.js (PARTE 2) - MOVIMIENTOS, NOVEDADES, ESCANEO, EXPIRADOS con paginación y tooltips

/* ----------------------------- NOVEDADES ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const novTxt = document.getElementById("novedadTexto");
const guardarNovedadBtn = document.getElementById("guardarNovedadBtn");
const novMsg = document.getElementById("novedadMsg");
let editingNovedadId = null;

if(guardarNovedadBtn){
  guardarNovedadBtn.addEventListener("click", async ()=>{
    if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
    const texto = novTxt.value.trim();
    if(!texto){ novMsg.style.color="red"; novMsg.textContent="Ingrese texto"; setTimeout(()=>novMsg.textContent="",2000); return; }
    try{
      if(editingNovedadId){
        await updateDoc(doc(db,"novedades",editingNovedadId), { texto, when: isoNow() });
        editingNovedadId = null; novMsg.style.color="green"; novMsg.textContent="Novedad editada";
      } else {
        await addDoc(novedadesRef, { texto, when: isoNow() });
        novMsg.style.color="green"; novMsg.textContent="Novedad guardada";
      }
      novTxt.value=""; setTimeout(()=>novMsg.textContent="",2000);
    }catch(err){ console.error(err); novMsg.style.color="red"; novMsg.textContent="Error"; setTimeout(()=>novMsg.textContent="",2000); }
  });
}

if(novedadesTableBody){
  onSnapshot(query(novedadesRef, orderBy("when","desc")), snapshot=>{
    novedadesTableBody.innerHTML = "";
    snapshot.docs.forEach(d=>{
      const n = d.data();
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${n.when ? fechaDDMMYYYY(n.when) : ""}</td>
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
}

/* ----------------------------- Cierres / UI ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); });

/* ----------------------------- MOVIMIENTOS (Panel) ----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[], currentPage=1, activeTipo = "todos";

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo = btn.dataset.tipo;
    currentPage = 1;
    renderMovsPage();
  });
});

const printActiveBtn = document.getElementById("printActiveBtn");
if(printActiveBtn) printActiveBtn.addEventListener("click", ()=>{ if(!isUnlocked){ alert("Operación no permitida."); return; } printMovimientosPorTipo(activeTipo); });

function renderPagination(totalItems, container){
  const totalPages=Math.max(1,Math.ceil(totalItems/MOV_LIMIT));
  container.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===currentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click", ()=>{ currentPage=p; renderExpiredPage(); });
    container.appendChild(btn);
  }
}

function shouldShowAutorizanteColumn(tipo){
  return ["obrero","invitado","empleado","otro"].includes(tipo);
}

// --- Render MOVIMIENTOS ---
function renderMovsPage(){
  if(!movimientosTableBody) return;
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo === "todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page = filtered.slice(start, start+MOV_LIMIT);

  const table = document.getElementById("movimientosTable");
  const showAut = shouldShowAutorizanteColumn(activeTipo);
  if(showAut){
    table.classList.remove('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='table-cell');
  } else {
    table.classList.add('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='none');
  }

  page.forEach(item=>{
    const tr=document.createElement("tr");
    const autorizText = item.autorizante || "";

    // tooltip para H. Entrada / H. Salida
    const entradaDate = parseToDate(item.entrada);
    const salidaDate = parseToDate(item.salida);
    const entradaText = entradaDate ? entradaDate.toLocaleTimeString("es-AR",{hour:'2-digit',minute:'2-digit'}) : "";
    const salidaText = salidaDate ? salidaDate.toLocaleTimeString("es-AR",{hour:'2-digit',minute:'2-digit'}) : "";

    tr.innerHTML = `<td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td title="${entradaDate?entradaDate.toLocaleString():""}">${entradaText}</td>
      <td title="${salidaDate?salidaDate.toLocaleString():""}">${salidaText}</td>
      <td>${item.tipo||""}</td>
      <td class="autorizante-td">${autorizText}</td>
      <td>
        <button class="ficha-btn" data-L="${item.L}">FICHA</button>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>`;
    movimientosTableBody.appendChild(tr);

    tr.querySelector(".ficha-btn").addEventListener("click", async (e)=>{
      const L = e.currentTarget.dataset.L;
      try{
        const snap = await getDocs(query(usuariosRef, where("L","==",L), limit(1)));
        if(!snap.empty){
          const u = snap.docs[0].data();
          document.getElementById("fichaL").textContent = u.L||"";
          document.getElementById("fichaNombre").textContent = (u.nombre||"").toUpperCase();
          document.getElementById("fichaDni").textContent = u.dni||"";
          document.getElementById("fichaCelular").textContent = u.celular||"";
          document.getElementById("fichaAutorizante").textContent = u.autorizante||"";
          document.getElementById("fichaFechaExp").textContent = u.fechaExpedicion ? fechaDDMMYYYY(u.fechaExpedicion) : "";
          document.getElementById("fichaTipo").textContent = u.tipo||"";
          document.getElementById("fichaModal").classList.add("active");
        } else { alert("No se encontró ficha para ese lote"); }
      }catch(err){ console.error(err); alert("Error al buscar ficha"); }
    });

    tr.querySelector(".delMov").addEventListener("click", async e=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
}

// --- Escuchar MOVIMIENTOS ---
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

/* ----------------------------- ESCANEAR CÓDIGOS ----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");
let scanProcessing = false;

scanBtn.addEventListener("click", () => {
  if(!isUnlocked){ alert("Operación no permitida."); return; }
  scanModal.classList.add("active");
  scanInput.value = "";
  scanMessage.textContent = "";
  scanInput.focus();
});
cancelScanBtn.addEventListener("click", () => {
  scanModal.classList.remove("active");
  scanMessage.textContent = "";
  scanInput.value = "";
});

scanInput.addEventListener("input", async () => {
  const raw = (scanInput.value || "").trim();
  if (scanProcessing) return;
  if (raw.length < 8) return;
  scanProcessing = true;
  const code = raw.substring(0,8).toUpperCase();
  try {
    let userDoc = null;
    let tipoAccion = "entrada";
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",code)));
    if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion = "entrada"; }
    else { snap = await getDocs(query(usuariosRef, where("codigoSalida","==",code))); if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion = "salida"; } }

    if(!userDoc){
      scanMessage.style.color = "red";
      scanMessage.textContent = "Código no válido";
      setTimeout(()=>{ scanMessage.textContent = ""; }, 1800);
      scanProcessing = false; return;
    }
    const u = userDoc.data();
    if(tipoAccion === "entrada"){
      const newMov = { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: horaActualStr(), salida: "", hora: serverTimestamp() };
      await addDoc(movimientosRef, newMov);
      movimientosCache.unshift({...newMov,__id:"temp_"+Date.now()}); // agregar al inicio local
    } else {
      const movQ = query(movimientosRef, where("L","==",u.L), where("salida","==",""));
      const movSnap = await getDocs(movQ);
      if(!movSnap.empty){
        let chosen = movSnap.docs[0];
        let chosenTime = chosen.data().hora && chosen.data().hora.toDate ? chosen.data().hora.toDate() : new Date(0);
        movSnap.docs.forEach(d=>{
          const t = d.data().hora && d.data().hora.toDate ? d.data().hora.toDate() : new Date(0);
          if(t > chosenTime){ chosen = d; chosenTime = t; }
        });
        await updateDoc(doc(db,"movimientos",chosen.id), { salida: horaActualStr() });
      } else {
        const newMov = { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: "", salida: horaActualStr(), hora: serverTimestamp() };
        await addDoc(movimientosRef, newMov);
        movimientosCache.unshift({...newMov,__id:"temp_"+Date.now()});
      }
    }
    scanOk.style.display = "inline-block";
    setTimeout(()=>scanOk.style.display = "none", 900);
    scanInput.value = "";
    scanMessage.textContent = "";
    renderMovsPage();
  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  } finally { scanProcessing = false; }
});

/* ----------------------------- IMPRIMIR MOVIMIENTOS ----------------------------- */
function printMovimientosPorTipo(tipo, auto=false){
  if(!auto && !isUnlocked){ alert("Operación no permitida."); return; }
  const filtered = tipo==="todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===tipo);
  const toPrint = filtered.slice(0,25);
  const w = window.open("","_blank","width=900,height=600");
  const title = tipo==="todos" ? "Movimientos - Todos" : `Movimientos - ${tipo}`;
  let html = `<html><head><title>${title}</title><style>
    @page{size:A4;margin:6mm;} body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:2px;text-align:center;font-size:10px}
    thead th{background:#fff;font-weight:700;color:#000}
    img, svg { filter: grayscale(100%); }
    </style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
}

/* ----------------------------- EXPIRADOS ----------------------------- */
const expiradosTableBody = document.querySelector("#expiradosTable tbody");
const expiradosPagination = document.getElementById("expiradosPagination");
const EXP_LIMIT = 25;
let expiradosCache = [], expiradosPage = 1;

function renderExpiredPage(){
  if(!expiradosTableBody) return;
  expiradosTableBody.innerHTML = "";
  const start = (expiradosPage-1)*EXP_LIMIT;
  const page = expiradosCache.slice(start, start+EXP_LIMIT);

  page.forEach(item=>{
    const tr = document.createElement("tr");

    const fechaElim = parseToDate(item.fechaElim);
    const horaText = fechaElim ? fechaElim.toLocaleTimeString("es-AR",{hour:'2-digit',minute:'2-digit'}) : "";
    const tooltipText = fechaElim ? fechaElim.toLocaleString() : "";

    tr.innerHTML = `<td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td>${item.tipo||""}</td>
      <td title="${tooltipText}">${horaText}</td>`;

    expiradosTableBody.appendChild(tr);
  });

  renderPagination(expiradosCache.length, expiradosPagination);
}

// Escuchar expirados
onSnapshot(query(expiradosRef, orderBy("fechaElim","desc")), snapshot=>{
  expiradosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages = Math.max(1,Math.ceil(expiradosCache.length/EXP_LIMIT));
  if(expiradosPage>totalPages) expiradosPage = totalPages;
  renderExpiredPage();
});

// Botones de filtro o paginación extra si los hay se manejan igual
