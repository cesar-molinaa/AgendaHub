



document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});

const calendarsBtn = document.getElementById("calendarsBtn");
const calendarsPanel = document.querySelector(".calendars-panel");

calendarsBtn.addEventListener("click", () => {

    const abierto = calendarsPanel.classList.toggle("show");

    if (window.innerWidth <= 768 && abierto) {

        const rect = calendarsBtn.getBoundingClientRect();

        calendarsPanel.style.position = "fixed";
        calendarsPanel.style.top = `${rect.bottom + 8}px`;
        calendarsPanel.style.left = `${rect.left + rect.width / 2}px`;
        calendarsPanel.style.right = "auto";
        calendarsPanel.style.transform = "translateX(-50%)";
        calendarsPanel.style.zIndex = "100";

    } else {

        calendarsPanel.style.position = "";
        calendarsPanel.style.top = "";
        calendarsPanel.style.left = "";
        calendarsPanel.style.right = "";
        calendarsPanel.style.transform = "";
    }

});

//BOTON AÑADIR EVENTO

const addEvent = document.getElementById("addEvent");
const eventModal = document.getElementById("eventModal");
const cancelEvent = document.getElementById("cancelEvent");




function prepararNuevoEvento(fecha = "") {

    editandoEvento = false;
    eventoSeleccionado = null;

    eventFormTitle.textContent = "Nuevo evento";

    eventTitle.value = "";
    eventSubject.value = "";
    eventColor.value = "#60A561";
    eventCalendar.value = "";

    eventDate.value = fecha;
    eventEndDate.value = fecha;

    eventTime.value = "";
    eventEndTime.value = "";

    eventDescription.value = "";

    eventRepeat.checked = false;
    eventRepeatOptions.style.display = "none";

    document
        .querySelectorAll(".event-repeat-day")
        .forEach(checkbox => {
            checkbox.checked = false;
        });

    eventShowInCalendar.checked = true;

    formError.classList.remove("show");

    eventModal.classList.add("show");
}






addEvent.addEventListener("click", () => {

    prepararNuevoEvento();

});

cancelEvent.addEventListener("click", () => {
    eventModal.classList.remove("show");
    formError.classList.remove("show");
})



//ELEMENTOS DEL MODAL DE CREAR EVENTO

let eventos = [];


async function loadEvents() {

    const { data, error } = await supabaseClient
        .from("events")
        .select("*")
        .eq("show_in_calendar", true)
        .order("start_date", { ascending: true })
        .order("start_time", { ascending: true });

    if (error) {
        console.error("Error cargando eventos:", error);
        return;
    }

    eventos = (data || []).map(evento => ({
        id: evento.id,
        titulo: evento.title,
        asignatura: evento.subject_id,
        calendario: evento.calendar_id,

        fecha: evento.start_date,
        hora: evento.start_time
            ? evento.start_time.slice(0, 5)
            : null,

        fechaFin: evento.end_date,
        horaFin: evento.end_time
            ? evento.end_time.slice(0, 5)
            : null,

        color: evento.color,

        repetir: evento.repeat,
        diasRepeticion: evento.repeat_days,
        mostrarEnCalendario: evento.show_in_calendar,

        descripcion: evento.description
    }));


    if (vistaActual === "month") {
        mostrarCalendario();
    }

    if (vistaActual === "week") {
        mostrarSemana();
    }

    if (vistaActual === "day") {
        mostrarDia();
    }
}



const eventFormTitle = document.getElementById("eventFormTitle");

const eventTitle = document.getElementById("eventTitle");
const eventSubject = document.getElementById("eventSubject");
const eventColor = document.getElementById("eventColor");
const eventCalendar = document.getElementById("eventCalendar");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");

const eventEndDate =
    document.getElementById("eventEndDate");

const eventEndTime =
    document.getElementById("eventEndTime");

const eventRepeat =
    document.getElementById("eventRepeat");

const eventRepeatOptions =
    document.getElementById("eventRepeatOptions");

const eventShowInCalendar =
    document.getElementById("eventShowInCalendar");


const eventDescription = document.getElementById("eventDescription");

const saveEvent = document.getElementById("saveEvent");
const calendar = document.getElementById("calendar");

const formError = document.getElementById("formError");



eventRepeat.addEventListener("change", () => {

    if (eventRepeat.checked) {

        eventRepeatOptions.style.display = "block";

    } else {

        eventRepeatOptions.style.display = "none";

    }

});

eventSubject.addEventListener("change", () => {

    const subject = getSubjectById(eventSubject.value);

    if (subject) {
        eventColor.value = subject.color;
    }

});


function getSubjectById(subjectId) {

    return subjects.find(subject => subject.id == subjectId);

}

function eventoApareceEnFecha(evento, fechaFormateada) {

    // EVENTO REPETITIVO

    if (evento.repetir) {

        // No aparece antes de la fecha de inicio
        if (fechaFormateada < evento.fecha) {
            return false;
        }

        // Si tiene una fecha de finalización posterior
        // a la fecha de inicio, la respetamos.
        if (
            evento.fechaFin &&
            evento.fechaFin !== evento.fecha &&
            fechaFormateada > evento.fechaFin
        ) {
            return false;
        }

        const fecha =
            new Date(fechaFormateada + "T00:00");

        const jsDay =
            fecha.getDay();

        const dayIndex =
            (jsDay + 6) % 7;

        return (evento.diasRepeticion || [])
            .includes(dayIndex);
    }


    // EVENTO NORMAL

    if (fechaFormateada < evento.fecha) {
        return false;
    }

    if (
        evento.fechaFin &&
        fechaFormateada > evento.fechaFin
    ) {
        return false;
    }

    return true;
}



function obtenerTextoDiasRepeticion(evento) {

    if (!evento.repetir || !evento.diasRepeticion) {
        return "";
    }

    const nombresDias = [
        "Lunes",
        "Martes",
        "Miércoles",
        "Jueves",
        "Viernes",
        "Sábado",
        "Domingo"
    ];

    return [...evento.diasRepeticion]
        .sort((a, b) => a - b)
        .map(dia => nombresDias[dia])
        .join(", ");
}






//FUNCIONAMIENTO DE CALENDARIOS (AÑADIR/QUITAR) --------------------------------------------------------------------------------------------------------------------------------------------

let calendarios = [];

async function loadCalendars() {

    const { data, error } = await supabaseClient
        .from("calendars")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error cargando calendarios:", error);
        return;
    }

    calendarios = data.map(calendario => ({
        id: calendario.id,
        nombre: calendario.name,
        visible: calendario.visible
    }));

    // Si el usuario todavía no tiene calendarios,
    // crear los dos iniciales
    if (calendarios.length === 0) {

        const { data: { user } } = await supabaseClient.auth.getUser();

        if (!user) {
            console.error("No hay ningún usuario conectado.");
            return;
        }

        const { data: nuevosCalendarios, error: insertError } =
            await supabaseClient
                .from("calendars")
                .insert([
                    {
                        user_id: user.id,
                        name: "Bachillerato",
                        visible: true
                    },
                    {
                        user_id: user.id,
                        name: "Personal",
                        visible: true
                    }
                ])
                .select();

        if (insertError) {
            console.error("Error creando calendarios iniciales:", insertError);
            return;
        }

        calendarios = nuevosCalendarios.map(calendario => ({
            id: calendario.id,
            nombre: calendario.name,
            visible: calendario.visible
        }));
    }

    mostrarCalendarios();
    cargarCalendariosEnSelect();

    await loadEvents();
}

const addCalendar = document.getElementById("addCalendar");
const calendarList = document.getElementById("calendarList");

const calendarModal = document.getElementById("calendarModal");

const calendarName = document.getElementById("calendarName");

const saveCalendar = document.getElementById("saveCalendar");

const cancelCalendar = document.getElementById("cancelCalendar");

const calendarError = document.getElementById("calendarError");


//MOSTRAR CALENDARIOS 

function mostrarCalendarios() {

     calendarList.innerHTML = "";

     calendarios.forEach(calendario => {

        const calendarItem = document.createElement("div");

        calendarItem.classList.add("calendar-item");

        calendarItem.innerHTML = `

            <label class="calendar-label">

                <input 
                    type="checkbox" 
                    class="calendar-checkbox"
                    ${calendario.visible ? "checked" : ""}
                >

                <span>${calendario.nombre}</span>

            </label>

            <button class="delete-calendar">
                ×
            </button>

        `;

        // MOSTRAR / OCULTAR CALENDARIO

        const checkbox = calendarItem.querySelector(".calendar-checkbox");

        checkbox.addEventListener("change", async () => {

            calendario.visible = checkbox.checked;

            const { error } = await supabaseClient
                .from("calendars")
                .update({
                    visible: calendario.visible
                })
                .eq("id", calendario.id);

            if (error) {
                console.error("Error actualizando calendario:", error);
                return;
            }

            actualizarVistaCalendario();

        });


        //ELIMINAR CALENDARIO

        const deleteButton = calendarItem.querySelector(".delete-calendar");

        deleteButton.addEventListener("click", (event) => {

            event.stopPropagation();

            eliminarCalendario(calendario.id);
        });

        calendarList.appendChild(calendarItem);
     })
}

function actualizarVistaCalendario() {

    if (vistaActual === "month") {
        mostrarCalendario();
    }

    if (vistaActual === "week") {
        mostrarSemana();
    }

    if (vistaActual === "day") {
        mostrarDia();
    }

}

//AÑADIR NUEVO CALENDARIO -----------------------------------

//BOTON ABRE MODAL PARA CREAR CALENDARIO NUEVO

addCalendar.addEventListener("click", () => {

    calendarName.value = "";

    calendarError.textContent = "";
    calendarError.classList.remove("show");

    calendarModal.classList.add("show");

    calendarName.focus();

})

//BOTON CIERRA MODAL DE CREAR CALENDARIO NUEVO

cancelCalendar.addEventListener("click", () => {

    calendarModal.classList.remove("show");

    calendarError.textContent = "";
    calendarError.classList.remove("show");
})


//GUARDAR CALENDARIO NUEVO

saveCalendar.addEventListener("click", async () => {

    const nombre = calendarName.value.trim();

    calendarError.classList.remove("show");


    if(nombre === "") {
        calendarError.textContent = "Introduce un nombre";

        calendarError.classList.add("show");

        return;
    }


    // COMPROBAR SI YA EXISTE ESE NOMBRE

    const existe = calendarios.some(
        calendario =>
            calendario.nombre.toLowerCase() === nombre.toLowerCase()
    );


    if (existe) {

        calendarError.textContent =
            "Ya existe un calendario con ese nombre";

        calendarError.classList.add("show");

        return;

    }

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        console.error("No hay ningún usuario conectado.");
        return;
    }

    const { data, error } = await supabaseClient
        .from("calendars")
        .insert({
            user_id: user.id,
            name: nombre,
            visible: true
        })
        .select()
        .single();

    if (error) {
        console.error("Error creando calendario:", error);
        return;
    }

    calendarios.push({
        id: data.id,
        nombre: data.name,
        visible: data.visible
    });

    mostrarCalendarios();
    cargarCalendariosEnSelect();

    // CERRAR MODAL

    calendarModal.classList.remove("show");
})




//ELIMINAR CALENDARIO Y SUS EVENTOS

async function eliminarCalendario(id) {

    const calendario = calendarios.find(
        calendario => calendario.id === id
    );

    if (!calendario) {
        return;
    }

    const confirmar = confirm(
        `¿Quieres eliminar el calendario "${calendario.nombre}"? También se eliminarán sus eventos.`
    );

    if (!confirmar) {
        return;
    }


    // ELIMINAR LOS EVENTOS DE ESTE CALENDARIO

    const { error: eventsError } = await supabaseClient
        .from("events")
        .delete()
        .eq("calendar_id", id);

    if (eventsError) {
        console.error("Error eliminando eventos:", eventsError);
        return;
    }


    // ELIMINAR EL CALENDARIO

    const { error: calendarError } = await supabaseClient
        .from("calendars")
        .delete()
        .eq("id", id);

    if (calendarError) {
        console.error("Error eliminando calendario:", calendarError);
        return;
    }


    // ACTUALIZAR LA INFORMACIÓN LOCAL DE LA INTERFAZ

    calendarios = calendarios.filter(
        calendario => calendario.id !== id
    );

    eventos = eventos.filter(
        evento => evento.calendario !== id
    );


    // ACTUALIZAR INTERFAZ

    mostrarCalendarios();
    cargarCalendariosEnSelect();

    if (vistaActual === "month") {
        mostrarCalendario();
    }

    if (vistaActual === "week") {
        mostrarSemana();
    }

    if (vistaActual === "day") {
        mostrarDia();
    }

}

function cargarCalendariosEnSelect() {

    eventCalendar.innerHTML = `
        <option value="">Selecciona un calendario</option>
    `;

    calendarios.forEach(calendario => {

        const option = document.createElement("option");

        option.value = calendario.id;

        option.textContent = calendario.nombre;

        eventCalendar.appendChild(option);

    });

}














//ELEMENTOS DEL MODAL DE EVENTO ABIERTO---------------------------------------------------------------------------------------------------------

const eventInfoModal = document.getElementById("eventInfoModal");

const infoTitle = document.getElementById("infoTitle");
const infoSubject = document.getElementById("infoSubject");
const infoDate = document.getElementById("infoDate");
const infoTime = document.getElementById("infoTime");
const infoDescription = document.getElementById("infoDescription");

const closeInfo = document.getElementById("closeInfo");
const editEvent = document.getElementById("editEvent");
const deleteEvent = document.getElementById("deleteEvent");



//GUARDAR INFORMACION DE EVENTO EN LOCAL STORAGE

saveEvent.addEventListener("click", async () => {

    const titulo = eventTitle.value.trim();
    const asignatura = eventSubject.value;
    const calendario = eventCalendar.value;
    const fecha = eventDate.value;
    const hora = eventTime.value;
    const fechaFin = eventEndDate.value;
    const horaFin = eventEndTime.value;
    const descripcion = eventDescription.value.trim();

    const repetir = eventRepeat.checked;

    const diasRepeticion = repetir
        ? Array.from(document.querySelectorAll(".event-repeat-day:checked"))
            .map(checkbox => Number(checkbox.value))
        : [];

    const mostrarEnCalendario = eventShowInCalendar.checked;

    formError.classList.remove("show");

    if (repetir && diasRepeticion.length === 0) {

        formError.textContent =
            "Selecciona al menos un día para repetir el evento";

        formError.classList.add("show");

        return;
    }


    formError.classList.remove("show");

    if (titulo === "") {

        formError.textContent = "Introduce un título";
        formError.classList.add("show");

        return;
    }

    if (calendario === "") {

        formError.textContent = "Selecciona un calendario";
        formError.classList.add("show");

        return;
    }

    if (fecha === "") {

        formError.textContent = "Introduce una fecha";
        formError.classList.add("show");

        return;
    }

    if (fechaFin === "") {
        formError.textContent = "Introduce una fecha de finalización";
        formError.classList.add("show");
        return;
    }

    if (fechaFin < fecha) {
        formError.textContent = "La fecha de finalización no puede ser anterior a la fecha de inicio";
        formError.classList.add("show");
        return;
    }

    if (fechaFin === fecha && hora && horaFin && horaFin <= hora) {
        formError.textContent = "La hora de finalización debe ser posterior a la hora de inicio";
        formError.classList.add("show");
        return;
    }


    // COMPROBAR USUARIO

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {

        console.error("No hay ningún usuario conectado.");

        return;
    }


    // EDITAR EVENTO

    if (editandoEvento) {

        const { data, error } = await supabaseClient
            .from("events")
            .update({
                title: titulo,
                subject_id: asignatura || null,
                calendar_id: calendario,

                start_date: fecha,
                end_date: fechaFin,

                start_time: hora || null,
                end_time: horaFin || hora || null,

                description: descripcion || null,

                color: eventColor.value || "#FCB55F",
                
                repeat: repetir,
                repeat_days: diasRepeticion,
                show_in_calendar: mostrarEnCalendario
            })
            .eq("id", eventoSeleccionado.id)
            .select()
            .single();


        if (error) {

            console.error("Error actualizando evento:", error);

            return;
        }


        // ACTUALIZAR EL EVENTO QUE YA TENEMOS EN MEMORIA

        eventoSeleccionado.titulo = data.title;
        eventoSeleccionado.asignatura = data.subject_id;
        eventoSeleccionado.calendario = data.calendar_id;

        eventoSeleccionado.fecha = data.start_date;
        eventoSeleccionado.hora = data.start_time;
        eventoSeleccionado.fechaFin = data.end_date;
        eventoSeleccionado.horaFin = data.end_time;

        eventoSeleccionado.color = data.color;

        eventoSeleccionado.repetir = data.repeat;
        eventoSeleccionado.diasRepeticion = data.repeat_days;
        eventoSeleccionado.mostrarEnCalendario = data.show_in_calendar;

        eventoSeleccionado.descripcion = data.description;

    }


    // CREAR EVENTO

    else {

        const { data, error } = await supabaseClient
            .from("events")
            .insert({
                user_id: user.id,
                title: titulo,
                subject_id: asignatura || null,
                calendar_id: calendario,

                start_date: fecha,
                end_date: fechaFin || fecha,

                start_time: hora || null,
                end_time: horaFin || hora || null,

                description: descripcion || null,

                color: eventColor.value || "#FCB55F",

                repeat: repetir,
                repeat_days: diasRepeticion,

                show_in_calendar: mostrarEnCalendario
            })
            .select()
            .single();


        if (error) {

            console.error("Error creando evento:", error);

            return;
        }


        // CONVERTIR EL EVENTO DE SUPABASE AL FORMATO DEL CALENDARIO

        eventos.push({
            id: data.id,
            titulo: data.title,
            asignatura: data.subject_id,
            calendario: data.calendar_id,
            
            fecha: data.start_date,
            hora: data.start_time,
            fechaFin: data.end_date,
            horaFin: data.end_time,
            color: data.color,
            repetir: data.repeat,
            diasRepeticion: data.repeat_days,
            mostrarEnCalendario: data.show_in_calendar,

            descripcion: data.description
        });

    }



    // CERRAR MODAL

    eventModal.classList.remove("show");


    // VOLVER A CARGAR LOS EVENTOS DESDE SUPABASE

    await loadEvents();

});




//SECCION CAMBIAR DE VISTA---------------------------------------------------------------------------------------------------------


const viewBtn = document.getElementById("viewBtn");
const viewMenu = document.getElementById("viewMenu");

//BOTON QUE DESPLEGA EL MENU

viewBtn.addEventListener("click", () => {
    viewMenu.classList.toggle("show");
});


//FUNCIONALIDAD BOTONES MENU DE VISTAS

let vistaActual = "month";

const viewOptions = viewMenu.querySelectorAll("button");

viewOptions.forEach((button) => {

    button.addEventListener("click", () => {

        vistaActual = button.dataset.view;

        viewBtn.firstChild.textContent = button.textContent + "";

        viewMenu.classList.remove("show");

        if (vistaActual === "month") {
            mostrarCalendario();
        }

        if (vistaActual === "week") {
            mostrarSemana();
        }

        if (vistaActual === "day") {
            mostrarDia();
        }

    })
})




// CALENDARIO MENSUAL--------------------------------------------------------------------------------------------------------------------------------------------

const calendarDays = document.getElementById("calendarDays");
const currentMonth = document.getElementById("currentMonth");

const prevMonth = document.getElementById("prevMonth");
const nextMonth = document.getElementById("nextMonth");

let fechaCalendario = new Date();

let fechaSeleccionada = null;

let eventoSeleccionado = null;

let editandoEvento = false;









//-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------



//FUNCIÓN QUE SE ENCARGA DE CALCULAR Y DISEÑAR EL CALENDARIO CORRESPONDIENTE

function mostrarCalendario() {

    calendarDays.innerHTML = "";

    calendar.classList.remove("day-view");
    calendar.classList.remove("week-view");

    const año = fechaCalendario.getFullYear();
    const mes = fechaCalendario.getMonth();

    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes +1, 0);

    const diasMes = ultimoDia.getDate();

    let diaSemana = primerDia.getDay();

    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;


     // ESPACIOS ANTES DEL PRIMER DÍA

    for (let i = 0; i < diaSemana; i++) {

        const espacio = document.createElement("div");

        espacio.classList.add("calendar-day");

        calendarDays.appendChild(espacio);

    }


    // DÍAS DEL MES

    for (let dia = 1; dia <= diasMes; dia++) {

        const day = document.createElement("div");

        day.classList.add("calendar-day");

        const hoy = new Date();

        if (
            dia === hoy.getDate() &&
            mes === hoy.getMonth() &&
            año === hoy.getFullYear()
        ) {
            day.classList.add("today");
        }

        day.innerHTML = `
            <span>${dia}</span>
        `;

        //FECHA DE ESTE DIA

        const fechaDia = new Date(año, mes, dia);

        const añoEvento = fechaDia.getFullYear();
        const mesEvento = String(fechaDia.getMonth() + 1).padStart(2, "0");
        const diaEvento = String(fechaDia.getDate()).padStart(2, "0");

        const fechaFormateada = `${añoEvento}-${mesEvento}-${diaEvento}`;


        //ABRE MODAL DE CREAR EVENTO AL HACER CLICK EN EL DIA (CON LA FECHA YA RELLENA)

        day.addEventListener("click", () => {

            prepararNuevoEvento();

            // PONER AUTOMÁTICAMENTE LA FECHA DEL DÍA
            fechaSeleccionada = fechaFormateada;
            eventDate.value = fechaSeleccionada;
            eventEndDate.value = fechaSeleccionada;


        });


        //BUSCAR EVENTOS DE ESTE DÍA

        const eventosDelDia = eventos
        .filter(evento => eventoApareceEnFecha(evento, fechaFormateada))
        .filter(evento => {

            const calendario = calendarios.find(
                calendario => calendario.id === evento.calendario
            );

            return calendario && calendario.visible;

        })
        .sort((a, b) => {

            return (a.hora || "23:59")
                .localeCompare(b.hora || "23:59");

        });
 

        // MOSTRAR LOS EVENTOS

        const maxEventos = 3;

        eventosDelDia.slice(0, maxEventos).forEach(evento => {

            const eventElement = document.createElement("div");

            eventElement.classList.add("calendar-event");

            eventElement.textContent = evento.titulo;

            
            if (evento.color) {
                    eventElement.style.backgroundColor = evento.color;
                } else {

                    const subject = getSubjectById(evento.asignatura);

                    if (subject) {
                        eventElement.style.backgroundColor = subject.color;
                    } else {
                        eventElement.style.backgroundColor = "#FCB55F";
                    }

                }


            eventElement.addEventListener("click", (event) => {

                event.stopPropagation();

                eventoSeleccionado = evento;

                infoTitle.textContent = evento.titulo;

                const subject = getSubjectById(evento.asignatura);
                infoSubject.textContent = subject
                ? subject.name
                : "Sin asignatura";

                if (evento.repetir) {

                    infoDate.textContent =
                        `Se repite: ${obtenerTextoDiasRepeticion(evento)}`;
                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                } else {

                    infoDate.textContent =
                        evento.fecha;
                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                }


                infoDescription.textContent =
                    evento.descripcion || "Sin descripción";

                eventInfoModal.classList.add("show");

            });


            day.appendChild(eventElement);

        });


        // MOSTRAR "..." SI HAY MÁS EVENTOS

        if (eventosDelDia.length > maxEventos) {

            const moreEvents = document.createElement("div");

            moreEvents.classList.add("more-events");

            moreEvents.textContent = ". . .";

            day.appendChild(moreEvents);
        }

        //AÑADE EL DÍA AL CALENDARIO

        calendarDays.appendChild(day);
    }


    // NOMBRE DEL MES

    const opciones = {
        month: "long",
        year: "numeric"
    };

    let nombreMes = fechaCalendario.toLocaleDateString("es-ES", opciones);

    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    currentMonth.textContent = nombreMes;


}


//FUNCIÓN QUE SE ENCARGA DE CALCULAR Y DISEÑAR LA SEMANA CORRESPONDIENTE

function mostrarSemana() {

    calendarDays.innerHTML = "";

    calendar.classList.remove("day-view");
    calendar.classList.add("week-view");

    const fecha = new Date(fechaCalendario);

    // LUNES DE LA SEMANA ACTUAL

    let diaSemana = fecha.getDay();

    diaSemana = diaSemana === 0 ? 6 : diaSemana - 1;

    fecha.setDate(fecha.getDate() - diaSemana);


    // CREAR LOS 7 DÍAS

    for (let i = 0; i < 7; i++) {

        const dia = new Date(fecha);

        dia.setDate(fecha.getDate() + i);


        const day = document.createElement("div");

        day.classList.add("calendar-day");

        const hoy = new Date();

        if (
            dia.getDate() === hoy.getDate() &&
            dia.getMonth() === hoy.getMonth() &&
            dia.getFullYear() === hoy.getFullYear()
        ) {
            day.classList.add("today");
        }


        // CREAR LA FECHA EN FORMATO YYYY-MM-DD

        const añoEvento = dia.getFullYear();

        const mesEvento = String(dia.getMonth() + 1).padStart(2, "0");

        const diaEvento = String(dia.getDate()).padStart(2, "0");

        const fechaFormateada = `${añoEvento}-${mesEvento}-${diaEvento}`;


        // MOSTRAR EL NOMBRE DEL DÍA Y EL NÚMERO

        const nombreDia = dia.toLocaleDateString("es-ES", {
            weekday: "short"
        });

        day.innerHTML = `
            <div class="week-day-header">
                <strong>${nombreDia}</strong>
                <span>${dia.getDate()}</span>
            </div>
        `;


        // CLICK EN EL DÍA → CREAR EVENTO

        day.addEventListener("click", () => {

    
            prepararNuevoEvento();

            fechaSeleccionada = fechaFormateada;
            eventDate.value = fechaSeleccionada;
            eventEndDate.value = fechaSeleccionada;


        });


        // BUSCAR EVENTOS DE ESTE DÍA

        const eventosDelDia = eventos
        .filter(evento => eventoApareceEnFecha(evento, fechaFormateada))
        .filter(evento => {

            const calendario = calendarios.find(
                calendario => calendario.id === evento.calendario
            );

            return calendario && calendario.visible;

        })
        .sort((a, b) => {

            return (a.hora || "23:59")
                .localeCompare(b.hora || "23:59");

        });



        // MOSTRAR LOS EVENTOS

        eventosDelDia.forEach(evento => {

            const eventElement = document.createElement("div");

            eventElement.classList.add("calendar-event");

            eventElement.textContent = evento.titulo;

            
            if (evento.color) {
                eventElement.style.backgroundColor = evento.color;
            } else {

                const subject = getSubjectById(evento.asignatura);

                if (subject) {
                    eventElement.style.backgroundColor = subject.color;
                } else {
                    eventElement.style.backgroundColor = "#FCB55F";
                }

            }


            // CLICK EN EL EVENTO

            eventElement.addEventListener("click", (event) => {

                event.stopPropagation();

                eventoSeleccionado = evento;

                infoTitle.textContent = evento.titulo;

                const subject = getSubjectById(evento.asignatura);  
                infoSubject.textContent = subject
                ? subject.name
                : "Sin asignatura";

                if (evento.repetir) {

                    infoDate.textContent =
                        `Se repite: ${obtenerTextoDiasRepeticion(evento)}`;

                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                } else {

                    infoDate.textContent =
                        evento.fecha;

                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                }



                infoDescription.textContent =
                    evento.descripcion || "Sin descripción";

                eventInfoModal.classList.add("show");

            });


            day.appendChild(eventElement);

        });


        calendarDays.appendChild(day);

    }


    // CAMBIAR EL TÍTULO DEL CALENDARIO

    const opciones = {
        month: "long",
        year: "numeric"
    };

    let nombreMes = fecha.toLocaleDateString("es-ES", opciones);

    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    currentMonth.textContent = nombreMes;

}



//FUNCIÓN QUE SE ENCARGA DE CALCULAR Y DISEÑAR EL DÍA CORRESPONDIENTE

function mostrarDia() {

    calendarDays.innerHTML = "";

    calendar.classList.remove("week-view");
    calendar.classList.add("day-view");

    const dia = new Date(fechaCalendario);

    const day = document.createElement("div");

    day.classList.add("calendar-day");

    const nombreDia = dia.toLocaleDateString("es-ES", {
        weekday: "long"
    });

    const numeroDia = dia.getDate();

    const año = dia.getFullYear();
    const mes = String(dia.getMonth() + 1).padStart(2, "0");
    const numero = String(dia.getDate()).padStart(2, "0");

    const fechaFormateada = `${año}-${mes}-${numero}`;

    day.innerHTML = `

        <div class="day-header">
            <strong>${nombreDia}</strong>
            <span>${numeroDia}</span>
        </div>

    `;

    calendarDays.appendChild(day);

    // CAMBIAR EL TÍTULO DEL CALENDARIO

    const opciones = {
        month: "long",
        year: "numeric"
    };

    let nombreMes = dia.toLocaleDateString("es-ES", opciones);

    nombreMes = nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1);

    currentMonth.textContent = nombreMes;


    // CLICK EN EL DÍA → CREAR EVENTO

    day.addEventListener("click", () => {

        prepararNuevoEvento();

        fechaSeleccionada = fechaFormateada;
        eventDate.value = fechaSeleccionada;
        eventEndDate.value = fechaSeleccionada;


    });




    // BUSCAR LOS EVENTOS DE ESTE DÍA

    const eventosDelDia = eventos
    .filter(evento => eventoApareceEnFecha(evento, fechaFormateada))
    .filter(evento => {

        const calendario = calendarios.find(
            calendario => calendario.id === evento.calendario
        );

        return calendario && calendario.visible;

    })
    .sort((a, b) => {

        return (a.hora || "23:59")
            .localeCompare(b.hora || "23:59");

    });




    // MOSTRAR LOS EVENTOS

    eventosDelDia.forEach(evento => {

        const eventElement = document.createElement("div");

        eventElement.classList.add("calendar-event");

        eventElement.textContent = evento.titulo;

        
        if (evento.color) {
                eventElement.style.backgroundColor = evento.color;
            } else {

                const subject = getSubjectById(evento.asignatura);

                if (subject) {
                    eventElement.style.backgroundColor = subject.color;
                } else {
                    eventElement.style.backgroundColor = "#FCB55F";
                }

            }


        // CLICK EN EL EVENTO

        eventElement.addEventListener("click", (event) => {

            event.stopPropagation();

            eventoSeleccionado = evento;

            infoTitle.textContent = evento.titulo;

            const subject = getSubjectById(evento.asignatura);
            infoSubject.textContent = subject
            ? subject.name
            : "Sin asignatura";

            if (evento.repetir) {

                    infoDate.textContent =
                        `Se repite: ${obtenerTextoDiasRepeticion(evento)}`;

                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                } else {

                    infoDate.textContent =
                        evento.fecha;

                    infoTime.textContent =
                        `${evento.hora || "Sin hora"} - ${evento.horaFin || "Sin hora"}`;

                }



            infoDescription.textContent =
                evento.descripcion || "Sin descripción";

            eventInfoModal.classList.add("show");

        });


        day.appendChild(eventElement);

    });


}












//BOTONES PARA CAMBIAR DE MES-SEMANA-DÍA--------------------------------------------------------------------------------------------------------------------------------------------

prevMonth.addEventListener("click", () => {

    if (vistaActual === "month") {
        fechaCalendario.setMonth(fechaCalendario.getMonth() - 1);

        mostrarCalendario();
    }

    if (vistaActual === "week") {
        fechaCalendario.setDate(fechaCalendario.getDate() - 7);

        mostrarSemana();
    }

    if (vistaActual === "day") {
        fechaCalendario.setDate(fechaCalendario.getDate() - 1)

        mostrarDia();
    }

});


nextMonth.addEventListener("click", () => {

    if (vistaActual === "month") {

        fechaCalendario.setMonth(fechaCalendario.getMonth() + 1);

        mostrarCalendario();

    }

    if (vistaActual === "week") {

        fechaCalendario.setDate(fechaCalendario.getDate() + 7);

        mostrarSemana();

    }

    if (vistaActual === "day") {
        fechaCalendario.setDate(fechaCalendario.getDate() + 1)

        mostrarDia();
    }

});



mostrarCalendario();
loadCalendars();



//--------------------------------------------------------------------------------------------------------------------------------------------

//CERRAR MODAL DE INFO DE EVENTO

closeInfo.addEventListener("click", () => {

    eventInfoModal.classList.remove("show");

});


//BOTON DE EDITAR UN EVENTO YA CREADO

editEvent.addEventListener("click", () => {

    editandoEvento = true;

    eventInfoModal.classList.remove("show");

    eventFormTitle.textContent = "Editar evento";

    eventTitle.value =
        eventoSeleccionado.titulo || "";

    eventSubject.value =
        eventoSeleccionado.asignatura || "";
    
    eventColor.value =
        eventoSeleccionado.color || "#60A561";

    eventCalendar.value =
        eventoSeleccionado.calendario || "";

    eventDate.value =
        eventoSeleccionado.fecha || "";

    eventEndDate.value =
        eventoSeleccionado.fechaFin ||
        eventoSeleccionado.fecha ||
        "";

    eventTime.value =
        eventoSeleccionado.hora || "";

    eventEndTime.value =
        eventoSeleccionado.horaFin ||
        eventoSeleccionado.hora ||
        "";

    eventDescription.value =
        eventoSeleccionado.descripcion || "";

    eventRepeat.checked =
        eventoSeleccionado.repetir || false;

    eventShowInCalendar.checked =
        eventoSeleccionado.mostrarEnCalendario !== false;

    eventRepeatOptions.style.display =
        eventRepeat.checked ? "block" : "none";

    document
        .querySelectorAll(".event-repeat-day")
        .forEach(checkbox => {

            checkbox.checked =
                (eventoSeleccionado.diasRepeticion || [])
                    .includes(Number(checkbox.value));

        });

    eventModal.classList.add("show");


});


//BOTON DE ELIMINAR EVENTO

deleteEvent.addEventListener("click", async () => {

    if (!confirm("¿Quieres eliminar este evento?")) {
        return;
    }


    const { error } = await supabaseClient
        .from("events")
        .delete()
        .eq("id", eventoSeleccionado.id);


    if (error) {

        console.error("Error eliminando evento:", error);

        return;
    }


    // ELIMINARLO DE LA INFORMACIÓN QUE TENEMOS EN MEMORIA

    eventos = eventos.filter(
        evento => evento.id !== eventoSeleccionado.id
    );


    eventoSeleccionado = null;

    eventInfoModal.classList.remove("show");


    // ACTUALIZAR CALENDARIO

    if (vistaActual === "month") {
        mostrarCalendario();
    }

    if (vistaActual === "week") {
        mostrarSemana();
    }

    if (vistaActual === "day") {
        mostrarDia();
    }

});


//---------------------------------------------------------------------------------------------------------


//BOTÓN QUE LLEVA A HOY

const todayBtn = document.getElementById("todayBtn");

todayBtn.addEventListener("click", () => {

    fechaCalendario = new Date();

    if(vistaActual === "month") {
        mostrarCalendario();
    }

    if(vistaActual === "week") {
        mostrarSemana();
    }

    if(vistaActual === "day") {
        mostrarDia();
    }
})








