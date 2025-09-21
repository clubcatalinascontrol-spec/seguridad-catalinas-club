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
    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    userMessage.textContent="Usuario agregado";
    userL.value="000"; userNombre.value=""; userDni.value=""; userTipo.value="";
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
  });
});

/* -----------------------------
   MOVIMIENTOS (render en tiempo real)
----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
onSnapshot(query(movimientosRef, orderBy("entrada","desc")), snapshot=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const m=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.entrada||""}</td>
      <td>${m.salida||""}</td>
      <td>${m.tipo}</td>
    `;
    movimientosTableBody.appendChild(tr);
  });
});

/* -----------------------------
   SCAN PANEL
----------------------------- */
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanBtn=document.getElementById("scanBtn");
const scanOk=document.getElementById("scanOk");
const scanMessage=document.getElementById("scanMessage");

scanBtn.onclick=()=>{ scanModal.classList.add("active"); scanInput.focus(); };
cancelScanBtn.onclick=()=>{ scanModal.classList.remove("active"); scanInput.value=""; };

scanInput.addEventListener("input",async ()=>{
  const code=scanInput.value.trim();
  if(code.length===8){
    const q=query(usuariosRef,where("codigoIngreso","==",code));
    const snap=await getDocs(q);
    if(!snap.empty){
      const u=snap.docs[0].data();
      await addDoc(movimientosRef,{L:u.L,nombre:u.nombre,dni:u.dni,entrada:horaActualStr(),salida:"",tipo:u.tipo});
      scanOk.style.display="inline"; setTimeout(()=>scanOk.style.display="none",2000);
      scanInput.value=""; scanModal.classList.remove("active"); scanMessage.textContent="";
    } else {
      scanMessage.textContent="Código no válido";
    }
  }
});

/* -----------------------------
   IMPRIMIR MOVIMIENTOS
----------------------------- */
document.getElementById("printPageBtn").onclick=()=>{
  const pass=prompt("Ingrese contraseña para imprimir movimientos");
  if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
  const tabla=movimientosTable.innerHTML;
  const win=window.open("","_blank","width=800,height=600");
  win.document.write("<h2>Movimientos</h2><table border=1>"+tabla+"</table>");
  win.document.close(); win.focus(); win.print();
};

/* -----------------------------
   Cambiar/restaurar contraseña
----------------------------- */
document.getElementById("savePassBtn").onclick=()=>{
  const cur=document.getElementById("currentPass").value;
  const neu=document.getElementById("newPass").value;
  if(!checkPass(cur)){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(neu)){ alert("Nueva contraseña debe ser 4 dígitos"); return; }
  localStorage.setItem("adminPass",neu);
  alert("Contraseña cambiada");
};

document.getElementById("restoreDefaultBtn").onclick=()=>{
  const master=prompt("Ingrese contraseña maestra para continuar");
  if(master!==MASTER_PASS){ alert("Contraseña maestra incorrecta"); return; }
  localStorage.setItem("adminPass","1234");
  const msg=document.getElementById("restoreMsg");
  msg.textContent="Ahora la contraseña nueva es 1234";
  setTimeout(()=>msg.textContent="",3000);
};
