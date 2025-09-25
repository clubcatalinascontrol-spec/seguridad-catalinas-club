// app.js - CONTROL DE INGRESO CATALINAS COUNTRY
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, query, orderBy, where, getDocs, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.firebasestorage.app",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const usuariosRef = collection(db,"usuarios");
const movimientosRef = collection(db,"movimientos");
const novedadesRef = collection(db,"novedades");
const expiredRef = collection(db,"expirados");

// ----------------------------- UTILS -----------------------------
function isoNow(){ return new Date().toISOString(); }
function parseToDate(iso){ return iso ? new Date(iso) : null; }
function horaActualStr(){ const d = new Date(); return d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'}); }
function fechaDDMMYYYY(date){ return date ? date.toLocaleDateString('es-AR') : ""; }

let isUnlocked = false; // password control (se gestiona en otro fragmento)

// ----------------------------- NOVEDADES -----------------------------
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
        editingNovedadId=null;
        novMsg.style.color="green"; novMsg.textContent="Novedad editada";
      } else {
        await addDoc(novedadesRef,{ texto, when: isoNow() });
        novMsg.style.color="green"; novMsg.textContent="Novedad guardada";
      }
      novTxt.value="";
      setTimeout(()=>novMsg.textContent="",2000);
    }catch(err){ console.error(err); novMsg.style.color="red"; novMsg.textContent="Error"; setTimeout(()=>novMsg.textContent="",2000);}
  });
}

// render novedades
if(novedadesTableBody){
  onSnapshot(query(novedadesRef, orderBy("when","desc")), snapshot=>{
    novedadesTableBody.innerHTML="";
    snapshot.docs.forEach(d=>{
      const n = d.data();
      const tr=document.createElement("tr");
      let horaFecha="";
      if(n.when){
        const date=parseToDate(n.when);
        if(date){
          const hora=date.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
          const fecha=date.toLocaleDateString("es-AR");
          horaFecha=`${hora}<br><small>${fecha}</small>`;
        }
      }
      tr.innerHTML=`
        <td style="white-space:nowrap">${horaFecha}</td>
        <td style="text-align:left;padding-left:8px;">${n.texto||""}</td>
        <td>
          <button class="edit-nov" data-id="${d.id}">Editar</button>
          <button class="del-nov" data-id="${d.id}">Eliminar</button>
        </td>
      `;
      novedadesTableBody.appendChild(tr);
      tr.querySelector(".edit-nov").addEventListener("click", ()=>{
        document.getElementById("novedadTexto").value=n.texto||"";
        editingNovedadId=d.id;
        document.querySelector('#novedades').scrollIntoView({behavior:'smooth'});
      });
      tr.querySelector(".del-nov").addEventListener("click", async ()=>{
        if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
        if(!confirm("Eliminar novedad?")) return;
        try{ await deleteDoc(doc(db,"novedades",d.id)); }
        catch(err){ console.error(err); alert("Error eliminando novedad"); }
      });
    });
  });
}

// ----------------------------- EXPIRADOS -----------------------------
const expiredTableBody = document.querySelector("#expiredTable tbody");
const expiredPagination = document.createElement("div");
expiredPagination.className = "pagination";
document.querySelector("#expirados .table-wrap").appendChild(expiredPagination);

const EXP_LIMIT = 25;
let expiredCache = [], expiredCurrentPage = 1;

function renderExpiredPage() {
  if(!expiredTableBody) return;
  expiredTableBody.innerHTML="";
  const start = (expiredCurrentPage-1)*EXP_LIMIT;
  const page = expiredCache.slice(start,start+EXP_LIMIT);
  page.forEach(item=>{
    const tr=document.createElement("tr");
    let fechaElim="";
    if(item.fechaEliminacion){
      const d = new Date(item.fechaEliminacion);
      fechaElim=`<span title="${d.toLocaleString('es-AR')}">${d.toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}<br><small>${d.toLocaleDateString('es-AR')}</small></span>`;
    }
    tr.innerHTML=`
      <td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td>${item.dni||""}</td>
      <td>${item.codigoIngreso||""}</td>
      <td>${item.codigoSalida||""}</td>
      <td>${item.tipo||""}</td>
      <td>${fechaElim}</td>
    `;
    expiredTableBody.appendChild(tr);
  });
  renderExpiredPagination(expiredCache.length);
}

function renderExpiredPagination(totalItems){
  const totalPages=Math.max(1,Math.ceil(totalItems/EXP_LIMIT));
  expiredPagination.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===expiredCurrentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click",()=>{ expiredCurrentPage=p; renderExpiredPage(); });
    expiredPagination.appendChild(btn);
  }
}

onSnapshot(query(expiredRef, orderBy("fechaEliminacion","desc")), snapshot=>{
  expiredCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(expiredCache.length/EXP_LIMIT));
  if(expiredCurrentPage>totalPages) expiredCurrentPage=totalPages;
  renderExpiredPage();
});

// ----------------------------- PANEL / MOVIMIENTOS -----------------------------
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[], currentPage=1, activeTipo="todos";

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo=btn.dataset.tipo;
    currentPage=1;
    renderMovsPage();
  });
});

function renderPagination(totalItems){
  const totalPages=Math.max(1,Math.ceil(totalItems/MOV_LIMIT));
  paginationDiv.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===currentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click",()=>{ currentPage=p; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

function shouldShowAutorizanteColumn(tipo){
  return ["obrero","invitado","empleado","otro"].includes(tipo);
}

function renderMovsPage(){
  if(!movimientosTableBody) return;
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo==="todos"? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page=filtered.slice(start,start+MOV_LIMIT);
  const table=document.getElementById("movimientosTable");
  const showAut=shouldShowAutorizanteColumn(activeTipo);
  if(showAut){ table.classList.remove('autorizante-hidden'); document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='table-cell'); }
  else{ table.classList.add('autorizante-hidden'); document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display='none'); }

  page.forEach(item=>{
    const tr=document.createElement("tr");
    const autorizText=item.autorizante||"";
    tr.innerHTML=`
      <td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td>${item.entrada||""}</td>
      <td>${item.salida||""}</td>
      <td>${item.tipo||""}</td>
      <td class="autorizante-td">${autorizText}</td>
      <td>
        <button class="ficha-btn" data-L="${item.L}">FICHA</button>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>
    `;
    movimientosTableBody.appendChild(tr);

    // ficha
    tr.querySelector(".ficha-btn").addEventListener("click", async (e)=>{
      const L = e.currentTarget.dataset.L;
      try{
        const snap = await getDocs(query(usuariosRef, where("L","==",L), limit(1)));
        if(!snap.empty){
          const u=snap.docs[0].data();
          document.getElementById("fichaL").textContent=u.L||"";
          document.getElementById("fichaNombre").textContent=(u.nombre||"").toUpperCase();
          document.getElementById("fichaDni").textContent=u.dni||"";
          document.getElementById("fichaCelular").textContent=u.celular||"";
          document.getElementById("fichaAutorizante").textContent=u.autorizante||"";
          document.getElementById("fichaFechaExp").textContent=u.fechaExpedicion?fechaDDMMYYYY(u.fechaExpedicion):"";
          document.getElementById("fichaTipo").textContent=u.tipo||"";
          document.getElementById("fichaModal").classList.add("active");
        } else alert("No se encontró ficha para ese lote");
      }catch(err){ console.error(err); alert("Error al buscar ficha"); }
    });

    // eliminar movimiento
    tr.querySelector(".delMov").addEventListener("click", async e=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); }
      catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });

  renderPagination(filtered.length);
}

// Escucha movimientos
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

// ----------------------------- ESCANEO -----------------------------
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");
let scanProcessing = false;

scanBtn.addEventListener("click", ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  scanModal.classList.add("active");
  scanInput.value="";
  scanInput.focus();
});

cancelScanBtn.addEventListener("click", ()=>scanModal.classList.remove("active"));

// registrar escaneo: siempre crear nueva fila
scanInput.addEventListener("input", async ()=>{
  const raw = (scanInput.value||"").trim();
  if(scanProcessing || raw.length<8) return;
  scanProcessing = true;
  const code = raw.substring(0,8).toUpperCase();
  try{
    let userDoc = null;
    let tipoAccion = "entrada";
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",code)));
    if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion="entrada"; } 
    else { snap = await getDocs(query(usuariosRef, where("codigoSalida","==",code))); if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion="salida"; } }
    if(!userDoc){ scanMessage.style.color="red"; scanMessage.textContent="Código no válido"; setTimeout(()=>{ scanMessage.textContent=""; },1800); scanProcessing=false; return; }
    const u=userDoc.data();
    const docData={
      L:u.L,
      nombre:u.nombre,
      dni:u.dni||"",
      tipo:u.tipo,
      autorizante:u.autorizante||"",
      entrada:tipoAccion==="entrada"?horaActualStr():"",
      salida:tipoAccion==="salida"?horaActualStr():"",
      hora: serverTimestamp()
    };
    await addDoc(movimientosRef, docData); // NUEVO REGISTRO
    scanOk.style.display="inline-block"; setTimeout(()=>scanOk.style.display="none",900);
    scanInput.value="";
    scanMessage.textContent="";
  }catch(err){ console.error(err); scanMessage.style.color="red"; scanMessage.textContent="Error al registrar"; setTimeout(()=>{ scanMessage.textContent=""; },1800);}
  finally{ scanProcessing=false; }
});
