import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* Firebase */
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

/* Contraseñas */
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
if (!localStorage.getItem("backupPass")) localStorage.setItem("backupPass","9999");

/* Helpers */
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActualStr(){
  const d=new Date();
  return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} (${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()})`;
}

/* SPA */
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
        <button class="printUser" data-id="${docSnap.id}">Imprimir</button>
      </td>`;
    usersTableBody.appendChild(tr);

    tr.querySelector(".editUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin:");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
      const newL=prompt("Nuevo #L:", u.L); if(newL===null) return;
      const newNombre=prompt("Nuevo nombre:", u.nombre); if(newNombre===null) return;
      const newDni=prompt("Nuevo DNI:", u.dni); if(newDni===null) return;
      const newTipo=prompt("Nuevo tipo:", u.tipo); if(newTipo===null) return;
      try{ await updateDoc(doc(db,"usuarios",id),{ L:newL.trim(), nombre:newNombre.trim(), dni:newDni.trim(), tipo:newTipo.trim() }); }
      catch(err){ console.error(err); alert("Error editando"); }
    });

    tr.querySelector(".delUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin:");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente?")) return;
      try{ await deleteDoc(doc(db,"usuarios",id)); } catch(err){ console.error(err); alert("Error eliminando"); }
    });

    tr.querySelector(".printUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin:");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
      const borderColor = {propietario:"violet",administracion:"orange",empleado:"green",obrero:"yellow",invitado:"cyan",guardia:"red"}[u.tipo]||"gray";
      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`
        <html><head><title>Tarjeta ${u.L}</title>
        <style>
          body{font-family:Arial;text-align:center;margin:0;padding:0}
          .card{width:15cm;height:6cm;border:${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-border-width')||12)}px solid ${borderColor};box-sizing:border-box;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center}
          .userData{margin:8px 0;font-size:16px;font-weight:700}
          .barcodeLabel{font-size:10px;margin-bottom:4px}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
          <div class="card">
            <div class="barcodeLabel">Ingreso</div>
            <svg id="codeIn"></svg>
            <div class="userData">${u.L} — ${u.nombre} — ${u.dni} — ${u.tipo}</div>
            <div class="barcodeLabel">Salida</div>
            <svg id="codeOut"></svg>
          </div>
          <script>
            JsBarcode(document.getElementById('codeIn'),"${u.codigoIngreso}",{format:'CODE128',width:2,height:40});
            JsBarcode(document.getElementById('codeOut'),"${u.codigoSalida}",{format:'CODE128',width:2,height:40});
            window.print();
            setTimeout(()=>window.close(),700);
          </script>
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

function renderPagination(totalItems){
  const totalPages = Math.min(10,Math.max(1,Math.ceil(totalItems/MOV_LIMIT)));
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
    tr.innerHTML=`<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td><td><button class="delMov" data-id="${item.__id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
  });
  renderPagination(movimientosCache.length);
}

/* Delegación para eliminar */
movimientosTableBody.addEventListener("click", async e=>{
  if(e.target.classList.contains("delMov")){
    const id = e.target.dataset.id;
    const pass = prompt("Contraseña admin:");
    if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
    if(!confirm("Eliminar movimiento permanentemente?")) return;
    try{ await deleteDoc(doc(db,"movimientos",id)); } catch(err){ console.error(err); alert("Error eliminando"); }
  }
});

onSnapshot(query(movimientosRef, orderBy("entrada","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  renderMovsPage();
});

/* ESCANEO */
const scanBtn=document.getElementById("scanBtn");
const scanDiv=document.getElementById("scanDiv");
const scanInput=document.getElementById("scanInput");
const cancelScanBtn=document.getElementById("cancelScanBtn");

scanBtn.addEventListener("click", ()=>{ scanDiv.classList.remove("hidden"); scanInput.focus(); });
cancelScanBtn.addEventListener("click", ()=>{ scanDiv.classList.add("hidden"); scanInput.value=""; });

scanInput.addEventListener("input", async ()=>{
  if(scanInput.value.length===8){
    const code = scanInput.value;
    const userSnap = await getDocs(query(usuariosRef, where("codigoIngreso","==",code)));
    let user;
    let tipoMov="entrada";
    if(userSnap.empty){
      const outSnap = await getDocs(query(usuariosRef, where("codigoSalida","==",code)));
      if(outSnap.empty){ alert("Código no encontrado"); scanInput.value=""; return; }
      user = outSnap.docs[0].data();
      tipoMov="salida";
    } else user = userSnap.docs[0].data();

    await addDoc(movimientosRef,{
      L:user.L, nombre:user.nombre, dni:user.dni, tipo:user.tipo,
      entrada: tipoMov==="entrada"?horaActualStr():"",
      salida: tipoMov==="salida"?horaActualStr():"",
      tipo: tipoMov
    });
    scanInput.value="";
    scanDiv.classList.add("hidden");
  }
});

/* CONFIGURACIÓN CONTRASEÑA */
const currentPass = document.getElementById("currentPass");
const newPass = document.getElementById("newPass");
const savePassBtn = document.getElementById("savePassBtn");

savePassBtn.addEventListener("click", ()=>{
  if(currentPass.value!==localStorage.getItem("adminPass")){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(newPass.value)){ alert("Debe ingresar 4 números"); return; }
  localStorage.setItem("adminPass", newPass.value);
  alert("Contraseña cambiada con éxito");
  currentPass.value=""; newPass.value="";
});
