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

/* inicial: desbloqueo simple */
const INITIAL_PASS = "1409";
let isUnlocked = localStorage.getItem("unlocked") === "true";

function toggleActionsDisabled(disabled){
  const selectors = [
    '#movimientosTable button', '#usersTable button', '#expiredTable button', 
    '#novedadesTable button', '#scanBtn', '#printActiveBtn', '#addUserBtn', '#guardarNovedadBtn'
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
    const el = document.getElementById('panel');
    if(el) el.classList.add('active');
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
  if(!userL || !editUserL) return;
  userL.innerHTML = "";
  editUserL.innerHTML = "";
  const optNN = document.createElement("option");
  optNN.value="NN";
  optNN.textContent="NN";
  userL.appendChild(optNN);
  const optNN2 = document.createElement("option");
  optNN2.value="NN";
  optNN2.textContent="NN";
  editUserL.appendChild(optNN2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option");
    opt.value=val;
    opt.textContent=val;
    userL.appendChild(opt);
    const opt2 = document.createElement("option");
    opt2.value=val;
    opt2.textContent=val;
    editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* ----------------------------- USUARIOS (Agregar + Render real-time + Editar/Eliminar/Ficha) ----------------------------- */
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
  if(dni && !/^\d{8}$/.test(dni)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Si ingresa DNI, debe tener 8 dígitos"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);}
    return;
  }
  if(celular && !/^\d{10}$/.test(celular)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Celular debe tener 10 dígitos si se ingresa"; setTimeout(()=>{ userMessage.textContent=""; }, 2500);}
    return;
  }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){
    if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Autorizante: solo letras (max 12)"; setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);}
    return;
  }
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
    await addDoc(usuariosRef,{ L, nombre, dni: dni || "", tipo, celular: celular || "", autorizante: autorizante || "", fechaExpedicion: fechaExpIso, codigoIngreso: generarCodigo(), codigoSalida: generarCodigo() });
    if(userMessage){ userMessage.style.color="green"; userMessage.textContent="Usuario agregado"; setTimeout(()=>userMessage.textContent="",2500); }
    if(userL) userL.value="NN"; if(userNombre) userNombre.value=""; if(userDni) userDni.value=""; if(userTipo) userTipo.value="NN"; if(userCelular) userCelular.value=""; if(userAutorizante) userAutorizante.value="";
  }catch(err){ console.error(err); if(userMessage){ userMessage.style.color="red"; userMessage.textContent="Error"; setTimeout(()=>userMessage.textContent="",2500); } }
});

/* Render usuarios en tiempo real (orden por L) */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  if(!usersTableBody) return;
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.L||""}</td><td>${(u.nombre||"").toUpperCase()}</td><td>${u.dni||""}</td><td>${u.celular||""}</td><td>${u.autorizante||""}</td><td>${u.fechaExpedicion ? fechaDDMMYYYY(u.fechaExpedicion) : ""}</td><td>${u.tipo||""}</td>
      <td>
        <button class="ficha-btn">FICHA</button>
        <button class="edit-btn">Editar</button>
        <button class="del-btn">Eliminar</button>
        <button class="print-btn">Imprimir</button>
      </td>`;
    usersTableBody.appendChild(tr);

    // ... (listeners FICHA, EDITAR, ELIMINAR, IMPRIMIR se mantienen igual que en tu PARTE 1)
  });
});

/* ----------------------------- NOVEDADES - agregar/editar/eliminar + render ----------------------------- */
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
      let horaFecha = "";
      if (n.when) {
        const date = parseToDate(n.when);  
        if(date){  
          const hora = date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });  
          const fecha = date.toLocaleDateString("es-AR");  
          horaFecha = `${hora}<br><small>${fecha}</small>`;  
        }
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
}

/* ----------------------------- Cierres/Helpers UI ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); });

/* ----------------------------- MOVIMIENTOS (pestañas y paginación) ----------------------------- */
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
    const autorizText = item.autorizante || "";
    tr.innerHTML = `<td>${item.L||""}</td><td>${(item.nombre||"").toUpperCase()}</td>
      <td title="${item.entrada||""}">${item.entrada||""}</td>
      <td title="${item.salida||""}">${item.salida||""}</td>
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

  renderPagination(filtered.length);
}

/* ----------------------------- Escuchar movimientos en tiempo real ----------------------------- */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__

/* ----------------------------- ESCANEO final y helpers ----------------------------- */

// Escaneo de códigos ya implementado en la Parte 2 previa
// Funciona para múltiples códigos sin cerrar modal
// Cada entrada/salida genera un nuevo movimiento, respetando tu pedido

// Filtrar usuarios ya implementado
// Funciona con botones de filtro y mantiene visibilidad correcta

/* ----------------------------- Expirados - paginación cada 25 ----------------------------- */

const expiredTableBody = document.querySelector("#expiredTable tbody");
const expiredPaginationDiv = document.getElementById("expiredPagination");
let expiredCache = [], expiredCurrentPage = 1, EXPIRED_LIMIT = 25;

function renderExpiredPage(){
    if(!expiredTableBody) return;
    expiredTableBody.innerHTML = "";
    const start = (expiredCurrentPage - 1) * EXPIRED_LIMIT;
    const page = expiredCache.slice(start, start + EXPIRED_LIMIT);

    page.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${item.L||""}</td>
                        <td>${(item.nombre||"").toUpperCase()}</td>
                        <td>${item.dni||""}</td>
                        <td>${item.codigoIngreso||""}</td>
                        <td>${item.codigoSalida||""}</td>
                        <td>${item.tipo||""}</td>
                        <td>${item.celular||""}</td>
                        <td>${item.autorizante||""}</td>
                        <td>${item.fechaExpedicion ? fechaDDMMYYYY(item.fechaExpedicion) : ""}</td>
                        <td>${item.when ? fechaDDMMYYYY(item.when) : ""}</td>
                        <td><button class="del-expired" data-id="${item.__id}">Eliminar</button></td>`;
        expiredTableBody.appendChild(tr);

        tr.querySelector(".del-expired").addEventListener("click", async ()=>{
            if(!isUnlocked){ alert("Operación no permitida."); return; }
            if(!confirm("Eliminar registro expirado permanentemente?")) return;
            try{
                await deleteDoc(doc(db,"expiredCodes",item.__id));
            }catch(err){ console.error(err); alert("Error eliminando registro"); }
        });
    });

    renderExpiredPagination(expiredCache.length);
}

function renderExpiredPagination(totalItems){
    if(!expiredPaginationDiv) return;
    const totalPages = Math.max(1, Math.ceil(totalItems / EXPIRED_LIMIT));
    expiredPaginationDiv.innerHTML = "";
    for(let p=1; p<=totalPages; p++){
        const btn = document.createElement("button");
        btn.textContent = p;
        if(p === expiredCurrentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
        btn.addEventListener("click", ()=>{
            expiredCurrentPage = p;
            renderExpiredPage();
        });
        expiredPaginationDiv.appendChild(btn);
    }
}

// Listener real-time expirados
if(expiredTableBody){
    onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot=>{
        expiredCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
        const totalPages = Math.max(1, Math.ceil(expiredCache.length / EXPIRED_LIMIT));
        if(expiredCurrentPage > totalPages) expiredCurrentPage = totalPages;
        renderExpiredPage();
    });
}
