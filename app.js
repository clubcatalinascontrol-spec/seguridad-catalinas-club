// Importar Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, orderBy, serverTimestamp, limit, where } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Configuración Firebase
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

// Referencias
const usuariosRef = collection(db,"usuarios");
const movimientosRef = collection(db,"movimientos");

const usuariosBtn = document.getElementById("usuariosBtn");
const movimientosBtn = document.getElementById("movimientosBtn");
const usuariosSection = document.getElementById("usuariosSection");
const movimientosSection = document.getElementById("movimientosSection");

usuariosBtn.addEventListener("click",()=>{usuariosSection.classList.remove("hidden"); movimientosSection.classList.add("hidden");});
movimientosBtn.addEventListener("click",()=>{movimientosSection.classList.remove("hidden"); usuariosSection.classList.add("hidden");});

// ================== USUARIOS ==================
const usuarioForm = document.getElementById("usuarioForm");
const usuariosTable = document.querySelector("#usuariosTable tbody");

async function cargarUsuarios(){
  usuariosTable.innerHTML="";
  const q = query(usuariosRef, orderBy("L"));
  const snapshot = await getDocs(q);
  snapshot.forEach(d=>{
    const u = d.data();
    const tr = document.createElement("tr");
    tr.innerHTML=`
      <td>${u.L}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.tipo}</td>
      <td>
        <button onclick="editarUsuario('${d.id}','${u.L}','${u.nombre}','${u.dni}','${u.tipo}')">Editar</button>
        <button onclick="eliminarUsuario('${d.id}')">Eliminar</button>
        <button onclick="imprimirTarjeta('${u.L}','${u.nombre}','${u.dni}','${u.tipo}')">Imprimir Tarjeta</button>
      </td>
    `;
    usuariosTable.appendChild(tr);
  });
}
cargarUsuarios();

usuarioForm.addEventListener("submit", async e=>{
  e.preventDefault();
  const id = document.getElementById("usuarioId").value;
  const uData = {
    L: document.getElementById("usuarioL").value.trim(),
    nombre: document.getElementById("usuarioNombre").value.trim(),
    dni: document.getElementById("usuarioDni").value.trim(),
    tipo: document.getElementById("usuarioTipo").value
  };
  if(id){
    await updateDoc(doc(db,"usuarios",id),uData);
  }else{
    await addDoc(usuariosRef,uData);
  }
  usuarioForm.reset();
  document.getElementById("usuarioId").value="";
  cargarUsuarios();
});

window.editarUsuario=(id,L,nombre,dni,tipo)=>{
  document.getElementById("usuarioId").value=id;
  document.getElementById("usuarioL").value=L;
  document.getElementById("usuarioNombre").value=nombre;
  document.getElementById("usuarioDni").value=dni;
  document.getElementById("usuarioTipo").value=tipo;
};

window.eliminarUsuario=async(id)=>{
  if(confirm("¿Seguro que desea eliminar este usuario?")){
    await deleteDoc(doc(db,"usuarios",id));
    cargarUsuarios();
  }
};

// Imprimir tarjeta
window.imprimirTarjeta=(L,nombre,dni,tipo)=>{
  const entradaCode = `ENT-${L}-${dni}`;
  const salidaCode = `SAL-${L}-${dni}`;
  const win = window.open("","_blank");
  win.document.write(`
    <html><head><title>Tarjeta</title></head><body>
    <h3>${nombre}</h3>
    <p>#L: ${L} - DNI: ${dni} - Tipo: ${tipo}</p>
    <p><b>Entrada:</b> ${entradaCode}</p>
    <p><b>Salida:</b> ${salidaCode}</p>
    <script>window.print();</script>
    </body></html>
  `);
  win.document.close();
};

// ================== MOVIMIENTOS ==================
const scannerInput=document.getElementById("scannerInput");
const scanMsg=document.getElementById("scanMsg");
const movimientosTable=document.querySelector("#movimientosTable tbody");

let paginaActual=1;
const porPagina=25;

scannerInput.addEventListener("input", async ()=>{
  const code=scannerInput.value.trim();
  if(code.length<5) return;
  await procesarCodigo(code);
  scannerInput.value="";
});

function horaActualStr(){
  const now=new Date();
  return now.toLocaleString("es-AR");
}

async function procesarCodigo(code){
  try{
    let esEntrada=code.startsWith("ENT-");
    let esSalida=code.startsWith("SAL-");
    if(!esEntrada && !esSalida){
      scanMsg.textContent="Código inválido";
      scanMsg.style.color="red"; return;
    }
    const parts=code.split("-");
    const L=parts[1];
    const dni=parts[2];
    const qU=query(usuariosRef, where("L","==",L), where("dni","==",dni));
    const snapU=await getDocs(qU);
    if(snapU.empty){scanMsg.textContent="Usuario no encontrado"; scanMsg.style.color="red"; return;}
    const u=snapU.docs[0].data();

    if(esEntrada){
      await addDoc(movimientosRef,{
        L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,
        entrada:horaActualStr(),salida:"",hora:serverTimestamp()
      });
    } else {
      // Corrección: buscar último movimiento abierto sin depender de índice compuesto
      const movQ=query(movimientosRef, where("L","==",u.L), orderBy("hora","desc"), limit(5));
      const movSnap=await getDocs(movQ);
      let lastMov=null;
      movSnap.forEach(docu=>{
        const data=docu.data();
        if(data.salida==="") lastMov=docu;
      });
      if(lastMov){
        await updateDoc(doc(db,"movimientos",lastMov.id),{salida:horaActualStr()});
      } else {
        await addDoc(movimientosRef,{
          L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo,
          entrada:"",salida:horaActualStr(),hora:serverTimestamp()
        });
      }
    }
    scanMsg.textContent="Registro exitoso";
    scanMsg.style.color="lime";
    cargarMovimientos();
  }catch(err){
    console.error(err);
    scanMsg.textContent="Error al registrar";
    scanMsg.style.color="red";
  }
}

// Cargar movimientos
async function cargarMovimientos(){
  movimientosTable.innerHTML="";
  const q=query(movimientosRef, orderBy("hora","desc"));
  const snapshot=await getDocs(q);
  const docs=snapshot.docs;
  const totalPaginas=Math.ceil(docs.length/porPagina);
  if(paginaActual>totalPaginas) paginaActual=totalPaginas||1;
  const start=(paginaActual-1)*porPagina;
  const end=start+porPagina;
  const pageDocs=docs.slice(start,end);

  pageDocs.forEach(d=>{
    const m=d.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`
      <td>${m.L}</td>
      <td>${m.nombre}</td>
      <td>${m.dni}</td>
      <td>${m.tipo}</td>
      <td>${m.entrada}</td>
      <td>${m.salida}</td>
      <td><button onclick="eliminarMovimiento('${d.id}')">Eliminar</button></td>
    `;
    movimientosTable.appendChild(tr);
  });

  document.getElementById("pageInfo").textContent=`${paginaActual}/${totalPaginas||1}`;
}
cargarMovimientos();

document.getElementById("prevPage").addEventListener("click",()=>{if(paginaActual>1){paginaActual--;cargarMovimientos();}});
document.getElementById("nextPage").addEventListener("click",()=>{paginaActual++;cargarMovimientos();});

// Eliminar movimiento
window.eliminarMovimiento=async(id)=>{
  const pass=prompt("Ingrese contraseña para eliminar:");
  if(pass==="123456789"||pass==="admin"){ 
    await deleteDoc(doc(db,"movimientos",id));
    cargarMovimientos();
  } else {
    alert("Contraseña incorrecta");
  }
};

// Imprimir movimientos
document.getElementById("imprimirMovimientosBtn").addEventListener("click",()=>{
  const tabla=document.getElementById("movimientosTable").outerHTML;
  const win=window.open("","_blank");
  win.document.write(`<html><head><title>Movimientos</title></head><body>${tabla}<script>window.print();</script></body></html>`);
  win.document.close();
});
