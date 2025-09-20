import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.firebasestorage.app",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234"); // por defecto

const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn=>btn.addEventListener("click", ()=>{
  pages.forEach(p=>p.classList.remove("active"));
  document.getElementById(btn.dataset.section).classList.add("active");
  navBtns.forEach(b=>b.classList.remove("active"));
  btn.classList.add("active");
}));

/* Scanner */
const scanBtn=document.getElementById("scanBtn");
const scannerDiv=document.getElementById("scannerDiv");
const scannerInput=document.getElementById("scannerInput");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const mainContent=document.getElementById("mainContent");

function showScanner(){
  scannerDiv.classList.add("active");
  mainContent.classList.add("blur");
  scannerInput.value="";
  scannerInput.focus();
}
function hideScanner(){
  scannerDiv.classList.remove("active");
  mainContent.classList.remove("blur");
  scannerInput.value="";
}

scanBtn.addEventListener("click", showScanner);
cancelScanBtn.addEventListener("click", hideScanner);

/* Registrar movimiento automáticamente */
const movimientosRef = collection(db,"movimientos");
const usuariosRef = collection(db,"usuarios");
scannerInput.addEventListener("input", async ()=>{
  const code = scannerInput.value.trim();
  if(code.length!==8) return;
  let snap = await getDocs(query(usuariosRef,where("codigoIngreso","==",code)));
  let user=null, tipoMov="entrada";
  if(!snap.empty){ user=snap.docs[0].data(); tipoMov="entrada"; }
  else{
    snap = await getDocs(query(usuariosRef,where("codigoSalida","==",code)));
    if(!snap.empty){ user=snap.docs[0].data(); tipoMov="salida"; }
  }
  if(!user){ alert("Código no válido"); return; }
  await addDoc(movimientosRef,{
    L:user.L, nombre:user.nombre, dni:user.dni, tipo:user.tipo,
    horaEntrada: tipoMov==="entrada"? new Date().toLocaleString():"",
    horaSalida: tipoMov==="salida"? new Date().toLocaleString():""
  });
  hideScanner();
});

/* Renderizar movimientos */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
onSnapshot(query(movimientosRef,orderBy("horaEntrada","desc")), snapshot=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const m=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.horaEntrada||""}</td>
      <td>${m.horaSalida||""}</td>
      <td>${m.tipo}</td>
      <td><button class="delMov" data-id="${docSnap.id}">Eliminar</button></td>
    `;
    movimientosTableBody.appendChild(tr);
    tr.querySelector(".delMov").addEventListener("click", async ()=>{
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass")){ alert("Contraseña incorrecta"); return; }
      await deleteDoc(doc(db,"movimientos",docSnap.id));
    });
  });
});
