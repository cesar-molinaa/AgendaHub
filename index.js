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
    
    .filter(event => 
        {const eventDate = new Date(event.fecha);
         eventDate.setHours(0,0,0,0);
         
         return eventDate >= today;
        })

    .sort((a, b) => {
            return new Date(a.fecha) - new Date(b.fecha);
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


    const pendingTasks = tasks

    .filter(task => task.status !== "done")
    .sort((a, b) => {
            return new Date(a.date) - new Date(b.date);
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