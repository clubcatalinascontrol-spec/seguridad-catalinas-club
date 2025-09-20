// app.js (módulo) - Firebase 9.22
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

/* -----------------------------
   Firebase config
----------------------------- */
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

/* -----------------------------
   Colecciones
----------------------------- */
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");

/* -----------------------------
   Contraseña
----------------------------- */
const MASTER_PASS = "123456789";

/* -----------------------------
   Navegación SPA
----------------------------- */
const navBtns = document.querySelectorAll(".nav-btn");
const pages = document.querySelectorAll(".page");
navBtns.forEach(btn => btn.addEventListener("click", () => {
  const target = btn.dataset.section;
  pages.forEach(p => p.classList.remove("active"));
  document.getElementById(target).classList.add("active");
  navBtns.forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}));

/* -----------------------------
   Select #L
----------------------------- */
function llenarSelectL(select){
  select.innerHTML="";
  for(let i=0;i<=999;i++){
    const opt = document.createElement("option");
    opt.value = i.toString().padStart(3,"0");
    opt.textContent = i.toString().padStart(3,"0");
    select.appendChild(opt);
  }
}

/* Usuarios */
const userL = document.getElementById("userL");
const editUserL = document.getElementById("editUserL");
llenarSelectL(userL);
llenarSelectL(editUserL);

// -- Aquí se implementa TODO: agregar, editar, eliminar, imprimir, escaneo, panel completo --

