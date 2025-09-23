// ---- PANEL ----
const scanInput = document.getElementById('scan-input');
const panelFilter = document.getElementById('panel-filter');
const panelTables = document.querySelectorAll('.panel-table');
const printBtn = document.getElementById('print-btn');

// ---- USUARIOS ----
const userFilter = document.getElementById('user-filter');
const userTables = document.querySelectorAll('.users-table');

// FUNCIONES GENERALES
function showTable(tables, type) {
    tables.forEach(table => {
        if (table.dataset.type === type) {
            table.style.display = 'table';
        } else {
            table.style.display = 'none';
        }
    });
}

// ---- PANEL ----
panelFilter.addEventListener('change', () => {
    showTable(panelTables, panelFilter.value);
});

// ---- USUARIOS ----
userFilter.addEventListener('change', () => {
    showTable(userTables, userFilter.value);
});

// ---- ESCANEAR CÓDIGO ----
scanInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const code = scanInput.value.trim();
        if (code !== '') {
            registerScan(code);
            scanInput.value = '';
        }
    }
});

// FUNCION REGISTRO DE ESCANEO
function registerScan(code) {
    const now = new Date();
    const id = Math.floor(Math.random() * 10000);

    // AGREGAR A "TODOS" PANEL
    const tbodyTodos = document.querySelector('#table-todos tbody');
    const rowTodos = document.createElement('tr');
    rowTodos.innerHTML = `
        <td>${id}</td>
        <td>${code}</td>
        <td>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</td>
    `;
    tbodyTodos.prepend(rowTodos);

    // SIMULA LOGICA DE FILTRO
    const tipo = detectTipoUsuario(code); // función que define tipo
    if (tipo !== 'todos') {
        const tbodyTipo = document.querySelector(`#table-${tipo} tbody`);
        const rowTipo = document.createElement('tr');
        rowTipo.innerHTML = `
            <td>${id}</td>
            <td>${code}</td>
            <td>${now.toLocaleDateString()} ${now.toLocaleTimeString()}</td>
        `;
        tbodyTipo.prepend(rowTipo);
    }

    // ACTUALIZAR TABLA VISIBLE
    showTable(panelTables, panelFilter.value);
}

// FUNCION SIMULADA PARA DETECTAR TIPO DE USUARIO
function detectTipoUsuario(code) {
    if (code.toLowerCase().includes('prop')) return 'propietarios';
    if (code.toLowerCase().includes('vis')) return 'visitantes';
    if (code.toLowerCase().includes('exp')) return 'expirados';
    return 'todos';
}

// ---- IMPRIMIR ----
printBtn.addEventListener('click', () => {
    window.print();
});

// INICIALIZAR TABLAS VISIBLES
showTable(panelTables, 'todos');
showTable(userTables, 'todos');
