// Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBmgexrB3aDlx5XARYqigaPoFsWX5vDz_4",
  authDomain: "seguridad-catalinas-club.firebaseapp.com",
  projectId: "seguridad-catalinas-club",
  storageBucket: "seguridad-catalinas-club.appspot.com",
  messagingSenderId: "980866194296",
  appId: "1:980866194296:web:3fefc2a107d0ec6052468d"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const usuariosRef = db.collection("usuarios");
const movimientosRef = db.collection("movimientos");

if(!localStorage.getItem("pinMaestro")) localStorage.setItem("pinMaestro","1234");

// Navegación
document.querySelectorAll("#nav button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".section").forEach(sec=>sec.style.display="none");
    document.getElementById(btn.dataset.section).style.display="block";
  });
});

// Helpers
function generarCodigo(){return Math.random().toString(36).substring(2,10);}
function horaActual(){ const d=new Date(); return d.getHours().toString().padStart(2,'0')+":"+d.getMinutes().toString().padStart(2,'0')+" ("+d.toLocaleDateString()+")";}
function colorTipo(tipo){switch(tipo){case "propietario":return "violet";case "administracion":return "orange";case "empleado":return "green";case "obrero":return "yellow";case "invitado":return "cyan";case "guardia":return "red";default:return "gray";}}

// --- Agregar Usuario ---
const userMessage=document.getElementById("userMessage");
document.getElementById("addUserBtn").addEventListener("click", async ()=>{
  const L=document.getElementById("userL").value.trim();
  const nombre=document.getElementById("userNombre").value.trim();
  const dni=document.getElementById("userDni").value.trim();
  const tipo=document.getElementById("userTipo").value;
  if(!L||!nombre||!dni||!tipo){userMessage.textContent="Complete todos los campos"; return;}
  if(dni.length!==8){userMessage.textContent="DNI debe tener 8 dígitos"; return;}
  await usuariosRef.add({L,nombre,dni,tipo,codigoIngreso:generarCodigo(),codigoSalida:generarCodigo()});
  userMessage.textContent="Usuario agregado con éxito";
  setTimeout(()=>userMessage.textContent="",3000);
  document.getElementById("userL").value="";
  document.getElementById("userNombre").value="";
  document.getElementById("userDni").value="";
});

// --- Render Usuarios ---
function renderUsuarios(snapshot){
  const tbody=document.querySelector("#usersTable tbody");
  tbody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const u=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${u.L}</td><td>${u.nombre}</td><td>${u.dni}</td><td>${u.tipo}</td>
      <td>
      <button class="editUser">Editar</button>
      <button class="delUser">Eliminar</button>
      <button class="printUser">Imprimir Tarjeta</button>
      </td>`;
    tbody.appendChild(tr);

    tr.querySelector(".editUser").onclick=async()=>{
      const pin=prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){alert("PIN incorrecto"); return;}
      const newNombre=prompt("Nuevo nombre", u.nombre);
      const newDni=prompt("Nuevo DNI", u.dni);
      const newTipo=prompt("Nuevo tipo", u.tipo);
      await usuariosRef.doc(docSnap.id).update({nombre:newNombre,dni:newDni,tipo:newTipo});
    };

    tr.querySelector(".delUser").onclick=async()=>{
      const pin=prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){alert("PIN incorrecto"); return;}
      await usuariosRef.doc(docSnap.id).delete();
    };

    tr.querySelector(".printUser").onclick=()=>{
      const pin=prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){alert("PIN incorrecto"); return;}
      const w=window.open("","_blank","width=400,height=300");
      const color=colorTipo(u.tipo);
      w.document.write(`<div style="width:15cm;height:6cm;border:1cm solid ${color};text-align:center;">
        <p>#${u.L} - ${u.nombre} - ${u.dni} - ${u.tipo}</p>
        <svg id="codeIngreso"></svg>
        <svg id="codeSalida"></svg>
      </div>`);
      JsBarcode(w.document.getElementById("codeIngreso"), u.codigoIngreso, {format:"CODE128"});
      JsBarcode(w.document.getElementById("codeSalida"), u.codigoSalida, {format:"CODE128"});
      w.print();
      w.close();
    };
  });
}

usuariosRef.onSnapshot(renderUsuarios);

// --- Movimientos en tiempo real ---
function renderMovimientos(snapshot){
  const tbody=document.querySelector("#movimientosTable tbody");
  tbody.innerHTML="";
  snapshot.docs.forEach(docSnap=>{
    const m=docSnap.data();
    const tr=document.createElement("tr");
    tr.innerHTML=`<td>${m.L}</td><td>${m.nombre}</td><td>${m.dni}</td><td>${m.entrada||""}</td><td>${m.salida||""}</td><td>${m.tipo}</td>
    <td><button class="delMov">Eliminar</button></td>`;
    tbody.appendChild(tr);
    tr.querySelector(".delMov").onclick=async()=>{
      const pin=prompt("Ingrese PIN maestro:");
      if(pin!==localStorage.getItem("pinMaestro")){alert("PIN incorrecto"); return;}
      await movimientosRef.doc(docSnap.id).delete();
    };
  });
}
movimientosRef.orderBy("hora","desc").onSnapshot(renderMovimientos);

// --- Escaneo ---
document.getElementById("scanBtn").onclick=async()=>{
  const codigo=prompt("Escanee el código de barra:"); if(!codigo) return;
  const query=await usuariosRef.where("codigoIngreso","==",codigo).get();
  let tipoMov="entrada";
  if(query.empty){
    const qSalida=await usuariosRef.where("codigoSalida","==",codigo).get();
    if(qSalida.empty){alert("Código no reconocido"); return;}
    else {tipoMov="salida"; query=qSalida;}
  }
  query.forEach(async docSnap=>{
    const u=docSnap.data();
    const data={L:u.L,nombre:u.nombre,dni:u.dni,tipo:u.tipo};
    if(tipoMov==="entrada"){data.entrada=horaActual();}
    else{data.salida=horaActual();}
    data.hora=new Date();
    await movimientosRef.add(data);
  });
};

// --- Imprimir última página ---
document.getElementById("printPageBtn").onclick=async()=>{
  const query=await movimientosRef.orderBy("hora","desc").limit(25).get();
  const data=query.docs.map(d=>d.data());
  const w=window.open("","_blank");
  let html=`<table border="1"><thead><tr><th>#L</th><th>Nombre</th><th>DNI</th><th>Entrada</th><th>Salida</th><th>Tipo</th></tr></thead><tbody>`;
  data.forEach(d=>{html+=`<tr><td>${d.L}</td><td>${d.nombre}</td><td>${d.dni}</td><td>${d.entrada||""}</td><td>${d.salida||""}</td><td>${d.tipo}</td></tr>`;});
  html+="</tbody></table>";
  w.document.write(html); w.print(); w.close();
};

// --- CONFIG PIN ---
document.getElementById("savePin").addEventListener("click",()=>{
  const current=document.getElementById("currentPin").value;
  const nuevo=document.getElementById("newPin").value;
  if(current!==localStorage.getItem("pinMaestro")){alert("PIN actual incorrecto"); return;}
  if(nuevo.length!==4){alert("PIN debe tener 4 dígitos"); return;}
  localStorage.setItem("pinMaestro",nuevo);
  alert("PIN actualizado correctamente");
  document.getElementById("currentPin").value="";
  document.getElementById("newPin").value="";
});
