import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc,
  query, orderBy
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

const usuariosRef = collection(db,"usuarios");
const movimientosRef = collection(db,"movimientos");
const expiredRef = collection(db,"expiredCodes");

const MASTER_PASS="9999";
if(!localStorage.getItem("adminPass")) localStorage.setItem("adminPass","1234");
function checkPass(pass){return pass===MASTER_PASS||pass===localStorage.getItem("adminPass");}

function generarCodigo(){return Math.random().toString(36).substring(2,10).toUpperCase();}
function horaActualStr(){const d=new Date();return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")} (${d.getDate().toString().padStart(2,"0")}/${(d.getMonth()+1).toString().padStart(2,"0")}/${d.getFullYear()})`;}

const navBtns=document.querySelectorAll(".nav-btn");
const pages=document.querySelectorAll(".page");
navBtns.forEach(btn=>btn.addEventListener("click",()=>{pages.forEach(p=>p.classList.remove("active"));document.getElementById(btn.dataset.section).classList.add("active");navBtns.forEach(b=>b.classList.remove("active"));btn.classList.add("active");}));

// #L desplegable
function llenarLSelect(select){
  select.innerHTML="";
  for(let i=0;i<=999;i++){
    let n=i.toString().padStart(3,"0");
    let opt=document.createElement("option");
    opt.value=n; opt.textContent=n; select.appendChild(opt);
  }
}
const userL=document.getElementById("userL");
const editUserL=document.getElementById("editUserL");
llenarLSelect(userL);llenarLSelect(editUserL);

const userNombre=document.getElementById("userNombre");
const userDni=document.getElementById("userDni");
const userTipo=document.getElementById("userTipo");
const addUserBtn=document.getElementById("addUserBtn");
const userMessage=document.getElementById("userMessage");
const usersTableBody=document.querySelector("#usersTable tbody");

// Agregar usuario
addUserBtn.addEventListener("click",async ()=>{
  const L=userL.value.trim(), nombre=userNombre.value.trim(), dni=userDni.value.trim(), tipo=userTipo.value;
  if(!L||!nombre||!dni||!tipo){userMessage.textContent="Complete todos los campos";return;}
  if(!/^\d{3}$/.test(L)){userMessage.textContent="#L inválido";return;}
  if(!/^\d{8}$/.test(dni)){userMessage.textContent="DNI inválido";return;}
  try{
    await addDoc(usuariosRef,{L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
    userMessage.textContent="Usuario agregado";
    userNombre.value=""; userDni.value=""; userTipo.value="";
    setTimeout(()=>userMessage.textContent="",2500);
  }catch(err){console.error(err);userMessage.textContent="Error";}
});

// Render usuarios
onSnapshot(query(usuariosRef,orderBy("L")),snapshot=>{
  usersTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${docSnap.id}">Editar</button>
        <button class="del-btn" data-id="${docSnap.id}">Eliminar</button>
        <button class="print-btn" data-id="${docSnap.id}">Imprimir Tarjeta</button>
      </td>`;
    usersTableBody.appendChild(tr);

    tr.querySelector(".edit-btn").addEventListener("click",()=>{
      const id=docSnap.id;
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      document.getElementById("editUserModal").classList.add("active");
      editUserL.value=u.L; document.getElementById("editUserNombre").value=u.nombre; document.getElementById("editUserDni").value=u.dni; document.getElementById("editUserTipo").value=u.tipo;
      const finalizeBtn=document.getElementById("finalizeEditBtn");
      const cancelBtn=document.getElementById("cancelEditBtn");
      const msgSpan=document.getElementById("editUserMsg");
      finalizeBtn.onclick=async ()=>{
        const newL=editUserL.value.trim(), newNombre=document.getElementById("editUserNombre").value.trim(), newDni=document.getElementById("editUserDni").value.trim(), newTipo=document.getElementById("editUserTipo").value;
        if(!newL||!newNombre||!newDni||!newTipo){msgSpan.textContent="Complete todos los campos";return;}
        try{await updateDoc(doc(db,"usuarios",id),{L:newL,nombre:newNombre,dni:newDni,tipo:newTipo});msgSpan.style.color="green";msgSpan.textContent="Usuario editado"; setTimeout(()=>{document.getElementById("editUserModal").classList.remove("active");msgSpan.textContent="";msgSpan.style.color="#0a0";},1500);}catch(err){console.error(err);msgSpan.textContent="Error editando";}
      };
      cancelBtn.onclick=()=>{document.getElementById("editUserModal").classList.remove("active");msgSpan.textContent="";};
    });

    tr.querySelector(".del-btn").addEventListener("click",async ()=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      if(!confirm("Eliminar usuario permanentemente?")) return;
      try{
        if(u.codigoIngreso) await addDoc(expiredRef,{code:u.codigoIngreso,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        if(u.codigoSalida) await addDoc(expiredRef,{code:u.codigoSalida,reason:"usuario_eliminado",L:u.L,nombre:u.nombre,when:new Date()});
        await deleteDoc(doc(db,"usuarios",docSnap.id));
        alert("Usuario eliminado y códigos invalidados.");
      }catch(err){console.error(err);alert("Error eliminando usuario");}
    });

    tr.querySelector(".print-btn").addEventListener("click",()=>{
      const pass=prompt("Ingrese contraseña de administración para continuar");
      if(!checkPass(pass)){ alert("Contraseña incorrecta"); return; }
      const borderColor={"propietario":"violet","administracion":"orange","empleado":"green","obrero":"yellow","invitado":"cyan","guardia":"red"}[u.tipo]||"gray";
      const w=window.open("","_blank","width=600,height=380");
      w.document.write(`<html><head><title>Tarjeta ${u.L}</title><style>body{font-family:Arial;text-align:center}.card{width:15cm;height:6cm;border:12px solid ${borderColor};box-sizing:border-box;padding:12px;margin:auto;display:flex;flex-direction:column;justify-content:center;align-items:center}.card h2{margin:0}svg{margin-top:10px}</style></head><body><div class="card"><h2>${u.nombre}</h2><div>#L: ${u.L} | ${u.tipo}</div><svg id="barcode"></svg></div><script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script><script>JsBarcode("#barcode","${u.codigoIngreso}",{format:"CODE128",displayValue:true,width:2,height:40})</script></body></html>`);
      w.document.close();
      w.print();
    });
  });
});

// Panel movimientos
const scanBtn=document.getElementById("scanBtn");
const printPageBtn=document.getElementById("printPageBtn");
const scanModal=document.getElementById("scanModal");
const scanInput=document.getElementById("scanInput");
const confirmScanBtn=document.getElementById("confirmScanBtn");
const cancelScanBtn=document.getElementById("cancelScanBtn");
const scanMessage=document.getElementById("scanMessage");
const scanOk=document.getElementById("scanOk");
const movimientosTableBody=document.querySelector("#movimientosTable tbody");

scanBtn.addEventListener("click",()=>{scanModal.classList.add("active");scanInput.value="";scanInput.focus();scanMessage.textContent="";});
cancelScanBtn.addEventListener("click",()=>{scanModal.classList.remove("active");scanMessage.textContent="";});

confirmScanBtn.addEventListener("click",async ()=>{
  const code=scanInput.value.trim();
  if(!code){scanMessage.textContent="Ingrese código";return;}
  // Buscar usuario por código
  let usuarioSnapshot=await getDocs(query(usuariosRef));
  let found=null;
  usuarioSnapshot.forEach(docSnap=>{const u=docSnap.data();if(u.codigoIngreso===code||u.codigoSalida===code) found={id:docSnap.id,...u};});
  if(!found){scanMessage.textContent="Código inválido";return;}
  // Determinar si es entrada o salida
  const tipoMov=found.codigoIngreso===code?"entrada":"salida";
  try{
    await addDoc(movimientosRef,{L:found.L,nombre:found.nombre,dni:found.dni,tipo:tipoMov,hora:horaActualStr()});
    scanOk.style.display="inline";setTimeout(()=>scanOk.style.display="none",1000);
    scanModal.classList.remove("active");
  }catch(err){scanMessage.textContent="Error registrando movimiento";}
});

// Mostrar movimientos
onSnapshot(query(movimientosRef,orderBy("hora","desc")),snapshot=>{
  movimientosTableBody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const m=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.tipo==="entrada"?m.hora:"-"}</td><td>${m.tipo==="salida"?m.hora:"-"}</td><td>${m.tipo}</td><td></td>`;
    movimientosTableBody.appendChild(tr);
  });
});

// Imprimir movimientos
printPageBtn.addEventListener("click",()=>{window.print();});

// Cambiar contraseña
document.getElementById("savePassBtn").addEventListener("click",()=>{
  const c=document.getElementById("currentPass").value;
  const n=document.getElementById("newPass").value;
  if(!c||!n){alert("Complete ambos campos");return;}
  if(!checkPass(c)){alert("Contraseña actual incorrecta");return;}
  if(!/^\d{4}$/.test(n)){alert("Nueva contraseña inválida");return;}
  localStorage.setItem("adminPass",n);
  alert("Contraseña actualizada");
});

// Restaurar contraseña
document.getElementById("restoreDefaultBtn").addEventListener("click",()=>{
  localStorage.setItem("adminPass","123456789");
  document.getElementById("restoreMsg").textContent="Contraseña restaurada"; setTimeout(()=>{document.getElementById("restoreMsg").textContent="";},2500);
});
