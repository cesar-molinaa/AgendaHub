



document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});



//BOTON AÑADIR EVENTO

const addEvent = document.getElementById("addEvent");
const eventModal = document.getElementById("eventModal");
const cancelEvent = document.getElementById("cancelEvent");

addEvent.addEventListener("click", () => {

    editandoEvento = false;

    eventoSeleccionado = null;

    eventFormTitle.textContent = "Nuevo evento";

    eventTitle.value = "";
    eventSubject.value = "";
    eventCalendar.value = "";
    eventDate.value = "";
    eventTime.value = "";
    eventDescription.value = "";

    eventModal.classList.add("show");

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
        .order("date", { ascending: true })
        .order("time", { ascending: true });

    if (error) {
        console.error("Error cargando eventos:", error);
        return;
    }

    eventos = (data || []).map(evento => ({
        id: evento.id,
        titulo: evento.title,
        asignatura: evento.subject_id,
        calendario: evento.calendar_id,
        fecha: evento.date,
        hora: evento.time,
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
const eventCalendar = document.getElementById("eventCalendar");
const eventDate = document.getElementById("eventDate");
const eventTime = document.getElementById("eventTime");
const eventDescription = document.getElementById("eventDescription");

const saveEvent = document.getElementById("saveEvent");
const calendar = document.getElementById("calendar");

const formError = document.getElementById("formError");



function getSubjectById(subjectId) {

    return subjects.find(subject => subject.id == subjectId);

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
    const descripcion = eventDescription.value.trim();

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
                date: fecha,
                time: hora || null,
                description: descripcion || null
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
        eventoSeleccionado.fecha = data.date;
        eventoSeleccionado.hora = data.time;
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
                date: fecha,
                time: hora || null,
                description: descripcion || null
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
            fecha: data.date,
            hora: data.time,
            descripcion: data.description
        });

    }


    // CERRAR MODAL

    eventModal.classList.remove("show");


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

            // ESTAMOS CREANDO UN EVENTO NUEVO
            editandoEvento = false;
            eventoSeleccionado = null;

            // LIMPIAR EL FORMULARIO
            eventTitle.value = "";
            eventSubject.value = "";
            eventTime.value = "";
            eventDescription.value = "";

            // PONER AUTOMÁTICAMENTE LA FECHA DEL DÍA
            fechaSeleccionada = fechaFormateada;
            eventDate.value = fechaSeleccionada;

            // LIMPIAR POSIBLE ERROR ANTERIOR
            formError.classList.remove("show");

            // ABRIR MODAL
            eventModal.classList.add("show");

        });


        //BUSCAR EVENTOS DE ESTE DÍA

        const eventosDelDia = eventos
        .filter(evento => evento.fecha === fechaFormateada)
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

            
            const subject = getSubjectById(evento.asignatura);

            if (subject) {
                eventElement.style.backgroundColor = subject.color;
            } else {
                eventElement.style.backgroundColor = "#FCB55F";
            }


            eventElement.addEventListener("click", (event) => {

                event.stopPropagation();

                eventoSeleccionado = evento;

                infoTitle.textContent = evento.titulo;

                const subject = getSubjectById(evento.asignatura);
                infoSubject.textContent = subject
                ? subject.name
                : "Sin asignatura";

                infoDate.textContent = evento.fecha;
                infoTime.textContent = evento.hora || "Sin hora";
                infoDescription.textContent =
                    evento.descripcion || "Sin descripción";

                eventInfoModal.classList.add("show");

            });

            eventInfoModal.addEventListener("click", (event) => {

                if (event.target === eventInfoModal) {
                    eventInfoModal.classList.remove("show");
                }

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
            <span>
                ${dia.getDate()}
            </span>
        `;


        // CLICK EN EL DÍA → CREAR EVENTO

        day.addEventListener("click", () => {

            editandoEvento = false;

            eventoSeleccionado = null;

            eventTitle.value = "";

            eventSubject.value = "";

            eventTime.value = "";

            eventDescription.value = "";

            fechaSeleccionada = fechaFormateada;

            eventDate.value = fechaSeleccionada;

            formError.classList.remove("show");

            eventModal.classList.add("show");

        });


        // BUSCAR EVENTOS DE ESTE DÍA

        const eventosDelDia = eventos
        .filter(evento => evento.fecha === fechaFormateada)
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

            
            const subject = getSubjectById(evento.asignatura);

            if (subject) {
                eventElement.style.backgroundColor = subject.color;
            } else {
                eventElement.style.backgroundColor = "#FCB55F";
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

                infoDate.textContent = evento.fecha;

                infoTime.textContent =
                    evento.hora || "Sin hora";

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

        editandoEvento = false;

        eventoSeleccionado = null;

        eventTitle.value = "";
        eventSubject.value = "";
        eventTime.value = "";
        eventDescription.value = "";

        fechaSeleccionada = fechaFormateada;
        eventDate.value = fechaSeleccionada;

        formError.classList.remove("show");

        eventModal.classList.add("show");

    });




    // BUSCAR LOS EVENTOS DE ESTE DÍA

    const eventosDelDia = eventos
    .filter(evento => evento.fecha === fechaFormateada)
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

        
        const subject = getSubjectById(evento.asignatura);

            if (subject) {
                eventElement.style.backgroundColor = subject.color;
            } else {
                eventElement.style.backgroundColor = "#FCB55F";
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

            infoDate.textContent = evento.fecha;

            infoTime.textContent =
                evento.hora || "Sin hora";

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

    eventTitle.value = eventoSeleccionado.titulo;
    eventSubject.value = eventoSeleccionado.asignatura;
    eventCalendar.value = eventoSeleccionado.calendario;
    eventDate.value = eventoSeleccionado.fecha;
    eventTime.value = eventoSeleccionado.hora;
    eventDescription.value = eventoSeleccionado.descripcion;

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








