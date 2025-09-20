import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* Firebase config */
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

const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");

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
   MOVIMIENTOS
----------------------------- */
const movimientosTableBody = document.querySelector("#movimientosTable tbody");
onSnapshot(query(movimientosRef, orderBy("hora","desc")), snapshot=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const m = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.entrada||""}</td>
      <td>${m.salida||""}</td>
      <td>${m.tipo}</td>
      <td><button class="delMov" data-id="${docSnap.id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);

    tr.querySelector(".delMov").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      if(confirm("Eliminar movimiento?")) await deleteDoc(doc(movimientosRef,id));
    });
  });
});

/* -----------------------------
   ESCANEO
----------------------------- */
const scanBtn = document.getElementById("scanBtn");
const scannerDiv = document.getElementById("scannerDiv");
const scannerInput = document.getElementById("scannerInput");
const cancelScanBtn = document.getElementById("cancelScanBtn");

scanBtn.addEventListener("click", ()=>{
  scannerDiv.classList.remove("hidden");
  scannerInput.value="";
  scannerInput.focus();
});
cancelScanBtn.addEventListener("click", ()=>{ scannerDiv.classList.add("hidden"); });

scannerInput.addEventListener("input", async e=>{
  const codigo = e.target.value.trim();
  if(codigo.length>=8){
    // Buscar usuario por código
    let tipoMov="entrada";
    let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",codigo)));
    if(snap.empty){
      snap = await getDocs(query(usuariosRef, where("codigoSalida","==",codigo)));
      if(snap.empty){ alert("Código no reconocido"); return; }
      tipoMov="salida";
    }
    for(const d of snap.docs){
      const u=d.data();
      const mov={
        L:u.L,
        nombre:u.nombre,
        dni:u.dni,
        tipo:u.tipo,
        hora:new Date(),
        entrada: tipoMov==="entrada"?new Date().toLocaleTimeString():"",
        salida: tipoMov==="salida"?new Date().toLocaleTimeString():""
      };
      await addDoc(movimientosRef,mov);
    }
    scannerDiv.classList.add("hidden");
  }
});
