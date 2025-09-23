// app.js (optimizado) - Firebase 9.22
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
function horaActualStr(){ const d=new Date(); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} (${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()})`; }
function fechaDDMMYYYY(dateIso){ const d = dateIso ? new Date(dateIso) : new Date(); return `(${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()})`; }
function isoNow(){ return new Date().toISOString(); }

/* ----------------------------- UI elementos globales ----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
const passwordBanner = document.getElementById("passwordBanner");
const initPassInput = document.getElementById("initPassInput");
const initPassBtn = document.getElementById("initPassBtn");
const initPassMsg = document.getElementById("initPassMsg");

function toggleActionsDisabled(disabled){
  const selectors = [
    '#movimientosTable button','#usersTable button','#expiredTable button','#novedadesTable button',
    '#scanBtn','#printActiveBtn','#addUserBtn','#guardarNovedadBtn'
  ];
  selectors.forEach(sel=>{ document.querySelectorAll(sel).forEach(b=>{ b.disabled=!!disabled; b.classList.toggle('disabled', disabled); }); });
  document.querySelector('.topbar').style.display = disabled ? 'none' : 'flex';
  passwordBanner.style.display = disabled ? 'flex' : 'none';
  if(disabled){ pages.forEach(p=>p.classList.remove('active')); document.getElementById('panel')?.classList.add('active'); }
}
toggleActionsDisabled(!isUnlocked);

/* ----------------------------- Ingreso de contraseña inicial ----------------------------- */
initPassBtn.addEventListener('click', ()=>{
  const v = (initPassInput.value||"").trim();
  if(v===INITIAL_PASS){
    isUnlocked=true; localStorage.setItem("unlocked","true");
    initPassMsg.style.color='green'; initPassMsg.textContent='Desbloqueado';
    setTimeout(()=>{ initPassMsg.textContent=''; initPassInput.value=''; },900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color='red'; initPassMsg.textContent='Contraseña incorrecta';
    setTimeout(()=>{ initPassMsg.textContent=''; initPassInput.value=''; },1200);
  }
});

/* ----------------------------- Navegación SPA ----------------------------- */
navBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  const target=btn.dataset.section;
  pages.forEach(p=>p.classList.remove("active"));
  document.getElementById(target)?.classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* ----------------------------- Select #L ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  [userL, editUserL].forEach(select=>{
    select.innerHTML="";
    const optNN = document.createElement("option"); optNN.value="NN"; optNN.textContent="NN"; select.appendChild(optNN);
    for(let i=0;i<1000;i++){ const val=i.toString().padStart(3,"0"); const opt=document.createElement("option"); opt.value=val; opt.textContent=val; select.appendChild(opt); }
  });
}
llenarLSelect();

/* ----------------------------- USUARIOS ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

/* Agregar usuario */
addUserBtn.addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida."); return; }
  const L=userL.value.trim();
  let nombre=userNombre.value.trim();
  const dni=userDni.value.trim(), tipo=userTipo.value, celular=userCelular.value.trim(), autorizante=userAutorizante.value.trim();
  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){ userMessage.style.color="red"; userMessage.textContent="Debe cargar nombre, L y Tipo"; setTimeout(()=>{ userMessage.textContent=""; },3000); return; }
  if(dni && !/^\d{8}$/.test(dni)){ userMessage.style.color="red"; userMessage.textContent="DNI debe tener 8 dígitos"; setTimeout(()=>userMessage.textContent="",2500); return; }
  if(celular && !/^\d{10}$/.test(celular)){ userMessage.style.color="red"; userMessage.textContent="Celular debe tener 10 dígitos"; setTimeout(()=>userMessage.textContent="",2500); return; }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){ userMessage.style.color="red"; userMessage.textContent="Autorizante inválido"; setTimeout(()=>userMessage.textContent="",2500); return; }
  nombre = nombre.toUpperCase();
  try{
    if(dni){
      const existing = await getDocs(query(usuariosRef, where("dni","==",dni)));
      if(!existing.empty){ userMessage.style.color="red"; userMessage.textContent="DNI ya registrado"; setTimeout(()=>userMessage.textContent="",2500); return; }
    }
    const fechaExpIso = isoNow();
    await addDoc(usuariosRef, { L, nombre, dni:dni||"", tipo, celular:celular||"", autorizante:autorizante||"", fechaExpedicion:fechaExpIso, codigoIngreso:generarCodigo(), codigoSalida:generarCodigo() });
    userMessage.style.color="green"; userMessage.textContent="Usuario agregado";
    [userL,userNombre,userDni,userTipo,userCelular,userAutorizante].forEach(el=>el.value = el===userTipo||el===userL?"NN":'');
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){ console.error(err); userMessage.style.color="red"; userMessage.textContent="Error"; setTimeout(()=>userMessage.textContent="",2500); }
});

/* Render usuarios en tiempo real */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.L||""}</td><td>${(u.nombre||"").toUpperCase()}</td><td>${u.dni||""}</td><td>${u.celular||""}</td><td>${u.autorizante||""}</td><td>${u.fechaExpedicion ? fechaDDMMYYYY(u.fechaExpedicion) : ""}</td><td>${u.tipo||""}</td>
      <td>
        <button class="ficha-btn" data-id="${docSnap.id}">FICHA</button>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

    // FICHA
    tr.querySelector(".ficha-btn").addEventListener("click", async ()=>{
      try{
        const snap2 = await getDocs(query(usuariosRef, where("__name__","==",docSnap.id), limit(1)));
        if(!snap2.empty){
          const u2 = snap2.docs[0].data();
          ["L","Nombre","Dni","Celular","Autorizante","FechaExp","Tipo"].forEach(id=>document.getElementById(`ficha${id}`).textContent = u2[id.toLowerCase()]||"");
          document.getElementById("fichaModal").classList.add("active");
        }
      }catch(err){ console.error(err); alert("Error al buscar ficha"); }
    });

    // Editar
    tr.querySelector(".edit-btn").addEventListener("click", ()=>{
      const u2 = u;
      document.getElementById("editUserL").value = u2.L||"NN";
      document.getElementById("editUserNombre").value = u2.nombre||"";
      document.getElementById("editUserDni").value = u2.dni||"";
      document.getElementById("editUserTipo").value = u2.tipo||"NN";
      document.getElementById("editUserCelular").value = u2.celular||"";
      document.getElementById("editUserAutorizante").value = u2.autorizante||"";
      document.getElementById("editUserModal").classList.add("active");
      document.getElementById("editUserSaveBtn").dataset.id = docSnap.id;
    });

    // Eliminar
    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar usuario?")) return;
      try{ await deleteDoc(doc(usuariosRef, docSnap.id)); } catch(err){ console.error(err); alert("Error eliminando usuario"); }
    });

    // Imprimir tarjeta
    tr.querySelector(".print-btn").addEventListener("click", ()=>{ printTarjetaUsuario(u); });
  });
});

/* Cerrar modal ficha */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });

/* ----------------------------- EXPIRADOS ----------------------------- */
const expiredTableBody = document.querySelector("#expiredTable tbody");
const EXPIRED_LIMIT = 25;
let expiredCache = [], expiredPage=1;

onSnapshot(query(expiredRef, orderBy("fecha","desc")), snapshot=>{
  expiredCache = snapshot.docs.map(d=>({ __id:d.id, ...d.data() }));
  renderExpiredPage();
});

function renderExpiredPage(){
  expiredTableBody.innerHTML="";
  const start=(expiredPage-1)*EXPIRED_LIMIT;
  const page = expiredCache.slice(start,start+EXPIRED_LIMIT);
  page.forEach(item=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${item.codigo||""}</td><td>${item.nombre||""}</td><td>${item.tipo||""}</td><td>${item.fecha ? fechaDDMMYYYY(item.fecha) : ""}</td>`;
    expiredTableBody.appendChild(tr);
  });
  renderExpiredPagination(expiredCache.length);
}

function renderExpiredPagination(totalItems){
  const totalPages=Math.max(1,Math.ceil(totalItems/EXPIRED_LIMIT));
  const paginationDiv=document.getElementById("expiredPagination");
  paginationDiv.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===expiredPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click", ()=>{ expiredPage=p; renderExpiredPage(); });
    paginationDiv.appendChild(btn);
  }
}

/* ----------------------------- NOVEDADES ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const novTxt = document.getElementById("novedadTexto");
const guardarNovedadBtn = document.getElementById("guardarNovedadBtn");
const novMsg = document.getElementById("novedadMsg");
let editingNovedadId = null;

guardarNovedadBtn.addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida."); return; }
  const texto = novTxt.value.trim();
  if(!texto){ novMsg.style.color="red"; novMsg.textContent="Ingrese texto"; setTimeout(()=>novMsg.textContent="",2000); return; }
  try{
    if(editingNovedadId){
      await updateDoc(doc(novedadesRef, editingNovedadId), { texto, when: isoNow() });
      editingNovedadId=null; novMsg.style.color="green"; novMsg.textContent="Novedad editada";
    } else {
      await addDoc(novedadesRef, { texto, when: isoNow() });
      novMsg.style.color="green"; novMsg.textContent="Novedad guardada";
    }
    novTxt.value=""; setTimeout(()=>novMsg.textContent="",2000);
  }catch(err){ console.error(err); novMsg.style.color="red"; novMsg.textContent="Error"; setTimeout(()=>novMsg.textContent="",2000); }
}

// Render novedades con editar/eliminar
onSnapshot(query(novedadesRef, orderBy("when","desc")), snapshot=>{
  novedadesTableBody.innerHTML="";
  snapshot.docs.forEach(d=>{
    const n = d.data();
    const tr=document.createElement("tr");
    let horaFecha="";
    if(n.when){
      const date = n.when.toDate ? n.when.toDate() : new Date(n.when);
      horaFecha = `${date.toLocaleTimeString("es-AR",{hour:"2-digit",minute:"2-digit"})}<br><small>${date.toLocaleDateString("es-AR")}</small>`;
    }
    tr.innerHTML = `<td style="white-space:nowrap">${horaFecha}</td><td style="text-align:left;padding-left:8px;">${n.texto||""}</td>
      <td><button class="edit-nov" data-id="${d.id}">Editar</button>
      <button class="del-nov" data-id="${d.id}">Eliminar</button></td>`;
    novedadesTableBody.appendChild(tr);

    tr.querySelector(".edit-nov").addEventListener("click", ()=>{
      novTxt.value = n.texto||"";
      editingNovedadId = d.id;
      document.querySelector('#novedades').scrollIntoView({behavior:'smooth'});
    });
    tr.querySelector(".del-nov").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar novedad?")) return;
      try{ await deleteDoc(doc(novedadesRef,d.id)); } catch(err){ console.error(err); alert("Error eliminando novedad"); }
    });
  });
});

/* ----------------------------- MOVIMIENTOS ----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache=[], currentPage=1;
let activeTipo = "todos";

document.querySelectorAll(".tab-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".tab-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo = btn.dataset.tipo;
    currentPage=1; renderMovsPage();
  });
});

document.getElementById("printActiveBtn").addEventListener("click", ()=>{ if(!isUnlocked){ alert("Operación no permitida."); return; } printMovimientosPorTipo(activeTipo); });

function shouldShowAutorizanteColumn(tipo){ return ["obrero","invitado","empleado","otro"].includes(tipo); }

function renderPagination(totalItems){
  const totalPages=Math.max(1, Math.ceil(totalItems/MOV_LIMIT));
  paginationDiv.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button"); btn.textContent=p;
    if(p===currentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click", ()=>{ currentPage=p; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

function renderMovsPage(){
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo==="todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page = filtered.slice(start,start+MOV_LIMIT);
  const table = document.getElementById("movimientosTable");
  const showAut = shouldShowAutorizanteColumn(activeTipo);
  document.querySelectorAll('.autorizante-th').forEach(th=>th.style.display = showAut ? 'table-cell' : 'none');

  page.forEach(item=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${item.L||""}</td><td>${(item.nombre||"").toUpperCase()}</td><td>${item.entrada||""}</td>
      <td>${item.salida||""}</td><td>${item.tipo||""}</td><td class="autorizante-td">${item.autorizante||""}</td>
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
          ["L","Nombre","Dni","Celular","Autorizante","FechaExp","Tipo"].forEach(id=>document.getElementById(`ficha${id}`).textContent = u[id.toLowerCase()]||"");
          document.getElementById("fichaModal").classList.add("active");
        } else alert("No se encontró ficha para ese lote");
      }catch(err){ console.error(err); alert("Error al buscar ficha"); }
    });

    tr.querySelector(".delMov").addEventListener("click", async e=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(movimientosRef, e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(filtered.length);
}

/* ----------------------------- AUTO-IMPRESIÓN PROPIETARIOS ----------------------------- */
let autoPrintPropietarios = true;
const toggleAutoPrintBtn = document.createElement("button");
toggleAutoPrintBtn.id="toggleAutoPrintBtn"; toggleAutoPrintBtn.textContent="Auto-Impresión"; toggleAutoPrintBtn.style.marginLeft="10px";

function updateAutoPrintBtn(){
  toggleAutoPrintBtn.style.background = autoPrintPropietarios ? "green" : "red";
  toggleAutoPrintBtn.style.color="#fff";
}
updateAutoPrintBtn();
document.getElementById("printActiveBtn").parentNode.insertBefore(toggleAutoPrintBtn, document.getElementById("printActiveBtn").nextSibling);
toggleAutoPrintBtn.addEventListener("click", ()=>{ autoPrintPropietarios=!autoPrintPropietarios; updateAutoPrintBtn(); });

/* ----------------------------- Escaneo automático de códigos ----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");
let scanProcessing=false;

scanBtn.addEventListener("click", ()=>{ if(!isUnlocked){ alert("Operación no permitida."); return; } scanModal.classList.add("active"); scanInput.value=""; scanInput.focus(); scanMessage.textContent=""; });
cancelScanBtn.addEventListener("click", ()=>{ scanMessage.textContent=""; scanInput.value=""; });

scanInput.addEventListener("input", async ()=>{
  const raw = scanInput.value.trim(); if(scanProcessing || raw.length<8) return;
  scanProcessing=true; const code = raw.substring(0,8).toUpperCase();
  try{
    let userDoc=null, tipoAccion="entrada";
    const qIngreso=query(usuariosRef, where("codigoIngreso","==",code));
    const snap=await getDocs(qIngreso);
    if(!snap.empty) userDoc=snap.docs[0]; 
    else { const snap2 = await getDocs(query(usuariosRef, where("codigoSalida","==",code))); if(!snap2.empty){ userDoc=snap2.docs[0]; tipoAccion="salida"; } }
    if(!userDoc){ scanMessage.style.color="red"; scanMessage.textContent="Código no válido"; setTimeout(()=>scanMessage.textContent="",1800); scanProcessing=false; return; }

    const u=userDoc.data();
    if(tipoAccion==="entrada"){
      await addDoc(movimientosRef, { L:u.L,nombre:u.nombre,dni:u.dni||"",tipo:u.tipo,autorizante:u.autorizante||"",entrada:horaActualStr(),salida:"",hora:serverTimestamp() });
    } else {
      const movSnap = await getDocs(query(movimientosRef, where("L","==",u.L), where("salida","==","")));
      if(!movSnap.empty){
        let chosen=movSnap.docs[0]; let chosenTime=chosen.data().hora?.toDate ? chosen.data().hora.toDate() : new Date(0);
        movSnap.docs.forEach(d=>{ const t=d.data().hora?.toDate ? d.data().hora.toDate() : new Date(0); if(t>chosenTime){ chosen=d; chosenTime=t; } });
        await updateDoc(doc(movimientosRef,chosen.id), { salida:horaActualStr() });
      } else await addDoc(movimientosRef, { L:u.L,nombre:u.nombre,dni:u.dni||"",tipo:u.tipo,autorizante:u.autorizante||"",entrada:"",salida:horaActualStr(),hora:serverTimestamp() });
    }
    scanOk.style.display="inline-block"; setTimeout(()=>scanOk.style.display="none",900); scanModal.classList.remove("active"); scanInput.value="";
  }catch(err){ console.error(err); scanMessage.style.color="red"; scanMessage.textContent="Error al registrar"; setTimeout(()=>scanMessage.textContent="",1800); }
  finally{ scanProcessing=false; }
});

/* ----------------------------- Filtros usuarios ----------------------------- */
let activeUserFilter="todos";
document.querySelectorAll(".user-filter-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".user-filter-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeUserFilter=btn.dataset.tipo;
    filterUsersTable();
  });
});

function filterUsersTable(){
  document.querySelectorAll("#usersTable tbody tr").forEach(tr=>{
    const tipo = tr.children[6]?.textContent.trim() || "";
    tr.style.display = (activeUserFilter==="todos" || tipo===activeUserFilter) ? "" : "none";
  });
}

/* ----------------------------- Modales cerrar ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); });
