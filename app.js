
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
const expiredRef = collection(db, "expiredCodes"); // como en la versión original
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
// parsea ISO string o Firestore Timestamp u objetos Date
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

/* inicial: desbloqueo simple (mantengo tu flujo original de contraseña) */
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
    setTimeout(()=>{ initPassMsg.textContent = ''; initPassInput.value = ''; }, 900);tr.q// IMPRIMIR TARJETA    
"obrero":"yellow",    
"invitado":"cyan",    
"guardia":"red"  
}[udata.tipo]||"gray";
  const w=window.open("","_blank","width=600,height=380");  
w.document.write(`
    <html>
      <head>
        <title>Tarjeta ${udata.L}</title>
        <style>
          body{font-family:Arial;text-align:center;margin:0;padding:0}
          .card{
            width:15cm;
            height:6cm;
            border:12px solid ${borderColor};
            box-sizing:border-box;
            padding:8px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
          }
          .info{font-size:16px;font-weight:700;margin:6px 0}
          svg{display:block;margin:6px auto}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3Puedes pagar en cualquier OXXO, 👏🏻 Te mando los datos y me mandas foto del ticket

Tarjeta de OXXO
Número: *4217 4700 7519 0195*
Nombre: Alejandra Hernandez Lopez
Monto $200, si puedes un poco más 🙏🏻te lo recompensaré 🥰

o para transferencia usa mi clabe👇🏻.5/dist/JsBarcode.all.min.js"><\/script>
      </head>
      <body>
        <div class="card">
          <svg id="codeIn"></svg>
          <div class="info">            
${udata.L} — ${(udata.nombre||"").toUpperCase()}<br>
            DNI: ${udata.dni||""}<br>            
${udata.tipo}
          </div>
          <svg id="codeOut"></svg>
        </div>
 "#codeIn","${udata.codigoIngreso||""}",{format:"CODE128",width:2,height:40});
          JsBarcode("#codeOut","${udata.codigoSalida||""}",{format:"CODE128",width:2,height:40});
          window.print();
          setTimeout(()=>window. para transferencia usa mi clabe👇🏻.5/dist/JsBarcode.all.min.js"><\/script>
      </head>
      <body>
        <div class="card">
          <svg id="codeIn"></svg>
          <div class="info">            
${udata.L} — ${(udata.nombre||"").toUpperCase()}<br>
            DNI: ${udata.dni||""}<br>            
${udata.tipo}
          </div>
          = document.getElementById("expiredPagination");
const EXP_LIMIT = 25;
let expiredCache = [], expiredCurrentPage = 1;
// función para obtener hora en 24h desde Date o Firestore Timestamp
function horaHHMM(date){  
const d = date.toDate ? date.toDate() : date;  
const h = d.getHours().toString().padStart(2,'0');  
const m = d.getMinutes().toString().padStart(2,'0');  
return `${h}:${m}`;
}
if(expiredTableBody){  
// escuchar cambios en tiempo real  
onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot => {    
snapshot.docChanges().forEach(change => {      
const data = { __id: change.doc.id, ...change.doc.data() };      
if(change.type === "added"){        
expiredCache.unshift(data); // agrego al inicio      
}      
if(change.type === "removed"){        
expiredCache = expiredCache.filter(e => e.__id !== data.__id);      
}      
if(change.type === "modified"){        
const index = expiredCache.findIndex(e => e.__id === data.__id);        
if(index !== -1) expiredCache[index] = data;      
}    
});
    // siempre mostrar la primera página al haber nuevos registros    
expiredCurrentPage = 1;    
renderExpiredPage();  
});
  function renderExpiredPagination(totalItems){    
const totalPages = Math.max(1, Math.ceil(totalItems / EXP_LIMIT));    
expiredPaginationDiv.innerHTML = "";    
for(let p=1; p<=totalPages; p++){      
const btn = document.createElement("button");      
btn.textContent = p;      
if(p === expiredCurrentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }      
btn.addEventListener("click", ()=>{ expiredCurrentPage = p; renderExpiredPage(); });      
expiredPaginationDiv.appendChild(btn);    
}  
}
  function renderExpiredPage(){    
if(!expiredTableBody) return;    
expiredTableBody.innerHTML = "";    
const start = (expiredCurrentPage - 1) * EXP_LIMsetTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 3000); }
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

/* Render usuarios en tiempo real (orden por L) */
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
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

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
        const newL = editUserL.value.trim();
        let newNombre = document.getElementById("editUserNombre").value.trim();
        const newDni = document.getElementById("editUserDni").value.trim();
        const newCel = document.getElementById("editUserCelular").value.trim();
        const newAut = document.getElementById("editUserAutorizante").value.trim();
        const newTipo = document.getElementById("editUserTipo").value;
        if(!newL || newL==="NN" || !newNombre || !newTipo || newTipo==="NN"){ msgSpan.style.color="red"; msgSpan.textContent="Debe cargar #L, Nombre y Tipo (no NN)"; return; }
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
  if(!isUnlocked){ 
    alert("Operación no permitida. Introduzca la contraseña de apertura."); 
    return; 
  }
  const udata = u;
  const borderColor={
    "propietario":"violet",
    "administracion":"orange",
    "empleado":"green",
    "obrero":"yellow",
    "invitado":"cyan",
    "guardia":"red"
  }[udata.tipo]||"gray";

  const w=window.open("","_blank","width=600,height=380");
  w.document.write(`
    <html>
      <head>
        <title>Tarjeta ${udata.L}</title>
        <style>
          body{font-family:Arial;text-align:center;margin:0;padding:0}
          .card{
            width:15cm;
            height:6cm;
            border:12px solid ${borderColor};
            box-sizing:border-box;
            padding:8px;
            display:flex;
            flex-direction:column;
            justify-content:center;
            align-items:center;
          }
          .info{font-size:16px;font-weight:700;margin:6px 0}
          svg{display:block;margin:6px auto}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script>
      </head>
      <body>
        <div class="card">
          <svg id="codeIn"></svg>
          <div class="info">
            ${udata.L} — ${(udata.nombre||"").toUpperCase()}<br>
            DNI: ${udata.dni||""}<br>
            ${udata.tipo}
          </div>
          <svg id="codeOut"></svg>
        </div>
        <script>
          JsBarcode("#codeIn","${udata.codigoIngreso||""}",{format:"CODE128",width:2,height:40});
          JsBarcode("#codeOut","${udata.codigoSalida||""}",{format:"CODE128",width:2,height:40});
          window.print();
          setTimeout(()=>window.close(),700);
        <\/script>
      </body>
    </html>
  `);
});

/* ----------------------------- EXPIRADOS - render con paginación y tooltip hora ----------------------------- */
const expiredTableBody = document.querySelector("#expiredTable tbody");
const expiredPaginationDiv = document.getElementById("expiredPagination");
const EXP_LIMIT = 25;
let expiredCache = [], expiredCurrentPage = 1;

// función para obtener hora en 24h desde Date o Firestore Timestamp
function horaHHMM(date){
  const d = date.toDate ? date.toDate() : date;
  const h = d.getHours().toString().padStart(2,'0');
  const m = d.getMinutes().toString().padStart(2,'0');
  return `${h}:${m}`;
}

if(expiredTableBody){
  // escuchar cambios en tiempo real
  onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot => {
    snapshot.docChanges().forEach(change => {
      const data = { __id: change.doc.id, ...change.doc.data() };
      if(change.type === "added"){
        expiredCache.unshift(data); // agrego al inicio
      }
      if(change.type === "removed"){
        expiredCache = expiredCache.filter(e => e.__id !== data.__id);
      }
      if(change.type === "modified"){
        const index = expiredCache.findIndex(e => e.__id === data.__id);
        if(index !== -1) expiredCache[index] = data;
      }
    });

    // siempre mostrar la primera página al haber nuevos registros
    expiredCurrentPage = 1;
    renderExpiredPage();
  });

  function renderExpiredPagination(totalItems){
    const totalPages = Math.max(1, Math.ceil(totalItems / EXP_LIMIT));
    expiredPaginationDiv.innerHTML = "";
    for(let p=1; p<=totalPages; p++){
      const btn = document.createElement("button");
      btn.textContent = p;
      if(p === expiredCurrentPage){ btn.style.background="#d8a800"; btn.style.color="#111"; }
      btn.addEventListener("click", ()=>{ expiredCurrentPage = p; renderExpiredPage(); });
      expiredPaginationDiv.appendChild(btn);
    }
  }

  function renderExpiredPage(){
    if(!expiredTableBody) return;
    expiredTableBody.innerHTML = "";
    const start = (expiredCurrentPage - 1) * EXP_LIMIT;
    const page = expiredCache.slice(start, start + EXP_LIMIT);

    page.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `<td>${e.L || ""}</td>
        <td>${(e.nombre||"").toUpperCase()}</td>
        <td>${e.dni || ""}</td>
        <td>${e.codigoIngreso || ""}</td>
        <td>${e.codigoSalida || ""}</td>
        <td>${e.tipo || ""}</td>
        <td title="${e.when ? horaHHMM(e.when) : ''}">${e.when ? fechaDDMMYYYY(e.when) : ""}</td>`;
      expiredTableBody.appendChild(tr);
    });

    renderExpiredPagination(expiredCache.length);
  }
}

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

// render novedades (listener)
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
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); });

/* ----------------------------- MOVIMIENTOS (pestañas por tipo y paginación) ----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [], currentPage = 1, activeTipo = "todos";

// pestañas tipo
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeTipo = btn.dataset.tipo;
    currentPage = 1;
    renderMovsPage();
  });
});

// imprimir pestaña activa
const printActiveBtn = document.getElementById("printActiveBtn");
if (printActiveBtn) {
  printActiveBtn.addEventListener("click", () => {
    if (!isUnlocked) { 
      alert("Operación no permitida."); 
      return; 
    }
    printMovimientosPorTipo(activeTipo);
  });
}

// mostrar/ocultar columna autorizante según tipo
function shouldShowAutorizanteColumn(tipo) {
  return ["obrero", "invitado", "empleado", "otro"].includes(tipo);
}

// renderizar botones de paginación
function renderPagination(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / MOV_LIMIT));
  paginationDiv.innerHTML = "";
  for (let p = 1; p <= totalPages; p++) {
    const btn = document.createElement("button");
    btn.textContent = p;
    if (p === currentPage) { 
      btn.style.background = "#d8a800"; 
      btn.style.color = "#111"; 
    }
    btn.addEventListener("click", () => { 
      currentPage = p; 
      renderMovsPage(); 
    });
    paginationDiv.appendChild(btn);
  }
}

// renderizar movimientos en la tabla
function renderMovsPage() {
  if (!movimientosTableBody) return;
  movimientosTableBody.innerHTML = "";

  // Filtrar por tipo
  const filtered = activeTipo === "todos"
    ? movimientosCache
    : movimientosCache.filter(m => m.tipo === activeTipo);

  // ORDENAR POR HORA DESC (más recientes arriba)
  filtered.sort((a, b) => b.hora.toDate() - a.hora.toDate());

  // paginación
  const start = (currentPage - 1) * MOV_LIMIT;
  const page = filtered.slice(start, start + MOV_LIMIT);

  // mostrar/ocultar columna autorizante
  const table = document.getElementById("movimientosTable");
  const showAut = shouldShowAutorizanteColumn(activeTipo);
  if (showAut) {
    table.classList.remove('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th => th.style.display = 'table-cell');
  } else {
    table.classList.add('autorizante-hidden');
    document.querySelectorAll('.autorizante-th').forEach(th => th.style.display = 'none');
  }

  // renderizar filas
  page.forEach(item => {
    const tr = document.createElement("tr");
    const autorizText = item.autorizante || "";
    tr.innerHTML = `<td>${item.L || ""}</td>
      <td>${(item.nombre || "").toUpperCase()}</td>
      <td>${item.entrada || ""}</td>
      <td>${item.salida || ""}</td>
      <td>${item.tipo || ""}</td>
      <td class="autorizante-td">${autorizText}</td>
      <td>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>`;
    movimientosTableBody.appendChild(tr);

    // eliminar movimiento
    tr.querySelector(".delMov").addEventListener("click", async e => {
      if (!isUnlocked) { 
        alert("Operación no permitida. Introduzca la contraseña de apertura."); 
        return; 
      }
      if (!confirm("Eliminar movimiento permanentemente?")) return;
      try {
        await deleteDoc(doc(db, "movimientos", e.currentTarget.dataset.id));
      } catch (err) {
        console.error(err);
        alert("Error eliminando movimiento");
      }
    });
  });

  // renderizar botones de paginación
  renderPagination(filtered.length);
}

/* ----------------------------- Escuchar movimientos (order by hora desc) ----------------------------- */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot => {
  let nuevos = false;
  snapshot.docChanges().forEach(change => {
    const data = { __id: change.doc.id, ...change.doc.data() };
    if (change.type === "added") {
      movimientosCache.unshift(data);
      nuevos = true;
    }
    if (change.type === "removed") movimientosCache = movimientosCache.filter(m => m.__id !== data.__id);
    if (change.type === "modified") {
      const index = movimientosCache.findIndex(m => m.__id === data.__id);
      if (index !== -1) movimientosCache[index] = data;
    }
  });

  if (nuevos) currentPage = 1;
  renderMovsPage();

  // auto-imprimir propietarios cada múltiplo de 25 borrar "//" para habilitar
  //const propietariosCount = movimientosCache.filter(m => m.tipo === "propietario").length;
  //if (propietariosCount > 0 && propietariosCount % MOV_LIMIT === 0) {
    //printMovimientosPorTipo("propietario", true);
  //}
});

/* ----------------------------- ESCANEAR CÓDIGOS (movimientos totalmente independientes) ----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");
let scanProcessing = false;

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
      scanProcessing = false;
      return;
    }

    const u = userDoc.data();
    // Siempre crear registro totalmente nuevo
    const newMov = tipoAccion === "entrada"
      ? { L: u.L, nombre: u.nombre, dni: u.dni||"", tipo: u.tipo, autorizante: u.autorizante||"", entrada: horaActualStr(), salida: "", hora: serverTimestamp() }
      : { L: u.L, nombre: u.nombre, dni: u.dni||"", tipo: u.tipo, autorizante: u.autorizante||"", entrada: "", salida: horaActualStr(), hora: serverTimestamp() };

    await addDoc(movimientosRef, newMov);

    scanOk.style.display = "inline-block";
    setTimeout(()=>scanOk.style.display = "none", 900);
    scanInput.value = "";
    scanMessage.textContent = "";

  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  } finally { scanProcessing = false; }
});

/* ----------------------------- IMPRIMIR movimientos (A4, font-size reducido) ----------------------------- */
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
    </style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
}

/* ----------------------------- USUARIOS - filtros (botones) ----------------------------- */
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






