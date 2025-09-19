import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, doc, onSnapshot, query, orderBy 
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

// --- PIN maestro ---
const pinModal = document.getElementById("pinModal");
let deleteTargetId = null;
document.body.addEventListener("click", e=>{
  if(e.target.classList.contains("delete-mov")){
    deleteTargetId = e.target.dataset.id;
    pinModal.classList.add("active");
  }
});
document.getElementById("cancelPin").addEventListener("click", ()=>{
  pinModal.classList.remove("active");
  deleteTargetId=null;
  document.getElementById("pinInput").value="";
});
document.getElementById("confirmPin").addEventListener("click", async ()=>{
  const pinInput = document.getElementById("pinInput").value;
  const pinDoc = await getDocs(collection(db,"config"));
  let pin="1234";
  pinDoc.forEach(d => { pin = d.data().pin; });
  if(pinInput===pin){
    await deleteDoc(doc(db,"movimientos",deleteTargetId));
    alert("Movimiento eliminado");
  }else alert("PIN incorrecto");
  pinModal.classList.remove("active");
  deleteTargetId=null;
  document.getElementById("pinInput").value="";
});

// --- Guardar PIN ---
document.getElementById("savePin").addEventListener("click", async()=>{
  const newPin = document.getElementById("newPin").value;
  if(/^\d{4}$/.test(newPin)){
    await setDoc(doc(db,"config","pin"),{pin:newPin});
    alert("PIN guardado");
  }else alert("PIN inválido, debe tener 4 dígitos");
});

// --- Reimprimir última página ---
document.getElementById("reprintLastPage").addEventListener("click", ()=>{
  // Implementar impresión última página si se requiere
});

// --- Panel de movimientos y usuarios ya implementados en versiones anteriores ---
