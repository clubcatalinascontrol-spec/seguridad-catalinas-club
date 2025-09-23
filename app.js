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
/* Eliminadas las contraseñas previas y CONFIG. Se usa una sola contraseña de apertura. */
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
  // botones dentro de tablas y controles que no deben funcionar cuando bloqueado
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
  // además ocultar/mostrar header según locked
  if(disabled){
    document.querySelector('.topbar').style.display = 'none';
    passwordBanner.style.display = 'flex';
    // ensure panel visible
    pages.forEach(p=>p.classList.remove('active'));
    const el = document.getElementById('panel'); if(el) el.classList.add('active');
    // hide nav active states visually
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

/* ----------------------------- USUARIOS (añadidos: celular, autorizante, fechaExpedicion) ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// Agregar usuario
addUserBtn.addEventListener("click",async ()=>{
  if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
  const L=userL.value.trim();
  let nombre=userNombre.value.trim();
  const dni=userDni.value.trim();
  const tipo=userTipo.value;
  const celular=userCelular.value.trim();
  const autorizante=userAutorizante.value.trim();
  // Requeridos: L != NN, nombre no vacío, tipo != NN
  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){
    userMessage.style.color="red";
    userMessage.textContent="Debe cargar un nombre, un número de Lote y un Tipo para continuar";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 3000);
    return;
  }
  // Validaciones opcionales
  if(dni && !/^\d{8}$/.test(dni)){
    userMessage.style.color="red";
    userMessage.textContent="Si ingresa DNI, debe tener 8 dígitos";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
    return;
  }
  if(celular && !/^\d{10}$/.test(celular)){
    userMessage.style.color="red";
    userMessage.textContent="Celular debe tener 10 dígitos si se ingresa";
    setTimeout(()=>{ userMessage.textContent=""; }, 2500);
    return;
  }
  if(autorizante && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(autorizante)){
    userMessage.style.color="red";
    userMessage.textContent="Autorizante: solo letras (max 12)";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
    return;
  }
  nombre = nombre.toUpperCase();
  try{
    // Verificar DNI único
    if(dni){
      const qDni = query(usuariosRef, where("dni","==",dni));
      const existing = await getDocs(qDni);
      if(!existing.empty){
        userMessage.style.color = "red";
        userMessage.textContent = "DNI ya registrado";
        setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
        return;
      }
    }
    const fechaExpIso = isoNow();
    await addDoc(usuariosRef,{
      L, nombre, dni: dni || "", tipo, celular: celular || "", autorizante: autorizante || "", fechaExpedicion: fechaExpIso,
      codigoIngreso: generarCodigo(), codigoSalida: generarCodigo()
    });
    userMessage.style.color = "green";
    userMessage.textContent="Usuario agregado";
    userL.value="NN"; userNombre.value=""; userDni.value=""; userTipo.value="NN"; userCelular.value=""; userAutorizante.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){
    console.error(err);
    userMessage.style.color="red";
    userMessage.textContent="Error";
    setTimeout(()=>userMessage.textContent="",2500);
  }
});

/* Render usuarios en tiempo real */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    // autorizante visible siempre en usuarios (según estructura); ficha agregado en acciones
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

    // FICHA (usuarios)
    tr.querySelector(".ficha-btn").addEventListener("click", async (e)=>{
      const id = docSnap.id;
      try{
        const snap = await getDocs(query(usuariosRef, where("__name__","==",id), limit(1)));
        if(!snap.empty){
          const u2 = snap.docs[0].data();
          document.getElementById("fichaL").textContent = u2.L||"";
          document.getElementById("fichaNombre").textContent = (u2.nombre||"").toUpperCase();
          document.getElementById("fichaDni").textContent = u2.dni||"";
          document.getElementById("fichaCelular").textContent = u2.celular||"";
          document.getElementById("fichaAutorizante").textContent = u2.autorizante||"";
          document.getElementById("fichaFechaExp").textContent = u2.fechaExpedicion ? fechaDDMMYYYY(u2.fechaExpedicion) : "";
          document.getElementById("fichaTipo").textContent = u2.tipo||"";
          document.getElementById("fichaModal").classList.add("active");
        } else {
          alert("No se encontró ficha");
        }
      }catch(err){ console.error(err); alert("Error al buscar ficha"); }
    });

    // EDITAR
    tr.querySelector(".edit-btn").addEventListener("click", ()=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      const udata = u;
      document.getElementById("editUserModal").classList.add("active");
      editUserL.value = udata.L||"NN";
      document.getElementById("editUserNombre").value = udata.nombre||"";
      document.getElementById("editUserDni").value = udata.dni||"";
      document.getElementById("editUserCelular").value = udata.celular||"";
      document.getElementById("editUserAutorizante").value = udata.autorizante||"";
      document.getElementById("editUserTipo").value = udata.tipo||"NN";
      const finalizeBtn=document.getElementById("finalizeEditBtn");
      const cancelBtn=document.getElementById("cancelEditBtn");
      const msgSpan=document.getElementById("editUserMsg");
      finalizeBtn.onclick = async ()=>{
        const newL=editUserL.value.trim();
        let newNombre=document.getElementById("editUserNombre").value.trim();
        const newDni=document.getElementById("editUserDni").value.trim();
        const newCel=document.getElementById("editUserCelular").value.trim();
        const newAut=document.getElementById("editUserAutorizante").value.trim();
        const newTipo=document.getElementById("editUserTipo").value;
        if(!newL || newL==="NN" || !newNombre || !newTipo || newTipo==="NN"){
          msgSpan.style.color="red"; msgSpan.textContent="Debe cargar #L, Nombre y Tipo (no NN)"; return;
        }
        if(newDni && !/^\d{8}$/.test(newDni)){ msgSpan.style.color="red"; msgSpan.textContent="DNI debe tener 8 dígitos"; return; }
        if(newCel && !/^\d{10}$/.test(newCel)){ msgSpan.style.color="red"; msgSpan.textContent="Celular debe tener 10 dígitos"; return; }
        if(newAut && !/^[A-Za-zÁÉÍÓÚáéíóúÑñ ]{1,12}$/.test(newAut)){ msgSpan.style.color="red"; msgSpan.textContent="Autorizante inválido"; return; }
        // Verificar DNI único
        if(newDni){
          const qDni=query(usuariosRef, where("dni","==",newDni));
          const snapDni=await getDocs(qDni);
          if(!snapDni.empty && snapDni.docs[0].id!==docSnap.id){
            msgSpan.style.color="red"; msgSpan.textContent="DNI ya registrado en otro usuario"; return;
          }
        }
        newNombre = newNombre.toUpperCase();
        try{
          await updateDoc(doc(db,"usuarios",docSnap.id),{ L:newL, nombre:newNombre, dni:newDni||"", tipo:newTipo, celular:newCel||"", autorizante:newAut||"" });
          msgSpan.style.color="green"; msgSpan.textContent="Usuario editado con éxito";
          setTimeout(()=>{ document.getElementById("editUserModal").classList.remove("active"); msgSpan.textContent=""; msgSpan.style.color="#0a0"; },1500);
        }catch(err){ console.error(err); msgSpan.style.color="red"; msgSpan.textContent="Error editando"; }
      };
      cancelBtn.onclick=()=>{ document.getElementById("editUserModal").classList.remove("active"); msgSpan.textContent=""; };
    });

    // ELIMINAR USUARIO
    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      if(!confirm("Eliminar usuario permanentemente? (esto invalidará sus códigos)")) return;
      try{
        await addDoc(expiredRef,{ L: u.L||"", nombre: u.nombre||"", dni: u.dni||"", codigoIngreso: u.codigoIngreso||"", codigoSalida: u.codigoSalida||"", tipo: u.tipo||"", when: isoNow(), celular: u.celular||"", autorizante: u.autorizante||"", fechaExpedicion: u.fechaExpedicion||"" });
        await deleteDoc(doc(db,"usuarios",docSnap.id));
        alert("Usuario eliminado y códigos invalidados.");
      }catch(err){ console.error(err); alert("Error eliminando usuario"); }
    });

    // IMPRIMIR TARJETA
    tr.querySelector(".print-btn").addEventListener("click", async ()=>{
      if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
      const udata = u;
      const borderColor={"propietario":"violet","administracion":"orange","empleado":"green","obrero":"yellow","invitado":"cyan","guardia":"red"}[udata.tipo]||"gray";
      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`<html><head><title>Tarjeta ${udata.L}</title><style>body{font-family:Arial;text-align:center}.card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:8px}</style><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script></head><body> <div class="card"> <svg id="codeIn" style="display:block;margin:6px auto"></svg> <div style="font-size:16px;font-weight:700;margin:6px 0">${udata.L} — ${(udata.nombre||"").toUpperCase()}<br>DNI: ${udata.dni||''}<br>${udata.tipo}</div> <svg id="codeOut" style="display:block;margin:6px auto"></svg> </div> <script> JsBarcode(document.getElementById('codeIn'),"${udata.codigoIngreso||''}",{format:'CODE128',width:2,height:40}); JsBarcode(document.getElementById('codeOut'),"${udata.codigoSalida||''}",{format:'CODE128',width:2,height:40}); window.print(); setTimeout(()=>window.close(),700); <\/script> </body></html>`);
    });

  });
});

/* ----------------------------- EXPIRADOS - render en tiempo real ----------------------------- */
const expiredTableBody = document.querySelector("#expiredTable tbody");
const expiredPaginationDiv = document.getElementById("expiredPagination"); // 👈 agrega este <div> en el HTML
const EXP_LIMIT = 25;
let expiredCache = [];
let currentExpiredPage = 1;

onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot=>{
  expiredCache = snapshot.docs.map(d => ({ __id:d.id, ...d.data() }));
  renderExpiredPage();
});

function renderExpiredPage(){
  expiredTableBody.innerHTML = "";
  const start = (currentExpiredPage-1)*EXP_LIMIT;
  const page = expiredCache.slice(start, start+EXP_LIMIT);
  page.forEach(e=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${e.L || ""}</td>
      <td>${e.nombre || ""}</td>
      <td>${e.dni || ""}</td>
      <td>${e.codigoIngreso || ""}</td>
      <td>${e.codigoSalida || ""}</td>
      <td>${e.tipo || ""}</td>
      <td>${e.when ? fechaDDMMYYYY(e.when) : ""}</td>`;
    expiredTableBody.appendChild(tr);
  });
  renderExpiredPagination();
}

function renderExpiredPagination(){
  const totalPages = Math.max(1, Math.ceil(expiredCache.length/EXP_LIMIT));
  expiredPaginationDiv.innerHTML = "";
  for(let p=1; p<=totalPages; p++){
    const btn = document.createElement("button");
    btn.textContent = p;
    if(p === currentExpiredPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
    btn.addEventListener("click", ()=>{ currentExpiredPage=p; renderExpiredPage(); });
    expiredPaginationDiv.appendChild(btn);
  }
}
/* ----------------------------- NOVEDADES - agregar/editar/eliminar ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const novTxt = document.getElementById("novedadTexto");
const guardarNovedadBtn = document.getElementById("guardarNovedadBtn");
const novMsg = document.getElementById("novedadMsg");
let editingNovedadId = null;
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

// render novedades, ahora con botón ELIMINAR
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
/* ----------------------------- MOVIMIENTOS (pestañas por tipo y paginación) ----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[],currentPage=1;
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
  // Mostrar columna autorizante únicamente para: obrero, invitado, empleado, otro
  return ["obrero","invitado","empleado","otro"].includes(tipo);
}

function renderMovsPage(){
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo === "todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page=filtered.slice(start,start+MOV_LIMIT);
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

    // FICHA (solo desde PANEL) -> buscar usuario por L y mostrar modal (solo lectura)
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
          document.getElementById("fichaAutorizante").textContent = (u.tipo === "invitado") ? (u.autorizante||"") : u.autorizante||"";
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

// PANEL - onSnapshot con inserción de filas NUEVAS arriba sin sobreescribir
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot => {

  snapshot.docChanges().forEach(change => {
    const d = change.doc;
    const data = { __id: d.id, ...d.data() };

    if(change.type === "added"){
      // insertar al inicio de la cache
      movimientosCache.unshift(data);
      // eliminar duplicados por ID
      movimientosCache = movimientosCache.filter((v,i,a)=>a.findIndex(x=>x.__id===v.__id)===i);

      // verificar si el movimiento coincide con el filtro activo
      const matchesFilter = (activeTipo === "todos" || data.tipo === activeTipo);

      if(matchesFilter){
        // crear fila NUEVA y agregar al inicio del tbody
        const tr = document.createElement("tr");
        const autorizText = data.autorizante || "";
        tr.innerHTML = `<td>${data.L||""}</td><td>${(data.nombre||"").toUpperCase()}</td>
          <td>${data.entrada||""}</td><td>${data.salida||""}</td><td>${data.tipo||""}</td>
          <td class="autorizante-td">${autorizText}</td>
          <td>
            <button class="ficha-btn" data-L="${data.L}">FICHA</button>
            <button class="delMov" data-id="${data.__id}">Eliminar</button>
          </td>`;

        // listeners para FICHA
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

        // listener para ELIMINAR movimiento
        tr.querySelector(".delMov").addEventListener("click", async e=>{
          if(!isUnlocked){ alert("Operación no permitida. Introduzca la contraseña de apertura."); return; }
          if(!confirm("Eliminar movimiento permanentemente?")) return;
          try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
        });

        // insertar al inicio del tbody
        movimientosTableBody.insertAdjacentElement('afterbegin', tr);
      }

    } else if(change.type === "modified"){
      const idx = movimientosCache.findIndex(x=>x.__id===data.__id);
      if(idx > -1) movimientosCache[idx] = data;
      renderMovsPage();

    } else if(change.type === "removed"){
      movimientosCache = movimientosCache.filter(x=>x.__id !== data.__id);
      const row = movimientosTableBody.querySelector(`.delMov[data-id="${data.__id}"]`)?.closest("tr");
      if(row) row.remove();
      renderMovsPage();
    }
  });

  // auto-imprimir propietarios cada múltiplo de 25
  const propietariosCount = movimientosCache.filter(m=>m.tipo==="propietario").length;
  if(propietariosCount>0 && propietariosCount % MOV_LIMIT === 0){
    printMovimientosPorTipo("propietario", true);
  }
});


/* ----------------------------- ESCANEAR CÓDIGOS AUTOMÁTICO ----------------------------- */
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
cancelScanBtn.addEventListener("click", () => { scanMessage.textContent = ""; scanInput.value = ""; });

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
    else { const qSalida = query(usuariosRef, where("codigoSalida", "==", code)); const snap2 = await getDocs(qSalida); if(!snap2.empty){ userDoc = snap2.docs[0]; tipoAccion="salida"; } }

    if(!userDoc){
      scanMessage.style.color = "red";
      scanMessage.textContent = "Código no válido";
      setTimeout(()=>{ scanMessage.textContent = ""; }, 1800);
      scanProcessing = false; return;
    }
    const u = userDoc.data();
    // incluir autorizante en el movimiento si existe
    if(tipoAccion === "entrada"){
      await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: horaActualStr(), salida: "", hora: serverTimestamp() });
    } else {
      const movQ = query(movimientosRef, where("L","==",u.L), where("salida","==",""));
      const movSnap = await getDocs(movQ);
      if(!movSnap.empty){
        let chosen = movSnap.docs[0];
        let chosenTime = chosen.data().hora && chosen.data().hora.toDate ? chosen.data().hora.toDate() : new Date(0);
        movSnap.docs.forEach(d=>{ const t = d.data().hora && d.data().hora.toDate ? d.data().hora.toDate() : new Date(0); if(t > chosenTime){ chosen = d; chosenTime = t; } });
        await updateDoc(doc(db,"movimientos",chosen.id), { salida: horaActualStr() });
      } else {
        await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni || "", tipo: u.tipo, autorizante: u.autorizante || "", entrada: "", salida: horaActualStr(), hora: serverTimestamp() });
      }
    }
    scanOk.style.display = "inline-block";
    setTimeout(()=>scanOk.style.display = "none", 900);
    scanModal.classList.remove("active");
    scanInput.value = "";
  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  } finally { scanProcessing = false; }
});

/* ----------------------------- BOTONES USUARIOS - filtro por tipo (similar a PANEL) ----------------------------- */
const userFilterBtns = document.querySelectorAll(".user-filter-btn");
let activeUserFilter = "todos";
userFilterBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    userFilterBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    activeUserFilter = btn.dataset.tipo;
    filterUsersTable();
  });
});
function filterUsersTable(){
  // Re-render current snapshot: simplest approach leer filas y mostrar/ocultar según tipo
  document.querySelectorAll('#usersTable tbody tr').forEach(tr=>{
    const tipo = tr.children[6] ? tr.children[6].textContent.trim() : "";
    if(activeUserFilter === "todos" || tipo === activeUserFilter){
      tr.style.display = "";
    } else tr.style.display = "none";
  });
}

/* ----------------------------- FICHA modal - cerrar ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });

/* ----------------------------- Edit modal cancel (aseguro que exista listener) ----------------------------- */
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); });

/* Nota final: se quitaron funciones y prompts de cambio/restore de contraseña y la sección CONFIG por pedido del usuario. */




