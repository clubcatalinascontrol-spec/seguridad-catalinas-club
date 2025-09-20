import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
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

/* Contraseña admin */
if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
if(!localStorage.getItem("masterPass")) localStorage.setItem("masterPass","9999");

/* Helpers */
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

/* Navegación SPA */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const target = btn.dataset.section;
    pages.forEach(p=>p.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navBtns.forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
  });
});

/* USUARIOS */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userTipo = document.getElementById("userTipo");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  const L=userL.value.trim();
  const nombre=userNombre.value.trim();
  const dni=userDni.value.trim();
  const tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return; }
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser hasta 3 dígitos"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }

  try{
    await addDoc(usuariosRef,{
      L,nombre,dni,tipo,
      codigoIngreso: generarCodigo(),
      codigoSalida: generarCodigo()
    });
    userMessage.textContent="Usuario agregado con éxito";
    userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2800);
  } catch(err){ console.error(err); userMessage.textContent="Error al agregar"; }
});

/* Render usuarios en tiempo real */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="editUser" data-id="${docSnap.id}">Editar</button>
        <button class="delUser" data-id="${docSnap.id}">Eliminar</button>
        <button class="printUser" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

    // Editar
    tr.querySelector(".editUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("masterPass")){
        alert("Contraseña incorrecta"); return; }

      const newL=prompt("Nuevo #L:", u.L); if(newL===null) return;
      const newNombre=prompt("Nuevo nombre:", u.nombre); if(newNombre===null) return;
      const newDni=prompt("Nuevo DNI:", u.dni); if(newDni===null) return;
      const newTipo=prompt("Nuevo tipo:", u.tipo); if(newTipo===null) return;

      try{ await updateDoc(doc(db,"usuarios",id),{ L:newL.trim(), nombre:newNombre.trim(), dni:newDni.trim(), tipo:newTipo.trim() }); }
      catch(err){ console.error(err); alert("Error editando"); }
    });

    // Eliminar
    tr.querySelector(".delUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("masterPass")){
        alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente?")) return;
      try{ await deleteDoc(doc(db,"usuarios",id)); } catch(err){ console.error(err); alert("Error eliminando"); }
    });

    // Imprimir tarjeta
    tr.querySelector(".printUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("masterPass")){
        alert("Contraseña incorrecta"); return; }

      const borderColor = (t=>{
        switch(t){
          case "propietario": return "violet";
          case "administracion": return "orange";
          case "empleado": return "green";
          case "obrero": return "yellow";
          case "invitado": return "cyan";
          case "guardia": return "red";
          default: return "gray";
        }
      })(u.tipo);

      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>
          body{font-family:Arial;text-align:center}
          .card{width:15cm;height:6cm;border:${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-border-width')||12)}px solid ${borderColor};box-sizing:border-box;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center;}
          .data{font-size:16px;font-weight:700;margin:6px 0;}
          .label-bar{font-size:10px;margin-bottom:2px;}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
          <div class="card">
            <div class="label-bar">Ingreso</div>
            <svg id="codeIn" style="display:block;margin:2px auto"></svg>
            <div class="data">${u.L} | ${u.nombre} | ${u.dni} | ${u.tipo}</div>
            <div class="label-bar">Salida</div>
            <svg id="codeOut" style="display:block;margin:2px auto"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'),"${u.codigoIngreso}",{format:'CODE128',width:2,height:40});
            JsBarcode(document.getElementById('codeOut'),"${u.codigoSalida}",{format:'CODE128',width:2,height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          <\/script>
        </body></html>
      `);
    });
  });
});

/* MOVIMIENTOS */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [];
let currentPage = 1;
let prevMovCount = 0;

function renderPagination(totalItems){
  const totalPages = Math.min(10,Math.max(1,Math.ceil(totalItems/MOV_LIMIT)));
  paginationDiv.innerHTML="";
  for(let i=1;i<=totalPages;i++){
    const b = document.createElement("button");
    b.textContent=i;
    if(i===currentPage) b.style.fontWeight="700";
    b.addEventListener("click",()=>{ currentPage=i; renderMovimientos(); });
    paginationDiv.appendChild(b);
  }
}

function renderMovimientos(){
  movimientosTableBody.innerHTML="";
  const start=(currentPage-1)*MOV_LIMIT;
  const movs = movimientosCache.slice(start,start+MOV_LIMIT);
  movs.forEach((m,i)=>{
    const tr = document.createElement("tr");
    tr.innerHTML=`<td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td><td></td>`;
    movimientosTableBody.appendChild(tr);
  });
  renderPagination(movimientosCache.length);
}

onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>d.data());
  renderMovimientos();
});

/* CAMBIAR CONTRASEÑA */
const currentPassInput = document.getElementById("currentPass");
const newPassInput = document.getElementById("newPass");
const savePassBtn = document.getElementById("savePassBtn");
savePassBtn.addEventListener("click", ()=>{
  const cur=currentPassInput.value.trim();
  const nuevo=newPassInput.value.trim();
  if(cur!==localStorage.getItem("adminPass") && cur!==localStorage.getItem("masterPass")){
    alert("Contraseña actual incorrecta"); return;
  }
  if(!/^\d{4}$/.test(nuevo)){ alert("Nueva contraseña debe ser 4 dígitos"); return; }
  localStorage.setItem("adminPass",nuevo);
  alert("Contraseña cambiada");
  currentPassInput.value=""; newPassInput.value="";
});

/* ESCANEAR con overlay */
const scanOverlay = document.getElementById("scanOverlay");
const scanInput = document.getElementById("scanInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");
document.getElementById("scanBtn").addEventListener("click", ()=>{
  scanOverlay.style.display = "flex";
  scanInput.value = "";
  scanInput.focus();
});
cancelScanBtn.addEventListener("click", ()=>{
  scanOverlay.style.display="none";
  scanInput.value="";
});
scanInput.addEventListener("input", async ()=>{
  const codigo = scanInput.value.trim();
  if(codigo.length >= 8){
    try{
      let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",codigo)));
      let tipoMov="entrada";
      if(snap.empty){
        snap = await getDocs(query(usuariosRef, where("codigoSalida","==",codigo)));
        if(snap.empty){ alert("Código no reconocido"); scanInput.value=""; return; }
        tipoMov="salida";
      }
      for(const d of snap.docs){
        const u=d.data();
        const mov={L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,hora:new Date()};
        if(tipoMov==="entrada") mov.entrada = horaActualStr();
        else mov.salida = horaActualStr();
        await addDoc(movimientosRef,mov);
      }
      scanOverlay.style.display="none";
      scanInput.value="";
      alert(`Movimiento de ${tipoMov} registrado`);
    }catch(err){ console.error(err); alert("Error registrando movimiento"); scanInput.value=""; }
  }
});

