import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

const usuariosRef = collection(db, "usuarios");
const MASTER_PASS = "9999";
if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
function checkPass(pass){ return pass===MASTER_PASS || pass===localStorage.getItem("adminPass"); }

const userL=document.getElementById("userL"), userNombre=document.getElementById("userNombre"), userDni=document.getElementById("userDni"), userTipo=document.getElementById("userTipo"), addUserBtn=document.getElementById("addUserBtn"), userMessage=document.getElementById("userMessage"), usersTableBody=document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  const L=userL.value.trim(), nombre=userNombre.value.trim(), dni=userDni.value.trim(), tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return; }
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser 1-3 dígitos"; return; }
  if(nombre.length>25){ userMessage.textContent="Nombre máximo 25 caracteres"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }
  try{ await addDoc(usuariosRef,{ L, nombre, dni, tipo }); userMessage.textContent="Usuario agregado"; userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value=""; setTimeout(()=>userMessage.textContent="",2500);}catch(err){ console.error(err); userMessage.textContent="Error"; }
});

let editDocId=null;
const editModal=document.getElementById("editModal");
const editL=document.getElementById("editL"), editNombre=document.getElementById("editNombre"), editDni=document.getElementById("editDni"), editTipo=document.getElementById("editTipo");
const cancelEditBtn=document.getElementById("cancelEditBtn"), finishEditBtn=document.getElementById("finishEditBtn"), editMsg=document.getElementById("editMsg");

onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
      </td>`;
    usersTableBody.appendChild(tr);

    tr.querySelector(".edit-btn").addEventListener("click", e=>{
      const pass=prompt("Ingrese la contraseña administrativa para continuar:");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      editDocId=docSnap.id;
      editL.value=u.L; editNombre.value=u.nombre; editDni.value=u.dni; editTipo.value=u.tipo;
      editMsg.textContent=""; editModal.classList.add("active");
    });

    tr.querySelector(".del-btn").addEventListener("click", async e=>{
      const pass=prompt("Ingrese la contraseña administrativa para continuar:");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente?")) return;
      try{ await deleteDoc(doc(db,"usuarios",docSnap.id)); alert("Usuario eliminado"); }catch(err){ console.error(err); alert("Error eliminando"); }
    });
  });
});

cancelEditBtn.addEventListener("click", ()=>{ editModal.classList.remove("active"); });
finishEditBtn.addEventListener("click", async ()=>{
  const Lv=editL.value.trim(), Nv=editNombre.value.trim(), Dv=editDni.value.trim(), Tv=editTipo.value;
  if(!Lv||!Nv||!Dv||!Tv){ editMsg.textContent="Faltan datos, por favor complete todos los campos"; return; }
  if(!/^\d{1,3}$/.test(Lv)){ editMsg.textContent="#L debe ser 1-3 dígitos"; return; }
  if(Nv.length>25){ editMsg.textContent="Nombre máximo 25 caracteres"; return; }
  if(!/^\d{8}$/.test(Dv)){ editMsg.textContent="DNI debe tener 8 dígitos"; return; }
  try{ await updateDoc(doc(db,"usuarios",editDocId),{ L:Lv, nombre:Nv, dni:Dv, tipo:Tv }); editMsg.textContent="Usuario editado con éxito"; setTimeout(()=>editModal.classList.remove("active"),1200);}catch(err){ console.error(err); editMsg.textContent="Error al actualizar"; }
});
