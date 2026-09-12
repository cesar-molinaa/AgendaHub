//DATOS DE AGENDAHUB

let subjects = JSON.parse(localStorage.getItem("agendahub-subjects")) || [];
let events = JSON.parse(localStorage.getItem("eventos")) || [];
let tasks = JSON.parse(localStorage.getItem("agendahub-tasks")) || [];
let marks = JSON.parse(localStorage.getItem("agendahub-marks")) || [];




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

        const subjectColor = subject ? subject.color : "#FCB55F";

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






renderUpcomingEvents();
renderDashboardTasks();
renderDashboardAverage();
renderDashboardSubjects();