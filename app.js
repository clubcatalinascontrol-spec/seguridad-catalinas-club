import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, where, orderBy, limit
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

/* -----------------------------
   Contraseñas admin y respaldo
----------------------------- */
if (!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
if (!localStorage.getItem("backupPass")) localStorage.setItem("backupPass","9999");

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
   USUARIOS
----------------------------- */
const userL = document.getElementById("userL");
const userNombre = document.getElementById("userNombre");
const userDni = document.getElementById("userDni");
const userTipo = document.getElementById("userTipo");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");
const usersTableBody = document.querySelector("#usersTable tbody");

addUserBtn.addEventListener("click", async ()=>{
  const L=userL.value.trim();
  const nombre=userNombre.value.trim();
  const dni=userDni.value.trim();
  const tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){ userMessage.textContent="Complete todos los campos"; return; }
  if(!/^\d{1,3}$/.test(L)){ userMessage.textContent="#L debe ser hasta 3 dígitos"; return; }
  if(!/^\d{8}$/.test(dni)){ userMessage.textContent="DNI debe tener 8 dígitos"; return; }

  try{
    await addDoc(usuariosRef,{
      L,nombre,dni,tipo,
      codigoIngreso: generarCodigo(),
      codigoSalida: generarCodigo()
    });
    userMessage.textContent="Usuario agregado con éxito";
    userL.value=""; userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2800);
  } catch(err){ console.error(err); userMessage.textContent="Error al agregar"; }
});

/* Render usuarios en tiempo real */
onSnapshot(query(usuariosRef, orderBy("L")), snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u = docSnap.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button class="editUser" data-id="${docSnap.id}">Editar</button>
        <button class="delUser" data-id="${docSnap.id}">Eliminar</button>
        <button class="printUser" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

    tr.querySelector(".editUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }

      const newL=prompt("Nuevo #L:", u.L); if(newL===null) return;
      const newNombre=prompt("Nuevo nombre:", u.nombre); if(newNombre===null) return;
      const newDni=prompt("Nuevo DNI:", u.dni); if(newDni===null) return;
      const newTipo=prompt("Nuevo tipo:", u.tipo); if(newTipo===null) return;

      await updateDoc(doc(usuariosRef,id), {L:newL,nombre:newNombre,dni:newDni,tipo:newTipo});
    });
    tr.querySelector(".delUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
      if(confirm("Eliminar usuario?")) await deleteDoc(doc(usuariosRef,id));
    });
    tr.querySelector(".printUser").addEventListener("click", async e=>{
      const id=e.currentTarget.dataset.id;
      const uSnap = await getDocs(query(usuariosRef, where("__name__","==",id)));
      const uData = uSnap.docs[0].data();
      imprimirTarjeta(uData);
    });
  });
});

/* -----------------------------
   ESCANEO DE CÓDIGOS
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
      scannerDiv.classList.add("hidden");
    }catch(err){ console.error(err); alert("Error registrando movimiento"); }
  }
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
      const pass=prompt("Contraseña admin (4 dígitos):");
      if(pass!==localStorage.getItem("adminPass") && pass!==localStorage.getItem("backupPass")){ alert("Contraseña incorrecta"); return; }
      if(confirm("Eliminar movimiento?")) await deleteDoc(doc(movimientosRef,id));
    });
  });
});

/* -----------------------------
   IMPRESIÓN DE TARJETA
----------------------------- */
function imprimirTarjeta(u){
  const w=400,h=200;
  const html=`
  <div style="width:${w}px;height:${h}px;border:2px solid #000;display:flex;flex-direction:column;justify-content:space-around;align-items:center;padding:10px;">
    <div style="font-size:10px;">Ingreso</div>
    <svg id="barcodeIngreso"></svg>
    <div style="font-size:16px;text-align:center;">
      ${u.nombre}<br>DNI: ${u.dni}<br>Tipo: ${u.tipo}
    </div>
    <svg id="barcodeSalida"></svg>
    <div style="font-size:10px;">Salida</div>
  </div>`;
  const win=window.open("","_blank");
  win.document.write(html);
  win.document.close();
  JsBarcode(win.document.getElementById("barcodeIngreso"), u.codigoIngreso, {format:"CODE128",width:2,height:40,displayValue:false});
  JsBarcode(win.document.getElementById("barcodeSalida"), u.codigoSalida, {format:"CODE128",width:2,height:40,displayValue:false});
  win.print();
}

/* -----------------------------
   CAMBIO DE CONTRASEÑA
----------------------------- */
const savePassBtn = document.getElementById("savePassBtn");
const currentPass = document.getElementById("currentPass");
const newPass = document.getElementById("newPass");

savePassBtn.addEventListener("click", ()=>{
  const cur = currentPass.value.trim();
  const nue = newPass.value.trim();
  if(cur!==localStorage.getItem("adminPass") && cur!==localStorage.getItem("backupPass")){ alert("Contraseña actual incorrecta"); return; }
  if(!/^\d{4}$/.test(nue)){ alert("Nueva contraseña debe ser 4 números"); return; }
  localStorage.setItem("adminPass",nue);
  alert("Contraseña cambiada con éxito");
  currentPass.value=""; newPass.value="";
});
