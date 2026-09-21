// CERRAR MODALES AL HACER CLICK FUERA

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});

const scheduleGrid = document.getElementById("scheduleGrid");

const days = [
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
    "Domingo"
];

const startHour = 0;
const endHour = 24;
let scheduleEvents = [];
let currentWeekOffset = 0;



async function loadScheduleEvents() {

    const { data, error } = await supabaseClient
        .from("schedule")
        .select("*")
        .order("start_time", { ascending: true });


    if (error) {

        console.error("Error cargando el horario:", error);

        return;

    }


    scheduleEvents = data || [];

    renderScheduleEvents();

}
function parseTime(time) {

    const [hour, minute] = time.split(":").map(Number);

    return {
        hour,
        minute
    };

}


function renderScheduleEvents() {

    document.querySelectorAll(".schedule-event").forEach(event => {
        event.remove();
    });


    scheduleEvents.forEach(event => {

        if (!event.repeat) {

            const currentMonday =
                getMonday(currentWeekOffset);

            const currentWeekStart =
                `${currentMonday.getFullYear()}-${String(currentMonday.getMonth() + 1).padStart(2, "0")}-${String(currentMonday.getDate()).padStart(2, "0")}`;

            if (event.week_start !== currentWeekStart) {
                return;
            }

        }


        const start = parseTime(event.start_time);
        const end = parseTime(event.end_time);


        const cell = document.querySelector(`.schedule-cell[data-day="${event.day}"][data-hour="${start.hour}"]`);

        if(!cell) return;


        const eventElement = document.createElement("div");

        eventElement.classList.add("schedule-event");

        eventElement.textContent = event.title;

        eventElement.style.backgroundColor = event.color;

        eventElement.addEventListener("click", (e) => {

            e.stopPropagation();
            openScheduleInfo(event);

        });



        const startTotal =
            start.hour * 60 + start.minute;

        const endTotal =
            end.hour * 60 + end.minute;


        const duration =
            endTotal - startTotal;

        const cellHeight = cell.offsetHeight;

        eventElement.style.top =
            `${(start.minute / 60) * cellHeight}px`;


        eventElement.style.height =
            `${(duration / 60) * cellHeight}px`;


        cell.appendChild(eventElement);

    })
}











function createSchedule() {

    scheduleGrid.innerHTML = "";

    
    const header = document.createElement("div");
    header.classList.add("schedule-header");

    const emptyCell = document.createElement("div");
    emptyCell.classList.add("schedule-time-header");

    header.appendChild(emptyCell);

    days.forEach((day, dayIndex) => {

        const dayElement = document.createElement("div");

        dayElement.classList.add("schedule-day-header");
        dayElement.textContent = day;
        dayElement.dataset.day = dayIndex;

        header.appendChild(dayElement);

    });

    scheduleGrid.appendChild(header);


    const body = document.createElement("div");
    body.classList.add("schedule-body");

    for (let hour = startHour; hour < endHour; hour++) {

        const timeElement = document.createElement("div");

        timeElement.classList.add("schedule-time");
        timeElement.textContent = `${String(hour).padStart(2, "0")}:00`;

        body.appendChild(timeElement);


        days.forEach((day, dayIndex) => {
            const cell = document.createElement("div");

            cell.classList.add("schedule-cell");

            cell.dataset.day = dayIndex;
            cell.dataset.hour = hour;

            cell.addEventListener("click", () => {

                openScheduleModal(dayIndex, hour);

            });

            body.appendChild(cell);
        });
    }

    scheduleGrid.appendChild(body);
};



//ABRIR MODAL DE CREAR EVENTO

function openScheduleModal(dayIndex, hour) {

    const modal = document.getElementById("scheduleModal");

    const dayInput = document.getElementById("scheduleDay");
    const startInput = document.getElementById("scheduleStart");
    const endInput = document.getElementById("scheduleEnd");

    dayInput.value = dayIndex;

    startInput.value = `${String(hour).padStart(2, "0")}:00`;

    const nextHour = hour + 1;

    if (nextHour <= 23) {

        endInput.value = `${String(nextHour).padStart(2, "0")}:00`;
    } else {
        endInput.value = "23:59";
    }

    modal.classList.add("show");
}

const addScheduleEvent =
    document.getElementById("addScheduleEvent");

addScheduleEvent.addEventListener("click", () => {

    openScheduleModal(0, 8);

});

//CERRAR MODAL

const cancelSchedule =
    document.getElementById("cancelSchedule");

cancelSchedule.addEventListener("click", () => {

    document
        .getElementById("scheduleModal")
        .classList.remove("show");

});


const saveSchedule =
    document.getElementById("saveSchedule");


//GUARDAR EVENTO EN EL HORARIO

saveSchedule.addEventListener("click", async () => {

    const title =
        document.getElementById("scheduleTitle").value.trim();

    const day =
        Number(document.getElementById("scheduleDay").value);

    const start =
        document.getElementById("scheduleStart").value;

    const end =
        document.getElementById("scheduleEnd").value;

    const color =
        document.getElementById("scheduleColor").value;

    const description =
        document.getElementById("scheduleDescription").value.trim();

    const repeat =
        document.getElementById("scheduleRepeat").checked;


    const formError =
        document.getElementById("scheduleFormError");


    formError.textContent = "";


    if (!title || !start || !end) {

        formError.textContent =
            "Completa los campos obligatorios.";

        return;

    }


    const [startHour, startMinute] =
        start.split(":").map(Number);

    const [endHour, endMinute] =
        end.split(":").map(Number);


    const startTotal =
        startHour * 60 + startMinute;

    const endTotal =
        endHour * 60 + endMinute;


    if (endTotal <= startTotal) {

        formError.textContent =
            "La hora de finalización debe ser posterior a la de inicio.";

        return;

    }


    const { data: userData, error: userError } =
        await supabaseClient.auth.getUser();


    if (userError || !userData.user) {

        formError.textContent =
            "No se ha podido identificar al usuario.";

        return;

    }

    const monday = getMonday(currentWeekOffset);

    const weekStart = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
        
    const { data, error } = await supabaseClient
        .from("schedule")
        .insert({

            user_id: userData.user.id,

            title: title,

            day: day,

            start_time: start,

            end_time: end,

            color: color,

            description: description,

            repeat: repeat,
            week_start: repeat ? null : weekStart

        })
        .select()
        .single();


    if (error) {

        console.error("Error creando evento:", error);

        formError.textContent =
            "No se ha podido crear el evento.";

        return;

    }


    scheduleEvents.push(data);


    document
        .getElementById("scheduleModal")
        .classList.remove("show");


    document.getElementById("scheduleTitle").value = "";

    document.getElementById("scheduleDescription").value = "";

    document.getElementById("scheduleColor").value = "#60A561";

    document.getElementById("scheduleRepeat").checked = true;


    renderScheduleEvents();

});


//ABRIR MODAL INFO EVENTO

function openScheduleInfo(event) {

    const modal = document.getElementById("scheduleInfoModal");

    document.getElementById("scheduleInfoTitle").textContent =
        event.title;

    document.getElementById("scheduleInfoDay").textContent =
        days[event.day];

    document.getElementById("scheduleInfoTime").textContent =
        `${event.start_time.slice(0, 5)} - ${event.end_time.slice(0, 5)}`;

    document.getElementById("scheduleInfoDescription").textContent =
        event.description || "Sin descripción";

    modal.classList.add("show");
}

const closeScheduleInfo =
    document.getElementById("closeScheduleInfo");


closeScheduleInfo.addEventListener("click", () => {

    document
        .getElementById("scheduleInfoModal")
        .classList.remove("show");

});







function getMonday(offset = 0) {

    const date = new Date();

    const day = date.getDay();

    const difference =
        day === 0 ? -6 : 1 - day;

    date.setDate(
        date.getDate() + difference
    );

    date.setDate(
        date.getDate() + (offset * 7)
    );

    date.setHours(0, 0, 0, 0);

    return date;

}


function updateWeekRange() {

    const monday =
        getMonday(currentWeekOffset);

    const sunday =
        new Date(monday);

    sunday.setDate(
        sunday.getDate() + 6
    );


    const formatDate = date => {

        return date.toLocaleDateString("es-ES", {
            day: "numeric",
            month: "long"
        });

    };


    document.getElementById("weekRange").textContent =
        `${formatDate(monday)} - ${formatDate(sunday)}`;

}

const previousWeek =
    document.getElementById("previousWeek");


const nextWeek =
    document.getElementById("nextWeek");


const today =
    document.getElementById("today");


previousWeek.addEventListener("click", () => {

    currentWeekOffset--;

    updateWeekRange();
    renderScheduleEvents();
    updateTodayHeader();

});


nextWeek.addEventListener("click", () => {

    currentWeekOffset++;

    updateWeekRange();
    renderScheduleEvents();
    updateTodayHeader();

});


today.addEventListener("click", () => {

    currentWeekOffset = 0;

    updateWeekRange();
    renderScheduleEvents();
    updateTodayHeader();

});


function updateTodayHeader() {

    document.querySelectorAll(".schedule-day-header").forEach(header => {
        header.classList.remove("today-header");
    });

    // Si no estamos viendo la semana actual, no resaltamos ningún día
    if (currentWeekOffset !== 0) {
        return;
    }

    const today = new Date().getDay();

    // JavaScript: domingo = 0, lunes = 1...
    // Nuestro horario: lunes = 0, martes = 1...
    const todayIndex = (today + 6) % 7;

    const todayHeader = document.querySelector(
        `.schedule-day-header[data-day="${todayIndex}"]`
    );

    if (todayHeader) {
        todayHeader.classList.add("today-header");
    }
}



createSchedule();
loadScheduleEvents();
updateWeekRange();
updateTodayHeader();