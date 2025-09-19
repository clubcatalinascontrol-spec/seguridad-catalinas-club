import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, setDoc, getDocs, deleteDoc, onSnapshot, query, orderBy } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

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

// Navegación SPA
const sections = document.querySelectorAll("main section");
document.querySelectorAll("header .nav button").forEach(btn => {
  btn.addEventListener("click", () => {
    sections.forEach(sec => sec.classList.remove("active"));
    document.getElementById(btn.dataset.section).classList.add("active");
  });
});

// Movimientos
let currentPage = 1;
const pageSize = 25;
let movementsCache = [];

const movimientosTableBody = document.querySelector("#movimientosTable tbody");
const paginationDiv = document.getElementById("pagination");

function renderTable(page){
  movimientosTableBody.innerHTML = "";
  const start = (page-1)*pageSize;
  const end = start + pageSize;
  const pageData = movementsCache.slice(start,end);
  pageData.forEach(mov=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${mov.L}</td><td>${mov.nombre}</td><td>${mov.dni}</td>
    <td>${mov.horaEntrada||'-'}</td><td>${mov.horaSalida||'-'}</td><td>${mov.tipo}</td>
    <td><button class="delete-mov" data-id="${mov.id}">Eliminar</button></td>`;
    movimientosTableBody.appendChild(tr);
  });
  renderPagination(page);
}

function renderPagination(activePage){
  paginationDiv.innerHTML="";
  const totalPages = Math.min(Math.ceil(movementsCache.length/pageSize),10);
  for(let i=1;i<=totalPages;i++){
    const btn = document.createElement("button");
    btn.textContent=i;
    if(i===activePage) btn.classList.add("active");
    btn.addEventListener("click",()=>{currentPage=i; renderTable(currentPage)});
    paginationDiv.appendChild(btn);
  }
}

function printPage(data){
  const win=window.open("","PRINT","height=600,width=800");
  win.document.write("<html><head><title>Movimientos</title></head><body>");
  win.document.write("<table border='1' style='border-collapse:collapse;width:100%'>");
  win.document.write("<tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr>");
  data.forEach(mov=>{win.document.write(`<tr><td>${mov.L}</td><td>${mov.nombre}</td><td>${mov.dni}</td><td>${mov.horaEntrada||'-'}</td><td>${mov.horaSalida||'-'}</td><td>${mov.tipo}</td></tr>`);});
  win.document.write("</table></body></html>");
  win.document.close();
  win.print();
}

// Escucha real-time
onSnapshot(query(collection(db,"movimientos"),orderBy("timestamp","desc")),snapshot=>{
  movementsCache = snapshot.docs.map(doc=>({id:doc.id,...doc.data()}));
  if(movementsCache.length>=pageSize){
    const latestPage=movementsCache.slice(0,pageSize);
    printPage(latestPage);
  }
  renderTable(currentPage);
});

// Eliminar con PIN
const pinModal=document.getElementById("pinModal");
let deleteTargetId=null;
document.body.addEventListener("click",e=>{
  if(e.target.classList.contains("delete-mov")){
    deleteTargetId=e.target.dataset.id;
    pinModal.classList.remove("hidden");
  }
});
document.getElementById("cancelPin").addEventListener("click",()=>{
  pinModal.classList.add("hidden"); deleteTargetId=null;
});
document.getElementById("confirmPin").addEventListener("click",async()=>{
  const pinInput=document.getElementById("pinInput").value;
  const pinDoc=await getDocs(collection(db,"config"));
  let pin="1234";
  pinDoc.forEach(d=>{pin=d.data().pin});
  if(pinInput===pin){
    await deleteDoc(doc(db,"movimientos",deleteTargetId));
    alert("Movimiento eliminado");
  } else {
    alert("PIN incorrecto");
  }
  pinModal.classList.add("hidden");
  deleteTargetId=null;
});

// Guardar PIN
document.getElementById("savePin").addEventListener("click",async()=>{
  const newPin=document.getElementById("newPin").value;
  if(/^\d{4}$/.test(newPin)){
    await setDoc(doc(db,"config","pin"),{pin:newPin});
    alert("PIN guardado");
  }else{
    alert("PIN inválido, debe tener 4 dígitos");
  }
});

// Reimprimir última página
document.getElementById("reprintLastPage").addEventListener("click",()=>{
  const latestPage=movementsCache.slice(0,pageSize);
  printPage(latestPage);
});
