import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, onSnapshot
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// --- Firebase ---
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

// --- SPA Navigation ---
const sections = document.querySelectorAll("main section");
const navButtons = document.querySelectorAll(".nav-btn");
navButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    const target = btn.dataset.section;
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(target).classList.add("active");
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- Auxiliares ---
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function colorTipo(tipo){
  switch(tipo){
    case "propietario": return "#8A2BE2";
    case "administracion": return "#FFA500";
    case "empleado": return "#008000";
    case "obrero": return "#FFD700";
    case "invitado": return "#00FFFF";
    case "guardia": return "#FF0000";
    default: return "#808080";
  }
}

// --- Usuarios ---
const userTableBody = document.querySelector("#userTable tbody");
const userMessage = document.getElementById("userMessage");

async function initUsuarios(){
  const usuariosRef = collection(db,"usuarios");
  const docs = await getDocs(usuariosRef);
  if(docs.empty){
    await addDoc(usuariosRef,{L:"999",nombre:"Prueba A",dni:"11222333",tipo:"otro",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    await addDoc(usuariosRef,{L:"998",nombre:"Prueba B",dni:"44555666",tipo:"empleado",codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  }

  onSnapshot(usuariosRef, snapshot=>{
    userTableBody.innerHTML="";
    snapshot.docs.forEach(docSnap=>{
      const data = docSnap.data();
      const tr = document.createElement("tr");
      tr.innerHTML=`
        <td>${data.L}</td>
        <td><input type="text" value="${data.nombre}" size="25" data-field="nombre"></td>
        <td><input type="text" value="${data.dni}" size="8" data-field="dni"></td>
        <td>
          <select data-field="tipo">
            <option value="propietario" ${data.tipo==="propietario"?"selected":""}>Propietario</option>
            <option value="administracion" ${data.tipo==="administracion"?"selected":""}>Administración</option>
            <option value="empleado" ${data.tipo==="empleado"?"selected":""}>Empleado</option>
            <option value="obrero" ${data.tipo==="obrero"?"selected":""}>Obrero</option>
            <option value="invitado" ${data.tipo==="invitado"?"selected":""}>Invitado</option>
            <option value="guardia" ${data.tipo==="guardia"?"selected":""}>Guardia</option>
            <option value="otro" ${data.tipo==="otro"?"selected":""}>Otro</option>
          </select>
        </td>
        <td>
          <button class="userTableBtn saveUserBtn" data-id="${docSnap.id}">Guardar</button>
          <button class="userTableBtn printUserBtn" data-id="${docSnap.id}">Imprimir</button>
          <button class="userTableBtn deleteUserBtn" data-id="${docSnap.id}">Eliminar</button>
        </td>
      `;
      userTableBody.appendChild(tr);
    });
  });
}
initUsuarios();

// --- Agregar Usuario ---
document.getElementById("addUserBtn").onclick = async()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;
  if(!L || !nombre || !dni){ alert("Completa todos los campos"); return; }
  if(dni.length>8){ alert("DNI máximo 8 dígitos"); return; }
  await addDoc(collection(db,"usuarios"),{
    L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()
  });
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>userMessage.textContent="",3000);
  document.getElementById("userL").value="";
  document.getElementById("userNombre").value="";
  document.getElementById("userDni").value="";
};

// --- Guardar PIN ---
document.getElementById("savePin").onclick = ()=>{
  const newPin = document.getElementById("newPin").value.trim();
  if(!/^\d{4}$/.test(newPin)){ alert("PIN debe tener 4 dígitos"); return; }
  localStorage.setItem("pinMaestro",newPin);
  alert("PIN maestro guardado");
};
