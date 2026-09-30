//DATOS DE AGENDAHUB

let subjects = [];
let events = [];
let tasks = [];
let marks = [];

async function loadDashboardData() {

    const [
        subjectsResult,
        eventsResult,
        tasksResult,
        marksResult
    ] = await Promise.all([

        supabaseClient
            .from("subjects")
            .select("*")
            .order("created_at", { ascending: true }),

        supabaseClient
            .from("events")
            .select("*")
            .order("start_date", { ascending: true })
            .order("start_time", { ascending: true }),

        supabaseClient
            .from("tasks")
            .select("*")
            .order("date", { ascending: true })
            .order("time", { ascending: true }),

        supabaseClient
            .from("marks")
            .select("*")
            .order("date", { ascending: false })
    ]);

    if (subjectsResult.error) {
        console.error("Error cargando asignaturas:", subjectsResult.error);
        return;
    }

    if (eventsResult.error) {
        console.error("Error cargando eventos:", eventsResult.error);
        return;
    }

    if (tasksResult.error) {
        console.error("Error cargando tareas:", tasksResult.error);
        return;
    }

    if (marksResult.error) {
        console.error("Error cargando calificaciones:", marksResult.error);
        return;
    }

    subjects = subjectsResult.data || [];

    events = (eventsResult.data || []).map(event => ({
        id: event.id,
        titulo: event.title,
        asignatura: event.subject_id,
        calendario: event.calendar_id,
        fecha: event.start_date,
        hora: event.start_time,
        descripcion: event.description,
        color: event.color
    }));

    tasks = (tasksResult.data || []).map(task => ({
        id: task.id,
        title: task.title,
        subject: task.subject_id,
        date: task.date,
        time: task.time,
        description: task.description,
        status: task.status
    }));

    marks = (marksResult.data || []).map(mark => ({
        id: mark.id,
        title: mark.title,
        subject: mark.subject_id,
        value: Number(mark.value),
        date: mark.date
    }));

    renderUpcomingEvents();
    renderDashboardTasks();
    renderDashboardAverage();
    renderDashboardSubjects();
    renderCourseCountdown();
}


//BUSCAR ASIGNATURA

function getSubjectById(id) {

    return subjects.find(subject => subject.id == id)
}


//PRÓXIMOS EVENTOS

function renderUpcomingEvents() {

    const container = document.getElementById("upcomingEvents");

    container.innerHTML = "";

    const today = new Date();
    today.setHours(0,0,0,0);

    const upcomingEvents = events

        .filter(event => {

            const eventDateTime = new Date(
                `${event.fecha}T${event.hora || "00:00"}`
            );

            return eventDateTime >= new Date();

        })

    .sort((a, b) => {

        const fechaA = new Date(
            `${a.fecha}T${a.hora || "00:00"}`
        );

        const fechaB = new Date(
            `${b.fecha}T${b.hora || "00:00"}`
        );

        return fechaA - fechaB;

    })

    .slice(0, 5);


    if(upcomingEvents.length === 0) {

        container.innerHTML = `
        
            <p class="dashboard-empty">
                No tienes eventos próximos.
            </p>
        `;

        return;
    };

    upcomingEvents.forEach(event => {

        const subject = getSubjectById(event.asignatura);

        const subjectColor = event.color || (subject ? subject.color : "#FCB55F");


        const date = new Date(event.fecha + "T00:00:00");

        const formattedDate = date.toLocaleDateString("es-ES", {
            day: "2-digit",
            month: "2-digit"
        });

        const item = document.createElement("div");

        item.className = "dashboard-item";

        item.style.backgroundColor = subjectColor;
        item.style.color = obtenerColorTexto(subjectColor);

        item.innerHTML = `
        
            <div>
                <h4>${event.titulo}</h4>
            </div>

            <span class="dashboard-item-date">
                ${formattedDate}
            </span>
        `;

        container.appendChild(item);
    });
}


//TAREAS

function renderDashboardTasks() {

    const container = document.getElementById("dashboardTasks");

    container.innerHTML = "";


    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const pendingTasks = tasks
        .filter(task => {
            if (task.status === "done") {
                return false;
            }

            const taskDate = new Date(task.date + "T00:00:00");

            return taskDate >= today;
        })
        .sort((a, b) => {

            const dateA = new Date(a.date + "T00:00:00");
            const dateB = new Date(b.date + "T00:00:00");

            return dateA - dateB;

        })
        .slice(0, 5);


    if(pendingTasks.length === 0){

        container.innerHTML = `
        
            <p class="dashboard-empty">
                No tienes tareas pendientes.
            </p>
        `;

        return;
    }

    pendingTasks.forEach(task => {

        const subject = getSubjectById(task.subject);

        const subjectColor = subject ? subject.color : "#FCB55F";


        const date = new Date(task.date + "T00:00:00");

        const formattedDate = date.toLocaleDateString("es-ES", {

            day: "2-digit",
            month: "2-digit"
        });


        const item = document.createElement("div");

        item.className = "dashboard-item";

        item.style.backgroundColor = subjectColor;
        item.style.color = obtenerColorTexto(subjectColor);

        item.innerHTML = `

            <div>
                <h4>${task.title}</h4>
            </div>

            <span class="dashboard-item-date">
                ${formattedDate}
            </span>
        `;

        container.appendChild(item);

    })

    
}

//MEDIA GENERAL

function renderDashboardAverage() {

    const averageElement = document.getElementById("dashboardAverage");
    const progress = document.getElementById("dashboardAverageProgress");

    if(marks.length === 0) {

        averageElement.textContent = "-";
        progress.style.width = "0%";

        return;
    };

    const total = marks.reduce((sum,mark) => {
        return sum + Number(mark.value);
    }, 0);


    const average = total / marks.length;

    averageElement.textContent = average.toFixed(1).replace(".", ",");

    progress.style.width = `${average * 10}%`
}


//MEDIA DE CADA ASIGNATURA

function renderDashboardSubjects() {

    const container = document.getElementById("dashboardSubjects");

    container.innerHTML = "";

    subjects.forEach(subject => {

        const subjectMarks = marks.filter(mark => {
            return mark.subject == subject.id;
        });


        if(subjectMarks.length === 0) {
            return;
        };


        const total = subjectMarks.reduce((sum, mark) => { 
            return sum + Number(mark.value);
        }, 0);


        const average = total / subjectMarks.length;

        const item = document.createElement("div");

        item.className = "dashboard-subject";

        item.style.backgroundColor = subject.color;
        item.style.color = obtenerColorTexto(subjectColor);

        item.innerHTML = `
            <h4>${subject.name}</h4>
            <p>
                ${average.toFixed(1).replace(".", ",")}
            </p>
        `;


        container.appendChild(item);

    })
}




//CUENTA ATRÁS

async function renderCourseCountdown() {

    const countdown = document.getElementById("courseCountdown");
    if(!countdown) return;

    const { data: { user }, error } =
        await supabaseClient.auth.getUser();

    if (error || !user) return;

    const inicio = user.user_metadata?.course_start;
    const final = user.user_metadata?.course_end;


    if(!inicio || !final) {
        countdown.textContent = "--";
        return;
    }

    const hoy = new Date();
    const fechaFinal = new Date(final);

    const diferencia = fechaFinal - hoy;
    const dias = Math.ceil(diferencia / (1000* 60 * 60 * 24));

    if (dias > 0) {
        countdown.innerHTML = `
        
            <strong>${dias}</strong>
            <span>días</span>
        `;
    } else {
        countdown.textContent = "FIN :)"
    }
}

loadDashboardData();






























// HÁBITOS
let habits = [];
let habitCompletions = [];
let allHabitCompletions = [];
let dailyRatingValue = 0;
let dailyReviews = [];

let habitsChart = null;

let habitEditando = null;

let reviewYear = new Date().getFullYear();





function obtenerFechaHoy() {
    const hoy = new Date();

    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    const dia = String(hoy.getDate()).padStart(2, "0");

    return `${año}-${mes}-${dia}`;
}

let ultimaFecha = obtenerFechaHoy();

async function comprobarCambioDeDia() {

    const fechaHoy = obtenerFechaHoy();

    if (fechaHoy === ultimaFecha) {
        return;
    }

    ultimaFecha = fechaHoy;

    console.log("Ha comenzado un nuevo día.");

    dailyRatingValue = 0;
    actualizarEstrellas();

    await loadHabits();
    await loadDailyReview();
    await loadDashboardData();
}

setInterval(comprobarCambioDeDia, 30000);

document.addEventListener("visibilitychange", () => {

    if (document.visibilityState === "visible") {
        comprobarCambioDeDia();
    }

});

// CARGAR TODO EL HISTORIAL DE HÁBITOS Y VALORACIONES

async function loadHabitHistory() {

    const {
        data,
        error
    } = await supabaseClient
        .from("daily_reviews")
        .select("*")
        .order("date", { ascending: true });

    if (error) {

        console.error(
            "Error cargando historial de valoraciones:",
            error
        );

        return;
    }

    dailyReviews = data || [];
}


function renderDailyReviewsCalendar() {

    const container = document.getElementById(
        "reviewsCalendarMonths"
    );

    const yearElement = document.getElementById(
        "reviewYear"
    );

    if (!container || !yearElement) return;

    yearElement.textContent = reviewYear;

    container.innerHTML = "";

    const meses = [
        "ENE",
        "FEB",
        "MAR",
        "ABR",
        "MAY",
        "JUN",
        "JUL",
        "AGO",
        "SEP",
        "OCT",
        "NOV",
        "DIC"
    ];

    for (let month = 0; month < 12; month++) {

        const row = document.createElement("div");

        row.className = "review-month";

        const monthName = document.createElement("span");

        monthName.className = "review-month-name";

        monthName.textContent = meses[month];

        row.appendChild(monthName);


        const daysInMonth = new Date(
            reviewYear,
            month + 1,
            0
        ).getDate();


        for (let day = 1; day <= 31; day++) {

            const circle = document.createElement("button");

            circle.type = "button";

            circle.className = "review-day";


            if (day > daysInMonth) {

                circle.classList.add("empty");

                circle.disabled = true;

                row.appendChild(circle);

                continue;
            }


            const fecha = `${reviewYear}-${String(
                month + 1
            ).padStart(2, "0")}-${String(
                day
            ).padStart(2, "0")}`;


            const review = dailyReviews.find(
                item => item.date === fecha
            );


            if (review) {

                circle.classList.add(
                    `rating-${review.rating}`
                );

                circle.title =
                    `${day}/${month + 1}/${reviewYear} · ` +
                    `${review.rating}/5`;
            }


            circle.addEventListener("click", () => {

                mostrarDetalleValoracion(
                    fecha,
                    review
                );

            });


            row.appendChild(circle);
        }


        container.appendChild(row);
    }
}

function mostrarDetalleValoracion(fecha, review) {

    const container = document.getElementById(
        "reviewDetail"
    );

    if (!container) return;


    const [year, month, day] = fecha.split("-");


    if (!review) {

        container.innerHTML = `
            <p>
                <strong>${day}/${month}/${year}</strong>
                · Sin valoración
            </p>
        `;

        return;
    }


    container.innerHTML = `
        <p>
            <strong>${day}/${month}/${year}</strong>
            · ${review.rating}/5 ⭐
        </p>

        ${
            review.note
                ? `
                    <p class="review-detail-note">
                        ${review.note}
                    </p>
                `
                : `
                    <p class="review-detail-note">
                        No escribiste ninguna nota ese día.
                    </p>
                `
        }
    `;
}

document.getElementById("previousReviewYear")
    .addEventListener("click", () => {

        reviewYear--;

        renderDailyReviewsCalendar();
    });


document.getElementById("nextReviewYear")
    .addEventListener("click", () => {

        reviewYear++;

        renderDailyReviewsCalendar();
    });

document.getElementById("reviewYear")
    .addEventListener("click", () => {

        reviewYear = new Date().getFullYear();

        renderDailyReviewsCalendar();
    });





const addHabit = document.getElementById("addHabit");
const habitModal = document.getElementById("habitModal");
const cancelHabit = document.getElementById("cancelHabit");
const saveHabit = document.getElementById("saveHabit");

const habitName = document.getElementById("habitName");
const habitColor = document.getElementById("habitColor");

const habitFormError = document.getElementById("habitFormError");

const habitModalTitle = document.getElementById("habitModalTitle");
const deleteHabit = document.getElementById("deleteHabit");


const dailyRating = document.getElementById("dailyRating");
const dailyNote = document.getElementById("dailyNote");
const saveDailyReview = document.getElementById("saveDailyReview");

const ratingButtons =
    dailyRating.querySelectorAll("button");

const habitsChartDiv = document.querySelector(".habits-chart");

ratingButtons.forEach(button => {

    button.addEventListener("click", () => {

        dailyRatingValue =
            Number(button.dataset.rating);

        actualizarEstrellas();

    });

});


function actualizarEstrellas() {

    ratingButtons.forEach(button => {

        const rating =
            Number(button.dataset.rating);

        button.classList.toggle(
            "selected",
            rating <= dailyRatingValue
        );

    });

}

async function loadDailyReview() {

    const hoy = new Date();

    const año = hoy.getFullYear();

    const mes = String(
        hoy.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoy.getDate()
    ).padStart(2, "0");

    const fechaHoy =
        `${año}-${mes}-${dia}`;


    const {
        data,
        error
    } = await supabaseClient

        .from("daily_reviews")

        .select("*")

        .eq("date", fechaHoy)

        .maybeSingle();


    if (error) {

        console.error(
            "Error cargando valoración:",
            error
        );

        return;
    }


    if (!data) {

        dailyRatingValue = 0;

        dailyNote.value = "";

        actualizarEstrellas();

        return;
    }


    dailyRatingValue =
        data.rating || 0;

    dailyNote.value =
        data.note || "";

    actualizarEstrellas();

}

saveDailyReview.addEventListener(
    "click",
    async () => {

        if (dailyRatingValue === 0) {

            alert(
                "Selecciona una valoración"
            );

            return;
        }


        const hoy = new Date();

        const año =
            hoy.getFullYear();

        const mes =
            String(
                hoy.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                hoy.getDate()
            ).padStart(2, "0");

        const fechaHoy =
            `${año}-${mes}-${dia}`;


        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !user) {

            console.error(
                "No hay ningún usuario conectado."
            );

            return;
        }


        const {
            error
        } = await supabaseClient

            .from("daily_reviews")

            .upsert({

                user_id: user.id,

                date: fechaHoy,

                rating: dailyRatingValue,

                note:
                    dailyNote.value.trim() ||
                    null

            }, {

                onConflict: "user_id,date"

            });


        if (error) {

            console.error(
                "Error guardando valoración:",
                error
            );

            return;
        }


        console.log(
            "Valoración guardada correctamente."
        );

        await loadHabitHistory();

        renderDailyReviewsCalendar();

    }
);



// ABRIR MODAL
addHabit.addEventListener("click", () => {


    habitEditando = null;


    habitModalTitle.textContent = "Nuevo hábito";
    saveHabit.textContent = "Crear hábito";


    deleteHabit.style.display = "none";


    habitName.value = "";
    habitColor.value = "#60A561";

    document
        .querySelectorAll(".habit-days input[type='checkbox']")
        .forEach(checkbox => {
            checkbox.checked = false;
        });

    habitFormError.textContent = "";
    habitFormError.classList.remove("show");

    habitModal.classList.add("show");

    habitName.focus();
});


// CERRAR MODAL
cancelHabit.addEventListener("click", () => {

    habitModal.classList.remove("show");

    habitFormError.textContent = "";
    habitFormError.classList.remove("show");

});


// CARGAR HÁBITOS
async function loadHabits() {

    const { data, error } = await supabaseClient

        .from("habits")

        .select("*")

        .eq("active", true)

        .order("created_at", { ascending: true });


    if (error) {

        console.error(
            "Error cargando hábitos:",
            error
        );

        return;
    }


    habits = data || [];


    // FECHA DE HOY
    const fechaHoy = obtenerFechaHoy();


    // CARGAR COMPLETADOS DE HOY
    const {
        data: completados,
        error: completadosError
    } = await supabaseClient

        .from("habit_completions")

        .select("*")

        .eq("date", fechaHoy);


    if (completadosError) {

        console.error(
            "Error cargando hábitos completados:",
            completadosError
        );

        return;
    }


    habitCompletions =
        completados || [];

    const {
        data: historial,
        error: historialError
    } = await supabaseClient
        .from("habit_completions")
        .select("*")
        .order("date", { ascending: true });

    if (historialError) {
        console.error(
            "Error cargando historial de hábitos:",
            historialError
        );
        return;
    }

    allHabitCompletions =
        historial || [];

    renderDashboardHabits();
    renderHabitStats();
    renderHabitStreak();
    renderHabitChart();

}


// MOSTRAR LOS HÁBITOS DE HOY
function renderDashboardHabits() {

    const container =
        document.getElementById("dashboardHabits");

    if (!container) {
        return;
    }


    container.innerHTML = "";


    const hoy = new Date();

    let diaSemana = hoy.getDay();

    diaSemana =
        diaSemana === 0
            ? 6
            : diaSemana - 1;


    const habitsHoy = habits.filter(habit => {

        return habit.days.includes(diaSemana);

    });



    if (habitsHoy.length === 0) {

        container.innerHTML = `

            <p class="dashboard-empty">

                No tienes hábitos para hoy.

            </p>

        `;

        actualizarProgresoHabitos(0, 0);

        return;
    }


    const completadosIds =
        new Set(
            habitCompletions.map(
                completion => completion.habit_id
            )
        );


    habitsHoy.forEach(habit => {

        const completado =
            completadosIds.has(habit.id);

        const card =
            document.createElement("div");

        card.className = "habit-card";

        if (completado) {
            card.classList.add("completed");
        }

        card.style.backgroundColor =
            habit.color || "#60A561";

        card.innerHTML = `

            <span class="habit-name">
                ${habit.name}
            </span>

            <button class="habit-edit" type="button" aria-label="Editar hábito">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 20h9"/>
                    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
                </svg>
            </button>

            <span class="habit-check">
                ${completado ? `
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path d="m5 12 4 4L19 6"/>
                    </svg>
                ` : ""}
            </span>
        `;

        card.addEventListener("click", () => {
            toggleHabit(habit.id);
        });

        const editButton =
            card.querySelector(".habit-edit");

        editButton.addEventListener("click", (event) => {
            event.stopPropagation();
            abrirEditarHabit(habit);
        });

        container.appendChild(card);
    });


    const completadosHoy = habitsHoy.filter(habit =>
        completadosIds.has(habit.id)
    ).length;

    actualizarProgresoHabitos(
        habitsHoy.length,
        completadosHoy
    );

}



function abrirEditarHabit(habit) {

    habitEditando = habit;

    habitModalTitle.textContent = "Editar hábito";
    saveHabit.textContent = "Guardar cambios";

    deleteHabit.style.display = "block";


    habitName.value = habit.name;
    habitColor.value = habit.color || "#60A561";


    document
        .querySelectorAll(".habit-days input[type='checkbox']")
        .forEach(checkbox => {

            checkbox.checked =
                habit.days.includes(
                    Number(checkbox.value)
                );

        });


    habitFormError.textContent = "";
    habitFormError.classList.remove("show");

    habitModal.classList.add("show");

    habitName.focus();
}



async function toggleHabit(habitId) {

    const hoy = new Date();

    const año = hoy.getFullYear();

    const mes = String(
        hoy.getMonth() + 1
    ).padStart(2, "0");

    const dia = String(
        hoy.getDate()
    ).padStart(2, "0");

    const fechaHoy =
        `${año}-${mes}-${dia}`;


    const completion =
        habitCompletions.find(
            completion =>
                completion.habit_id === habitId
        );


    // DESMARCAR
    if (completion) {

        const { error } =
            await supabaseClient

                .from("habit_completions")

                .delete()

                .eq("id", completion.id);


        if (error) {

            console.error(
                "Error desmarcando hábito:",
                error
            );

            return;
        }

    }


    // MARCAR
    else {

        const {
            data: { user },
            error: userError
        } = await supabaseClient
            .auth
            .getUser();


        if (userError || !user) {

            console.error(
                "No hay ningún usuario conectado."
            );

            return;
        }


        const { error } =
            await supabaseClient

                .from("habit_completions")

                .insert({

                    user_id: user.id,

                    habit_id: habitId,

                    date: fechaHoy

                });


        if (error) {

            console.error(
                "Error marcando hábito:",
                error
            );

            return;
        }

    }


    // VOLVER A CARGAR
    // LOS COMPLETADOS
    await loadHabits();

}




// GUARDAR HÁBITO
saveHabit.addEventListener("click", async () => {

    const name =
        habitName.value.trim();

    const color =
        habitColor.value;

    const days = Array.from(
        document.querySelectorAll(
            ".habit-days input[type='checkbox']:checked"
        )
    ).map(checkbox =>
        Number(checkbox.value)
    );


    habitFormError.textContent = "";
    habitFormError.classList.remove("show");



    if (name === "") {

        habitFormError.textContent =
            "Introduce un nombre";

        habitFormError.classList.add("show");

        return;
    }



    if (days.length === 0) {

        habitFormError.textContent =
            "Selecciona al menos un día";

        habitFormError.classList.add("show");

        return;
    }



    if (habitEditando) {

        const { error } =
            await supabaseClient
                .from("habits")
                .update({

                    name: name,

                    color: color,

                    days: days

                })
                .eq("id", habitEditando.id);


        if (error) {

            console.error(
                "Error editando hábito:",
                error
            );

            return;
        }

    }



    else {

        const {
            data: { user },
            error: userError
        } = await supabaseClient.auth.getUser();


        if (userError || !user) {

            console.error(
                "No hay ningún usuario conectado."
            );

            return;
        }


        const { error } =
            await supabaseClient
                .from("habits")
                .insert({

                    user_id: user.id,

                    name: name,

                    color: color,

                    days: days,

                    active: true

                });


        if (error) {

            console.error(
                "Error creando hábito:",
                error
            );

            return;
        }

    }



    habitModal.classList.remove("show");
    habitEditando = null;


    await loadHabits();

});


deleteHabit.addEventListener("click", async () => {

    if (!habitEditando) {
        return;
    }

    const confirmar = confirm(
        `¿Quieres eliminar el hábito "${habitEditando.name}"?`
    );

    if (!confirmar) {
        return;
    }

    const habitId = habitEditando.id;

    const { error } = await supabaseClient
        .from("habits")
        .update({
            active: false
        })
        .eq("id", habitId);

    if (error) {
        console.error(
            "Error eliminando hábito:",
            error
        );
        return;
    }

    habits = habits.filter(
        habit => habit.id !== habitId
    );

    allHabitCompletions = allHabitCompletions.filter(
        completion =>
            completion.habit_id !== habitId
    );

    habitCompletions = habitCompletions.filter(
        completion =>
            completion.habit_id !== habitId
    );

    habitModal.classList.remove("show");
    habitEditando = null;

    renderDashboardHabits();
    renderHabitStats();
    renderHabitStreak();
    renderHabitChart();

    await loadHabits();
});


function actualizarProgresoHabitos(
    total,
    completados
) {

    const completedElement =
        document.getElementById(
            "habitsCompleted"
        );

    const progress =
        document.getElementById(
            "habitProgressFill"
        );


    if (!completedElement || !progress) {
        return;
    }


    completedElement.textContent =
        `${completados} / ${total}`;


    const porcentaje =
        total === 0
            ? 0
            : (completados / total) * 100;


    progress.style.width =
        `${porcentaje}%`;

}



function renderHabitStats() {

    const habitosActivosIds = new Set(
        habits.map(habit => habit.id)
    );

    const completionsActivos = allHabitCompletions.filter(completion =>
        habitosActivosIds.has(completion.habit_id)
    );


    const container =
        document.getElementById("habitStats");

    if (!container) {
        return;
    }

    container.innerHTML = "";

    if (habits.length === 0) {

        container.innerHTML = `
            <div class="empty-message">
                <p>No tienes ningún hábito creado todavía.</p>
            </div>
        `;

        habitsChartDiv.style.display = "none";



        return;
    }

    habitsChartDiv.style.display = "block";

    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);


    habits.forEach(habit => {

        let diasProgramados = 0;
        let diasCompletados = 0;


        // MIRAR LOS ÚLTIMOS 30 DÍAS
        for (let i = 29; i >= 0; i--) {

            const fecha = new Date(hoy);

            fecha.setDate(
                hoy.getDate() - i
            );


            let diaSemana =
                fecha.getDay();

            diaSemana =
                diaSemana === 0
                    ? 6
                    : diaSemana - 1;


            // ESTE HÁBITO ESTÁ PROGRAMADO ESTE DÍA
            if (
                habit.days.includes(
                    diaSemana
                )
            ) {

                diasProgramados++;


                const año =
                    fecha.getFullYear();

                const mes =
                    String(
                        fecha.getMonth() + 1
                    ).padStart(2, "0");

                const dia =
                    String(
                        fecha.getDate()
                    ).padStart(2, "0");

                const fechaFormateada =
                    `${año}-${mes}-${dia}`;


                const completado =
                    completionsActivos.some(
                        completion =>

                            completion.habit_id ===
                                habit.id &&

                            completion.date ===
                                fechaFormateada
                    );


                if (completado) {
                    diasCompletados++;
                }

            }

        }


        const porcentaje =
            diasProgramados === 0
                ? 0
                : (diasCompletados / diasProgramados) * 100;


        const item =
            document.createElement("div");

        item.className =
            "habit-stat";


        item.innerHTML = `

            <div class="habit-stat-header">

                <span>
                    ${habit.name}
                </span>

                <strong>
                    ${Math.round(porcentaje)}%
                </strong>

            </div>

            <div class="habit-stat-progress">

                <div
                    class="habit-stat-progress-fill"
                    style="width: ${porcentaje}%; background-color: ${habit.color || "#60A561"};">
                </div>

            </div>

        `;


        container.appendChild(item);

    });

}


function renderHabitChart() {

    const canvas = document.getElementById("habitsChart");

    if (!canvas) {
        return;
    }

    if (habitsChart) {
        habitsChart.destroy();
    }

    if (habits.length === 0) {
        return;
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const labels = [];
    const fechas = [];

    // ÚLTIMOS 30 DÍAS
    for (let i = 29; i >= 0; i--) {

        const fecha = new Date(hoy);

        fecha.setDate(
            hoy.getDate() - i
        );

        const año = fecha.getFullYear();

        const mes = String(
            fecha.getMonth() + 1
        ).padStart(2, "0");

        const dia = String(
            fecha.getDate()
        ).padStart(2, "0");

        const fechaFormateada =
            `${año}-${mes}-${dia}`;

        fechas.push(fechaFormateada);

        labels.push(
            fecha.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit"
            })
        );
    }
    const datasets = habits.map(habit => {

        const datos = fechas.map(fechaFormateada => {

            const fecha = new Date(
                fechaFormateada + "T00:00:00"
            );

            let diaSemana = fecha.getDay();

            diaSemana =
                diaSemana === 0
                    ? 6
                    : diaSemana - 1;

            if (!habit.days.includes(diaSemana)) {
                return null;
            }

            const completado =
                allHabitCompletions.some(completion =>
                    completion.habit_id === habit.id &&
                    completion.date === fechaFormateada
                );

            return completado ? 100 : 0;
        });

        return {
            label: habit.name,

            data: datos,

            borderColor:
                habit.color || "#60A561",

            backgroundColor:
                habit.color || "#60A561",

            borderWidth: 3,

            pointBackgroundColor:
                habit.color || "#60A561",

            pointBorderColor:
                "#191923",

            pointBorderWidth: 2,

            pointRadius: 4,

            pointHoverRadius: 6,

            tension: 0.35,

            fill: false,

            spanGaps: false
        };
    });

    habitsChart = new Chart(canvas, {

        type: "line",

        data: {
            labels: labels,
            datasets: datasets
        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            interaction: {
                mode: "index",
                intersect: false
            },

            scales: {

                y: {
                        min: 0,
                        max: 110,

                        ticks: {
                            stepSize: 20,

                            callback: function(value) {

                                if (value > 100) {
                                    return "";
                                }

                                return value + "%";
                            }
                        }
                    }

            },

            plugins: {

                legend: {
                    display: true
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {

                            if (context.raw === null) {
                                return context.dataset.label;
                            }

                            return `${context.dataset.label}: ${context.raw}%`;
                        }
                    }
                }

            }
        }

    });
}



function renderHabitStreak() {

    const habitosActivosIds = new Set(
        habits.map(habit => habit.id)
    );

    const completionsActivos =
        allHabitCompletions.filter(completion =>
            habitosActivosIds.has(completion.habit_id)
        );

    const streakElement =
        document.getElementById("habitStreak");

    if (!streakElement) {
        return;
    }


    if (habits.length === 0) {

        streakElement.textContent =
            "0 días";

        return;
    }


    const hoy = new Date();

    hoy.setHours(0, 0, 0, 0);


    let racha = 0;


    // MIRAR HACIA ATRÁS DESDE HOY
    for (let i = 0; ; i++) {

        const fecha = new Date(hoy);

        fecha.setDate(
            hoy.getDate() - i
        );


        let diaSemana =
            fecha.getDay();

        diaSemana =
            diaSemana === 0
                ? 6
                : diaSemana - 1;


        // HÁBITOS QUE TOCABAN ESE DÍA
        const habitsDelDia =
            habits.filter(habit =>
                habit.days.includes(diaSemana)
            );


        // SI NO HABÍA HÁBITOS PROGRAMADOS,
        // ESE DÍA NO ROMPE LA RACHA
        if (habitsDelDia.length === 0) {
            continue;
        }


        const año =
            fecha.getFullYear();

        const mes =
            String(
                fecha.getMonth() + 1
            ).padStart(2, "0");

        const dia =
            String(
                fecha.getDate()
            ).padStart(2, "0");


        const fechaFormateada =
            `${año}-${mes}-${dia}`;


        // COMPROBAR SI AL MENOS UNO
        // FUE COMPLETADO
        const hayCompletado =
            completionsActivos.some(
                completion =>

                    completion.date ===
                        fechaFormateada &&

                    habitsDelDia.some(
                        habit =>
                            habit.id ===
                            completion.habit_id
                    )
            );


        if (!hayCompletado) {
            break;
        }


        racha++;

    }


    streakElement.textContent =
        `${racha} ${racha === 1 ? "día" : "días"}`;

}






loadHabits();
loadDailyReview();
loadHabitHistory().then(() => {
    renderDailyReviewsCalendar();
});