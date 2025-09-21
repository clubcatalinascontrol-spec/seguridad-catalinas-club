// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy
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
   USUARIOS
----------------------------- */
const userL=document.getElementById("userL");
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
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser hasta 3 dígitos"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }
  try{
    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    userMessage.textContent="Usuario agregado";
    userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){ console.error(err); userMessage.textContent="Error"; }
});

// Render usuarios en tiempo real
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
      document.getElementById("editUserL").value=u.L;
      document.getElementById("editUserNombre").value=u.nombre;
      document.getElementById("editUserDni").value=u.dni;
      document.getElementById("editUserTipo").value=u.tipo;

      const finalizeBtn=document.getElementById("finalizeEditBtn");
      const cancelBtn=document.getElementById("cancelEditBtn");
      const msgSpan=document.getElementById("editUserMsg");

      finalizeBtn.onclick=async ()=>{
        const newL=document.getElementById("editUserL").value.trim();
        const newNombre=document.getElementById("editUserNombre").value.trim();
        const newDni=document.getElementById("editUserDni").value.trim();
        const newTipo=document.getElementById("editUserTipo").value;
        if(!newL||!newNombre||!newDni||!newTipo){ msgSpan.textContent="Faltan datos, por favor complete todos los campos"; return; }
        if(!/^\d{1,3}$/.test(newL)||newNombre.length>25||!/^\d{8}$/.test(newDni)){ msgSpan.textContent="Datos inválidos"; return; }

        // Comprobar si DNI existe en otro usuario
        const qDni=query(usuariosRef, where("dni","==",newDni));
        const snapDni=await getDocs(qDni);
        if(!snapDni.empty && snapDni.docs[0].id!==id){
          msgSpan.style.color="red";
          msgSpan.textContent=`Este DNI ya existe en #L${snapDni.docs[0].data().L}`;
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
        }catch(err){ console.error(err); msgSpan.textContent="Error editando"; }
      };
      cancelBtn.onclick=()=>{ document.getElementById("editUserModal").classList.remove("active"); msgSpan.textContent=""; };
    });

    // ELIMINAR
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
   MOVIMIENTOS
----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[],currentPage=1;

function renderPagination(totalItems){
  const totalPages=Math.min(10,Math.max(1,Math.ceil(totalItems/MOV_LIMIT)));
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
    tr.innerHTML=`<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td>
      <td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td>
      <td><button class="delMov" data-id="${item.__id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click",async e=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); } catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}

onSnapshot(query(movimientosRef, orderBy("hora","desc")),snapshot=>{
  movimientosCache=snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.min(10,Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT)));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

// Imprimir movimientos
document.getElementById("printPageBtn").addEventListener("click",()=>{
  const w=window.open("","_blank","width=900,height=600");
  let html=`<html><head><title>Movimientos</title><style>table{width:100%;border-collapse:collapse} th,td{border:1px solid #000;padding:6px;text-align:center}</style></head><body><h3>Movimientos</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>H. Entrada</th><th>H. Salida</th><th>Tipo</th></tr></thead><tbody>`;
  movimientosCache.forEach(m=>{
    html+=`<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`;
  });
  html+="</tbody></table></body></html>";
  w.document.write(html);
  w.print();
});

/* -----------------------------
   ESCANEAR CÓDIGOS
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
});

scanInput.addEventListener("keydown", async (e) => {
  if (e.key !== "Enter") return;
  const code = scanInput.value.trim().toUpperCase();
  if (!code) return;

  // Buscar usuario por código de entrada o salida
  const q = query(usuariosRef, where("codigoIngreso", "==", code));
  const snap = await getDocs(q);
  let userDoc = null;
  let tipoAccion = "entrada";

  if (snap.empty) {
    const q2 = query(usuariosRef, where("codigoSalida", "==", code));
    const snap2 = await getDocs(q2);
    if (snap2.empty) {
      scanMessage.style.color = "red";
      scanMessage.textContent = "Código no válido";
      return;
    } else {
      userDoc = snap2.docs[0];
      tipoAccion = "salida";
    }
  } else {
    userDoc = snap.docs[0];
  }

  const u = userDoc.data();
  const hora = horaActualStr();

  try {
    if (tipoAccion === "entrada") {
      await addDoc(movimientosRef, {
        L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo,
        entrada: hora, salida: "", hora: new Date()
      });
    } else {
      const movQuery = query(movimientosRef, where("L", "==", u.L), where("salida", "==", ""));
      const movSnap = await getDocs(movQuery);
      if (!movSnap.empty) {
        const lastMov = movSnap.docs[movSnap.docs.length - 1];
        await updateDoc(doc(db, "movimientos", lastMov.id), { salida: hora });
      } else {
        await addDoc(movimientosRef, {
          L: u.L, nombre: u.nombre, dni: u.dni, tipo: u.tipo,
          entrada: "", salida: hora, hora: new Date()
        });
      }
    }
    scanOk.style.display = "inline";
    setTimeout(() => { scanOk.style.display = "none"; }, 1500);
    scanModal.classList.remove("active");
  } catch (err) {
    console.error(err);
    scanMessage.style.color = "red";
    scanMessage.textContent = "Error al registrar";
  }
});

/* -----------------------------
   CONFIG
----------------------------- */
const currentPassInput=document.getElementById("currentPass");
const newPassInput=document.getElementById("newPass");
const savePassBtn=document.getElementById("savePassBtn");
const restoreDefaultBtn=document.getElementById("restoreDefaultBtn");
const restoreMsg=document.getElementById("restoreMsg");

savePassBtn.addEventListener("click",()=>{
  const cur=currentPassInput.value.trim(), nue=newPassInput.value.trim();
  if(!checkPass(cur)){ restoreMsg.style.color="red"; restoreMsg.textContent="Contraseña incorrecta"; return; }
  if(!/^\d{4}$/.test(nue)){ restoreMsg.style.color="red"; restoreMsg.textContent="Nueva contraseña inválida"; return; }
  localStorage.setItem("adminPass",nue);
  restoreMsg.style.color="green"; restoreMsg.textContent="Contraseña cambiada con éxito";
  setTimeout(()=>restoreMsg.textContent="",2500);
});

restoreDefaultBtn.addEventListener("click",()=>{
  const p=prompt("Ingrese contraseña maestra para restaurar la contraseña por defecto");
  if(p!==MASTER_PASS){ alert("Contraseña incorrecta"); return; }
  localStorage.setItem("adminPass","1234");
  restoreMsg.style.color="green"; restoreMsg.textContent="La contraseña ahora es 1234";
  setTimeout(()=>restoreMsg.textContent="",2500);
});   
