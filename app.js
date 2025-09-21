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
const editUserL=document.getElementById("editUserL");
const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// Llenar selects con 000–999
function fillLSelect(select){
  select.innerHTML="";
  for(let i=0;i<=999;i++){
    const opt=document.createElement("option");
    opt.value=i.toString().padStart(3,"0");
    opt.textContent=i.toString().padStart(3,"0");
    select.appendChild(opt);
  }
}
fillLSelect(userL);
fillLSelect(editUserL);

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
        if(!newL||!newNombre||!newDni||!newTipo){ msgSpan.textContent="Faltan datos, complete todos los campos"; return; }
        if(!/^\d{1,3}$/.test(newL)||newNombre.length>25||!/^\d{8}$/.test(newDni)){ msgSpan.textContent="Datos inválidos"; return; }

        // Comprobar si DNI existe en otro usuario
        const qDni=query(usuariosRef, where("dni","==",newDni));
        const snapDni=await getDocs(qDni);
        if(!snapDni.empty && snapDni.docs[0].id!==id){
          msgSpan.style.color="red";
          msgSpan.textContent          msgSpan.style.color="red";
          msgSpan.textContent="DNI ya existe en otro usuario";
          return;
        }

        // Actualizar doc
        await updateDoc(doc(usuariosRef, id), {
          L: newL,
          nombre: newNombre,
          dni: newDni,
          tipo: newTipo
        });
        msgSpan.style.color="green";
        msgSpan.textContent="Usuario actualizado";
        setTimeout(()=>{
          document.getElementById("editUserModal").classList.remove("active");
          msgSpan.textContent="";
        },1500);
      };

      cancelBtn.onclick=()=>document.getElementById("editUserModal").classList.remove("active");
    });

    // ELIMINAR
    tr.querySelector(".del-btn").addEventListener("click",async ()=>{
      const pass=prompt("Ingrese contraseña de administración para eliminar usuario");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(confirm("Confirma eliminar este usuario?")){
        await deleteDoc(doc(usuariosRef, docSnap.id));
      }
    });

    // IMPRIMIR TARJETA
    tr.querySelector(".print-btn").addEventListener("click", ()=>{
      const tarjeta=`
        <div style="padding:20px;font-family:sans-serif;text-align:center;border:1px solid #000">
          <h3>${u.nombre}</h3>
          <p>DNI: ${u.dni}</p>
          <p>Tipo: ${u.tipo}</p>
        </div>
      `;
      const w=window.open();
      w.document.write(tarjeta);
      w.print();
      w.close();
    });
  });
});

/* -----------------------------
   PANEL MOVIMIENTOS
----------------------------- */
const movimientosTableBody=document.querySelector("#movimientosTable tbody");
const scanBtn=document.getElementById("scanBtn");
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanMessage=document.getElementById("scanMessage");
const scanOk=document.getElementById("scanOk");
const printPageBtn=document.getElementById("printPageBtn");

// Escanear
scanBtn.addEventListener("click",()=>{ scanModal.classList.add("active"); scanInput.focus(); });
cancelScanBtn.addEventListener("click",()=>{ scanModal.classList.remove("active"); scanInput.value=""; scanMessage.textContent=""; });

scanInput.addEventListener("keypress", async e=>{
  if(e.key==="Enter"){
    const code=scanInput.value.trim();
    if(!code){ scanMessage.textContent="Ingrese código"; return; }
    const q=query(usuariosRef, where("codigoIngreso","==",code));
    const snap=await getDocs(q);
    if(snap.empty){ scanMessage.textContent="Código inválido"; return; }
    const u=snap.docs[0].data();
    // Registrar movimiento
    await addDoc(movimientosRef,{
      L: u.L,
      nombre: u.nombre,
      dni: u.dni,
      tipo: u.tipo,
      horaEntrada: horaActualStr(),
      horaSalida: "",
      fecha: new Date().toISOString(),
      action: "entrada"
    });
    scanMessage.textContent="Entrada registrada";
    scanOk.style.display="inline";
    setTimeout(()=>{
      scanModal.classList.remove("active");
      scanInput.value=""; scanMessage.textContent=""; scanOk.style.display="none";
    },1200);
  }
});

// Render movimientos en tiempo real orden descendente
onSnapshot(query(movimientosRef, orderBy("fecha","desc")), snapshot=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach((docSnap,index)=>{
    const m=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${index+1}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.horaEntrada}</td>
      <td>${m.horaSalida||"-"}</td>
      <td>${m.tipo}</td>
      <td>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
      </td>
    `;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      const pass=prompt("Ingrese contraseña para eliminar movimiento");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(confirm("Confirma eliminar este movimiento?")){
        await deleteDoc(doc(movimientosRef, docSnap.id));
      }
    });
  });
});

// Imprimir movimientos
printPageBtn.addEventListener("click", ()=>{
  const w=window.open();
  w.document.write("<h3>Movimientos</h3>");
  w.document.write(movimientosTableBody.parentElement.innerHTML);
  w.print();
  w.close();
});

/* -----------------------------
   CONFIG CONTRASEÑA
----------------------------- */
const currentPassInput=document.getElementById("currentPass");
const newPassInput=document.getElementById("newPass");
const savePassBtn=document.getElementById("savePassBtn");
const restoreDefaultBtn=document.getElementById("restoreDefaultBtn");
const restoreMsg=document.getElementById("restoreMsg");

savePassBtn.addEventListener("click", ()=>{
  const current=currentPassInput.value.trim();
  const newP=newPassInput.value.trim();
  if(!current || !newP){ restoreMsg.textContent="Complete ambos campos"; return; }
  if(!checkPass(current)){ restoreMsg.textContent="Contraseña actual incorrecta"; return; }
  if(!/^\d{4}$/.test(newP)){ restoreMsg.textContent="La nueva contraseña debe ser 4 dígitos"; return; }
  localStorage.setItem("adminPass", newP);
  restoreMsg.textContent="Contraseña actualizada";
  setTimeout(()=>restoreMsg.textContent="",2000);
  currentPassInput.value=""; newPassInput.value="";
});

// Restaurar a 1234
restoreDefaultBtn.addEventListener("click", ()=>{
  const pass=prompt("Ingrese contraseña actual para restaurar a 1234");
  if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
  localStorage.setItem("adminPass","1234");
  restoreMsg.textContent="Contraseña restaurada a 1234";
  setTimeout(()=>restoreMsg.textContent="",2000);
});
