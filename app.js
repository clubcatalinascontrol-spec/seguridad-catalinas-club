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

/* -----------------------------
   Contraseñas
----------------------------- */
const MASTER_PASS = "1234";
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");

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
function checkPass(pass){
  return pass===MASTER_PASS || pass===localStorage.getItem("adminPass");
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
   USUARIOS
----------------------------- */
const userL=document.getElementById("userL");
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  const L=userL.value.trim();
  const nombre=userNombre.value.trim();
  const dni=userDni.value.trim();
  const tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return; }
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser hasta 3 dígitos"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }
  try{
    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    userMessage.textContent="Usuario agregado";
    userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){console.error(err);userMessage.textContent="Error";}
});

onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
    <td><button class="printUser" data-id="${docSnap.id}">Imprimir Tarjeta</button></td>`;
    usersTableBody.appendChild(tr);
  });
});

/* -----------------------------
   MOVIMIENTOS
----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const paginationDiv=document.getElementById("pagination");
const MOV_LIMIT=25;
let movimientosCache=[]; let currentPage=1;

function renderPagination(totalItems){
  const totalPages=Math.min(10,Math.max(1,Math.ceil(totalItems/MOV_LIMIT)));
  paginationDiv.innerHTML="";
  for(let p=1;p<=totalPages;p++){
    const btn=document.createElement("button");
    btn.textContent=p;
    if(p===currentPage){btn.style.background="#d8a800";btn.style.color="#111";}
    btn.addEventListener("click",()=>{currentPage=p;renderMovsPage();});
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
      const pass=prompt("Contraseña admin:");
      if(!checkPass(pass)){alert("Incorrecta");return;}
      if(!confirm("Eliminar movimiento?"))return;
      try{await deleteDoc(doc(db,"movimientos",e.currentTarget.dataset.id));}
      catch(err){console.error(err);alert("Error");}
    });
  });
  renderPagination(movimientosCache.length);
}

onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosCache=snapshot.docs.map(d=>({__id:d.id,...d.data()}));
  renderMovsPage();
});

/* -----------------------------
   ESCANEAR MODAL
----------------------------- */
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const scanBtn=document.getElementById("scanBtn");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanMessage=document.getElementById("scanMessage");

scanBtn.addEventListener("click",()=>{
  scanModal.classList.remove("hidden");
  scanInput.value="";
  scanInput.focus();
  scanMessage.textContent="";
});

cancelScanBtn.addEventListener("click",()=>{
  scanModal.classList.add("hidden");
});

scanInput.addEventListener("input",async ()=>{
  if(scanInput.value.length===8){
    const codigo=scanInput.value.trim();
    try{
      let snap=await getDocs(query(usuariosRef, where("codigoIngreso","==",codigo)));
      let tipoMov="entrada";
      if(snap.empty){
        snap=await getDocs(query(usuariosRef, where("codigoSalida","==",codigo)));
        if(snap.empty){scanMessage.textContent="Código no reconocido";scanMessage.style.color="red";return;}
        tipoMov="salida";
      }
      for(const d of snap.docs){
        const u=d.data();
        const mov={L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,hora:new Date()};
        if(tipoMov==="entrada")mov.entrada=horaActualStr();
        else mov.salida=horaActualStr();
        await addDoc(movimientosRef,mov);
      }
      scanMessage.textContent="OK";
      scanMessage.style.color="green";
      setTimeout(()=>{scanModal.classList.add("hidden");},800);
    }catch(err){console.error(err);scanMessage.textContent="Error";scanMessage.style.color="red";}
  }
});

/* -----------------------------
   CONFIG: cambiar contraseña
----------------------------- */
document.getElementById("savePassBtn").addEventListener("click",()=>{
  const current=document.getElementById("currentPass").value.trim();
  const nuevo=document.getElementById("newPass").value.trim();
  if(!checkPass(current)){alert("Contraseña actual incorrecta");return;}
  if(!/^\d{4}$/.test(nuevo)){alert("Debe ser numérica de 4 dígitos");return;}
  localStorage.setItem("adminPass",nuevo);
  alert("Contraseña cambiada con éxito");
  document.getElementById("currentPass").value="";
  document.getElementById("newPass").value="";
});
