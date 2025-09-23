// ===== Variables y selectores =====
const pages = document.querySelectorAll('.page');
const navBtns = document.querySelectorAll('.nav-btn');
const tabBtns = document.querySelectorAll('.tab-btn');
const movimientosTableBody = document.querySelector('#movimientosTable tbody');
const usersTableBody = document.querySelector('#usersTable tbody');
const expiredTableBody = document.querySelector('#expiredTable tbody');
const novedadesTableBody = document.querySelector('#novedadesTable tbody');

const scanModal = document.getElementById('scanModal');
const scanInput = document.getElementById('scanInput');
const scanMessage = document.getElementById('scanMessage');

const editUserModal = document.getElementById('editUserModal');
const editUserMsg = document.getElementById('editUserMsg');

// ===== Datos locales =====
let usuarios = [];
let movimientos = [];
let expirados = [];
let novedades = [];

// ===== Funciones =====
function showPage(pageId) {
  pages.forEach(p=>p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  navBtns.forEach(b=>b.classList.remove('active'));
  document.querySelector(`.nav-btn[data-section="${pageId}"]`).classList.add('active');
}

navBtns.forEach(btn=>{
  btn.addEventListener('click',()=>showPage(btn.dataset.section));
});

function updateTables() {
  movimientosTableBody.innerHTML = '';
  usuarios.forEach((u,i)=>{
    let entrada = movimientos.find(m=>m.userId===u.id)?.entrada || '';
    let salida = movimientos.find(m=>m.userId===u.id)?.salida || '';
    let tr = `<tr>
      <td>${i+1}</td>
      <td>${u.nombre}</td>
      <td>${entrada}</td>
      <td>${salida}</td>
      <td>${u.tipo}</td>
      <td><button onclick="editarUsuario('${u.id}')">Editar</button></td>
    </tr>`;
    movimientosTableBody.innerHTML += tr;
  });

  usersTableBody.innerHTML = '';
  usuarios.forEach((u,i)=>{
    usersTableBody.innerHTML += `<tr>
      <td>${i+1}</td>
      <td>${u.nombre}</td>
      <td>${u.dni}</td>
      <td>${u.celular}</td>
      <td>${u.autorizante}</td>
      <td>${u.tipo}</td>
      <td><button onclick="editarUsuario('${u.id}')">Editar</button></td>
    </tr>`;
  });

  expiredTableBody.innerHTML = '';
  expirados.forEach((u,i)=>{
    expiredTableBody.innerHTML += `<tr>
      <td>${i+1}</td>
      <td>${u.nombre}</td>
      <td>${u.fecha}</td>
      <td>${u.tipo}</td>
      <td>${u.codigoEntrada || ''}</td>
      <td>${u.codigoSalida || ''}</td>
    </tr>`;
  });

  novedadesTableBody.innerHTML = '';
  novedades.forEach(n=>{
    novedadesTableBody.innerHTML += `<tr>
      <td>${n.hora}</td>
      <td>${n.texto}</td>
      <td><button onclick="eliminarNovedad('${n.id}')">Eliminar</button></td>
    </tr>`;
  });
}

// ===== Agregar usuario =====
document.getElementById('addUserBtn').addEventListener('click',()=>{
  const nombre = document.getElementById('userNombre').value.trim();
  if(!nombre) return alert('Ingrese nombre');
  const dni = document.getElementById('userDni').value.trim();
  const celular = document.getElementById('userCelular').value.trim();
  const autorizante = document.getElementById('userAutorizante').value.trim();
  const tipo = document.getElementById('userTipo').value.trim();
  const id = Date.now().toString();
  usuarios.push({id,nombre,dni,celular,autorizante,tipo});
  updateTables();
  document.getElementById('userMessage').textContent='Usuario agregado';
});

// ===== Editar usuario =====
function editarUsuario(id){
  const u = usuarios.find(x=>x.id===id);
  if(!u) return;
  editUserModal.classList.add('active');
  document.getElementById('editUserNombre').value=u.nombre;
  document.getElementById('editUserDni').value=u.dni;
  document.getElementById('editUserCelular').value=u.celular;
  document.getElementById('editUserAutorizante').value=u.autorizante;
  document.getElementById('editUserTipo').value=u.tipo;
  document.getElementById('finalizeEditBtn').onclick=()=>{
    u.nombre=document.getElementById('editUserNombre').value.trim();
    u.dni=document.getElementById('editUserDni').value.trim();
    u.celular=document.getElementById('editUserCelular').value.trim();
    u.autorizante=document.getElementById('editUserAutorizante').value.trim();
    u.tipo=document.getElementById('editUserTipo').value.trim();
    updateTables();
    editUserModal.classList.remove('active');
  };
  document.getElementById('cancelEditBtn').onclick=()=>editUserModal.classList.remove('active');
}

// ===== Escaneo de códigos =====
document.getElementById('scanBtn').addEventListener('click',()=>scanModal.classList.add('active'));
document.getElementById('cancelScanBtn').addEventListener('click',()=>scanModal.classList.remove('active'));
scanInput.addEventListener('keypress',e=>{
  if(e.key==='Enter'){
    const val=scanInput.value.trim();
    if(val.length!==8){scanMessage.textContent='Código inválido';return;}
    const user = usuarios.find(u=>u.id.slice(-8)===val);
    if(!user){scanMessage.textContent='Usuario no encontrado';return;}
    let m = movimientos.find(x=>x.userId===user.id);
    if(!m){movimientos.push({userId:user.id,entrada:new Date().toLocaleTimeString(),salida:''});}
    else{m.salida=new Date().toLocaleTimeString();}
    scanMessage.textContent='Registrado correctamente';
    updateTables();
    scanInput.value='';
  }
});

// ===== Novedades =====
document.getElementById('saveNovedadBtn').addEventListener('click',()=>{
  const texto=document.getElementById('novedadText').value.trim();
  if(!texto) return;
  novedades.push({id:Date.now().toString(),hora:new Date().toLocaleTimeString(),texto});
  updateTables();
  document.getElementById('novedadText').value='';
});

// ===== Inicialización =====
updateTables();
