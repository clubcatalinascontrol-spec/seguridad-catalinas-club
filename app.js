import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
} from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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
const movimientosRef = collection(db, "movimientos");

if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
if (!localStorage.getItem("backupPass")) localStorage.setItem("backupPass","9999"); // contraseña de respaldo

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
   SPA Navegación
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
   Escaneo
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
  if(e.target.value.length>=8){
    const codigo = e.target.value.trim();
    try{
      let snap = await getDocs(query(usuariosRef, where("codigoIngreso","==",codigo)));
      let tipoMov="entrada";
      if(snap.empty){
        snap = await getDocs(query(usuariosRef, where("codigoSalida","==",codigo)));
        if(snap.empty){ alert("Código no reconocido"); return; }
        tipoMov="salida";
      }
      for(const d of snap.docs){
        const u=d.data();
        const mov={L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,hora:new Date()};
        if(tipoMov==="entrada") mov.entrada=horaActualStr();
        else mov.salida=horaActualStr();
        await addDoc(movimientosRef,mov);
      }
      alert("Movimiento registrado");
      scannerDiv.classList.add("hidden");
    }catch(err){ console.error(err); alert("Error registrando movimiento"); }
  }
});

/* -----------------------------
   Resto del código JS
   (usuarios, movimientos, tarjetas, impresión, etc.)
   Se mantiene tal cual como en tu base por defecto
----------------------------- */
// ...aquí iría el resto del código tal como estaba en tu app.js base para usuarios y movimientos...
