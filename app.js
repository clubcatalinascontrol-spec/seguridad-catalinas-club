import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
   Contraseña admin
----------------------------- */
if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");

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
   Imprimir movimientos
----------------------------- */
function printMovementsPage(pageData){
  const w=window.open("","_blank");
  let html=`<html><head><title>Movimientos</title>
  <style>body{font-family:Arial}table{width:100%;border-collapse:collapse}th,td{border:1px solid #000;padding:6px;text-align:center}</style>
  </head><body>`;
  html+=`<h3>Movimientos (últimos ${pageData.length})</h3><table><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr></thead><tbody>`;
  pageData.forEach(m=>{ html+=`<tr><td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td></tr>`; });
  html+=`</tbody></table></body></html>`;
  w.document.write(html); w.print(); w.close();
}
document.getElementById("printPageBtn").addEventListener("click", async ()=>{
  try{
    const snap=await getDocs(query(movimientosRef, orderBy("hora","desc"), limit(25)));
    const data = snap.docs.map(d=>d.data());
    printMovementsPage(data);
  }catch(err){ console.error(err); alert("Error imprimiendo movimientos"); }
});

/* -----------------------------
   Escaneo flotante
----------------------------- */
const scannerDiv = document.getElementById("scannerDiv");
const scannerInput = document.getElementById("scannerInput");
document.getElementById("scanBtn").addEventListener("click", ()=>{
  scannerDiv.style.display="block";
  document.body.classList.add("scanner-active");
  scannerInput.value="";
  scannerInput.focus();
});
document.getElementById("cancelScan").addEventListener("click", ()=>{
  scannerDiv.style.display="none";
  document.body.classList.remove("scanner-active");
});

/* registrar movimiento al ingresar 8 caracteres */
scannerInput.addEventListener("input", async ()=>{
  const val = scannerInput.value.toUpperCase();
  if(val.length<8) return;
  try{
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",val)));
    let tipoMov="entrada";
    if(snap.empty){
      snap = await getDocs(query(usuariosRef, where("codigoSalida","==",val)));
      if(snap.empty){ alert("Tarjeta expirada, debe imprimir una nueva, este usuario no existe en la base de datos"); scannerDiv.style.display="none"; document.body.classList.remove("scanner-active"); return; }
      tipoMov="salida";
    }
    for(const d of snap.docs){
      const u=d.data();
      const mov={L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,hora:new Date()};
      if(tipoMov==="entrada") mov.entrada=horaActualStr();
      else mov.salida=horaActualStr();
      await addDoc(movimientosRef,mov);
    }
    alert("OK");
  }catch(err){ console.error(err); alert("Error registrando movimiento"); }
  scannerDiv.style.display="none";
  document.body.classList.remove("scanner-active");
});

/* -----------------------------
   Gestión de Usuarios
----------------------------- */
const usersTableBody = document.querySelector("#usersTable tbody");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");

async function loadUsers(){
  const snap=await getDocs(query(usuariosRef, orderBy("L","asc")));
  usersTableBody.innerHTML="";
  snap.docs.forEach(d=>{
    const u=d.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
      <td><button class="delUserBtn" data-id="${d.id}">Eliminar</button></td>`;
    usersTableBody.appendChild(tr);
  });
  document.querySelectorAll(".delUserBtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.dataset.id;
      const pass=prompt("Ingrese contraseña para eliminar usuario:");
      const validPass = localStorage.getItem("adminPass");
      if(pass!==validPass){ alert("Contraseña incorrecta"); return; }
      try{
        await deleteDoc(doc(db,"usuarios",id));
        alert("Usuario eliminado, su tarjeta queda expirada");
        loadUsers();
      }catch(err){ console.error(err); alert("Error eliminando usuario"); }
    });
  });
}

addUserBtn.addEventListener("click", async ()=>{
  const L=document.getElementById("userL").value;
  const nombre=document.getElementById("userNombre").value;
  const dni=document.getElementById("userDni").value;
  const tipo=document.getElementById("userTipo").value;
  if(!L || !nombre || !dni || !tipo){ userMessage.textContent="Completa todos los campos"; return; }
  const codigoIngreso = generarCodigo();
  const codigoSalida = generarCodigo();
  try{
    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso,codigoSalida});
    userMessage.textContent="Usuario agregado correctamente";
    document.getElementById("userL").value="";
    document.getElementById("userNombre").value="";
    document.getElementById("userDni").value="";
    document.getElementById("userTipo").value="";
    loadUsers();
  }catch(err){ console.error(err); userMessage.textContent="Error agregando usuario"; }
});

loadUsers();

/* -----------------------------
   Configuración de contraseña
----------------------------- */
document.getElementById("savePassBtn").addEventListener("click", ()=>{
  const current=document.getElementById("currentPass").value;
  const newPass=document.getElementById("newPass").value;
  if(current!==localStorage.getItem("adminPass")){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(newPass)){ alert("La nueva contraseña debe tener 4 dígitos"); return; }
  localStorage.setItem("adminPass", newPass);
  alert("Contraseña cambiada correctamente");
  document.getElementById("currentPass").value="";
  document.getElementById("newPass").value="";
});

/* -----------------------------
   Movimientos en tiempo real
----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");

onSnapshot(movimientosRef, query(movimientosRef, orderBy("hora","desc")), (snapshot)=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach(d=>{
    const m=d.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td>
    <td><button class="delMovBtn" data-id="${d.id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
  });
  document.querySelectorAll(".delMovBtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const pass=prompt("Ingrese contraseña para eliminar movimiento:");
      const validPass = localStorage.getItem("adminPass");
      if(pass!==validPass){ alert("Contraseña incorrecta"); return; }
      try{
        await deleteDoc(doc(db,"movimientos",btn.dataset.id));
      }catch(err){ console.error(err); alert("Error eliminando movimiento"); }
    });
  });
});
