:root{
  --bg:#f5f5f5; --panel:#ffffff; --accent:#f4cf19; --muted:#666666; --text:#1f2634; --white:#ffffff; --blur-bg:rgba(0,0,0,0.35);
}
/* reset y base */
*{box-sizing:border-box;margin:0;padding:0} html,body{height:100%} body{ margin:0; font-family:"Inter",Arial,sans-serif; background:var(--bg); color:var(--text); -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale; }

/* top nav centrado - header ahora FIXED y con borde inferior + sombra */
.topbar{
  padding:14px 8px;
  display:flex;
  justify-content:center;
  background:var(--panel);
  box-shadow:0 6px 18px rgba(0,0,0,0.12);
  position:fixed;
  top:0;
  left:0;
  width:100%;
  z-index:50;
  border-bottom:4px solid rgba(0,0,0,0.06);
}

/* espacio superior para compensar header fijo */
.container{ max-width:1100px; margin:18px auto; padding:80px 16px 24px; } /* 80px deja espacio para el header */

/* nav-center y botones */
.nav-center{ display:flex; gap:12px; align-items:center; }
.nav-btn{ background:#e0e0e0; color:var(--text); padding:10px 14px; border-radius:8px; border:none; font-weight:700; cursor:pointer; transition:all .12s ease; }
.nav-btn.active{ background:var(--accent); color:#111; transform:translateY(-1px); }
.nav-btn:hover{ opacity:0.95; transform:translateY(-2px); }

/* password banner (reemplaza header temporalmente) */
.password-banner{
  position:fixed;
  top:0;
  left:0;
  width:100%;
  z-index:1000;
  display:flex;
  justify-content:center;
  background:var(--panel);
  box-shadow:0 6px 18px rgba(0,0,0,0.12);
  border-bottom:4px solid rgba(0,0,0,0.06);
  padding:12px 8px;
}
.password-inner{ max-width:1100px; width:100%; display:flex; gap:12px; align-items:center; justify-content:center; flex-direction:column; padding:6px 12px; }

/* page layout */
.page{ display:none; background:var(--panel); padding:18px; border-radius:12px; box-shadow:0 6px 22px rgba(0,0,0,0.05); }
.page.active{ display:block; }
.title-centered{text-align:center; margin-bottom:12px;}

/* controls y botones globales */
.controls{ display:flex; gap:10px; justify-content:center; margin-bottom:12px; align-items:center; }
button{ background:transparent; color:var(--accent); border:2px solid var(--accent); padding:8px 12px; border-radius:8px; cursor:pointer; font-weight:600; transition:all .12s; }
button:hover{ background:var(--accent); color:#111; transform:translateY(-2px); }

/* tabs-wrap */
.tabs-wrap{ padding:6px; border-radius:8px; background:rgba(0,0,0,0.02); }

/* forms */
.form-row{ display:flex; gap:10px; justify-content:center; align-items:center; flex-wrap:wrap; margin-bottom:12px; }
textarea{ font-family:inherit; font-size:14px; }
input, select{ background:#fafafa; color:var(--text); border:1px solid #ccc; padding:8px 10px; border-radius:8px; min-width:140px; }
input::placeholder{ color:#999; }

/* tabla */
.table-wrap{ overflow:auto; margin-top:10px; border-radius:8px; background:var(--panel); padding:8px; box-shadow:0 6px 18px rgba(0,0,0,0.03); }
.sheet{ width:100%; border-collapse:collapse; background:#fff; color:#000; border-radius:6px; overflow:hidden; }
.sheet th, .sheet td{ border:1px solid #000; padding:8px 6px; font-size:14px; text-align:center; }
.sheet thead th{ background:var(--accent); color:#111; font-weight:700; }

/* botones dentro de tabla */
.sheet td button{ padding:6px 8px; border-radius:6px; cursor:pointer; border:none; }
.sheet td .del-btn{ background:#c0392b; color:#fff; }
.sheet td .edit-btn{ background:#2d88ff; color:#fff; margin-right:6px; }
.sheet td .print-btn{ background:#333; color:#fff; margin-right:6px; }
.sheet td .ficha-btn{ background:#00a3bf; color:#fff; margin-right:6px; }

/* pagination */
.pagination{ margin-top:12px; display:flex; gap:6px; justify-content:center; flex-wrap:wrap; }

/* mensajes */
.okmsg{ color:#0a0; font-weight:700; margin-left:8px; }

/* muted */
.muted{ color:var(--muted); font-size:13px; }

/* scanner modal y edit modal (oculto por defecto) */
.scanner-overlay{ display:none; position:fixed; inset:0; justify-content:center; align-items:center; background:var(--blur-bg); backdrop-filter:blur(4px); z-index:2000; }
.scanner-overlay.active{ display:flex; }
.scanner-box{ background:var(--panel); padding:20px; border-radius:12px; text-align:center; box-shadow:0 10px 40px rgba(0,0,0,0.12); }
.scanner-box input, .scanner-box select{ width:240px; padding:8px 10px; border-radius:8px; border:1px solid #ccc; font-size:16px; text-align:center; margin:4px 0; }

/* ficha modal */
.scanner-box p{ margin:6px 0; color:var(--text); }
.scanner-box strong{ color:#111; }

/* highlight reciente */
.sheet tr.recent { background: rgba(0,200,255,0.12); transition: background 4s ease; }

/* responsive tweaks */
@media (max-width:900px){
  .form-row input, .form-row select { min-width:120px; }
  .scanner-box input, .scanner-box select { width:200px; }
}

/* impresión especial (si se añade desde JS se aplicará en ventana nueva, pero dejo aquí una referencia) */
@media print {
  body { font-size:12px; }
}

/* clase helper para ocultar columna autorizante (se controla por JS) */
.autorizante-hidden .autorizante-th,
.autorizante-hidden td.autorizante-td {
  display: none;
}

/* fecha debajo de la hora en tabla novedades */
.sheet td small {
  display: block;
  color: var(--muted);
  font-size: 12px;
  margin-top: 2px;
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
