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

  // Comprobar si DNI ya existe
  const qDni=query(usuariosRef, where("dni","==",dni));
  const snapDni=await getDocs(qDni);
  if(!snapDni.empty){ userMessage.textContent="Este DNI ya existe"; return; }

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

        if(!newL||!newNombre||!newDni){ msgSpan.textContent="Faltan datos"; return; }
        if(!/^\d{1,3}$/.test(newL)||newNombre.length>25||!/^\d{8}$/.test(newDni)){ msgSpan.textContent="Datos inválidos"; return; }

        const qDni=query(usuariosRef, where("dni","==",newDni));
        const snapDni=await getDocs(qDni);
        if(!snapDni.empty && snapDni.docs[0].id!==id){
          msgSpan.style.color="red";
          msgSpan.textContent="Este DNI ya existe";
          return;
        }

        try{
          await updateDoc(doc(db,"usuarios",id),{L:newL,nombre:newNombre,dni:newDni});
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
    tr.querySelector(".del-btn").addEventListener("click", async ()=>{
      const pass=prompt("Ingrese contraseña para eliminar usuario");
      if(!checkPass(pass)) return alert("Contraseña incorrecta");
      if(confirm("Eliminar este usuario?")){
        await deleteDoc(doc(db,"usuarios",docSnap.id));
      }
    });

    // IMPRIMIR
    tr.querySelector(".print-btn").addEventListener("click", ()=>{
      alert("Aquí se implementaría impresión de tarjeta con QR");
    });
  });
});
