// Importar SDKs de Firebase
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, query, orderBy, onSnapshot } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBmgexrB3aDlx5XARYqigaPoFsWX5vDz_4",
  authDomain: "seguridad-catalinas-club.firebaseapp.com",
  projectId: "seguridad-catalinas-club",
  storageBucket: "seguridad-catalinas-club.firebasestorage.app",
  messagingSenderId: "980866194296",
  appId: "1:980866194296:web:3fefc2a107d0ec6052468d"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Referencias al DOM
const registroForm = document.getElementById("registroForm");
const btnIngresar = document.getElementById("btnIngresar");
const btnSalir = document.getElementById("btnSalir");
const registrosDiv = document.getElementById("registros");

// Función para guardar registro
async function registrarMovimiento(tipo) {
  const nombre = document.getElementById("nombre").value;
  const dni = document.getElementById("dni").value;
  const vehiculo = document.getElementById("vehiculo").value;
  const observaciones = document.getElementById("observaciones").value;

  if (!nombre || !dni) {
    alert("Nombre y DNI son obligatorios.");
    return;
  }

  try {
    await addDoc(collection(db, "movimientos"), {
      nombre,
      dni,
      vehiculo,
      observaciones,
      tipo, // "Ingreso" o "Salida"
      timestamp: serverTimestamp()
    });

    registroForm.reset();
  } catch (e) {
    console.error("Error al registrar movimiento: ", e);
  }
}

// Escuchar botones
btnIngresar.addEventListener("click", () => registrarMovimiento("Ingreso"));
btnSalir.addEventListener("click", () => registrarMovimiento("Salida"));

// Mostrar movimientos en tiempo real
const q = query(collection(db, "movimientos"), orderBy("timestamp", "desc"));
onSnapshot(q, (snapshot) => {
  registrosDiv.innerHTML = "";
  snapshot.forEach((doc) => {
    const data = doc.data();
    const fecha = data.timestamp?.toDate().toLocaleString() || "Sin hora";
    registrosDiv.innerHTML += `
      <div class="registro">
        <p><strong>${data.tipo}</strong> - ${fecha}</p>
        <p><strong>Nombre:</strong> ${data.nombre}</p>
        <p><strong>DNI:</strong> ${data.dni}</p>
        <p><strong>Vehículo:</strong> ${data.vehiculo || "N/A"}</p>
        <p><strong>Obs:</strong> ${data.observaciones || "N/A"}</p>
      </div>
    `;
  });
});
