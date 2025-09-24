// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, where } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";

// Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB8fQJsN0tqpuz48Om30m6u6jhEcSfKYEw",
  authDomain: "supermercadox-107f6.firebaseapp.com",
  projectId: "supermercadox-107f6",
  storageBucket: "supermercadox-107f6.appspot.com",
  messagingSenderId: "504958637825",
  appId: "1:504958637825:web:6ae5e2cde43206b3052d00"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-btn');

const movimientosTableBody = document.querySelector('#movimientosTable tbody');
const usersTableBody = document.querySelector('#usersTable tbody');
const expiredTableBody = document.querySelector('#expiredTable tbody');
const novedadesTableBody = document.querySelector('#novedadesTable tbody');

const scanModal = document.getElementById('scanModal');
const scanInput = document.getElementById('scanInput');
const scanMessage = document.getElementById('scanMessage');
const scanBtn = document.getElementById('scanBtn');
const cancelScanBtn = document.getElementById('cancelScanBtn');
const scanOk = document.getElementById('scanOk');

const addUserBtn = document.getElementById('addUserBtn');
const userL = document.getElementById('userL');
const userNombre = document.getElementById('userNombre');
const userDni = document.getElementById('userDni');
const userCelular = document.getElementById('userCelular');
const userAutorizante = document.getElementById('userAutorizante');
const userTipo = document.getElementById('userTipo');
const userMessage = document.getElementById('userMessage');

// Navegación entre secciones
navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    navButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    pages.forEach(p => p.classList.remove('active'));
    document.getElementById(btn.dataset.section).classList.add('active');
  });
});

// FUNCIONES AUXILIARES
function formatDateTime(timestamp) {
  const d = timestamp instanceof Date ? timestamp : timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return d.toLocaleString('es-AR', { hour12: false });
}

function clearTableBody(tbody) {
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
}
// --- PARTE 2: CARGA DE DATOS, FILTROS Y ORDEN CRONOLÓGICO ---

// Cargar movimientos desde Firestore
async function cargarMovimientos() {
  const movimientosCol = collection(db, "movimientos");
  const q = query(movimientosCol, orderBy("fecha", "desc")); // orden cronológico descendente
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  mostrarMovimientos(data);
}

// Mostrar movimientos en tabla
function mostrarMovimientos(movimientos) {
  clearTableBody(movimientosTableBody);

  movimientos.forEach((mov, index) => {
    const tr = document.createElement('tr');
    tr.classList.add('recent');

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${mov.nombre}</td>
      <td>${mov.horaEntrada || ''}</td>
      <td>${mov.horaSalida || ''}</td>
      <td>${mov.tipo || ''}</td>
      <td class="autorizante-td" style="display:${mov.autorizante ? 'table-cell' : 'none'};">${mov.autorizante || ''}</td>
      <td>
        <button class="del-btn" data-id="${mov.id}">ELIMINAR</button>
        <button class="print-btn" data-id="${mov.id}">IMPRIMIR</button>
      </td>
    `;
    movimientosTableBody.appendChild(tr);
  });

  // Agregar event listeners a los botones de eliminar
  movimientosTableBody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "movimientos", id));
      cargarMovimientos();
    });
  });
}

// Filtros por tipo en PANEL
const tabBtns = document.querySelectorAll('.tab-btn');
tabBtns.forEach(btn => {
  btn.addEventListener('click', async () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    const tipo = btn.dataset.tipo;
    const movimientosCol = collection(db, "movimientos");
    let q;
    if (tipo === 'todos') {
      q = query(movimientosCol, orderBy("fecha", "desc"));
    } else {
      q = query(movimientosCol, where("tipo", "==", tipo), orderBy("fecha", "desc"));
    }

    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    mostrarMovimientos(data);
  });
});

// Modal escaneo
scanBtn.addEventListener('click', () => {
  scanModal.classList.add('active');
  scanInput.value = '';
  scanInput.focus();
});

cancelScanBtn.addEventListener('click', () => {
  scanModal.classList.remove('active');
  scanMessage.textContent = '';
});

scanInput.addEventListener('keypress', async (e) => {
  if (e.key === 'Enter') {
    const codigo = scanInput.value.trim();
    if (!codigo) return;

    // Buscar usuario por código en Firebase
    const usersCol = collection(db, "usuarios");
    const q = query(usersCol, where("codigo", "==", codigo));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      scanMessage.textContent = 'Código no encontrado';
      scanMessage.style.color = 'red';
      return;
    }

    const userDoc = snapshot.docs[0];
    const userData = userDoc.data();
    const now = new Date();

    // Registrar movimiento
    await addDoc(collection(db, "movimientos"), {
      nombre: userData.nombre,
      tipo: userData.tipo,
      autorizante: userData.autorizante || '',
      horaEntrada: formatDateTime(now),
      horaSalida: '',
      fecha: now
    });

    scanMessage.textContent = 'Registro OK';
    scanMessage.style.color = 'green';
    scanOk.style.display = 'inline-block';
    scanModal.classList.remove('active');
    cargarMovimientos();
  }
});

// Inicializar
cargarMovimientos();
// --- PARTE 3: USUARIOS, EXPIRADOS, NOVEDADES y acciones de tabla ---

// --- USUARIOS ---
const usersTableBody = document.querySelector("#usersTable tbody");
const addUserBtn = document.getElementById("addUserBtn");
const userMessage = document.getElementById("userMessage");

async function cargarUsuarios() {
  const usersCol = collection(db, "usuarios");
  const q = query(usersCol, orderBy("fechaExpedicion", "desc"));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  mostrarUsuarios(data);
}

function mostrarUsuarios(usuarios) {
  clearTableBody(usersTableBody);

  usuarios.forEach((user, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.nombre}</td>
      <td>${user.dni || ''}</td>
      <td>${user.celular || ''}</td>
      <td>${user.autorizante || ''}</td>
      <td>${user.fechaExpedicion ? formatDateTime(user.fechaExpedicion.toDate()) : ''}</td>
      <td>${user.tipo}</td>
      <td>
        <button class="edit-btn" data-id="${user.id}">EDITAR</button>
        <button class="ficha-btn" data-id="${user.id}">FICHA</button>
        <button class="del-btn" data-id="${user.id}">ELIMINAR</button>
      </td>
    `;
    usersTableBody.appendChild(tr);
  });

  // Botones
  usersTableBody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const userDoc = doc(db, "usuarios", id);
      const docSnap = await getDoc(userDoc);
      if (docSnap.exists()) {
        // Mover a expirados
        const data = docSnap.data();
        await addDoc(collection(db, "expirados"), {
          ...data,
          fechaEliminacion: new Date()
        });
        await deleteDoc(userDoc);
        cargarUsuarios();
        cargarExpirados();
      }
    });
  });

  usersTableBody.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const docRef = doc(db, "usuarios", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const user = docSnap.data();
      // Llenar modal
      editUserModal.classList.add('active');
      editUserL.value = id;
      editUserNombre.value = user.nombre;
      editUserDni.value = user.dni || '';
      editUserCelular.value = user.celular || '';
      editUserAutorizante.value = user.autorizante || '';
      editUserTipo.value = user.tipo;
    });
  });

  usersTableBody.querySelectorAll('.ficha-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      const docRef = doc(db, "usuarios", id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return;
      const user = docSnap.data();
      fichaModal.classList.add('active');
      fichaL.textContent = id;
      fichaNombre.textContent = user.nombre;
      fichaDni.textContent = user.dni || '';
      fichaCelular.textContent = user.celular || '';
      fichaAutorizante.textContent = user.autorizante || '';
      fichaFechaExp.textContent = user.fechaExpedicion ? formatDateTime(user.fechaExpedicion.toDate()) : '';
      fichaTipo.textContent = user.tipo;
    });
  });
}

// Agregar usuario
addUserBtn.addEventListener('click', async () => {
  const nombre = userNombre.value.trim();
  if (!nombre) return;
  await addDoc(collection(db, "usuarios"), {
    nombre,
    dni: userDni.value.trim() || '',
    celular: userCelular.value.trim() || '',
    autorizante: userAutorizante.value.trim() || '',
    tipo: userTipo.value,
    fechaExpedicion: new Date()
  });
  userMessage.textContent = 'Usuario agregado';
  userNombre.value = userDni.value = userCelular.value = userAutorizante.value = '';
  cargarUsuarios();
  setTimeout(() => userMessage.textContent = '', 2000);
});

// --- MODAL EDITAR USUARIO ---
finalizeEditBtn.addEventListener('click', async () => {
  const id = editUserL.value;
  await updateDoc(doc(db, "usuarios", id), {
    nombre: editUserNombre.value.trim(),
    dni: editUserDni.value.trim(),
    celular: editUserCelular.value.trim(),
    autorizante: editUserAutorizante.value.trim(),
    tipo: editUserTipo.value
  });
  editUserMsg.textContent = 'Actualizado';
  editUserModal.classList.remove('active');
  cargarUsuarios();
});

// Cancelar edición
cancelEditBtn.addEventListener('click', () => editUserModal.classList.remove('active'));

// Cerrar ficha
closeFichaBtn.addEventListener('click', () => fichaModal.classList.remove('active'));

// --- EXPIRADOS ---
const expiredTableBody = document.querySelector("#expiredTable tbody");

async function cargarExpirados() {
  const expiredCol = collection(db, "expirados");
  const q = query(expiredCol, orderBy("fechaEliminacion", "desc"));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  clearTableBody(expiredTableBody);

  data.forEach((user, index) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${user.nombre}</td>
      <td>${user.dni || ''}</td>
      <td>${user.codigoEntrada || ''}</td>
      <td>${user.codigoSalida || ''}</td>
      <td>${user.tipo}</td>
      <td>${user.fechaEliminacion ? formatDateTime(user.fechaEliminacion.toDate()) : ''}</td>
    `;
    expiredTableBody.appendChild(tr);
  });
}

// --- NOVEDADES ---
const novedadesTableBody = document.querySelector("#novedadesTable tbody");

guardarNovedadBtn.addEventListener('click', async () => {
  const texto = novedadTexto.value.trim();
  if (!texto) return;
  const now = new Date();
  await addDoc(collection(db, "novedades"), { texto, fecha: now });
  novedadMsg.textContent = 'OK';
  novedadTexto.value = '';
  cargarNovedades();
});

async function cargarNovedades() {
  const novedadesCol = collection(db, "novedades");
  const q = query(novedadesCol, orderBy("fecha", "desc"));
  const snapshot = await getDocs(q);
  const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

  clearTableBody(novedadesTableBody);
  data.forEach(nov => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${formatDateTime(nov.fecha.toDate())}</td>
      <td>${nov.texto}</td>
      <td><button class="del-btn" data-id="${nov.id}">ELIMINAR</button></td>
    `;
    novedadesTableBody.appendChild(tr);
  });

  novedadesTableBody.querySelectorAll('.del-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.id;
      await deleteDoc(doc(db, "novedades", id));
      cargarNovedades();
    });
  });
}

// --- FUNCIONES UTILES ---
function clearTableBody(tbody) {
  tbody.innerHTML = '';
}

function formatDateTime(date) {
  if (!date) return '';
  const d = new Date(date);
  const hh = String(d.getHours()).padStart(2,'0');
  const mm = String(d.getMinutes()).padStart(2,'0');
  const ss = String(d.getSeconds()).padStart(2,'0');
  const dd = String(d.getDate()).padStart(2,'0');
  const mmth = String(d.getMonth()+1).padStart(2,'0');
  const yyyy = d.getFullYear();
  return `${dd}/${mmth}/${yyyy} ${hh}:${mm}:${ss}`;
}

// Inicializar
cargarUsuarios();
cargarExpirados();
cargarNovedades();
