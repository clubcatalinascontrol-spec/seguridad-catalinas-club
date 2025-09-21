// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* -----------------------------
   Firebase config
----------------------------- */
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

/* -----------------------------
   Colecciones
----------------------------- */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes");

/* -----------------------------
   Contraseñas
----------------------------- */
const MASTER_PASS = "9999";
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234");
function checkPass(pass){ return pass===MASTER_PASS || pass===localStorage.getItem("adminPass"); }

/* -----------------------------
   Helpers
----------------------------- */
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

/* -----------------------------
   Navegación SPA
----------------------------- */
const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
navBtns.forEach(btn=>btn.addEventListener("click",()=>{
  const target=btn.dataset.section;
  pages.forEach(p=>p.classList.remove("active"));
  document.getElementById(target).classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* -----------------------------
   Select #L desplegable
----------------------------- */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
function llenarLSelect(){
  userL.innerHTML = "";
  editUserL.innerHTML = "";
  for(let i=0;i<1000;i++){
    const val = i.toString().padStart(3,"0");
    const opt = document.createElement("option"); opt.value=val; opt.textContent=val;
    userL.appendChild(opt);
    const opt2 = document.createElement("option"); opt2.value=val; opt2.textContent=val;
    editUserL.appendChild(opt2);
  }
}
llenarLSelect();

/* -----------------------------
   USUARIOS
----------------------------- */
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// Agregar usuario
addUserBtn.addEventListener("click",async ()=>{
  const L=userL.value.trim(), nombre=userNombre.value.trim(), dni=userDni.value.trim(), tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return; }
  if(!/^\d{3}$/.test(L)){ userMessage.textContent="#L debe ser 3 dígitos"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }
  try{
    // Verificar que DNI no exista ya en otro usuario
    const qDni = query(usuariosRef, where("dni","==",dni));
    const existing = await getDocs(qDni);
    if(!existing.empty){
      userMessage.style.color = "red";
      userMessage.textContent = "DNI ya registrado";
      setTimeout(()=>{ userMessage.textContent=""; userMessage.style.color=""; }, 2500);
      return;
    }

    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    userMessage.style.color = "green";
    userMessage.textContent="Usuario agregado";
    userL.value="000"; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){ console.error(err); userMessage.textContent="Error"; }
});

// Render usuarios en tiempo real (orden por L)
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    // EDITAR
    tr.querySelector(".edit-btn").addEventListener("click",()=>{
      const id=docSnap.id;
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      document.getElementById("editUserModal").classList.add("active");
      editUserL.value=u.L;
      document.getElementById("editUserNombre").value=u.nombre;
      document.getElementById("editUserDni").value=u.dni;
      document.getElementById("editUserTipo").value=u.tipo;

      const finalizeBtn=document.getElementById("finalizeEditBtn");
      const cancelBtn=document.getElementById("cancelEditBtn");
      const msgSpan=document.getElementById("editUserMsg");

      finalizeBtn.onclick=async ()=>{
        const newL=editUserL.value.trim();
        const newNombre=document.getElementById("editUserNombre").value.trim();
        const newDni=document.getElementById("editUserDni").value.trim();
        const newTipo=document.getElementById("editUserTipo").value;
        if(!newL||!newNombre||!newDni||!newTipo){ msgSpan.style.color="red"; msgSpan.textContent="Faltan datos, por favor complete todos los campos"; return; }
        if(!/^\d{3}$/.test(newL)){ msgSpan.style.color="red"; msgSpan.textContent="#L debe ser 3 dígitos"; return; }
        if(!/^\d{8}$/.test(newDni)){ msgSpan.style.color="red"; msgSpan.textContent="DNI debe tener 8 dígitos"; return; }

        // Comprobar si DNI existe en otro usuario
        const qDni=query(usuariosRef, where("dni","==",newDni));
        const snapDni=await getDocs(qDni);
        if(!snapDni.empty && snapDni.docs[0].id!==id){
          msgSpan.style.color="red";
          msgSpan.textContent="DNI ya registrado en otro usuario";
          return;
        }

        try{
          await updateDoc(doc(db,"usuarios",id),{L:newL,nombre:newNombre,dni:newDni,tipo:newTipo});
          msgSpan.style.color="green";
          msgSpan.textContent="Usuario editado con éxito";
          setTimeout(()=>{
            document.getElementById("editUserModal").classList.remove("active");
            msgSpan.textContent=""; msgSpan.style.color="#0a0";
          },1500);
        }catch(err){ console.error(err); msgSpan.style.color="red"; msgSpan.textContent="Error editando"; }
      };
      cancelBtn.onclick=()=>{ document.getElementById("editUserModal").classList.remove("active"); msgSpan.textContent=""; };
    });

    // ELIMINAR USUARIO
    tr.querySelector(".del-btn").addEventListener("click",async ()=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente? (esto invalidará sus códigos)")) return;
      try{
        if(u.codigoIngreso) await addDoc(expiredRef,{code:u.codigoIngreso,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        if(u.codigoSalida) await addDoc(expiredRef,{code:u.codigoSalida,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        await deleteDoc(doc(db,"usuarios",docSnap.id));
        alert("Usuario eliminado y códigos invalidados.");
      }catch(err){ console.error(err); alert("Error eliminando usuario"); }
    });

    // IMPRIMIR TARJETA
    tr.querySelector(".print-btn").addEventListener("click",()=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      const borderColor={"propietario":"violet","administracion":"orange","empleado":"green","obrero":"yellow","invitado":"cyan","guardia":"red"}[u.tipo]||"gray";
      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>body{font-family:Arial;text-align:center}.card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:8px}</style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"><\/script></head><body>
          <div class="card">
            <svg id="codeIn" style="display:block;margin:6px auto"></svg>
            <div style="font-size:16px;font-weight:700;margin:6px 0">${u.L} — ${u.nombre}<br>DNI: ${u.dni}<br>${u.tipo}</div>
            <svg id="codeOut" style="display:block;margin:6px auto"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'),"${u.codigoIngreso||''}",{format:'CODE128',width:2,height:40});
            JsBarcode(document.getElementById('codeOut'),"${u.codigoSalida||''}",{format:'CODE128',width:2,height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          <\/script>
        </body></html>
      `);
    });
  });
});

/* -----------------------------
   MOVIMIENTOS (ordenados por hora desc — más recientes arriba)
----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[],currentPage=1;

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
  const start=(currentPage-1)*MOV_LIMIT;
  const page=movimientosCache.slice(start,start+MOV_LIMIT);
  page.forEach(item=>{
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${item.L||""}</td><td>${item.nombre||""}</td><td>${item.dni||""}</td>
      <td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo||""}</td>
      <td>
        <button class="delMov" data-id="${item.__id}">Eliminar</button>
      </td>`;
    movimientosTableBody.appendChild(tr);

    // Eliminar movimiento (requiere contraseña maestra o admin)
    tr.querySelector(".delMov").addEventListener("click",async e=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}

// Escuchar movimientos ordenados por hora descendente (más recientes arriba)
onSnapshot(query(movimientosRef, orderBy("hora","desc")),snapshot=>{
  movimientosCache=snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

// Imprimir movimientos
document.getElementById("printPageBtn").addEventListener("click",()=>{
  const pass=prompt("Ingrese contraseña para imprimir movimientos");
  if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
  const w=window.open("","_blank","width=900,height=600");
  let html=`<html><head><title>Movimientos</title><style>table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body><h3>Movimientos</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  movimientosCache.forEach(m=>{
    html+=`<tr><td>${m.L||""}</td><td>${m.nombre||""}</td><td>${m.dni||""}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo||""}</td></tr>`;
  });
  html+="</tbody></table></body></html>";
  w.document.write(html);
  w.print();
});

/* -----------------------------
   ESCANEAR CÓDIGOS AUTOMÁTICO (sin Enter)
----------------------------- */
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

  try {
    let userDoc = null;
    let tipoAccion = "entrada";

    const qIngreso = query(usuariosRef, where("codigoIngreso", "==", code));
    const snap = await getDocs(qIngreso);
    if(!snap.empty){
      userDoc = snap.docs[0];
    } else {
      const qSalida = query(usuariosRef, where("codigoSalida", "==", code));
      const snap2 = await getDocs(qSalida);
      if(!snap2.empty){ userDoc = snap2.docs[0]; tipoAccion="salida"; }
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
        L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo,
        entrada: horaActualStr(), salida: "", hora: serverTimestamp()
      });
    } else {
      // CORRECCIÓN: Registro de salida funciona aunque no haya entrada
      const movQ = query(movimientosRef, where("L","==",u.L), where("salida","==",""), orderBy("hora","desc"), limit(1));
      const movSnap = await getDocs(movQ);
      if(!movSnap.empty){
        const lastMov = movSnap.docs[0];
        await updateDoc(doc(db,"movimientos",lastMov.id), { salida: horaActualStr() });
      } else {
        // Si no hay movimiento abierto, se crea uno solo con salida
        await addDoc(movimientosRef, {
          L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo,
          entrada: "", salida: horaActualStr(), hora: serverTimestamp()
        });
      }
    }

    scanMessage.style.color = "green";
    scanMessage.textContent = `Registrado ${tipoAccion} de ${u.nombre}`;
    scanOk.play?.();
    setTimeout(()=>{ scanMessage.textContent=""; scanInput.value=""; scanProcessing=false; }, 1800);

  } catch(err){
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
    scanProcessing = false;
    setTimeout(()=>{ scanMessage.textContent=""; scanInput.value=""; },1800);
  }
});
