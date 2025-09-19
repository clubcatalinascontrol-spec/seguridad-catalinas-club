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
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
    navButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});

// --- Funciones auxiliares ---
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

// --- USUARIOS ---
const addUserBtn = document.getElementById("addUserBtn");
const userListContainer = document.getElementById("userListContainer");
const userMessage = document.getElementById("userMessage");

addUserBtn.addEventListener("click", async ()=>{
  const L = document.getElementById("userL").value.trim();
  const nombre = document.getElementById("userNombre").value.trim();
  const dni = document.getElementById("userDni").value.trim();
  const tipo = document.getElementById("userTipo").value;

  if(!L||!nombre||!dni||!tipo){ alert("Complete todos los campos"); return; }
  if(!/^\d+$/.test(L)){ alert("#L debe ser solo números"); return; }
  if(!/^\d{1,8}$/.test(dni)){ alert("DNI debe tener máximo 8 dígitos"); return; }

  const codigoIngreso = generarCodigo();
  const codigoSalida = generarCodigo();
  await addDoc(collection(db,"usuarios"),{L,nombre,dni,tipo,codigoIngreso,codigoSalida});

  document.getElementById("userL").value="";
  document.getElementById("userNombre").value="";
  document.getElementById("userDni").value="";
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>{userMessage.textContent="";},3000);
});

// --- Mostrar usuarios en tiempo real ---
onSnapshot(collection(db,"usuarios"), snapshot=>{
  userListContainer.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const data = docSnap.data();
    const div = document.createElement("div");
    div.className="userItem";
    div.innerHTML=`
      <div>
        <input value="${data.L}" size="3" data-field="L">
        <input value="${data.nombre}" size="20" data-field="nombre">
        <input value="${data.dni}" size="8" data-field="dni">
        <select data-field="tipo">
          <option value="propietario" ${data.tipo==="propietario"?"selected":""}>Propietario</option>
          <option value="administracion" ${data.tipo==="administracion"?"selected":""}>Administración</option>
          <option value="empleado" ${data.tipo==="empleado"?"selected":""}>Empleado</option>
          <option value="obrero" ${data.tipo==="obrero"?"selected":""}>Obrero</option>
          <option value="invitado" ${data.tipo==="invitado"?"selected":""}>Invitado</option>
          <option value="guardia" ${data.tipo==="guardia"?"selected":""}>Guardia</option>
          <option value="otro" ${data.tipo==="otro"?"selected":""}>Otro</option>
        </select>
      </div>
      <div>
        <button class="saveUserBtn" data-id="${docSnap.id}">Guardar</button>
        <button class="printUserBtn" data-id="${docSnap.id}">Imprimir</button>
        <button class="deleteUserBtn" data-id="${docSnap.id}">Eliminar</button>
      </div>
    `;
    userListContainer.appendChild(div);
  });

  // Guardar cambios
  document.querySelectorAll(".saveUserBtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.dataset.id;
      const parent = btn.closest(".userItem");
      const inputs = parent.querySelectorAll("input, select");
      const updated = {};
      inputs.forEach(i=> updated[i.dataset.field] = i.value);
      await setDoc(doc(db,"usuarios",id), updated, {merge:true});
      alert("Usuario actualizado");
    });
  });

  // Imprimir tarjeta
  document.querySelectorAll(".printUserBtn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const id = btn.dataset.id;
      const data = snapshot.docs.find(d=>d.id===id).data();
      printUserCard(data);
    });
  });

  // Eliminar usuario con PIN maestro
  document.querySelectorAll(".deleteUserBtn").forEach(btn=>{
    btn.addEventListener("click", async ()=>{
      const id = btn.dataset.id;
      let pin = prompt("Ingrese PIN maestro para eliminar usuario:");
      const pinDoc = await getDocs(collection(db,"config"));
      let masterPin = "1234";
      pinDoc.forEach(d=>{masterPin=d.data().pin});
      if(pin===masterPin){
        await deleteDoc(doc(db,"usuarios",id));
        alert("Usuario eliminado");
      } else alert("PIN incorrecto");
    });
  });
});

// --- Imprimir tarjeta ---
function printUserCard(data){
  const win = window.open("","PRINT","width=400,height=300");
  const color = colorTipo(data.tipo);
  win.document.write(`<div style="border:1cm solid ${color};padding:10px;width:15cm;height:6cm;text-align:center">`);
  win.document.write(`<p>#${data.L} - ${data.nombre} - ${data.dni} - ${data.tipo}</p>`);
  win.document.write(`<svg id="barcode" jsbarcode-value="${data.codigoIngreso}" jsbarcode-height="40"></svg><br>`);
  win.document.write(`<svg id="barcode2" jsbarcode-value="${data.codigoSalida}" jsbarcode-height="40"></svg>`);
  win.document.write("</div>");
  win.document.close();
  JsBarcode(win.document.querySelector("#barcode")).init();
  JsBarcode(win.document.querySelector("#barcode2")).init();
}
