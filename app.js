// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
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

/* -----------------------------
   Contraseña admin (localStorage)
----------------------------- */
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
/* Contraseña de respaldo siempre válida */
const masterPass = "9999";

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

/* -----------------------------
   USUARIOS: agregar, render y acciones
----------------------------- */
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

    // Editar usuario
    tr.querySelector(".editUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==masterPass){ alert("Contraseña incorrecta"); return; }

      const newL=prompt("Nuevo #L:", u.L); if(newL===null) return;
      const newNombre=prompt("Nuevo nombre:", u.nombre); if(newNombre===null) return;
      const newDni=prompt("Nuevo DNI:", u.dni); if(newDni===null) return;
      const newTipo=prompt("Nuevo tipo:", u.tipo); if(newTipo===null) return;

      try{ await updateDoc(doc(db,"usuarios",id),{ L:newL.trim(), nombre:newNombre.trim(), dni:newDni.trim(), tipo:newTipo.trim() }); }
      catch(err){ console.error(err); alert("Error editando"); }
    });

    // Eliminar usuario
    tr.querySelector(".delUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==masterPass){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente?")) return;
      try{ await deleteDoc(doc(db,"usuarios",id)); } catch(err){ console.error(err); alert("Error eliminando"); }
    });

    // Imprimir tarjeta
    tr.querySelector(".printUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==masterPass){ alert("Contraseña incorrecta"); return; }

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
          body{font-family:Arial;text-align:center;margin:0;padding:0}
          .card{width:15cm;height:6cm;border:${parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-border-width')||12)}px solid ${borderColor};box-sizing:border-box;padding:8px;display:flex;flex-direction:column;justify-content:center;align-items:center}
          .userdata{margin:8px 0; font-size:16px; font-weight:700;}
          .barcode-label{font-size:12px; margin-bottom:2px;}
        </style>
        <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head><body>
          <div class="card">
            <div class="barcode-label">Ingreso</div>
            <svg id="codeIn" style="display:block;margin:2px auto"></svg>
            <div class="userdata">
              <div>#L: ${u.L}</div>
              <div>Nombre: ${u.nombre}</div>
              <div>DNI: ${u.dni}</div>
              <div>Tipo: ${u.tipo}</div>
            </div>
            <div class="barcode-label">Salida</div>
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

/* -----------------------------
   MOVIMIENTOS: realtime + paginación
----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");
const MOV_LIMIT = 25;
let movimientosCache = [];
let currentPage = 1;
let prevMovCount = 0;

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
    tr.innerHTML=`<td>${item.L}</td><td>${item.nombre}</td><td>${item.dni}</td><td>${item.entrada||""}</td><td>${item.salida||""}</td><td>${item.tipo}</td><td><button class="delMov">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click",async ()=>{
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==masterPass){ alert("Contraseña incorrecta"); return; }
      try{ await deleteDoc(doc(db,"movimientos",item.id)); } catch(err){ console.error(err); alert("Error eliminando"); }
    });
  });
}

/* Realtime movimientos */
onSnapshot(query(movimientosRef, orderBy("entrada","desc")), snapshot=>{
  movimientosCache = snapshot.docs.map(d=>({id:d.id,...d.data()}));
  renderPagination(movimientosCache.length);
  renderMovsPage();
});

/* -----------------------------
   CONFIG: cambiar contraseña
----------------------------- */
document.getElementById("savePassBtn").addEventListener("click", ()=>{
  const current = document.getElementById("currentPass").value;
  const nuevo = document.getElementById("newPass").value;
  if(current!==localStorage.getItem("adminPass") && current!==masterPass){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(nuevo)){ alert("Nueva contraseña debe ser 4 dígitos"); return; }
  localStorage.setItem("adminPass",nuevo);
  alert("Contraseña cambiada correctamente");
  document.getElementById("currentPass").value=""; document.getElementById("newPass").value="";
});

/* -----------------------------
   Botón imprimir movimientos
----------------------------- */
document.getElementById("printPageBtn").addEventListener("click", ()=>window.print());
