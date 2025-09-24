import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, onSnapshot, addDoc, getDocs, updateDoc, deleteDoc, doc, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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
/* ----------------------------- GLOBAL ----------------------------- */
let isUnlocked=false, editingNovedadId=null;
const horaActualStr=()=>new Date().toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"});
const fechaDDMMYYYY=d=>d?new Date(d.seconds*1000).toLocaleDateString("es-AR"):"";

/* ----------------------------- PASSWORD ----------------------------- */
const pwBanner=document.getElementById("passwordBanner");
document.getElementById("initPassBtn").addEventListener("click",()=>{
  isUnlocked=true;
  pwBanner.style.display="none";
});

/* ----------------------------- NAV ----------------------------- */
const sections=document.querySelectorAll(".page");
document.querySelectorAll(".nav-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    sections.forEach(s=>s.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

/* ----------------------------- REFERENCIAS ----------------------------- */
const movimientosRef=collection(db,"movimientos");
const usuariosRef=collection(db,"usuarios");
const expiradosRef=collection(db,"expirados");
const novedadesRef=collection(db,"novedades");

/* ----------------------------- NOVEDADES ----------------------------- */
const novedadesTableBody=document.querySelector("#novedadesTable tbody");
onSnapshot(query(novedadesRef, orderBy("when","desc")), snap=>{
  novedadesTableBody.innerHTML="";
  snap.docs.forEach(d=>{
    const n=d.data();
    const tr=document.createElement("tr");
    let hf="";
    if(n.when){ const dt=n.when.toDate?n.when.toDate():new Date(n.when); hf=`${dt.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}<br><small>${dt.toLocaleDateString("es-AR")}</small>`; }
    tr.innerHTML=`<td style="white-space:nowrap">${hf}</td>
      <td style="text-align:left;padding-left:8px;">${n.texto||""}</td>
      <td>
        <button class="edit-nov" data-id="${d.id}">Editar</button>
        <button class="del-nov" data-id="${d.id}">Eliminar</button>
      </td>`;
    novedadesTableBody.appendChild(tr);

    tr.querySelector(".edit-nov").addEventListener("click",()=>{
      document.getElementById("novedadTexto").value=n.texto||"";
      editingNovedadId=d.id;
      document.querySelector('#novedades').scrollIntoView({behavior:'smooth'});
    });
    tr.querySelector(".del-nov").addEventListener("click",async ()=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(confirm("Eliminar novedad?")){ try{ await deleteDoc(doc(db,"novedades",d.id)); }catch(e){ alert("Error"); } }
    });
  });
});

document.getElementById("guardarNovedadBtn").addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida."); return; }
  const txt=document.getElementById("novedadTexto").value.trim();
  if(!txt) return;
  try{
    if(editingNovedadId){ await updateDoc(doc(db,"novedades",editingNovedadId),{texto:txt}); editingNovedadId=null; }
    else{ await addDoc(novedadesRef,{texto:txt,when:serverTimestamp()}); }
    document.getElementById("novedadTexto").value="";
  }catch(e){ alert("Error al guardar novedad"); }
});

/* ----------------------------- MOVIMIENTOS ----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[],currentPage=1,activeTipo="todos";

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo=btn.dataset.tipo; currentPage=1; renderMovsPage();
  });
});

const printActiveBtn=document.getElementById("printActiveBtn");
printActiveBtn.addEventListener("click",()=>{ printMovimientosPorTipo(activeTipo); });

function renderPagination(total){
  paginationDiv.innerHTML="";
  const pages=Math.max(1,Math.ceil(total/MOV_LIMIT));
  for(let p=1;p<=pages;p++){
    const b=document.createElement("button"); b.textContent=p;
    if(p===currentPage){ b.style.background="#d8a800"; b.style.color="#111"; }
    b.addEventListener("click",()=>{ currentPage=p; renderMovsPage(); });
    paginationDiv.appendChild(b);
  }
}

function shouldShowAutorizanteColumn(tipo){ return ["obrero","invitado","empleado","otro"].includes(tipo); }

function renderMovsPage(){
  movimientosTableBody.innerHTML="";
  const filtered=activeTipo==="todos"?movimientosCache:movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page=filtered.slice(start,start+MOV_LIMIT);
  const table=document.getElementById("movimientosTable");
  const showAut=shouldShowAutorizanteColumn(activeTipo);
  if(showAut){ table.classList.remove('autorizante-hidden'); } else { table.classList.add('autorizante-hidden'); }

  page.forEach(item=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${item.L||""}</td><td>${(item.nombre||"").toUpperCase()}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo||""}</td><td class="autorizante-td">${item.autorizante||""}</td>
      <td><button class="ficha-btn" data-L="${item.L}">FICHA</button><button class="delMov" data-id="${item.__id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);

    /* FICHA modal */
    tr.querySelector(".ficha-btn").addEventListener("click", async e=>{
      const L=e.currentTarget.dataset.L;
      try{
        const snap=await getDocs(query(usuariosRef, where("L","==",L), limit(1)));
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
        } else alert("No se encontró ficha");
      }catch(e){ alert("Error al buscar ficha"); }
    });

    tr.querySelector(".delMov").addEventListener("click",async e=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(confirm("Eliminar movimiento permanentemente?")){ try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); }catch(e){ alert("Error eliminando movimiento"); } }
    });
  });
  renderPagination(filtered.length);
}
/* ----------------------------- FIREBASE SNAPSHOT MOVIMIENTOS ----------------------------- */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snap=>{
  movimientosCache=snap.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();

  // auto-print propietarios cada múltiplo de 25
  const propCount=movimientosCache.filter(m=>m.tipo==="propietario").length;
  if(propCount>0 && propCount%MOV_LIMIT===0){ printMovimientosPorTipo("propietario",true); }
});

/* ----------------------------- IMPRIMIR ----------------------------- */
function printMovimientosPorTipo(tipo,auto=false){
  if(!auto && !isUnlocked){ alert("Operación no permitida."); return; }
  const filtered=tipo==="todos"?movimientosCache:movimientosCache.filter(m=>m.tipo===tipo);
  const toPrint=filtered.slice(0,25);
  const w=window.open("","_blank","width=900,height=600");
  const title=tipo==="todos"?"Movimientos - Todos":`Movimientos - ${tipo}`;
  let html=`<html><head><title>${title}</title><style>
    @page{size:A4;margin:12mm;} body{font-family:Arial,sans-serif;font-size:12px;}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:6px;text-align:center;}
    thead th{background:#f4cf19;font-weight:700;}
  </style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{ html+=`<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`; });
  html+="</tbody></table></body></html>";
  w.document.write(html); w.print();
}

/* ----------------------------- ESCANEO AUTOMÁTICO ----------------------------- */
const scanBtn=document.getElementById("scanBtn");
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanMessage=document.getElementById("scanMessage");
const scanOk=document.getElementById("scanOk");
let scanProcessing=false;

scanBtn.addEventListener("click",()=>{ if(!isUnlocked){ alert("Operación no permitida."); return; } scanModal.classList.add("active"); scanInput.value=""; scanMessage.textContent=""; scanInput.focus(); });
cancelScanBtn.addEventListener("click",()=>{ scanModal.classList.remove("active"); scanMessage.textContent=""; scanInput.value=""; });

scanInput.addEventListener("input", async ()=>{
  const raw=scanInput.value.trim(); if(scanProcessing||raw.length<8) return;
  scanProcessing=true;
  const code=raw.substring(0,8).toUpperCase();
  try{
    let userDoc=null, tipoAccion="entrada";
    let snap=await getDocs(query(usuariosRef,where("codigoIngreso","==",code)));
    if(!snap.empty){ userDoc=snap.docs[0]; tipoAccion="entrada"; }
    else { snap=await getDocs(query(usuariosRef,where("codigoSalida","==",code))); if(!snap.empty){ userDoc=snap.docs[0]; tipoAccion="salida"; } }
    if(!userDoc){ scanMessage.style.color="red"; scanMessage.textContent="Código no válido"; setTimeout(()=>scanMessage.textContent="",1800); scanProcessing=false; return; }
    const u=userDoc.data();
    if(tipoAccion==="entrada"){ await addDoc(movimientosRef,{L:u.L,nombre:u.nombre,dni:u.dni||"",tipo:u.tipo,autorizante:u.autorizante||"",entrada:horaActualStr(),salida:"",hora:serverTimestamp()}); }
    else{
      const msnap=await getDocs(query(movimientosRef,where("L","==",u.L),where("salida","==","")));
      if(!msnap.empty){ let chosen=msnap.docs[0]; msnap.docs.forEach(d=>{ const t=d.data().hora?.toDate?d.data().hora.toDate():new Date(0); if(t>(chosen.data().hora?.toDate?chosen.data().hora.toDate():new Date(0))) chosen=d; }); await updateDoc(doc(db,"movimientos",chosen.id),{salida:horaActualStr()}); }
      else { await addDoc(movimientosRef,{L:u.L,nombre:u.nombre,dni:u.dni||"",tipo:u.tipo,autorizante:u.autorizante||"",entrada:"",salida:horaActualStr(),hora:serverTimestamp()}); }
    }
    scanOk.style.display="inline-block"; setTimeout(()=>scanOk.style.display="none",900); scanModal.classList.remove("active"); scanInput.value="";
  }catch(e){ scanMessage.style.color="red"; scanMessage.textContent="Error al registrar"; setTimeout(()=>scanMessage.textContent="",1800); }
  finally{ scanProcessing=false; }
});

/* ----------------------------- USUARIOS ----------------------------- */
let activeUserFilter="todos";
document.querySelectorAll(".user-filter-btn").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".user-filter-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeUserFilter=btn.dataset.tipo;
    filterUsersTable();
  });
});

function filterUsersTable(){
  document.querySelectorAll('#usersTable tbody tr').forEach(tr=>{
    const tipo=tr.children[6]?.textContent.trim()||"";
    tr.style.display=(activeUserFilter==="todos"||tipo===activeUserFilter)?"":"none";
  });
}

/* ----------------------------- MODALES ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click",()=>{ document.getElementById("fichaModal").classList.remove("active"); });
document.getElementById("cancelEditBtn").addEventListener("click",()=>{ document.getElementById("editUserModal").classList.remove("active"); });

/* ----------------------------- EXPIRADOS ----------------------------- */
onSnapshot(expiradosRef, snap=>{
  const tbody=document.querySelector("#expiredTable tbody");
  tbody.innerHTML="";
  snap.docs.forEach(d=>{
    const u=d.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.L||""}</td><td>${(u.nombre||"").toUpperCase()}</td><td>${u.dni||""}</td><td>${u.codigoIngreso||""}</td><td>${u.codigoSalida||""}</td><td>${u.tipo||""}</td><td>${fechaDDMMYYYY(u.when)}</td>`;
    tbody.appendChild(tr);
  });
});

