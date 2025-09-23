// ==========================================
// CONFIGURACIÓN DE FIREBASE
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore.js";

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

// ==========================================
// VARIABLES GLOBALES
// ==========================================
let isUnlocked = false;
let currentExpPage = 1;
const EXP_PER_PAGE = 25;

// ==========================================
// BLOQUEO DE SOFTWARE
// ==========================================
const passwordInput = document.getElementById("passwordInput");
const unlockBtn = document.getElementById("unlockBtn");
const navButtons = document.querySelectorAll(".nav-btn");
const mainSections = document.querySelectorAll(".main-section");

unlockBtn.addEventListener("click", () => {
    const pw = passwordInput.value.trim();
    if (pw === "123456789") { 
        isUnlocked = true;
        passwordInput.value = "";
        document.getElementById("unlockModal").style.display = "none";
        navButtons.forEach(btn => btn.disabled = false);
    } else {
        alert("Contraseña incorrecta");
    }
});

// Desactivar navegación al iniciar
if (!isUnlocked) {
    navButtons.forEach(btn => {
        if (btn.dataset.tab !== "panel") btn.disabled = true;
    });
    showSection("panel"); // forzar PANEL por defecto
}

function showSection(tab) {
    mainSections.forEach(s => s.style.display = "none");
    const section = document.getElementById(tab);
    if (section) section.style.display = "block";
}

// ==========================================
// PANEL: FICHA DE USUARIO
// ==========================================
async function openFicha(L) {
    try {
        const q = query(collection(db, "usuarios"), where("L", "==", L), limit(1));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            alert("Usuario no encontrado");
            return;
        }
        const docData = querySnapshot.docs[0].data();
        document.getElementById("fichaNombre").textContent = docData.nombre || "";
        document.getElementById("fichaDni").textContent = docData.dni || "";
        document.getElementById("fichaModal").style.display = "block";
    } catch (error) {
        console.error("Error al abrir ficha:", error);
    }
}

// ==========================================
// ESCANEAR MODAL (persistente)
// ==========================================
const scanModal = document.getElementById("scanModal");
const scanBtn = document.getElementById("scanBtn");
const cancelScanBtn = document.getElementById("cancelScanBtn");

scanBtn.addEventListener("click", () => {
    scanModal.style.display = "block";
});

cancelScanBtn.addEventListener("click", () => {
    scanModal.style.display = "none";
});

// ==========================================
// EXPIRADOS CON PAGINACIÓN
// ==========================================
async function loadExpirados(page = 1) {
    const start = (page - 1) * EXP_PER_PAGE;
    const expiradosTable = document.getElementById("expiradosTableBody");
    expiradosTable.innerHTML = "";

    try {
        const q = query(collection(db, "movimientos"), orderBy("fecha", "desc"));
        const snapshot = await getDocs(q);
        const docsArray = snapshot.docs.slice(start, start + EXP_PER_PAGE);

        docsArray.forEach(doc => {
            const data = doc.data();
            const tr = document.createElement("tr");

            const tdNombre = document.createElement("td");
            tdNombre.textContent = data.nombre || "";
            tr.appendChild(tdNombre);

            const tdFElim = document.createElement("td");
            tdFElim.textContent = data.fechaElim || ""; // Cambio "when" -> "F. Eliminación"
            tr.appendChild(tdFElim);

            expiradosTable.appendChild(tr);
        });

        // Paginación
        const totalPages = Math.ceil(snapshot.docs.length / EXP_PER_PAGE);
        const pagination = document.getElementById("expPagination");
        pagination.innerHTML = "";
        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement("button");
            btn.textContent = i;
            btn.disabled = i === page;
            btn.addEventListener("click", () => loadExpirados(i));
            pagination.appendChild(btn);
        }

    } catch (error) {
        console.error("Error cargando expirados:", error);
    }
}

// ==========================================
// EVENTOS DE BOTONES DE PANEL
// ==========================================
document.querySelectorAll(".ficha-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const L = btn.dataset.L;
        openFicha(L);
    });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================
window.addEventListener("DOMContentLoaded", () => {
    loadExpirados(currentExpPage);
});
