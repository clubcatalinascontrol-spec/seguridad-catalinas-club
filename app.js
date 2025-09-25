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
//});

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
    </style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  toPrint.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
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



