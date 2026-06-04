// --- BASE DE DATOS DE RETOS (ESCAPE ROOM) ---
const matrixRetos = [
    {
        id: "k1",
        tag: "Reto 1: La Llave de la Comunicación",
        desc: "El grupo de WhatsApp está lleno de mensajes. Un integrante nunca responde. Después dice: 'No sabía que tenía que hacer eso.'",
        question: "¿Qué harías para mejorar la comunicación del equipo?",
        toast: "Has conseguido la Llave de la Comunicación",
        labelShort: "Comunicación"
    },
    {
        id: "k2",
        tag: "Reto 2: La Llave de la Responsabilidad",
        desc: "Dos integrantes realizan todo el trabajo. Los demás apenas participan. Todos obtendrán la misma calificación.",
        question: "¿Cómo actuarías para que la carga de trabajo fuera más justa?",
        toast: "Has conseguido la Llave de la Responsabilidad",
        labelShort: "Responsabilidad"
    },
    {
        id: "k3",
        tag: "Reto 3: La Llave de la Organización",
        desc: "Un integrante entrega su parte el día de la exposición. Además contiene errores.",
        question: "¿Qué medidas propondrías para evitar esta situación?",
        toast: "Has conseguido la Llave de la Organización",
        labelShort: "Organización"
    },
    {
        id: "k4",
        tag: "Reto 4: La Llave del Respeto",
        desc: "Durante una reunión un compañero rechaza todas las ideas. No escucha a nadie.",
        question: "¿Cómo promoverías una comunicación respetuosa?",
        toast: "Has conseguido la Llave del Respeto",
        labelShort: "Respeto"
    },
    {
        id: "k5",
        tag: "Reto 5: La Llave del Consenso",
        desc: "Existen opiniones muy distintas. El equipo comienza a discutir.",
        question: "¿Cómo ayudarías a tomar decisiones sin generar conflictos?",
        toast: "Has conseguido la Llave del Consenso",
        labelShort: "Consenso"
    }
];

const frasesMotivacionales = [
    "¡Excelente trabajo en equipo!",
    "Cada respuesta te acerca a la salida.",
    "La colaboración es la llave del éxito."
];

// --- ESTADO GENERAL DEL JUEGO ---
let pointerIdx = 0;
let cronoSegundos = 0;
let cronoTicker = null;
let profileState = {
    name: "",
    account: "",
    answers: {},
    totalTimeStr: "00:00"
};

// --- MOTOR DE SONIDO SINTETIZADO (WEB AUDIO API) ---
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function emitBeep(freq, shape, duration) {
    try {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const nodeGain = audioCtx.createGain();
        osc.type = shape;
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
        nodeGain.gain.setValueAtTime(0.06, audioCtx.currentTime);
        nodeGain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + duration);
        osc.connect(nodeGain);
        nodeGain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
    } catch (e) { }
}

function triggerKeySound() {
    emitBeep(440, "sine", 0.1);
    setTimeout(() => emitBeep(554.37, "sine", 0.1), 80);
    setTimeout(() => emitBeep(659.25, "sine", 0.25), 160);
}

function triggerFinishSound() {
    emitBeep(523.25, "triangle", 0.15);
    setTimeout(() => emitBeep(659.25, "triangle", 0.15), 120);
    setTimeout(() => emitBeep(783.99, "triangle", 0.15), 240);
    setTimeout(() => emitBeep(1046.50, "triangle", 0.4), 360);
}

// --- SISTEMA DE ALMACENAMIENTO (LOCALSTORAGE) ---
function commitSession() {
    localStorage.setItem('escape_room_colaborativo_save', JSON.stringify(profileState));
}

function restoreSession() {
    const data = localStorage.getItem('escape_room_colaborativo_save');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed && typeof parsed === 'object') {
                profileState = { ...profileState, ...parsed };
            }
        } catch (e) { }
    }
}

// --- SELECTORES DOM ---
const scrGate = document.getElementById('screen-gate');
const scrRoom = document.getElementById('screen-room');
const scrVictory = document.getElementById('screen-victory');

const inputName = document.getElementById('reg-name');
const inputAccount = document.getElementById('reg-account');
const btnEngage = document.getElementById('btn-engage');

const prgFill = document.getElementById('progress-fill');
const hudClock = document.getElementById('hud-clock');
const toastBox = document.getElementById('toast-achievement');
const toastText = document.getElementById('toast-text');

const rmTag = document.getElementById('room-tag');
const rmDesc = document.getElementById('room-desc');
const rmQuestion = document.getElementById('room-question');
const rmInput = document.getElementById('room-input');
const rmCounter = document.getElementById('room-counter');
const rmErr = document.getElementById('room-err');
const btnUnlock = document.getElementById('btn-unlock');

const outName = document.getElementById('out-name');
const outAccount = document.getElementById('out-account');
const outDate = document.getElementById('out-date');
const outTime = document.getElementById('out-time');
const reportRows = document.getElementById('report-rows');
const btnExport = document.getElementById('btn-export');

// --- CRONÓMETRO ---
function runTimer() {
    cronoSegundos++;
    const mins = String(Math.floor(cronoSegundos / 60)).padStart(2, '0');
    const secs = String(cronoSegundos % 60).padStart(2, '0');
    profileState.totalTimeStr = `${mins}:${secs}`;
    hudClock.textContent = profileState.totalTimeStr;
}

// --- FLUJO DE CONTROL ---
btnEngage.addEventListener('click', () => {
    const nVal = inputName.value.trim();
    const aVal = inputAccount.value.trim();

    if (!nVal || !aVal) {
        alert("Por favor, introduce tu nombre y número de cuenta para iniciar la simulación.");
        return;
    }

    profileState.name = nVal;
    profileState.account = aVal;
    commitSession();

    // Identificar si existe progreso completo anterior
    let stepPointer = 0;
    for (let i = 0; i < matrixRetos.length; i++) {
        const ans = profileState.answers[matrixRetos[i].id];
        if (ans && ans.length >= 40) {
            stepPointer = i + 1;
        } else {
            break;
        }
    }

    scrGate.classList.remove('active');
    scrRoom.classList.add('active');

    // Lanzar Ticker
    cronoTicker = setInterval(runTimer, 1000);

    if (stepPointer >= matrixRetos.length) {
        renderVictoryLayout();
    } else {
        pointerIdx = stepPointer;
        mountReto(pointerIdx);
        refreshHUD();
    }
});

function mountReto(idx) {
    const ctx = matrixRetos[idx];
    rmTag.textContent = ctx.tag;
    rmDesc.textContent = ctx.desc;
    rmQuestion.textContent = ctx.question;

    const savedText = profileState.answers[ctx.id] || "";
    rmInput.value = savedText;
    evaluateInput(savedText);
    rmErr.style.display = 'none';
}

function evaluateInput(text) {
    const totalChars = text.length;
    rmCounter.textContent = `${totalChars} / 40 caracteres`;
    if (totalChars >= 40) {
        rmCounter.className = "counter-msg met";
    } else {
        rmCounter.className = "counter-msg";
    }
}

rmInput.addEventListener('input', (e) => {
    const txt = e.target.value;
    profileState.answers[matrixRetos[pointerIdx].id] = txt;
    commitSession();
    evaluateInput(txt);
});

function refreshHUD() {
    // Actualizar HUD de llaves basado en lo guardado
    matrixRetos.forEach((r) => {
        const slot = document.getElementById(`slot-${r.id}`);
        const ans = profileState.answers[r.id];
        if (ans && ans.length >= 40) {
            slot.classList.add('unlocked');
        } else {
            slot.classList.remove('unlocked');
        }
    });

    // Porcentaje
    const pct = Math.round((pointerIdx / matrixRetos.length) * 100);
    prgFill.style.width = `${pct}%`;
}

btnUnlock.addEventListener('click', () => {
    const currentAns = (profileState.answers[matrixRetos[pointerIdx].id] || "").trim();

    if (currentAns.length < 40) {
        rmErr.style.display = 'block';
        emitBeep(220, "sawtooth", 0.2);
        return;
    }

    rmErr.style.display = 'none';
    triggerKeySound();

    // Desbloquear llave visualmente inmediatamente
    document.getElementById(`slot-${matrixRetos[pointerIdx].id}`).classList.add('unlocked');

    // Mostrar Banner Flotante Gamificado (Toast)
    toastText.textContent = matrixRetos[pointerIdx].toast;
    toastBox.classList.add('visible');

    // Avanzar Índice
    pointerIdx++;
    const pct = Math.round((pointerIdx / matrixRetos.length) * 100);
    prgFill.style.width = `${pct}%`;

    setTimeout(() => {
        toastBox.classList.remove('visible');

        if (pointerIdx >= matrixRetos.length) {
            renderVictoryLayout();
        } else {
            mountReto(pointerIdx);
        }
    }, 2200);
});

function renderVictoryLayout() {
    clearInterval(cronoTicker);
    scrRoom.classList.remove('active');
    scrVictory.classList.add('active');
    triggerFinishSound();

    outName.textContent = profileState.name;
    outAccount.textContent = profileState.account;
    outTime.textContent = profileState.totalTimeStr;
    outDate.textContent = new Date().toLocaleDateString('es-MX', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    reportRows.innerHTML = "";
    matrixRetos.forEach(r => {
        const tr = document.createElement('tr');

        const tdK = document.createElement('td');
        tdK.className = "col-key";
        tdK.innerHTML = `<span>🔑</span> <span>${r.labelShort}</span>`;

        const tdA = document.createElement('td');
        tdA.className = "col-ans";
        tdA.textContent = profileState.answers[r.id] || "";

        tr.appendChild(tdK);
        tr.appendChild(tdA);
        reportRows.appendChild(tr);
    });
}

// --- SISTEMA NATIVO DE GENERACIÓN DE IMAGEN (CANVAS RENDER) ---
btnExport.addEventListener('click', () => {
    const canvas = document.getElementById('renderCanvas');
    const ctx = canvas.getContext('2d');
    const baseWidth = 900;

    // Procesador de envoltura para simular celdas responsivas en lienzo plano
    function injectWrappedText(context, text, x, startY, maxWidth, lineHeight) {
        const words = text.split(' ');
        let currentLine = '';
        let y = startY;

        for (let n = 0; n < words.length; n++) {
            let testLine = currentLine + words[n] + ' ';
            if (context.measureText(testLine).width > maxWidth && n > 0) {
                context.fillText(currentLine, x, y);
                currentLine = words[n] + ' ';
                y += lineHeight;
            } else {
                currentLine = testLine;
            }
        }
        context.fillText(currentLine, x, y);
        return y + lineHeight;
    }

    // Cálculo dinámico previo de la altura requerida del lienzo resultante
    ctx.font = "14px Arial";
    let computedHeight = 350; // Cabecera + Meta bloque fijo
    matrixRetos.forEach(r => {
        computedHeight += 45; // Separador y Título de fila
        const ansStr = profileState.answers[r.id] || "";
        const words = ansStr.split(' ');
        let line = '';
        let lineCount = 1;
        words.forEach(w => {
            let test = line + w + ' ';
            if (ctx.measureText(test).width > 760) {
                lineCount++;
                line = w + ' ';
            } else {
                line = test;
            }
        });
        computedHeight += (lineCount * 22) + 20;
    });

    canvas.width = baseWidth;
    canvas.height = computedHeight;

    // PINTAR FONDO GAMIFICADO
    ctx.fillStyle = "#070913";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // DETALLES ESTÉTICOS TECNOLÓGICOS (LÍNEAS DE GRADIENTE)
    let currentY = 50;
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 13px Arial";
    ctx.fillText("REPORTE DE LOGROS - ESCAPE ROOM DIGITAL", 50, currentY);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px Arial";
    ctx.fillText("MISIÓN ESCAPE: ATRAPADOS EN EL EQUIPO IMPOSIBLE", 50, currentY += 30);

    ctx.strokeStyle = "#312e81";
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(50, currentY += 15); ctx.lineTo(850, currentY); ctx.stroke();

    // BLOQUE DE DATOS GENERALES DEL ESTUDIANTE
    currentY += 25;
    ctx.fillStyle = "#0f1123";
    ctx.fillRect(50, currentY, 800, 100);
    ctx.strokeRect(50, currentY, 800, 100);

    ctx.fillStyle = "#f8fafc";
    ctx.font = "15px Arial";
    ctx.fillText(`Estudiante: ${profileState.name}`, 70, currentY + 30);
    ctx.fillText(`Número de Cuenta: ${profileState.account}`, 70, currentY + 55);
    ctx.fillText(`Fecha: ${outDate.textContent}`, 70, currentY + 80);

    ctx.fillStyle = "#a855f7";
    ctx.font = "bold 14px Arial";
    ctx.fillText(`Tiempo empleado: ${profileState.totalTimeStr}`, 530, currentY + 30);
    ctx.fillStyle = "#f59e0b";
    ctx.fillText("ESTADO: EVADIDO CON ÉXITO 🔓", 530, currentY + 55);

    currentY += 140;

    // ITERACIÓN DE RESPUESTAS ADQUIRIDAS
    matrixRetos.forEach(r => {
        // Encabezado de la celda del reto
        ctx.fillStyle = "#171a34";
        ctx.fillRect(50, currentY, 800, 32);
        ctx.strokeStyle = "#312e81";
        ctx.strokeRect(50, currentY, 800, 32);

        ctx.fillStyle = "#f59e0b";
        ctx.font = "bold 13px Arial";
        ctx.fillText(`🔑   LLAVE DE LA ${r.labelShort.toUpperCase()}`, 65, currentY + 20);

        currentY += 45;

        // Contenido de la propuesta explicada
        ctx.fillStyle = "#94a3b8";
        ctx.font = "15px Arial";
        const ansText = profileState.answers[r.id] || "No se detectó registro de respuesta.";
        currentY = injectWrappedText(ctx, ansText, 65, currentY, 760, 22);
        currentY += 15;
    });

    // Registro de pie de verificación
    ctx.fillStyle = "#312e81";
    ctx.font = "11px Arial";
    ctx.fillText("Evidencia digital autogenerada para la carpeta de evaluación formativa sobre Trabajo Colaborativo.", 50, canvas.height - 20);

    // EMISIÓN AUTOMÁTICA DE ARCHIVO DE DESCARGA
    const b64Str = canvas.toDataURL('image/png');
    const hiddenAnchor = document.createElement('a');
    const optimizedName = profileState.name.replace(/[^a-zA-Z0-9]/g, "_");
    hiddenAnchor.download = `EscapeRoom_TrabajoColaborativo_${optimizedName}.png`;
    hiddenAnchor.href = b64Str;
    document.body.appendChild(hiddenAnchor);
    hiddenAnchor.click();
    document.body.removeChild(hiddenAnchor);
});

// --- CARGA E INICIALIZACIÓN ---
window.addEventListener('load', () => {
    restoreSession();
    if (profileState.name) inputName.value = profileState.name;
    if (profileState.account) inputAccount.value = profileState.account;
});