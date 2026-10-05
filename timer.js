

const timerWindow = document.getElementById("timerWindow");
const timerWindowHeader = document.getElementById("timerWindowHeader");
const closeTimer = document.getElementById("closeTimer");

const timerHeader = document.getElementById("timerHeader");


const timerInput = document.getElementById("timerInput");
const timerStart = document.getElementById("timerStart");
const timerPause = document.getElementById("timerPause");
const timerReset = document.getElementById("timerReset");




 let tiempoRestante = 25 * 60;
let intervaloTimer = null;
let timerFuncionando = false;
let duracionTimer = 25 * 60;



function abrirTemporizador() {
    timerWindow.classList.add("show");
}

function cerrarTemporizador() {
    timerWindow.classList.remove("show");
}




let arrastrandoTimer = false;

let posicionInicialX = 0;
let posicionInicialY = 0;

let posicionVentanaX = 0;
let posicionVentanaY = 0;






timerWindowHeader.addEventListener("mousedown", (event) => {

    if (event.target.closest("#closeTimer")) return;

    arrastrandoTimer = true;

    posicionInicialX = event.clientX;
    posicionInicialY = event.clientY;

    const rect = timerWindow.getBoundingClientRect();

    posicionVentanaX = rect.left;
    posicionVentanaY = rect.top;

    timerWindow.style.left = `${rect.left}px`;
    timerWindow.style.top = `${rect.top}px`;
    timerWindow.style.right = "auto";

});


document.addEventListener("mousemove", (event) => {

    if (!arrastrandoTimer) return;

    const movimientoX = event.clientX - posicionInicialX;
    const movimientoY = event.clientY - posicionInicialY;

    const nuevaX = posicionVentanaX + movimientoX;
    const nuevaY = posicionVentanaY + movimientoY;

    timerWindow.style.left = `${nuevaX}px`;
    timerWindow.style.top = `${nuevaY}px`;

});


document.addEventListener("mouseup", () => {

    if (!arrastrandoTimer) return;

    arrastrandoTimer = false;

    guardarPosicionTimer();

});




function guardarPosicionTimer() {

    const rect = timerWindow.getBoundingClientRect();

    localStorage.setItem(
        "agendahub-timer-position",
        JSON.stringify({
            x: rect.left,
            y: rect.top
        })
    );
}




function cargarPosicionTimer() {

    const posicionGuardada =
        localStorage.getItem("agendahub-timer-position");

    if (!posicionGuardada) return;

    try {

        const posicion = JSON.parse(posicionGuardada);

        timerWindow.style.left = `${posicion.x}px`;
        timerWindow.style.top = `${posicion.y}px`;
        timerWindow.style.right = "auto";

    } catch (error) {

        console.error(
            "Error recuperando la posición del temporizador:",
            error
        );

    }
}


timerHeader.addEventListener("click", () => {

    if (timerWindow.classList.contains("show")) {
        cerrarTemporizador();
    } else {
        abrirTemporizador();
    }
});

closeTimer.addEventListener("click", (event) => {
    event.stopPropagation();
    cerrarTemporizador();
});















function mostrarTiempo() {

    const minutos = Math.floor(tiempoRestante / 60);

    const segundos = tiempoRestante % 60;

    const minutosTexto = String(minutos).padStart(2, "0");

    const segundosTexto = String(segundos).padStart(2, "0");

    timerInput.value = `${minutosTexto}:${segundosTexto}`;

}

function iniciarTemporizador() {

    if (timerFuncionando) return;

    const nuevoTiempo = obtenerTiempoInput();

    if (nuevoTiempo === null || nuevoTiempo === 0) {
        return;
    }

    tiempoRestante = nuevoTiempo;
    duracionTimer = nuevoTiempo;

    mostrarTiempo();


    timerFuncionando = true;

    intervaloTimer = setInterval(() => {

        tiempoRestante--;

        mostrarTiempo();

        if (tiempoRestante <= 0) {

            tiempoRestante = 0;

            mostrarTiempo();

            clearInterval(intervaloTimer);

            intervaloTimer = null;

            timerFuncionando = false;
        }

    }, 1000);
}


timerStart.addEventListener("click", () => {

    iniciarTemporizador();

});

function obtenerTiempoInput() {

    const valor = timerInput.value.trim();

    const partes = valor.split(":");

    if (partes.length !== 2) {
        return null;
    }

    const minutos = Number(partes[0]);
    const segundos = Number(partes[1]);

    if (
        !Number.isInteger(minutos) ||
        !Number.isInteger(segundos)
    ) {
        return null;
    }

    if (minutos < 0 || segundos < 0 || segundos > 59) {
        return null;
    }

    return (minutos * 60) + segundos;
}

function pausarTemporizador() {

    if (!timerFuncionando) return;

    clearInterval(intervaloTimer);

    intervaloTimer = null;

    timerFuncionando = false;
}

timerPause.addEventListener("click", () => {

    pausarTemporizador();

});

function reiniciarTemporizador() {

    clearInterval(intervaloTimer);

    intervaloTimer = null;

    timerFuncionando = false;

    tiempoRestante = duracionTimer;

    mostrarTiempo();
}

timerReset.addEventListener("click", () => {

    reiniciarTemporizador();

});










cargarPosicionTimer();
mostrarTiempo();