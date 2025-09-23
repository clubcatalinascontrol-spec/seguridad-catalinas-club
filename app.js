// app.js (completo, funcional, compatible con index.html y styles.css)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, onSnapshot, updateDoc, deleteDoc, query, where, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// ------------------- Firebase Config -------------------
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

// ------------------- Colecciones -------------------
const usuariosRef = collection(db, "usuarios");
const movimientosRef = collection(db, "movimientos");
const expiredRef = collection(db, "expiredCodes");
const novedadesRef = collection(db, "novedades");

// ------------------- Contraseña -------------------
const MAIN_PASS = "1409";
const passwordOverlay = document.getElementById("passwordOverlay");
const mainPassInput = document.getElementById("mainPassInput");
const mainPassBtn = document.getElementById("mainPassBtn");

mainPassBtn.addEventListener("click", () => {
    if(mainPassInput.value.trim() === MAIN_PASS) {
        passwordOverlay.style.display = "none";
        initApp();
    } else {
        document.querySelector(".passwordMsg").textContent = "Contraseña incorrecta";
    }
});

// ------------------- Helpers -------------------
function generarCodigo(){ return Math.random().toString(36).substring(2,10).toUpperCase(); }
function horaActualStr(){ const d=new Date(); return `${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`; }
function fechaDDMMYYYY(dateIso){ const d = dateIso ? new Date(dateIso) : new Date(); return `${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`; }

// ------------------- App Principal -------------------
function initApp(){

    // --- Navegación de secciones ---
    const navBtns = document.querySelectorAll(".nav-btn");
    const pages = document.querySelectorAll(".page");
    navBtns.forEach(btn=>{
        btn.addEventListener("click",()=>{
            navBtns.forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");
            const target = btn.dataset.section;
            pages.forEach(p=>p.classList.remove("active"));
            document.getElementById(target).classList.add("active");
        });
    });

    // ------------------- USUARIOS -------------------
    const usersTable = document.querySelector("#usersTable tbody");
    const userNombre = document.getElementById("userNombre");
    const userDni = document.getElementById("userDni");
    const userCelular = document.getElementById("userCelular");
    const userAutorizante = document.getElementById("userAutorizante");
    const userTipo = document.getElementById("userTipo");
    const addUserBtn = document.getElementById("addUserBtn");
    const userMessage = document.getElementById("userMessage");

    const filterBtns = document.querySelectorAll(".filterUserBtn");

    filterBtns.forEach(btn=>{
        btn.addEventListener("click",()=>{
            filterBtns.forEach(b=>b.classList.remove("active"));
            btn.classList.add("active");
            renderUsuarios(btn.dataset.tipo);
        });
    });

    async function agregarUsuario(){
        const nombre = userNombre.value.trim();
        const dni = userDni.value.trim();
        const celular = userCelular.value.trim();
        const autorizante = userAutorizante.value.trim();
        const tipo = userTipo.value;

        if(!nombre || nombre.length<3){ userMessage.textContent="Nombre inválido"; return; }

        await addDoc(usuariosRef,{
            nombre,dni,celular,autorizante,tipo,fExpedicion:serverTimestamp()
        });

        userNombre.value = userDni.value = userCelular.value = userAutorizante.value = "";
        userMessage.textContent="Usuario agregado correctamente";
    }

    addUserBtn.addEventListener("click", agregarUsuario);

    async function renderUsuarios(tipoFiltro="todos"){
        usersTable.innerHTML="";
        const q = tipoFiltro==="todos"? usuariosRef : query(usuariosRef,where("tipo","==",tipoFiltro));
        const snapshot = await getDocs(q);
        let i=1;
        snapshot.forEach(docSnap=>{
            const u = docSnap.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${i}</td>
            <td>${u.nombre}</td>
            <td>${u.dni||""}</td>
            <td>${u.celular||""}</td>
            <td>${(u.tipo!=="propietario" && u.tipo!=="administracion")?"":u.autorizante||""}</td>
            <td>${u.fExpedicion ? fechaDDMMYYYY(u.fExpedicion.toDate()) : ""}</td>
            <td>${u.tipo}</td>
            <td>
                <button class="ficha-btn" data-id="${docSnap.id}">FICHA</button>
                <button class="del-btn" data-id="${docSnap.id}">ELIMINAR</button>
            </td>`;
            usersTable.appendChild(tr);

            tr.querySelector(".del-btn").addEventListener("click", async()=>{
                await deleteDoc(doc(db,"usuarios",docSnap.id));
                await addDoc(expiredRef,{...u,codigo:generarCodigo(),fechaElim:serverTimestamp()});
                renderUsuarios(tipoFiltro);
            });

            tr.querySelector(".ficha-btn").addEventListener("click", ()=>{
                alert(`FICHA DE: ${u.nombre}\nDNI: ${u.dni}\nCelular: ${u.celular}\nAutorizante: ${u.autorizante}\nTipo: ${u.tipo}`);
            });

            i++;
        });
    }

    renderUsuarios();

    // ------------------- EXPIRADOS -------------------
    const expiredTable = document.querySelector("#expiredTable tbody");
    async function renderExpirados(){
        expiredTable.innerHTML="";
        const snapshot = await getDocs(expiredRef);
        let i=1;
        snapshot.forEach(docSnap=>{
            const e = docSnap.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${i}</td>
            <td>${e.nombre}</td>
            <td>${e.dni||""}</td>
            <td>${e.codigo||""}</td>
            <td>${e.codigoSalida||""}</td>
            <td>${e.tipo||""}</td>
            <td>${e.fechaElim ? fechaDDMMYYYY(e.fechaElim.toDate()) : ""}</td>`;
            expiredTable.appendChild(tr);
            i++;
        });
    }

    renderExpirados();

    // ------------------- NOVEDADES -------------------
    const novedadTexto = document.getElementById("novedadTexto");
    const guardarNovedadBtn = document.getElementById("guardarNovedadBtn");
    const novedadesTable = document.querySelector("#novedadesTable tbody");

    guardarNovedadBtn.addEventListener("click", async()=>{
        const texto = novedadTexto.value.trim();
        if(!texto) return;
        await addDoc(novedadesRef,{texto,fecha:serverTimestamp()});
        novedadTexto.value="";
        renderNovedades();
    });

    async function renderNovedades(){
        novedadesTable.innerHTML="";
        const snapshot = await getDocs(query(novedadesRef,orderBy("fecha","desc")));
        snapshot.forEach(docSnap=>{
            const n = docSnap.data();
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${n.fecha ? horaActualStr() : ""}</td><td>${n.texto}</td><td><button class="del-btn">ELIMINAR</button></td>`;
            novedadesTable.appendChild(tr);
            tr.querySelector(".del-btn").addEventListener("click", async()=>{
                await deleteDoc(doc(db,"novedades",docSnap.id));
                renderNovedades();
            });
        });
    }
    renderNovedades();

    // ------------------- MOVIMIENTOS / PANEL -------------------
    const movimientosTable = document.querySelector("#movimientosTable tbody");
    const scanBtn = document.getElementById("scanBtn");
    const printActiveBtn = document.getElementById("printActiveBtn");
    let movimientosCache = [];

    async function renderMovimientos(tipoFiltro="todos"){
        movimientosTable.innerHTML="";
        const snapshot = await getDocs(movimientosRef);
        movimientosCache = [];
        let i=1;
        snapshot.forEach(docSnap=>{
            const m = docSnap.data();
            if(tipoFiltro!=="todos" && m.tipo!==tipoFiltro) return;
            movimientosCache.push(m);
            const tr = document.createElement("tr");
            tr.innerHTML = `<td>${i}</td><td>${m.nombre}</td><td>${m.hEntrada||""}</td><td>${m.hSalida||""}</td><td>${m.tipo}</td>
            <td>
                <button class="del-btn" data-id="${docSnap.id}">ELIMINAR</button>
            </td>`;
            movimientosTable.appendChild(tr);
            tr.querySelector(".del-btn").addEventListener("click", async()=>{
                await deleteDoc(doc(db,"movimientos",docSnap.id));
                renderMovimientos(tipoFiltro);
            });
            i++;
        });
        if(movimientosCache.length>0 && movimientosCache.length%25===0){
            window.print();
        }
    }

    scanBtn.addEventListener("click", async()=>{
        const codigo = prompt("Ingrese código de barra:");
        if(!codigo) return;
        // Buscar usuario
        const snapshot = await getDocs(query(usuariosRef,where("codigo","==",codigo)));
        if(snapshot.empty){ alert("Código inválido"); return; }
        snapshot.forEach(async docSnap=>{
            const u = docSnap.data();
            const hEntrada = horaActualStr();
            await addDoc(movimientosRef,{nombre:u.nombre,tipo:u.tipo,hEntrada});
            renderMovimientos();
        });
    });

    printActiveBtn.addEventListener("click", ()=>window.print());

    renderMovimientos();
}
