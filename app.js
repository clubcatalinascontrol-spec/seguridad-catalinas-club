// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* Firebase config */
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

/* Colecciones */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes");

/* Contraseñas */
const MASTER_PASS = "9999";
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass", "1234");
function checkPass(pass) {
  return pass === MASTER_PASS || pass === localStorage.getItem("adminPass");
}

/* Helpers */
function generarCodigo() { return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActualStr() {
  const d = new Date();
  const hh = d.getHours().toString().padStart(2,"0");
  const mm = d.getMinutes().toString().padStart(2,"0");
  const dd = d.getDate().toString().padStart(2,"0");
  const mo = (d.getMonth()+1).toString().padStart(2,"0");
  const yyyy = d.getFullYear();
  return `${hh}:${mm} (${dd}/${mo}/${yyyy})`;
}

/* Navegación SPA */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    pages.forEach(p=>p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* --- USUARIOS --- */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userTipo = document.getElementById("userTipo");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  const L = userL.value.trim();
  const nombre = userNombre.value.trim();
  const dni = userDni.value.trim();
  const tipo = userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return;}
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser hasta 3 dígitos"; return;}
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return;}
  try{
    await addDoc(usuariosRef,{
      L,nombre,dni,tipo,
      codigoIngreso: generarCodigo(),
      codigoSalida: generarCodigo()
    });
    userMessage.textContent="Usuario agregado";
    userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){ console.error(err); userMessage.textContent="Error";}
});

/* render usuarios realtime */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>
    `;
    usersTableBody.appendChild(tr);

    /* EDITAR */
    tr.querySelector(".edit-btn").addEventListener("click",async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if(!checkPass(pass)){alert("Contraseña incorrecta"); return;}
      const newL=prompt("Nuevo #L (hasta 3 dígitos):", u.L); if(newL===null) return;
      if(!/^\d{1,3}$/.test(newL)){alert("#L inválido"); return;}
      const newNombre=prompt("Nuevo nombre (max 30):", u.nombre); if(newNombre===null) return;
      if(newNombre.trim().length===0||newNombre.trim().length>30){alert("Nombre inválido"); return;}
      const newDni=prompt("Nuevo DNI (8 dígitos):", u.dni); if(newDni===null) return;
      if(!/^\d{8}$/.test(newDni)){alert("DNI inválido"); return;}
      const newTipo=prompt("Nuevo tipo (propietario|administracion|empleado|obrero|invitado|guardia|otro):", u.tipo); if(newTipo===null) return;
      try{ await updateDoc(doc(db,"usuarios",id),{L:newL.trim(),nombre:newNombre.trim(),dni:newDni.trim(),tipo:newTipo.trim()}); }
      catch(err){console.error("Error editando usuario:",err); alert("Error editando");}
    });

    /* ELIMINAR */
    tr.querySelector(".del-btn").addEventListener("click",async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if(!checkPass(pass)){alert("Contraseña incorrecta"); return;}
      if(!confirm("Eliminar usuario permanentemente? (esto invalidará sus códigos)")) return;
      try{
        if(u.codigoIngreso) await addDoc(expiredRef,{code:u.codigoIngreso,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        if(u.codigoSalida) await addDoc(expiredRef,{code:u.codigoSalida,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        await deleteDoc(doc(db,"usuarios",id));
        alert("Usuario eliminado y códigos invalidados.");
      }catch(err){console.error("Error eliminando usuario:",err); alert("Error eliminando usuario");}
    });

    /* IMPRIMIR TARJETA */
    tr.querySelector(".print-btn").addEventListener("click",async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Ingrese la contraseña administrativa (4 dígitos):");
      if(!checkPass(pass)){alert("Contraseña incorrecta"); return;}
      const borderColor=(t=>{
        switch(t){
          case "propietario":return"violet";
          case "administracion":return"orange";
          case "empleado":return"green";
          case "obrero":return"yellow";
          case "invitado":return"cyan";
          case "guardia":return"red";
          default:return"gray";
        }
      })(u.tipo);
      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>body{font-family:Arial;text-align:center} .card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:8px}</style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
          <div class="card">
            <svg id="codeIn" style="display:block;margin:6px auto"></svg>
            <div style="font-size:16px;font-weight:700;margin:6px 0">${u.L} — ${u.nombre}<br>DNI: ${u.dni}<br>${u.tipo}</div>
            <svg id="codeOut" style="display:block;margin:6px auto"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'), "${u.codigoIngreso || ''}", {format:'CODE128', width:2, height:40});
            JsBarcode(document.getElementById('codeOut'), "${u.codigoSalida || ''}", {format:'CODE128', width:2, height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          <\/script>
        </body></html>
      `);
    });
  });
});

/* --- MOVIMIENTOS --- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[], currentPage=1;

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
      const pass=prompt("Ingrese la contraseña administradora (4 dígitos):");
      if(!checkPass(pass)){alert("Contraseña incorrecta"); return;}
      if(!confirm("Eliminar movimiento permanentemente?")) return;
      try{ await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id)); }
      catch(err){ console.error("Error eliminando mov:",err); alert("Error eliminando movimiento"); }
    });
  });
  renderPagination(movimientosCache.length);
}
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache=snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  const totalPages=Math.min(10,Math.max(1,Math.ceil(movimientosCache.length/MOV_LIMIT)));
  if(currentPage>totalPages) currentPage=totalPages;
  renderMovsPage();
});

/* --- ESCANEAR --- */
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const scanBtn=document.getElementById("scanBtn");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanMessage=document.getElementById("scanMessage");
const scanOk=document.getElementById("scanOk");

scanBtn.addEventListener("click",()=>{ scanModal.classList.add("active"); scanInput.value=""; scanInput.focus(); });
cancelScanBtn.addEventListener("click",()=>{ scanModal.classList.remove("active"); scanMessage.textContent=""; });
scanInput.addEventListener("keypress",async e=>{
  if(e.key==="Enter"){
    const code=scanInput.value.trim();
    if(!code){ scanMessage.textContent="Código vacío"; return; }
    // buscar usuario por códigoIngreso o códigoSalida
    const snap=await getDocs(usuariosRef);
    let userFound=null, tipoMov=null;
    snap.forEach(d=>{
      const u=d.data();
      if(u.codigoIngreso===code){ userFound=u; tipoMov="entrada"; }
      else if(u.codigoSalida===code){ userFound=u; tipoMov="salida"; }
    });
    if(!userFound){ scanMessage.textContent="Código inválido"; return; }
    // agregar movimiento
    try{
      await addDoc(movimientosRef,{
        L:userFound.L,
        nombre:userFound.nombre,
        dni:userFound.dni,
        tipo:userFound.tipo,
        entrada: tipoMov==="entrada"? horaActualStr(): "",
        salida: tipoMov==="salida"? horaActualStr(): "",
        hora:new Date()
      });
      scanOk.style.display="inline"; setTimeout(()=>scanOk.style.display="none",1200);
      scanModal.classList.remove("active");
    }catch(err){ console.error(err); scanMessage.textContent="Error registrando"; }
  }
});

/* --- CONFIG --- */
const currentPass=document.getElementById("currentPass");
const newPass=document.getElementById("newPass");
const savePassBtn=document.getElementById("savePassBtn");
const restorePassBtn=document.getElementById("restorePassBtn");

savePassBtn.addEventListener("click",()=>{
  const current=currentPass.value.trim();
  const nueva=newPass.value.trim();
  if(current!==localStorage.getItem("adminPass")){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(nueva)){ alert("Nueva contraseña debe tener 4 dígitos"); return; }
  localStorage.setItem("adminPass",nueva);
  alert("Contraseña cambiada correctamente"); currentPass.value=""; newPass.value="";
});

/* Restaurar contraseña por defecto */
restorePassBtn.addEventListener("click",()=>{
  const pass=prompt("Ingrese contraseña maestra (9999) para restaurar:");
  if(pass!==MASTER_PASS){ alert("Contraseña maestra incorrecta"); return; }
  localStorage.setItem("adminPass","1234");
  alert("Contraseña restaurada a valor por defecto: 1234");
});
