// Escaneo de códigos
const btnEscanear = document.getElementById("btn-escanear");
const scanModal = document.getElementById("scan-modal");
const scanInput = document.getElementById("scan-input");
const cancelScan = document.getElementById("cancel-scan");
const okMsg = document.getElementById("scan-ok");

// Abrir modal al presionar Escanear
btnEscanear.addEventListener("click", () => {
  scanModal.classList.remove("hidden");
  scanInput.value = "";
  scanInput.focus();
});

// Cancelar escaneo
cancelScan.addEventListener("click", () => {
  scanModal.classList.add("hidden");
});

// Detectar código completo
scanInput.addEventListener("input", () => {
  if (scanInput.value.length === 8) {
    scanModal.classList.add("hidden");
    okMsg.classList.remove("hidden");
    setTimeout(() => {
      okMsg.classList.add("hidden");
    }, 2000);
  }
});
