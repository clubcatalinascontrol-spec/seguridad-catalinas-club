// app.js (PARTE 1) - Firebase 9.22
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
const horaActualStr = ()=> {
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
  if(typeof d === "string") return new Date(d);
  if(typeof d.toDate === "function") return d.toDate();
  if(typeof d.seconds === "number") return new Date(d.seconds*1000);
  return new Date(d);
}
function fechaDDMMYYYY(dateIso){
  const dt = parseToDate(dateIso) || new Date();
  const dd = String(dt.getDate()).padStart(2,'0');
  const mm = String(dt.getMonth()+1).padStart(2,'0');
  const yyyy = dt.getFullYear();
  return `(${dd}/${mm}/${yyyy})`;
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
let isUnlocked = localStorage.getItem("unlocked") === "true";

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
      if(disabled) b.classList.add('disabled'); else b.classList.remove('disabled');
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
toggleActionsDisabled(!isUnlocked);

initPassBtn.addEventListener('click', ()=>{
  const v = (initPassInput.value || "").trim();
  if(v === INITIAL_PASS){
    isUnlocked = true;
    localStorage.setItem("unlocked", "true");
    initPassMsg.style.color = 'green'; initPassMsg.textContent = 'Desbloqueado';
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 900);
    toggleActionsDisabled(false);
  } else {
    initPassMsg.style.color = 'red'; initPassMsg.textContent = 'Contraseña incorrecta';
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

/* ----------------------------- Select #L ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  if(!userL || !editUserL) return;
  userL.innerHTML = ""; editUserL.innerHTML = "";
  const optNN = document.createElement("option"); optNN.value="NN"; optNN.textContent="NN"; userL.appendChild(optNN);
  const optNN2 = document.createElement("option"); optNN2.value="NN"; optNN2.textContent="NN"; editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option"); opt.value=val; opt.textContent=val; userL.appendChild(opt);
    const opt2 = document.createElement("option"); opt2.value=val; opt2.textContent=val; editUserL.appendChild(opt2);
  }
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

addUserBtn.addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  const L = userL ? userL.value.trim() : "NN";
  let nombre = (userNombre ? userNombre.value : "").trim();
  const dni = (userDni ? userDni.value.trim() : "");
  const tipo = userTipo ? userTipo.value : "NN";
  const celular = (userCelular ? userCelular.value.trim() : "");
  const autorizante = (userAutorizante ? userAutorizante.value.trim() : "");

  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Debe cargar un nombre, un número de Lote y un Tipo para continuar"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 3000); }
    return;
  }
  if(dni && !/^\d{8}$/.test(dni)){ if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Si ingresa DNI, debe tener 8 dígitos"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);} return; }
  if(celular && !/^\d{10}$/.test(celular)){ if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Celular debe tener 10 dígitos si se ingresa"; setTimeout(()=>{ userMessage.textContent=""; }, 2500);} return; }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){ if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Autorizante: solo letras (max 12)"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);} return; }

  nombre = nombre.toUpperCase();
  try{
    if(dni){
      const qDni = query(usuariosRef, where("dni","==",dni));
      const existing = await getDocs(qDni);
      if(!existing.empty){
        if(userMessage){ userMessage.style.color="red"; userMessage.textContent="DNI ya registrado"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500); }
        return;
      }
    }
    const fechaExpIso = isoNow();
    await addDoc(usuariosRef,{
      L, nombre, dni: dni || "", tipo, celular: celular || "", autorizante: autorizante || "", fechaExpedicion: fechaExpIso,
      codigoIngreso: generarCodigo(), codigoSalida: generarCodigo()
    });
    if(userMessage){ userMessage.style.color="green"; userMessage.textContent="Usuario agregado"; setTimeout(()=>userMessage.textContent="",2500); }
    if(userL) userL.value="NN";
    if(userNombre) userNombre.value="";
    if(userDni) userDni.value="";
    if(userTipo) userTipo.value="NN";
    if(userCelular) userCelular.value="";
    if(userAutorizante) userAutorizante.value="";
  }catch(err){
    console.error(err);
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Error"; setTimeout(()=>userMessage.textContent="",2500); }
  }
});

/* Render usuarios en tiempo real */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  if(!usersTableBody) return;
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${u.L||""}</td>
      <td>${(u.nombre||"").toUpperCase()}</td>
      <td>${u.dni||""}</td>
      <td>${u.celular||""}</td>
      <td>${u.autorizante||""}</td>
      <td>${u.fechaExpedicion ? fechaDDMMYYYY(u.fechaExpedicion) : ""}</td>
      <td>${u.tipo||""}</td>
      <td>
        <button class="ficha-btn" data-id="${docSnap.id}">FICHA</button>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

    // FICHA, EDITAR, ELIMINAR e IMPRIMIR se mantienen iguales a tu código original
    // ... (seguiría aquí la Parte 1 completa hasta antes de Expirados)
  });
});

// app.js (PARTE 2) - Expirados, Novedades, Movimientos (con tooltips)
/* ----------------------------- EXPIRADOS ----------------------------- */
const expiredTableBody = document.querySelector("#expiredTable tbody");
onSnapshot(query(expiredRef, orderBy("fecha","desc")), snapshot=>{
  if(!expiredTableBody) return;
  expiredTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const e = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.codigo||""}</td>
      <td>${e.motivo||""}</td>
      <td>${e.fecha ? fechaDDMMYYYY(e.fecha) : ""}</td>
      <td><button class="delExp" data-id="${docSnap.id}">Eliminar</button></td>`;
    expiredTableBody.appendChild(tr);

    tr.querySelector(".delExp")?.addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar expirado permanentemente?")) return;
      try{ await deleteDoc(doc(db,"expiredCodes",docSnap.id)); }catch(err){ console.error(err); alert("Error eliminando"); }
    });
  });
});

/* ----------------------------- NOVEDADES ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const guardarNovedadBtn = document.getElementById("guardarNovedadBtn");
const novMensaje = document.getElementById("novMensaje");
const novTexto = document.getElementById("novTexto");

guardarNovedadBtn?.addEventListener("click", async ()=>{
  if(!isUnlocked){ alert("Operación no permitida."); return; }
  const text = (novTexto.value||"").trim();
  if(!text) return;
  try{
    await addDoc(novedadesRef, { texto:text, fecha:serverTimestamp() });
    novMensaje.style.color="green"; novMensaje.textContent="Novedad guardada"; setTimeout(()=>novMensaje.textContent="",2500);
    novTexto.value="";
  }catch(err){ console.error(err); novMensaje.style.color="red"; novMensaje.textContent="Error guardando"; setTimeout(()=>novMensaje.textContent="",2500);}
});

onSnapshot(query(novedadesRef, orderBy("fecha","desc")), snapshot=>{
  if(!novedadesTableBody) return;
  novedadesTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const n = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${n.texto||""}</td>
      <td>${n.fecha ? fechaDDMMYYYY(n.fecha) : ""}</td>
      <td><button class="delNov" data-id="${docSnap.id}">Eliminar</button></td>`;
    novedadesTableBody.appendChild(tr);

    tr.querySelector(".delNov")?.addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar novedad?")) return;
      try{ await deleteDoc(doc(db,"novedades",docSnap.id)); }catch(err){ console.error(err); alert("Error eliminando"); }
    });
  });
});

/* ----------------------------- MOVIMIENTOS (con tooltip H. Entrada / H. Salida) ----------------------------- */
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
printActiveBtn?.addEventListener("click", ()=>{ if(!isUnlocked){ alert("Operación no permitida."); return; } printMovimientosPorTipo(activeTipo); });

function renderPagination(totalItems){
  const totalPages=Math.max(1,Math.ceil(totalItems/MOV_LIMIT));
  paginationDiv.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===currentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click", ()=>{ currentPage=p; renderMovsPage(); });
    paginationDiv.appendChild(btn);
  }
}

function shouldShowAutorizanteColumn(tipo){
  return ["obrero","invitado","empleado","otro"].includes(tipo);
}

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

    // Tooltip para H. Entrada y H. Salida
    const entradaDate = parseToDate(item.hora || new Date());
    const entradaStr = item.entrada ? item.entrada.split(" ")[0] : "";
    const salidaStr = item.salida ? item.salida.split(" ")[0] : "";
    tr.innerHTML = `<td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td title="${item.entrada||''}">${entradaStr}</td>
      <td title="${item.salida||''}">${salidaStr}</td>
      <td>${item.tipo||""}</td>
      <td class="autorizante-td">${item.autorizante||""}</td>
      <td>
        <button class="ficha-btn" data-L="${item.L}">FICHA</button>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>`;
    movimientosTableBody.appendChild(tr);

    // FICHA
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

    // ELIMINAR MOVIMIENTO
    tr.querySelector(".delMov").addEventListener("click", async e=>{
      if(!isUnlocked){ alert("Operación no permitida."); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });

  renderPagination(filtered.length);
}

/* Escuchar movimientos en tiempo real */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

// app.js (PARTE 3) - Escaneo, impresión y filtros de usuarios

/* ----------------------------- ESCANEAR CÓDIGOS ----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");
let scanProcessing = false;

scanBtn?.addEventListener("click", () => {
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  scanModal.classList.add("active");
  scanInput.value = "";
  scanMessage.textContent = "";
  scanInput.focus();
});

cancelScanBtn?.addEventListener("click", () => {
  scanModal.classList.remove("active");
  scanMessage.textContent = "";
  scanInput.value = "";
});

scanInput?.addEventListener("input", async () => {
  const raw = (scanInput.value || "").trim();
  if(scanProcessing || raw.length < 8) return;
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
    setTimeout(()=>scanOk.style.display="none",900);
    scanInput.value = "";
    scanMessage.textContent = "";
  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  } finally { scanProcessing = false; }
});

/* ----------------------------- IMPRIMIR MOVIMIENTOS (A4, font reducido) ----------------------------- */
function printMovimientosPorTipo(tipo, auto=false){
  if(!auto && !isUnlocked){ alert("Operación no permitida."); return; }
  const filtered = tipo==="todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===tipo);
  const toPrint = filtered.slice(0,25);
  const w = window.open("","_blank","width=900,height=600");
  const title = tipo==="todos" ? "Movimientos - Todos" : `Movimientos - ${tipo}`;
  let html = `<html><head><title>${title}</title><style>
    @page{size:A4;margin:6mm;} body{font-family:Arial,Helvetica,sans-serif;font-size:10px;color:#000;}
    table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:2px;text-align:center;font-size:10px}
    thead th{background:#fff;font-weight:700;color:#000} img, svg { filter: grayscale(100%); }
    </style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
}

/* ----------------------------- USUARIOS - filtros ----------------------------- */
let activeUserFilter = "todos";
document.querySelectorAll(".user-filter-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    document.querySelectorAll(".user-filter-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeUserFilter = btn.dataset.tipo;
    filterUsersTable();
  });
});

function filterUsersTable(){
  document.querySelectorAll('#usersTable tbody tr').forEach(tr=>{
    const tipo = tr.children[6] ? tr.children[6].textContent.trim() : "";
    tr.style.display = (activeUserFilter === "todos" || tipo === activeUserFilter) ? "" : "none";
  });
}

/* ----------------------------- UTILS ----------------------------- */
function horaActualStr(){
  const d = new Date();
  return d.toLocaleTimeString("es-AR",{hour12:false});
}

function fechaDDMMYYYY(date){
  if(!date) return "";
  if(date.toDate) date = date.toDate();
  const d = ("0"+date.getDate()).slice(-2);
  const m = ("0"+(date.getMonth()+1)).slice(-2);
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function parseToDate(date){
  if(!date) return new Date();
  return date.toDate ? date.toDate() : new Date(date);
}

/* Nota: listeners de cierre de modales y cancelEdit permanecen en Parte 1 */
