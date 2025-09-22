// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

/* ----------------------------- Contraseñas ----------------------------- */
const MASTER_PASS = "9999";
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234");
function checkPass(pass){
  return pass===MASTER_PASS || pass===localStorage.getItem("adminPass");
}

/* ----------------------------- Helpers ----------------------------- */
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }

function horaActualStr(){
  const d=new Date();
  const hh=d.getHours().toString().padStart(2,"0");
  const mm=d.getMinutes().toString().padStart(2,"0");
  const dd=d.getDate().toString().padStart(2,"0");
  const mo=(d.getMonth()+1).toString().padStart(2,"0");
  const yyyy=d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
}
function fechaHoyDDMMYYYY(){
  const d=new Date();
  const dd=d.getDate().toString().padStart(2,"0");
  const mo=(d.getMonth()+1).toString().padStart(2,"0");
  const yyyy=d.getFullYear();
  return `(${dd}/${mo}/${yyyy})`;
}
function formatDateFromTimestamp(ts){
  if(!ts) return "";
  try{
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const dd=d.getDate().toString().padStart(2,"0");
    const mo=(d.getMonth()+1).toString().padStart(2,"0");
    const yyyy=d.getFullYear();
    const hh=d.getHours().toString().padStart(2,"0");
    const mm=d.getMinutes().toString().padStart(2,"0");
    return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
  }catch(e){ return ""; }
}

/* ----------------------------- Navegación SPA con protección para EXPIRADOS ----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
navBtns.forEach(btn=>btn.addEventListener("click", async ()=>{
  const target=btn.dataset.section;
  // Si es expirados, pedir contraseña
  if(target==="expirados"){
    const pass = prompt("Ingrese contraseña para ver EXPIRADOS");
    if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
  }
  pages.forEach(p=>p.classList.remove("active"));
  document.getElementById(target).classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* ----------------------------- Select #L desplegable (con NN por defecto) ----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  // mantener NN como opción 0
  userL.innerHTML = "";
  editUserL.innerHTML = "";
  const nnOpt = document.createElement("option");
  nnOpt.value = "NN";
  nnOpt.textContent = "NN";
  userL.appendChild(nnOpt);
  const nnOpt2 = nnOpt.cloneNode(true);
  editUserL.appendChild(nnOpt2);
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option");
    opt.value=val; opt.textContent=val;
    userL.appendChild(opt);
    const opt2 = opt.cloneNode(true);
    editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* ----------------------------- USUARIOS (elementos) ----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const userCelular=document.getElementById("userCelular");
const userAutorizante=document.getElementById("userAutorizante");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

/* ----------------------------- Validaciones util ----------------------------- */
function soloLetras(str){ return /^[A-Za-zÀ-ÿ\s]+$/.test(str); }
function onlyDigits(str){ return /^\d+$/.test(str); }

/* ----------------------------- Agregar usuario ----------------------------- */
addUserBtn.addEventListener("click", async ()=>{
  const L = userL.value.trim();
  let nombre = userNombre.value.trim();
  const dni = userDni.value.trim();
  const tipo = userTipo.value;
  const celular = userCelular.value.trim();
  let autorizante = userAutorizante.value.trim();

  // Requeridos: L (no NN), Nombre, Tipo (no NN)
  if(!L || L==="NN" || !nombre || !tipo || tipo==="NN"){
    userMessage.style.color="red";
    userMessage.textContent = "Debe cargar un nombre, un número de Lote y un Tipo para continuar";
    setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; },3000);
    return;
  }

  // Validaciones
  if(!/^\d{3}$/.test(L) && L!=="NN"){ userMessage.style.color="red"; userMessage.textContent="#L debe ser 3 dígitos"; return; }
  if(dni && !/^\d{8}$/.test(dni)){ userMessage.style.color="red"; userMessage.textContent="DNI debe tener 8 dígitos"; return; }
  if(celular && !/^\d{10}$/.test(celular)){ userMessage.style.color="red"; userMessage.textContent="Celular debe tener 10 dígitos"; return; }
  if(autorizante && !soloLetras(autorizante)){ userMessage.style.color="red"; userMessage.textContent="Autorizante solo letras"; return; }
  if(autorizante && autorizante.length>12){ userMessage.style.color="red"; userMessage.textContent="Autorizante máximo 12 letras"; return; }

  // Forzar mayúsculas en nombre y autorizante (tipo no)
  nombre = nombre.toUpperCase();
  if(autorizante) autorizante = autorizante.toUpperCase();

  try{
    // Comprobar DNI duplicado si se ingresó
    if(dni){
      const qDni = query(usuariosRef, where("dni","==",dni));
      const existing = await getDocs(qDni);
      if(!existing.empty){
        userMessage.style.color="red";
        userMessage.textContent = "DNI ya registrado";
        setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
        return;
      }
    }

    const codigoIngreso = generarCodigo();
    const codigoSalida = generarCodigo();
    const fechaExpedicion = fechaHoyDDMMYYYY(); // formato solicitado (24/12/2024) con paréntesis

    await addDoc(usuariosRef, {
      L, nombre, dni, tipo, celular: celular||"", autorizante: autorizante||"", fechaExpedicion,
      codigoIngreso, codigoSalida
    });

    userMessage.style.color = "green";
    userMessage.textContent="Usuario agregado";
    // limpiar
    userL.value="NN";
    userNombre.value="";
    userDni.value="";
    userTipo.value="NN";
    userCelular.value="";
    userAutorizante.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){
    console.error(err);
    userMessage.style.color="red";
    userMessage.textContent="Error al agregar usuario";
    setTimeout(()=>userMessage.textContent="",2500);
  }
});

/* ----------------------------- RENDER USUARIOS en tiempo real ----------------------------- */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    // Mostrar nombre en mayúsculas (guardamos ya en mayúsculas al crear/editar)
    const celularDisplay = u.celular || "";
    const autorizanteDisplay = u.tipo==="invitado" ? (u.autorizante||"") : (u.autorizante||"");
    tr.innerHTML = `
      <td>${u.L||""}</td>
      <td>${(u.nombre||"").toUpperCase()}</td>
      <td>${u.dni||""}</td>
      <td>${celularDisplay}</td>
      <td>${u.fechaExpedicion||""}</td>
      <td>${ u.tipo === "invitado" ? (u.autorizante||"") : (u.autorizante||"") }</td>
      <td>${u.tipo||""}</td>
      <td>
        <button class="action-ficha" data-id="${docSnap.id}">FICHA</button>
        <button class="action-edit" data-id="${docSnap.id}">Editar</button>
        <button class="action-delete" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    // FICHA (solo vista, abre modal)
    tr.querySelector(".action-ficha").addEventListener("click", async ()=>{
      const docRef = doc(db,"usuarios",docSnap.id);
      const snap = await getDocs(query(usuariosRef, where("L","==",u.L)));
      // mejor leer el doc directamente
      const userDoc = docSnap; // already have
      const data = userDoc.data();
      document.getElementById("fichaL").textContent = data.L || "";
      document.getElementById("fichaNombre").textContent = (data.nombre||"").toUpperCase();
      document.getElementById("fichaDni").textContent = data.dni || "";
      document.getElementById("fichaCelular").textContent = data.celular || "";
      document.getElementById("fichaFechaExp").textContent = data.fechaExpedicion || "";
      document.getElementById("fichaAutorizante").textContent = data.autorizante || "";
      document.getElementById("fichaTipo").textContent = data.tipo || "";
      // Autorizante visible solo si tipo invitado
      if(data.tipo !== "invitado"){
        document.getElementById("fichaAutorizanteRow").style.display = "none";
      }else{
        document.getElementById("fichaAutorizanteRow").style.display = "block";
      }
      document.getElementById("fichaModal").classList.add("active");
    });

    // EDITAR (requiere contraseña)
    tr.querySelector(".action-edit").addEventListener("click", async ()=>{
      const id = docSnap.id;
      const pass = prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }

      document.getElementById("editUserModal").classList.add("active");
      editUserL.value = u.L || "NN";
      document.getElementById("editUserNombre").value = u.nombre || "";
      document.getElementById("editUserDni").value = u.dni || "";
      document.getElementById("editUserTipo").value = u.tipo || "NN";
      document.getElementById("editUserCelular").value = u.celular || "";
      document.getElementById("editUserAutorizante").value = u.autorizante || "";
      document.getElementById("editUserFechaExp").value = u.fechaExpedicion || "";

      const finalizeBtn=document.getElementById("finalizeEditBtn");
      const cancelBtn=document.getElementById("cancelEditBtn");
      const msgSpan=document.getElementById("editUserMsg");

      finalizeBtn.onclick=async ()=>{
        const newL = editUserL.value.trim();
        let newNombre = document.getElementById("editUserNombre").value.trim();
        const newDni = document.getElementById("editUserDni").value.trim();
        const newTipo = document.getElementById("editUserTipo").value;
        const newCelular = document.getElementById("editUserCelular").value.trim();
        let newAutorizante = document.getElementById("editUserAutorizante").value.trim();

        if(!newL || newL==="NN" || !newNombre || !newTipo || newTipo==="NN"){
          msgSpan.style.color="red"; msgSpan.textContent="Debe cargar un nombre, un número de Lote y un Tipo para continuar"; return;
        }
        if(newDni && !/^\d{8}$/.test(newDni)){ msgSpan.style.color="red"; msgSpan.textContent="DNI debe tener 8 dígitos"; return; }
        if(newCelular && !/^\d{10}$/.test(newCelular)){ msgSpan.style.color="red"; msgSpan.textContent="Celular debe tener 10 dígitos"; return; }
        if(newAutorizante && !soloLetras(newAutorizante)){ msgSpan.style.color="red"; msgSpan.textContent="Autorizante solo letras"; return; }
        if(newAutorizante && newAutorizante.length>12){ msgSpan.style.color="red"; msgSpan.textContent="Autorizante máximo 12 letras"; return; }

        // forzar mayúsculas en nombre/autorizante
        newNombre = newNombre.toUpperCase();
        if(newAutorizante) newAutorizante = newAutorizante.toUpperCase();

        // comprobar DNI duplicado
        if(newDni){
          const qDni = query(usuariosRef, where("dni","==",newDni));
          const snapDni = await getDocs(qDni);
          if(!snapDni.empty && snapDni.docs[0].id !== id){
            msgSpan.style.color="red"; msgSpan.textContent="DNI ya registrado en otro usuario"; return;
          }
        }
        try{
          await updateDoc(doc(db,"usuarios",id), {
            L: newL, nombre: newNombre, dni: newDni, tipo: newTipo, celular: newCelular||"", autorizante: newAutorizante||""
          });
          msgSpan.style.color="green"; msgSpan.textContent="Usuario editado con éxito";
          setTimeout(()=>{ document.getElementById("editUserModal").classList.remove("active"); msgSpan.textContent=""; msgSpan.style.color="#0a0"; },1500);
        }catch(err){ console.error(err); msgSpan.style.color="red"; msgSpan.textContent="Error editando"; }
      };
      cancelBtn.onclick=()=>{ document.getElementById("editUserModal").classList.remove("active"); document.getElementById("editUserMsg").textContent=""; };
    });

    // ELIMINAR USUARIO (requiere contraseña)
    tr.querySelector(".action-delete").addEventListener("click", async ()=>{
      const id = docSnap.id;
      const pass = prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente? (esto invalidará sus códigos)")) return;
      try{
        // Crear registro único en expiredRef con ambos códigos y metadata
        await addDoc(expiredRef, {
          L: u.L || "", nombre: u.nombre || "", dni: u.dni || "", tipo: u.tipo || "",
          codigoIngreso: u.codigoIngreso || "", codigoSalida: u.codigoSalida || "",
          celular: u.celular || "", autorizante: u.autorizante || "",
          when: serverTimestamp()
        });
        await deleteDoc(doc(db,"usuarios",id));
        alert("Usuario eliminado y códigos invalidados.");
      }catch(err){ console.error(err); alert("Error eliminando usuario"); }
    });

    // IMPRIMIR TARJETA (requiere contraseña)
    tr.querySelector(".print-btn").addEventListener("click", ()=>{
      const pass = prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      const borderColor = {"propietario":"violet","administracion":"orange","empleado":"green","obrero":"yellow","invitado":"cyan","guardia":"red"}[u.tipo]||"gray";
      const w = window.open("","_blank","width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>body{font-family:Arial;text-align:center}.card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:8px}</style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script></head><body>
        <div class="card">
          <svg id="codeIn" style="display:block;margin:6px auto"></svg>
          <div style="font-size:16px;font-weight:700;margin:6px 0">${u.L} — ${u.nombre}<br>DNI: ${u.dni || ""}<br>${u.tipo}</div>
          <svg id="codeOut" style="display:block;margin:6px auto"></svg>
        </div>
        <script>
          JsBarcode(document.getElementById('codeIn'),"${u.codigoIngreso||''}",{format:'CODE128',width:2,height:40});
          JsBarcode(document.getElementById('codeOut'),"${u.codigoSalida||''}",{format:'CODE128',width:2,height:40});
          window.print(); setTimeout(()=>window.close(),700);
        <\/script>
        </body></html>
      `);
    });

  });
});

/* ----------------------------- MOVIMIENTOS (tabla PANEL) ----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[], currentPage=1;
let activeTipo = "todos";

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

// botón imprimir de la pestaña activa
const printActiveBtn = document.getElementById("printActiveBtn");
printActiveBtn.addEventListener("click", ()=>{
  printMovimientosPorTipo(activeTipo);
});

// No existe ya "Imprimir todos (global)" (eliminado)

// Paginación y render
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
function renderMovsPage(){
  movimientosTableBody.innerHTML="";
  const filtered = activeTipo === "todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===activeTipo);
  const start=(currentPage-1)*MOV_LIMIT;
  const page=filtered.slice(start,start+MOV_LIMIT);
  page.forEach(item=>{
    const tr=document.createElement("tr");
    // DNI ya no se muestra en PANEL
    tr.innerHTML = `
      <td>${item.L||""}</td>
      <td>${(item.nombre||"").toUpperCase()}</td>
      <td>${item.entrada||""}</td>
      <td>${item.salida||""}</td>
      <td>${item.tipo||""}</td>
      <td>
        <button class="delMov action-delete" data-id="${item.__id}">Eliminar</button>
      </td>
    `;
    movimientosTableBody.appendChild(tr);

    // Eliminar movimiento
    tr.querySelector(".delMov").addEventListener("click", async e=>{
      const pass = prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos", e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(filtered.length);
}

/* Escuchar movimientos ordenados por hora descendente */
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({ __id: d.id, ...d.data() }));
  const totalPages = Math.max(1, Math.ceil(movimientosCache.length / MOV_LIMIT));
  if(currentPage > totalPages) currentPage = totalPages;
  renderMovsPage();

  // chequeo auto-print propietarios como en versión anterior (si quieres quitarlo lo sacamos)
  const propietariosCount = movimientosCache.filter(m=>m.tipo==="propietario").length;
  if(propietariosCount>0 && propietariosCount % MOV_LIMIT === 0){
    // auto-print propietarios (comportamiento anterior), aquí no pedimos contraseña
    printMovimientosPorTipo("propietario", true);
  }
});

/* Imprimir movimientos por tipo (sin DNI en PANEL/ impresión desde PANEL) */
function printMovimientosPorTipo(tipo, auto=false){
  if(!auto){
    const pass = prompt("Ingrese contraseña para imprimir movimientos de la pestaña");
    if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
  }
  const filtered = tipo==="todos" ? movimientosCache : movimientosCache.filter(m=>m.tipo===tipo);
  const w = window.open("","_blank","width=900,height=600");
  const title = tipo==="todos" ? "Movimientos - Todos" : `Movimientos - ${tipo}`;
  let html = `<html><head><title>${title}</title><style>table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body><h3>${title}</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  filtered.forEach(m=>{
    html += `<tr><td>${m.L||""}</td><td>${(m.nombre||"").toUpperCase()}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html += `</tbody></table></body></html>`;
  w.document.write(html);
  w.print();
}

/* ----------------------------- ESCANEAR CÓDIGOS AUTOMÁTICO (sin Enter) ----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scanModal = document.getElementById("scanModal");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
const scanMessage = document.getElementById("scanMessage");
const scanOk = document.getElementById("scanOk");

scanBtn.addEventListener("click", () => {
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
  try{
    let userDoc = null;
    let tipoAccion = "entrada";
    const qIngreso = query(usuariosRef, where("codigoIngreso", "==", code));
    const snap = await getDocs(qIngreso);
    if(!snap.empty){ userDoc = snap.docs[0]; tipoAccion = "entrada"; }
    else{
      const qSalida = query(usuariosRef, where("codigoSalida", "==", code));
      const snap2 = await getDocs(qSalida);
      if(!snap2.empty){ userDoc = snap2.docs[0]; tipoAccion = "salida"; }
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
      await addDoc(movimientosRef, {
        L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, entrada: horaActualStr(), salida: "", hora: serverTimestamp()
      });
    } else {
      // SALIDA
      const movQ = query(movimientosRef, where("L","==",u.L), where("salida","==",""));
      const movSnap = await getDocs(movQ);
      if(!movSnap.empty){
        // elegir el más reciente por campo hora
        let chosen = movSnap.docs[0];
        let chosenTime = chosen.data().hora && chosen.data().hora.toDate ? chosen.data().hora.toDate() : new Date(0);
        movSnap.docs.forEach(d=>{
          const t = d.data().hora && d.data().hora.toDate ? d.data().hora.toDate() : new Date(0);
          if(t > chosenTime){ chosen = d; chosenTime = t; }
        });
        await updateDoc(doc(db,"movimientos", chosen.id), { salida: horaActualStr() });
      } else {
        await addDoc(movimientosRef, { L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo, entrada: "", salida: horaActualStr(), hora: serverTimestamp() });
      }
    }
    scanOk.style.display = "inline-block";
    setTimeout(()=>scanOk.style.display = "none", 900);
    scanModal.classList.remove("active");
    scanInput.value = "";
  }catch(err){
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    setTimeout(()=>{ scanMessage.textContent=""; },1800);
  }finally{
    scanProcessing = false;
  }
});

/* ----------------------------- CONFIGURACIÓN CONTRASEÑA ----------------------------- */
document.getElementById("savePassBtn").addEventListener("click", ()=>{
  const cur=document.getElementById("currentPass").value.trim();
  const nue=document.getElementById("newPass").value.trim();
  if(!checkPass(cur)){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(nue)){ alert("Nueva contraseña debe ser 4 dígitos"); return; }
  localStorage.setItem("adminPass", nue);
  alert("Contraseña cambiada correctamente");
  document.getElementById("currentPass").value="";
  document.getElementById("newPass").value="";
});
document.getElementById("restoreDefaultBtn").addEventListener("click", ()=>{
  localStorage.setItem("adminPass","1234");
  document.getElementById("restoreMsg").textContent="Restaurada a 1234";
  setTimeout(()=>document.getElementById("restoreMsg").textContent="",2000);
});

/* ----------------------------- NOVEDADES (CRUD simple: agregar + editar) ----------------------------- */
const novedadesTableBody = document.querySelector("#novedadesTable tbody");
const saveNovedadBtn = document.getElementById("saveNovedadBtn");
const novedadText = document.getElementById("novedadText");

saveNovedadBtn.addEventListener("click", async ()=>{
  const text = novedadText.value;
  if(!text || text.trim()===""){ alert("Ingrese una novedad"); return; }
  try{
    await addDoc(novedadesRef, { text, createdAt: serverTimestamp() });
    novedadText.value = "";
  }catch(err){ console.error(err); alert("Error guardando novedad"); }
});

onSnapshot(query(novedadesRef, orderBy("createdAt","desc")), snapshot=>{
  novedadesTableBody.innerHTML = "";
  snapshot.docs.forEach(docSnap=>{
    const n = docSnap.data();
    const tr = document.createElement("tr");
    const horaStr = n.createdAt ? formatDateFromTimestamp(n.createdAt) : "";
    tr.innerHTML = `<td>${horaStr}</td><td style="text-align:left;max-width:600px;white-space:pre-wrap;">${n.text||""}</td><td><button class="action-edit" data-id="${docSnap.id}">Editar</button></td>`;
    novedadesTableBody.appendChild(tr);

    tr.querySelector(".action-edit").addEventListener("click", async ()=>{
      const nuevo = prompt("Editar novedad:", n.text || "");
      if(nuevo===null) return;
      try{ await updateDoc(doc(db,"novedades",docSnap.id), { text: nuevo }); } catch(err){ console.error(err); alert("Error editando novedad"); }
    });
  });
});

/* ----------------------------- EXPIRADOS (solo vista, no acciones ni impresión) ----------------------------- */
const expiradosTableBody = document.querySelector("#expiradosTable tbody");

onSnapshot(query(expiredRef, orderBy("when","desc")), snapshot=>{
  expiradosTableBody.innerHTML = "";
  snapshot.docs.forEach(docSnap=>{
    const e = docSnap.data();
    const tr = document.createElement("tr");
    // Nombre/campos mostrados tal como solicitaste
    const fechaElim = e.when ? formatDateFromTimestamp(e.when) : "";
    tr.innerHTML = `
      <td>${e.L||""}</td>
      <td>${(e.nombre||"").toUpperCase()}</td>
      <td>${e.dni||""}</td>
      <td>${fechaElim}</td>
      <td>${e.tipo||""}</td>
      <td>${e.codigoIngreso||""}</td>
      <td>${e.codigoSalida||""}</td>
    `;
    expiradosTableBody.appendChild(tr);
  });
});

/* ----------------------------- MODAL FICHA cerrar ----------------------------- */
document.getElementById("closeFichaBtn").addEventListener("click", ()=>{ document.getElementById("fichaModal").classList.remove("active"); });

/* ----------------------------- Cerrar edit modal ----------------------------- */
document.getElementById("cancelEditBtn").addEventListener("click", ()=>{ document.getElementById("editUserModal").classList.remove("active"); document.getElementById("editUserMsg").textContent=""; });

/* ----------------------------- Ajustes finales: ocultar elementos y placeholders ya hechos en HTML/CSS ----------------------------- */
/* Nada más—todas las funcionalidades principales solicitadas están implementadas:
   - DNI oculto en PANEL (pero visible en USUARIOS y FICHA)
   - EXPIRADOS con password y campos Código de Ingreso / Salida / F. Eliminación
   - Eliminado botón 'Imprimir todos (global)'
   - Nuevo botón IMPRIMIR (por pestaña)
   - Nuevo campo Celular, Autorizante y Fecha de expedición (autogenerada)
   - FICHA en PANEL (solo vista)
   - Validaciones: celular 10 dígitos, autorizante letras max 12, #L/Tipo/Nombre obligatorios
   - Forzar mayúsculas en nombre/autorizante al guardar/editar (Tipo no)
   - Botones y estilos de acción armonizados
   - Novedades con tabla Hora-Novedad-Acción (editable)
*/

