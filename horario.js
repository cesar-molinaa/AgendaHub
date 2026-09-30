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
let editingScheduleEvent = null;

let editingScheduleOccurrenceDate = null;
let editingScheduleMode = "all";
let scheduleExceptions = [];



const scheduleCalendar =
    document.getElementById("scheduleCalendar");


async function loadScheduleCalendars() {

    const { data, error } = await supabaseClient
        .from("calendars")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error cargando calendarios:", error);
        return;
    }

    scheduleCalendar.innerHTML = `
        <option value="">Selecciona un calendario</option>
    `;

    (data || []).forEach(calendario => {

        const option = document.createElement("option");

        option.value = calendario.id;
        option.textContent = calendario.name;

        scheduleCalendar.appendChild(option);

    });
}


async function loadScheduleSubjects() {

    const { data, error } = await supabaseClient
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error cargando asignaturas:", error);
        return;
    }

    const scheduleSubject =
        document.getElementById("scheduleSubject");

    scheduleSubject.innerHTML = `
        <option value="">Sin asignatura</option>
    `;

    (data || []).forEach(asignatura => {

        const option = document.createElement("option");

        option.value = asignatura.id;
        option.textContent = asignatura.name;

        scheduleSubject.appendChild(option);

    });
}

const scheduleSubject =
    document.getElementById("scheduleSubject");

const scheduleColor =
    document.getElementById("scheduleColor");

scheduleSubject.addEventListener("change", async () => {

    const subjectId = scheduleSubject.value;

    if (!subjectId) {
        return;
    }

    const { data, error } = await supabaseClient
        .from("subjects")
        .select("color")
        .eq("id", subjectId)
        .single();

    if (error) {
        console.error("Error obteniendo el color de la asignatura:", error);
        return;
    }

    if (data && data.color) {
        scheduleColor.value = data.color;
    }
});








async function loadScheduleEvents() {

    const { data, error } = await supabaseClient
        .from("events")
        .select("*")
        .order("start_time", { ascending: true });

    if (error) {

        console.error("Error cargando los eventos:", error);

        return;
    }

    scheduleEvents = data || [];

    await loadScheduleExceptions();

    renderScheduleEvents();
}


async function loadScheduleExceptions() {

    const { data, error } = await supabaseClient
        .from("event_exceptions")
        .select("*");

    if (error) {

        console.error(
            "Error cargando las excepciones:",
            error
        );

        return;
    }

    scheduleExceptions = data || [];
}

function formatOccurrenceDate(date) {

    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getScheduleException(event, occurrenceDate) {

    if (!event.repeat || !occurrenceDate) {
        return null;
    }

    const dateKey =
        formatOccurrenceDate(occurrenceDate);

    return scheduleExceptions.find(exception =>
        exception.event_id === event.id &&
        exception.occurrence_date === dateKey
    ) || null;
}




function parseTime(time) {

    const [hour, minute] = time.split(":").map(Number);

    return {
        hour,
        minute
    };

}


function renderScheduleEvents() {

    document.querySelectorAll(".schedule-event").forEach(eventElement => {
        eventElement.remove();
    });


    const monday =
        getMonday(currentWeekOffset);

    const sunday =
        new Date(monday);

    sunday.setDate(
        sunday.getDate() + 6
    );


    scheduleEvents.forEach(event => {

        /*
        ==========================================
        EVENTOS REPETITIVOS
        ==========================================
        */

if (event.repeat) {

    const repeatDays =
        event.repeat_days || [];

    const startDate =
        new Date(
            event.start_date + "T00:00:00"
        );

    const endDate =
        new Date(
            event.end_date + "T00:00:00"
        );


    /*
    Si la semana que estamos viendo
    está completamente antes del inicio
    o completamente después del final,
    no mostramos el evento.
    */

    if (
        sunday < startDate ||
        monday > endDate
    ) {
        return;
    }


    /*
    Recorremos los 7 días de la semana.
    */

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {

        const currentDate =
            new Date(monday);

        currentDate.setDate(
            currentDate.getDate() + dayIndex
        );


        /*
        No mostrar el evento antes
        de su fecha de inicio.
        */

        if (currentDate < startDate) {
            continue;
        }


        /*
        No mostrar el evento después
        de su fecha de finalización.
        */

        if (currentDate > endDate) {
            continue;
        }


        /*
        Comprobamos si este día
        está seleccionado para repetir.
        */

        if (repeatDays.includes(dayIndex)) {

            const exception =
                getScheduleException(event, currentDate);

            if (exception && exception.deleted) {
                continue;
            }

            const eventForOccurrence =
                exception
                    ? {
                        ...event,
                        ...Object.fromEntries(
                            Object.entries(exception)
                                .filter(([key, value]) =>
                                    ![
                                        "id",
                                        "event_id",
                                        "occurrence_date",
                                        "user_id",
                                        "created_at",
                                        "deleted"
                                    ].includes(key) &&
                                    value !== null
                                )
                        )
                    }
                    : event;

            renderEventInSchedule(
                eventForOccurrence,
                dayIndex,
                currentDate
            );

        }

    }

    return;
}


        /*
        ==========================================
        EVENTOS NO REPETITIVOS
        ==========================================
        */

        const eventStartDate =
            new Date(event.start_date + "T00:00:00");

        const eventEndDate =
            new Date(event.end_date + "T00:00:00");

        if (
            eventEndDate < monday ||
            eventStartDate > sunday
        ) {
            return;
        }

        const visibleStartDate =
            eventStartDate < monday
                ? new Date(monday)
                : new Date(eventStartDate);

        const jsDay =
            visibleStartDate.getDay();

        const dayIndex =
            (jsDay + 6) % 7;

        renderEventInSchedule(
            event,
            dayIndex,
            visibleStartDate,
            monday,
            sunday
        );

    });
}

function renderEventInSchedule(event, dayIndex, occurrenceDate, weekStart = null, weekEnd = null) {

    if (!event.start_time || !event.end_time) return;

    const start = parseTime(event.start_time);
    const end = parseTime(event.end_time);

    const startMinutes =
        start.hour * 60 +
        start.minute;

    const endMinutes =
        end.hour * 60 +
        end.minute;

    
    let duration;

    if (event.repeat) {

        duration =
            endMinutes - startMinutes;

    } else {

        const startDate =
            new Date(event.start_date + "T00:00:00");

        const endDate =
            new Date(event.end_date + "T00:00:00");

        const visibleStart =
            weekStart && startDate < weekStart
                ? new Date(weekStart)
                : new Date(startDate);

        const visibleEnd =
            weekEnd && endDate > weekEnd
                ? new Date(weekEnd)
                : new Date(endDate);

        const differenceMs =
            visibleEnd - visibleStart;

        const differenceDays =
            Math.round(
                differenceMs /
                (1000 * 60 * 60 * 24)
            );

        const visibleStartMinutes =
            visibleStart.getTime() === startDate.getTime()
                ? startMinutes
                : 0;

        const visibleEndMinutes =
            visibleEnd.getTime() === endDate.getTime()
                ? endMinutes
                : 24 * 60;

        duration =
            differenceDays * 24 * 60 +
            (visibleEndMinutes - visibleStartMinutes);

        if (visibleStart.getTime() !== startDate.getTime()) {
        }
    }


    // Si termina antes de empezar,
    // significa que pasa al día siguiente.
    if (duration <= 0) {
        duration += 24 * 60;
    }


    let remaining =
        duration;

    let currentDay =
        dayIndex;

    let currentStart = startMinutes;

    if (
        !event.repeat &&
        weekStart &&
        new Date(event.start_date + "T00:00:00") < weekStart
    ) {
        currentStart = 0;
    }

    let currentOccurrenceDate =
        new Date(occurrenceDate);

    while (remaining > 0) {

        // Minutos que quedan disponibles hasta las 00:00
        const available =
            24 * 60 - currentStart;

        const partDuration =
            Math.min(
                remaining,
                available
            );

        createScheduleEventPart(
            event,
            currentDay,
            currentStart,
            currentStart + partDuration,
            currentOccurrenceDate
        );

        remaining -= partDuration;

    if (remaining > 0) {

        if (currentDay === 6) {
            break;
        }

        currentDay++;
        currentStart = 0;

    } else {

        currentStart += partDuration;

    }


    }
}




function createScheduleEventPart(
    event,
    day,
    startTotal,
    endTotal,
    occurrenceDate
) {

    // Si no hay duración, no dibujamos nada.

    if (endTotal <= startTotal) {
        return;
    }

    const startHour =
        Math.floor(startTotal / 60);

    const cell =
        document.querySelector(
            `.schedule-cell[data-day="${day}"][data-hour="${startHour}"]`
        );

    if (!cell) {
        return;
    }

    const eventElement =
        document.createElement("div");

    eventElement.classList.add(
        "schedule-event"
    );

    eventElement.textContent =
        event.title;

    const colorFondo =
        event.color || "#60A561";

    eventElement.style.backgroundColor =
        colorFondo;

    eventElement.style.color =
        obtenerColorTexto(colorFondo);


    // ==========================================
    // POSICIÓN VERTICAL
    // ==========================================

    const cellRect = cell.getBoundingClientRect();

    const nextCell = document.querySelector(
        `.schedule-cell[data-day="${day}"][data-hour="${startHour + 1}"]`
    );

    const cellHeight = nextCell
        ? nextCell.getBoundingClientRect().top - cellRect.top
        : cellRect.height;

    const minutesInsideHour =
        startTotal % 60;

    eventElement.style.top =
        `${(minutesInsideHour / 60) * cellHeight}px`;


    // ==========================================
    // ALTURA
    // ==========================================

    const duration =
        endTotal - startTotal;

    eventElement.style.height =
        `${(duration / 60) * cellHeight}px`;


    if (duration <= 40) {
        eventElement.style.fontSize = "10px";
        eventElement.style.padding = "1px 4px";
        eventElement.style.fontWeight = "500";
        eventElement.style.display ="flex";
        eventElement.style.alignItems ="center";
    }

    if (duration <= 15) {
        eventElement.textContent = "";
    }

    // ==========================================
    // CLICK
    // ==========================================

    eventElement.addEventListener(
        "click",
        (e) => {

            e.stopPropagation();

            openScheduleInfo(event, occurrenceDate);

        }
    );

    eventElement.addEventListener("mouseenter", () => {

        cell.classList.add("schedule-cell-hover");

    });


    eventElement.addEventListener("mouseleave", () => {

        cell.classList.remove("schedule-cell-hover");

    });


    cell.appendChild(eventElement);
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

function updateCurrentTimeCell() {

    // Quitamos la marca anterior
    document.querySelectorAll(".schedule-cell").forEach(cell => {
        cell.classList.remove("current-time-cell");
    });

    // Si estamos viendo otra semana, no marcamos ninguna casilla
    if (currentWeekOffset !== 0) {
        return;
    }

    const now = new Date();

    const todayIndex = (now.getDay() + 6) % 7;

    const currentHour = now.getHours();

    const currentCell = document.querySelector(
        `.schedule-cell[data-day="${todayIndex}"][data-hour="${currentHour}"]`
    );

    if (currentCell) {
        currentCell.classList.add("current-time-cell");
    }
}

//ABRIR MODAL DE CREAR EVENTO

function openScheduleModal(dayIndex, hour, event = null) {

    const modal =
        document.getElementById("scheduleModal");

    const startDayInput =
        document.getElementById("scheduleStartDate");

    const endDayInput =
        document.getElementById("scheduleEndDate");

    const startInput =
        document.getElementById("eventTime");

    const endInput =
        document.getElementById("eventEndTime");

    const repeatCheckbox =
        document.getElementById("scheduleRepeat");

    const repeatDaysGroup =
        document.getElementById("repeatDaysGroup");

    const titleInput =
        document.getElementById("scheduleTitle");

    const subjectInput =
        document.getElementById("scheduleSubject");

    const colorInput =
        document.getElementById("scheduleColor");

    const calendarInput =
        document.getElementById("scheduleCalendar");

    const descriptionInput =
        document.getElementById("scheduleDescription");

    const showInCalendarInput =
        document.getElementById("eventShowInCalendar");

    const formError =
        document.getElementById("formError");

    const formTitle =
        document.getElementById("eventFormTitle");


    // ==========================================
    // LIMPIAR DÍAS DE REPETICIÓN
    // ==========================================

    document
        .querySelectorAll(".event-repeat-day")
        .forEach(checkbox => {
            checkbox.checked = false;
        });


    // ==========================================
    // MODO EDITAR
    // ==========================================

    if (event) {


        editingScheduleEvent = event;

        formTitle.textContent = "Editar evento";

        let eventToEdit = event;




        if (
            editingScheduleMode === "single" &&
            editingScheduleOccurrenceDate
        ) {
            const exception =
                getScheduleException(
                    event,
                    editingScheduleOccurrenceDate
                );

            if (exception) {
                eventToEdit = {
                    ...event,
                    ...exception
                };
            }

            // En "solo esta repetición" no se puede cambiar
            // la configuración de repetición.
            scheduleStartDate.disabled = true;
            scheduleEndDate.disabled = true;
            scheduleRepeat.disabled = true;

            document
                .querySelectorAll(".event-repeat-day")
                .forEach(checkbox => {
                    checkbox.disabled = true;
                });

        } else {

            // Editar todas las repeticiones
            scheduleStartDate.disabled = false;
            scheduleEndDate.disabled = false;
            scheduleRepeat.disabled = false;

            document
                .querySelectorAll(".event-repeat-day")
                .forEach(checkbox => {
                    checkbox.disabled = false;
                });
        }





        titleInput.value =
            eventToEdit.title || "";


        subjectInput.value =
            eventToEdit.subject_id || "";

        colorInput.value =
            eventToEdit.color || "#60A561";

        calendarInput.value =
            eventToEdit.calendar_id || "";

        startDayInput.value =
            eventToEdit.start_date || "";

        endDayInput.value =
            eventToEdit.end_date || "";

        startInput.value =
            eventToEdit.start_time
                ? eventToEdit.start_time.slice(0, 5)
                : "";

        endInput.value =
            eventToEdit.end_time
                ? eventToEdit.end_time.slice(0, 5)
                : "";

        descriptionInput.value =
            eventToEdit.description || "";

        repeatCheckbox.checked =
            eventToEdit.repeat || false;
        
        updateRepeatDateState();

        showInCalendarInput.checked =
            eventToEdit.show_in_calendar !== false;


        if (eventToEdit.repeat) {

            repeatDaysGroup.style.display = "block";

            const repeatDays =
                eventToEdit.repeat_days || [];

            document
                .querySelectorAll(".event-repeat-day")
                .forEach(checkbox => {

                    checkbox.checked =
                        repeatDays.includes(
                            Number(checkbox.value)
                        );

                });

        } else {

            repeatDaysGroup.style.display = "none";

        }

    }


    // ==========================================
    // MODO CREAR
    // ==========================================

    else {

        editingScheduleEvent = null;
        editingScheduleOccurrenceDate = null;

        formTitle.textContent = "Nuevo evento";

        const selectedDate =
            getMonday(currentWeekOffset);

        selectedDate.setDate(
            selectedDate.getDate() + dayIndex
        );


        const formatDate = date => {

            return `${date.getFullYear()}-${String(
                date.getMonth() + 1
            ).padStart(2, "0")}-${String(
                date.getDate()
            ).padStart(2, "0")}`;

        };


        startDayInput.value =
            formatDate(selectedDate);

        endDayInput.value =
            formatDate(selectedDate);


        startInput.value =
            `${String(hour).padStart(2, "0")}:00`;


        const nextHour = hour + 1;

        if (nextHour <= 23) {

            endInput.value =
                `${String(nextHour).padStart(2, "0")}:00`;

        } else {

            endInput.value = "23:59";

        }


        repeatCheckbox.checked = false;

        repeatDaysGroup.style.display = "none";

        updateRepeatDateState();

        subjectInput.value = "";

        colorInput.value = "#60A561";

        descriptionInput.value = "";

        showInCalendarInput.checked = true;

        if (scheduleCalendar.options.length > 1) {

            scheduleCalendar.selectedIndex = 1;

        }

    }


    // Limpiar error

    formError.textContent = "";
    formError.classList.remove("show");


    // Abrir modal

    modal.classList.add("show");
}








const scheduleRepeat =
    document.getElementById("scheduleRepeat");

const repeatDaysGroup =
    document.getElementById("repeatDaysGroup");

const scheduleStartDate =
    document.getElementById("scheduleStartDate");

const scheduleEndDate =
    document.getElementById("scheduleEndDate");


scheduleRepeat.addEventListener("change", () => {
    repeatDaysGroup.style.display = scheduleRepeat.checked ? "block" : "none";

    updateRepeatDateState();
});


function updateRepeatDateState() {
    const isRepeating = scheduleRepeat.checked;

    scheduleEndDate.disabled = false;
}




const addScheduleEvent =
    document.getElementById("addScheduleEvent");


addScheduleEvent.addEventListener("click", () => {

    const now = new Date();

    const jsDay = now.getDay();

    const todayIndex =
        (jsDay + 6) % 7;

    const currentHour =
        now.getHours();

    openScheduleModal(
        todayIndex,
        currentHour,
        null
    );

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

    const startDate =
        document.getElementById("scheduleStartDate").value;

    const endDate =
        document.getElementById("scheduleEndDate").value;

    const start =
        document.getElementById("eventTime").value;

    const end =
        document.getElementById("eventEndTime").value;

    const color =
        document.getElementById("scheduleColor").value;

    const description =
        document.getElementById("scheduleDescription").value.trim();

    const repeat =
        document.getElementById("scheduleRepeat").checked;

    const showInCalendar =
        document.getElementById("eventShowInCalendar").checked;

    const calendarId =
        document.getElementById("scheduleCalendar").value;

    const subjectId =
        document.getElementById("scheduleSubject").value || null;

    const repeatDays =
        Array.from(
            document.querySelectorAll(".event-repeat-day:checked")
        ).map(checkbox => Number(checkbox.value));

    const formError =
        document.getElementById("formError");

    formError.textContent = "";


    // ==============================
    // VALIDACIONES
    // ==============================

    if (!title) {

        formError.textContent =
            "Piensa un título";
        formError.classList.add("show");
        return;

    }


    if (!startDate || !endDate) {
        formError.textContent =
            "Determina las fechas del evento";
        formError.classList.add("show");
        return;
    }

    if (!start || !end) {
        formError.textContent =
            "Determina la duración del evento";
        formError.classList.add("show");
        return;
    }

    if (!calendarId) {
        formError.textContent =
            "Selecciona un calendario";
        formError.classList.add("show");
        return;
    }

    if (repeat && repeatDays.length === 0) {
        formError.textContent =
            "Selecciona al menos un día de repetición";
        formError.classList.add("show");
        return;
    }


    // ==============================
    // COMPROBAR FECHAS
    // ==============================

    const startDateTime =
        new Date(`${startDate}T${start}`);

    const endDateTime =
        new Date(`${endDate}T${end}`);


    if (endDateTime <= startDateTime) {
        formError.textContent =
            "La finalización debe ser posterior al inicio.";
        formError.classList.add("show");
        return;
    }

  // ==============================
    // CREAR O EDITAR EVENTO
    // ==============================

    let data;
    let error;

    const eventData = {

        title: title,

        subject_id: subjectId,

        calendar_id: calendarId,

        description: description || null,

        color: color,

        start_date: startDate,

        end_date: endDate,

        start_time: start,

        end_time: end,

        repeat: repeat,

        repeat_days: repeat
            ? repeatDays
            : [],

        show_in_calendar: showInCalendar

    };


    // ==========================================
    // EDITAR EVENTO
    // ==========================================

    if (
        editingScheduleEvent &&
        editingScheduleMode === "single"
    ) {

        if (!editingScheduleOccurrenceDate) {

            formError.textContent =
                "No se ha podido identificar la repetición.";

            formError.classList.add("show");

            return;
        }

        const occurrenceDate =
            formatOccurrenceDate(
                editingScheduleOccurrenceDate
            );

        const {
            data: userData,
            error: userError
        } = await supabaseClient.auth.getUser();

        if (userError || !userData.user) {

            formError.textContent =
                "No se ha podido identificar al usuario.";

            formError.classList.add("show");

            return;
        }

        const exceptionData = {

            event_id:
                editingScheduleEvent.id,

            user_id:
                userData.user.id,

            occurrence_date:
                occurrenceDate,

            title:
                title,

            subject_id:
                subjectId,

            color:
                color,

            start_time:
                start,

            end_time:
                end,

            description:
                description || null,

            calendar_id:
                calendarId,

            show_in_calendar:
                showInCalendar,

            deleted:
                false

        };

        const result =
            await supabaseClient
                .from("event_exceptions")
                .upsert(
                    exceptionData,
                    {
                        onConflict:
                            "event_id,occurrence_date"
                    }
                )
                .select()
                .single();

        data = result.data;
        error = result.error;

    }
    else if (
        editingScheduleEvent &&
        editingScheduleMode === "all"
    ) {

        const result =
            await supabaseClient
                .from("events")
                .update(eventData)
                .eq("id", editingScheduleEvent.id)
                .select()
                .single();

        data = result.data;
        error = result.error;
    }


    // ==========================================
    // CREAR EVENTO
    // ==========================================

    else {

        const {
            data: userData,
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !userData.user) {
            formError.textContent =
                "No se ha podido identificar al usuario.";
            formError.classList.add("show");
            return;
        }


        const result =
            await supabaseClient
                .from("events")
                .insert({

                    user_id: userData.user.id,

                    ...eventData

                })
                .select()
                .single();


        data = result.data;
        error = result.error;

    }


    // ==========================================
    // ERROR
    // ==========================================

    if (error) {
        console.error(
            "Error guardando evento:",
            error
        );

        formError.textContent =
            error.message ||
            "No se ha podido guardar el evento.";

        formError.classList.add("show");
        return;
    }


    // ==============================
    // ACTUALIZAR HORARIO
    // ==============================

    if (
        editingScheduleEvent &&
        editingScheduleMode === "single"
    ) {

        const exceptionIndex =
            scheduleExceptions.findIndex(
                exception =>
                    exception.event_id === editingScheduleEvent.id &&
                    exception.occurrence_date ===
                        formatOccurrenceDate(
                            editingScheduleOccurrenceDate
                        )
            );

        if (exceptionIndex !== -1) {

            scheduleExceptions[exceptionIndex] =
                data;

        } else {

            scheduleExceptions.push(data);

        }

    } else if (editingScheduleEvent) {

        const index =
            scheduleEvents.findIndex(
                event =>
                    event.id === editingScheduleEvent.id
            );

        if (index !== -1) {

            scheduleEvents[index] =
                data;

        }

    } else {

        scheduleEvents.push(data);

    }


    // ==============================
    // CERRAR MODAL
    // ==============================

    document
        .getElementById("scheduleModal")
        .classList.remove("show");


    // ==============================
    // LIMPIAR FORMULARIO
    // ==============================

    document.getElementById("scheduleTitle").value = "";

    document.getElementById("scheduleSubject").value = "";

    document.getElementById("scheduleStartDate").value = "";

    document.getElementById("scheduleEndDate").value = "";

    document.getElementById("scheduleEndDate").disabled = false;

    document.getElementById("eventTime").value = "";

    document.getElementById("eventEndTime").value = "";

    document.getElementById("scheduleColor").value = "#60A561";

    document.getElementById("scheduleDescription").value = "";

    document.getElementById("scheduleRepeat").checked = false;

    document.getElementById("repeatDaysGroup").style.display = "none";

    document.getElementById("eventShowInCalendar").checked = true;

    document
        .querySelectorAll(".event-repeat-day")
        .forEach(checkbox => {

            checkbox.checked = false;

        });

    editingScheduleEvent = null;
    editingScheduleOccurrenceDate = null;
    editingScheduleMode = "all";

    // ==============================
    // VOLVER A DIBUJAR
    // ==============================

    renderScheduleEvents();

});











//ABRIR MODAL INFO EVENTO

function openScheduleInfo(event, occurrenceDate) {

    editingScheduleEvent = event;
    editingScheduleOccurrenceDate = occurrenceDate;

    const modal =
        document.getElementById("scheduleInfoModal");


    document
        .getElementById("scheduleInfoTitle")
        .textContent = event.title;


    // ==========================================
    // DÍA
    // ==========================================

    let dayText = "";

    if (event.repeat) {

        if (occurrenceDate) {

            const jsDay =
                occurrenceDate.getDay();

            const dayIndex =
                (jsDay + 6) % 7;

            dayText =
                days[dayIndex];

        } else {

            const repeatDays =
                event.repeat_days || [];

            dayText =
                repeatDays
                    .map(day => days[day])
                    .join(", ");
        }

    } else {

        const eventDate =
            new Date(event.start_date + "T00:00:00");

        const jsDay =
            eventDate.getDay();

        const dayIndex =
            (jsDay + 6) % 7;

        dayText =
            days[dayIndex];

        if (
            event.end_date &&
            event.end_date !== event.start_date
        ) {

            const endDate =
                new Date(event.end_date + "T00:00:00");

            const endJsDay =
                endDate.getDay();

            const endDayIndex =
                (endJsDay + 6) % 7;

            dayText +=
                ` → ${days[endDayIndex]}`;

        }

    }


    document
        .getElementById("scheduleInfoDay")
        .textContent = dayText;


    // ==========================================
    // HORARIO
    // ==========================================

    document
        .getElementById("scheduleInfoTime")
        .textContent =
            `${event.start_time.slice(0, 5)} - ${event.end_time.slice(0, 5)}`;


    // ==========================================
    // DESCRIPCIÓN
    // ==========================================

    document
        .getElementById("scheduleInfoDescription")
        .textContent =
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

const editSchedule =
    document.getElementById("editSchedule");






editSchedule.addEventListener("click", () => {

    if (!editingScheduleEvent) {
        return;
    }

    const event =
        editingScheduleEvent;

    document
        .getElementById("scheduleInfoModal")
        .classList.remove("show");

    if (event.repeat) {

        document
            .getElementById("scheduleEditChoiceModal")
            .classList.add("show");

        return;
    }

    editingScheduleMode = "all";

    openScheduleModal(
        0,
        8,
        event
    );

});

const editOnlyThis =
    document.getElementById("editOnlyThis");

const editAllEvents =
    document.getElementById("editAllEvents");

const cancelEditChoice =
    document.getElementById("cancelEditChoice");


editOnlyThis.addEventListener("click", async () => {

    if (
        !editingScheduleEvent ||
        !editingScheduleOccurrenceDate
    ) {
        return;
    }

    editingScheduleMode = "single";

    document
        .getElementById("scheduleEditChoiceModal")
        .classList.remove("show");

    openScheduleModal(
        0,
        8,
        editingScheduleEvent
    );

});


editAllEvents.addEventListener("click", () => {

    if (!editingScheduleEvent) {
        return;
    }

    editingScheduleMode = "all";

    document
        .getElementById("scheduleEditChoiceModal")
        .classList.remove("show");

    openScheduleModal(
        0,
        8,
        editingScheduleEvent
    );

});


cancelEditChoice.addEventListener("click", () => {

    document
        .getElementById("scheduleEditChoiceModal")
        .classList.remove("show");

});







const deleteSchedule =
    document.getElementById("deleteSchedule");

deleteSchedule.addEventListener("click", async () => {

    if (!editingScheduleEvent) {
        return;
    }


    const event =
        editingScheduleEvent;


    const confirmed =
        confirm(
            `¿Quieres eliminar "${event.title}"?`
        );


    if (!confirmed) {
        return;
    }


    const { error } =
        await supabaseClient
            .from("events")
            .delete()
            .eq("id", event.id);


    if (error) {

        console.error(
            "Error eliminando evento:",
            error
        );

        return;

    }


    // Eliminarlo de la lista local

    scheduleEvents =
        scheduleEvents.filter(
            scheduleEvent =>
                scheduleEvent.id !== event.id
        );


    // Cerrar modal

    document
        .getElementById("scheduleInfoModal")
        .classList.remove("show");


    editingScheduleEvent = null;


    // Redibujar horario

    renderScheduleEvents();

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

    updateCurrentTimeCell();

});


nextWeek.addEventListener("click", () => {

    currentWeekOffset++;

    updateWeekRange();
    renderScheduleEvents();
    updateTodayHeader();

    updateCurrentTimeCell();

});


today.addEventListener("click", () => {

    currentWeekOffset = 0;

    updateWeekRange();
    renderScheduleEvents();
    updateTodayHeader();

    updateCurrentTimeCell();

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
loadScheduleCalendars();
loadScheduleSubjects();
updateWeekRange();
updateTodayHeader();


updateCurrentTimeCell();

setInterval(updateCurrentTimeCell, 60000);