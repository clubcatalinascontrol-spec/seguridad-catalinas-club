// app.js (módulo) - Firebase 9.22
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

/* ----------------------------- Contraseña inicial única ----------------------------- */
const INITIAL_PASS = "1409";
let isUnlocked = localStorage.getItem("unlocked") === "true";

/* ----------------------------- Helpers ----------------------------- */
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActualStr(){ const d=new Date(); const hh=d.getHours().toString().padStart(2,"0"); const mm=d.getMinutes().toString().padStart(2,"0"); const dd=d.getDate().toString().padStart(2,"0"); const mo=(d.getMonth()+1).toString().padStart(2,"0"); const yyyy=d.getFullYear(); return `${hh}:${mm} (${dd}/${mo}/${yyyy})`; }
function fechaDDMMYYYY(dateIso){ const d = dateIso ? new Date(dateIso) : new Date(); const dd = String(d.getDate()).padStart(2,'0'); const mm = String(d.getMonth()+1).padStart(2,'0'); const yyyy = d.getFullYear(); return `(${dd}/${mm}/${yyyy})`; }
function isoNow(){ return new Date().toISOString(); }

/* ----------------------------- UI elementos globales ----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

/* función para bloquear/desbloquear acciones del UI */
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
    document.querySelector('.topbar').style.display = 'none';
    passwordBanner.style.display = 'flex';
    pages.forEach(p=>p.classList.remove('active'));
    const el = document.getElementById('panel'); if(el) el.classList.add('active');
  } else {
    document.querySelector('.topbar').style.display = 'flex';
    passwordBanner.style.display = 'none';
  }
}

/* inicializar UI según isUnlocked */
toggleActionsDisabled(!isUnlocked);

/* evento ingreso de contraseña inicial */
initPassBtn.addEventListener('click', ()=>{
  const v = (initPassInput.value || "").trim();
  if(v === INITIAL_PASS){
    isUnlocked = true;
    localStorage.setItem("unlocked", "true");
    initPassMsg.style.color = 'green';
    initPassMsg.textContent = 'Desbloqueado';
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color = 'red';
    initPassMsg.textContent = 'Contraseña incorrecta';
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 1200);
  }
});

/* ----------------------------- Navegación SPA ----------------------------- */
navBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  const target=btn.dataset.section;
  pages.forEach(p=>p.classList.remove("active"));
  const el = document.getElementById(target);
  if(el) el.classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* ----------------------------- Select #L desplegable ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  userL.innerHTML = "";
  editUserL.innerHTML = "";
  const optNN = document.createElement("option"); optNN.value="NN"; optNN.textContent="NN"; userL.appendChild(optNN);
  const optNN2 = document.createElement("option"); optNN2.value="NN"; optNN2.textContent="NN"; editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option"); opt.value=val; opt.textContent=val; userL.appendChild(opt);
    const opt2 = document.createElement("option"); opt2.value=val; opt2.textContent=val; editUserL.appendChild(opt2);
  }
}
llenarLSelect();
/* ----------------------------- NOVEDADES ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
let editingNovedadId = null;

// render novedades con botón ELIMINAR
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

/* ----------------------------- MOVIMIENTOS (PANEL) ----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [], currentPage = 1;
let activeTipo = "todos";

// pestañas
const tabBtns = document.querySelectorAll(".tab-btn");
tabBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    tabBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo = btn.dataset.tipo;
    currentPage = 1;
    renderMovsPage();
  });
});

// botón IMPRIMIR (pestaña activa)
const printActiveBtn = document.getElementById("printActiveBtn");
printActiveBtn.addEventListener("click", ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  printMovimientosPorTipo(activeTipo);
});

function renderPagination(totalItems){
  const totalPages = Math.max(1, Math.ceil(totalItems / MOV_LIMIT));
  paginationDiv.innerHTML = "";
  for(let p=1; p<=totalPages; p++){
    const btn = document.createElement("button");
    btn.textContent = p;
    if(p === currentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click",()=>{ currentPage = p; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

function shouldShowAutorizanteColumn(tipo){
  return ["obrero","invitado","empleado","otro"].includes(tipo);
}

function renderMovsPage(){
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo === "todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start = (currentPage-1)*MOV_LIMIT;
  const page = filtered.slice(start, start+MOV_LIMIT);

  // toggle autorizante column visibility
  const table = document.getElementById("movimientosTable");
  const showAut = shouldShowAutorizanteColumn(activeTipo);
  if(showAut){
    table.classList.remove('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='table-cell');
  } else {
    table.classList.add('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='none');
  }

  // agregamos movimientos al inicio para mostrar nuevos arriba
  page.forEach(item=>{
    const tr=document.createElement("tr");
    const autorizText = item.autorizante || "";
    tr.innerHTML=`<td>${item.L||""}</td><td>${(item.nombre||"").toUpperCase()}</td>
      <td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo||""}</td>
      <td class="autorizante-td">${autorizText}</td>
      <td>
        <button class="ficha-btn" data-L="${item.L}">FICHA</button>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>`;
    movimientosTableBody.appendChild(tr);

    // FICHA
    tr.querySelector(".ficha-btn").addEventListener("click", async (e)=>{
      const L = e.currentTarget.dataset.L;
      try{
        const q = query(usuariosRef, where("L","==",L), limit(1));
        const snap = await getDocs(q);
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

    // Eliminar movimiento
    tr.querySelector(".delMov").addEventListener("click", async e=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(filtered.length);
}

/* Escuchar movimientos ordenados por hora descendente */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages = Math.max(1, Math.ceil(movimientosCache.length/MOV_LIMIT));
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

scanBtn.addEventListener("click", () => {
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
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

let scanProcessing = false;
scanInput.addEventListener("input", async () => {
  const raw = scanInput.value.trim();
  if (scanProcessing) return;
  if (raw.length < 8) return;
  scanProcessing = true;
  const code = raw.substring(0,8).toUpperCase();
  try {
    let userDoc = null;
    let tipoAccion = "entrada";
    const qIngreso = query(usuariosRef, where("codigoIngreso", "==", code));
    const snap = await getDocs(qIngreso);
    if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion = "entrada"; }
    else { 
      const qSalida = query(usuariosRef, where("codigoSalida", "==", code));
      const snap2 = await getDocs(qSalida);
      if(!snap2.empty){ userDoc = snap2.docs[0]; tipoAccion="salida"; } 
    }

    if(!userDoc){
      scanMessage.style.color = "red";
      scanMessage.textContent = "Código no válido";
      setTimeout(()=>{ scanMessage.textContent = ""; }, 1800);
      scanProcessing = false; 
      return;
    }

    const u = userDoc.data();
    if(tipoAccion === "entrada"){
      await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: horaActualStr(), salida: "", hora: serverTimestamp() });
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
        await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: "", salida: horaActualStr(), hora: serverTimestamp() });
      }
    }
    scanOk.style.display = "inline-block";
    setTimeout(()=>scanOk.style.display = "none", 900);
    scanInput.value = "";
    scanInput.focus(); // permanece visible hasta cancelar
  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  } finally { scanProcessing = false; }
});

/* ----------------------------- EXPIRADOS - Paginación ----------------------------- */
const expiradosTableBody = document.querySelector("#expiradosTable tbody");
const expiradosPagination = document.getElementById("expiradosPagination");
const EXP_LIMIT = 25;
let expiradosCache = [], currentExpPage = 1;

onSnapshot(query(usuariosRef, where("fechaExpiracion","<",new Date()), orderBy("fechaExpiracion","desc")), snapshot=>{
  expiradosCache = snapshot.docs.map(d=>({__id:d.id, ...d.data()}));
  const totalPages = Math.max(1, Math.ceil(expiradosCache.length/EXP_LIMIT));
  if(currentExpPage>totalPages) currentExpPage=totalPages;
  renderExpiradosPage();
});

function renderExpiradosPage(){
  expiradosTableBody.innerHTML = "";
  const start = (currentExpPage-1)*EXP_LIMIT;
  const page = expiradosCache.slice(start,start+EXP_LIMIT);
  page.forEach(u=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.L||""}</td><td>${(u.nombre||"").toUpperCase()}</td><td>${u.tipo||""}</td><td>${fechaDDMMYYYY(u.fechaExpiracion)}</td>`;
    expiradosTableBody.appendChild(tr);
  });

  expiradosPagination.innerHTML="";
  const totalPages = Math.max(1, Math.ceil(expiradosCache.length/EXP_LIMIT));
  for(let p=1; p<=totalPages; p++){
    const btn = document.createElement("button");
    btn.textContent=p;
    if(p===currentExpPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click",()=>{ currentExpPage=p; renderExpiradosPage(); });
    expiradosPagination.appendChild(btn);
  }
}

/* ----------------------------- IMPRESIÓN MOVIMIENTOS / EXPIRADOS ----------------------------- */
function printMovimientosPorTipo(tipo){
  const filtered = tipo==="todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===tipo);
  const toPrint = filtered.slice(0,25);
  const w=window.open("","_blank","width=900,height=600");
  const title = tipo==="todos" ? "Movimientos - Todos" : `Movimientos - ${tipo}`;
  let html = `<html><head><title>${title}</title>
    <style>
      @page { size: A4; margin: 10mm; }
      body{font-family:Arial,Helvetica,sans-serif; font-size:10px; color:#000;}
      table{width:100%;border-collapse:collapse; color:#000;}
      th,td{border:1px solid #000;padding:1px;text-align:center;font-size:10px;}
      thead th{background:#fff;font-weight:700;}
      *{color-adjust: exact; -webkit-print-color-adjust: exact; print-color-adjust: exact;}
    </style>
    </head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
}
