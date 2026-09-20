
//SISTEMA DE TAREAS-----------------------------------------------------------------------------------------------------------------------------------------------


let tasks = [];

async function loadTasks() {

    const { data, error } = await supabaseClient
        .from("tasks")
        .select("*")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

    if (error) {
        console.error("Error cargando tareas:", error);
        return;
    }

    tasks = (data || []).map(task => ({
        id: task.id,
        title: task.title,
        subject: task.subject_id,
        date: task.date,
        time: task.time,
        description: task.description,
        status: task.status
    }));

    renderTasks();
    renderTomorrowTasks();
    renderPendingTasks();
    updateTaskCounters();
}


const taskModal = document.getElementById("taskModal");



function getSubjectById(subjectId) {

    return subjects.find(subject => subject.id == subjectId);

}


document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});




//ELEMENTOS DEL MODAL DE INFORMACIÓN DE TAREA

const taskInfoModal = document.getElementById("taskInfoModal");

const taskInfoTitle = document.getElementById("taskInfoTitle");
const taskInfoSubject = document.getElementById("taskInfoSubject");
const taskInfoDate = document.getElementById("taskInfoDate");
const taskInfoTime = document.getElementById("taskInfoTime");
const taskInfoStatus = document.getElementById("taskInfoStatus");
const taskInfoDescription = document.getElementById("taskInfoDescription");

const closeTaskInfo = document.getElementById("closeTaskInfo");
const editTask = document.getElementById("editTask");
const deleteTask = document.getElementById("deleteTask");

let taskSelected = null;
let editingTask = false;




//CREAR TAREAS-----------------------------------------------------------------------------------------------------------------------------------------------

async function createTask(title, subject, date, time, description) {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        console.error("No hay ningún usuario conectado.");
        return false;
    }

    const { data, error } = await supabaseClient
        .from("tasks")
        .insert({
            user_id: user.id,
            subject_id: subject || null,
            title: title,
            date: date,
            time: time || null,
            description: description || null,
            status: "pending"
        })
        .select()
        .single();

    if (error) {
        console.error("Error creando tarea:", error);
        return false;
    }

    tasks.push({
        id: data.id,
        title: data.title,
        subject: data.subject_id,
        date: data.date,
        time: data.time,
        description: data.description,
        status: data.status
    });

    return true;
}


//BOTON QUE ABRE MODAL PARA CREAR TAREAS-----------------------------------------

const newTaskButton = document.getElementById("newTask");

newTaskButton.addEventListener("click", () => {

    taskModal.classList.add("show");
})


//BOTON CERRAR MODAL DE CREAR TAREAS------------------------------------------------------------------

const cancelTaskButton = document.getElementById("cancelTask");

cancelTaskButton.addEventListener("click", () => {

    taskModal.classList.remove("show");

});



//BOTON DE GUARDAR TAREA NUEVA--------------------------------------

const saveTaskButton = document.getElementById("saveTask");


saveTaskButton.addEventListener("click", async () => {

    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("taskSubject").value;
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const description = document.getElementById("taskDescription").value.trim();


    if (editingTask) {

        const { data, error } = await supabaseClient
            .from("tasks")
            .update({
                title: title,
                subject_id: subject || null,
                date: date,
                time: time || null,
                description: description || null
            })
            .eq("id", taskSelected.id)
            .select()
            .single();

        if (error) {
            console.error("Error actualizando tarea:", error);
            return;
        }

        taskSelected.title = data.title;
        taskSelected.subject = data.subject_id;
        taskSelected.date = data.date;
        taskSelected.time = data.time;
        taskSelected.description = data.description;

        editingTask = false;

    } else {

        const created = await createTask(
            title,
            subject,
            date,
            time,
            description
        );

        if (!created) {
            return;
        }

    };
    

    renderTasks();
    renderTomorrowTasks();
    renderPendingTasks();
    updateTaskCounters();

    taskModal.classList.remove("show");


    taskModal.classList.remove("show");

    document.getElementById("taskTitle").value = "";
    document.getElementById("taskSubject").value = "";
    document.getElementById("taskDate").value = "";
    document.getElementById("taskTime").value = "";
    document.getElementById("taskDescription").value = "";
})



//CONTADORES DE TAREAS INICIO------------------------------------------------------------------------------------------------------------------------------------------------------------------------


function updateTaskCounters() {

    const totalTasks = document.getElementById("totalTasks");
    const tomorrowTasks = document.getElementById("tomorrowTasks");
    const completedTasks = document.getElementById("completedTasks");

    //TOTAL

    totalTasks.textContent = tasks.length;


    //MAÑANA

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() +1);

    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const tasksTomorrow = tasks.filter(task => { return task.date === tomorrowDate && task.status !== "done"});

    tomorrowTasks.textContent = tasksTomorrow.length;


    //COMPLETADAS

    const tasksCompleted = tasks.filter(task => { return task.status == "done"});

    completedTasks.textContent = tasksCompleted.length;
}













// MENU ESTADO DE TAREA----------------------------------------------------------------------------------------------------------------------------------------------------------------

function addStatusMenu(taskCard, task) {

    const statusButton = taskCard.querySelector(".task-status-button");

    statusButton.addEventListener("click", (event) => {

        event.stopPropagation();

        const existingMenu = taskCard.querySelector(".task-status-menu");

        if (existingMenu) {
            existingMenu.remove();
            return;
        }

        const statusMenu = document.createElement("div");

        statusMenu.classList.add("task-status-menu");

        statusMenu.innerHTML = `
            <button data-status="pending">Pendiente</button>
            <button data-status="progress">En progreso</button>
            <button data-status="done">Hecho</button>
        `;

        taskCard.appendChild(statusMenu);

        statusMenu.querySelectorAll("button").forEach(button => {

            button.addEventListener("click", async (event) => {

                event.stopPropagation();

                const newStatus = button.dataset.status;

                const { error } = await supabaseClient
                    .from("tasks")
                    .update({
                        status: newStatus
                    })
                    .eq("id", task.id);

                if (error) {
                    console.error("Error actualizando estado:", error);
                    return;
                }

                task.status = newStatus;

                renderTasks();
                renderTomorrowTasks();
                renderPendingTasks();
                updateTaskCounters();

            });

        });

    });

}

document.addEventListener("click", (event) => {

    const openMenu = document.querySelector(".task-status-menu");

    if (!openMenu) {
        return;
    }

    if (!openMenu.contains(event.target)) {
        openMenu.remove();
    }

});



//ORGANIZAR TAREAS SEGUN SU ESTADO--------------------------------------------------------

function renderTasks() {

    const pendingList = document.getElementById("pendingList");
    const progressList = document.getElementById("progressList");
    const doneList = document.getElementById("doneList");

    pendingList.innerHTML = "";
    progressList.innerHTML = "";
    doneList.innerHTML = "";

    const tareasOrdenadas = [...tasks].sort((a, b) => {
        return a.date.localeCompare(b.date);
    });

    const tareasHechas = tareasOrdenadas.filter(task => task.status === "done");
    const tareasVisibles = tareasOrdenadas.filter(task => task.status !== "done");

    tareasVisibles.forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.classList.add("task-card");

        taskCard.addEventListener("click", () => {
            openTaskInfo(task);
        });

        taskCard.innerHTML = `

            <div class="task-main">
                <h3>${task.title}</h3>
            </div>

            <div class="task-actions">
                <span class="task-date">${task.date.split("-").reverse().slice(0, 2).join("/")}</span>
                <button class="task-status-button">
                    <span class="icon icon-down" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6 9L12 15L18 9"></path>
                                </svg>
                            </span>
                </button>
            </div>
        `;
        

        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
        } else {
            taskCard.style.backgroundColor = "#F7F3E3";
        }

        addStatusMenu(taskCard, task);

        if (task.status === "pending") {
            pendingList.appendChild(taskCard);
        }

        if (task.status === "progress") {
            progressList.appendChild(taskCard);
        }

        if (task.status === "done") {
            doneList.appendChild(taskCard);
        }
    });


    const tareasHechasVisibles = tareasHechas.slice(-5);

    tareasHechasVisibles.forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.classList.add("task-card");

        taskCard.addEventListener("click", () => {
            openTaskInfo(task);
        });

        taskCard.innerHTML = `
            <div class="task-main">
                <h3>${task.title}</h3>
            </div>

            <div class="task-actions">
                <span class="task-date">${task.date.split("-").reverse().slice(0, 2).join("/")}</span>
                <button class="task-status-button">
                    <span class="icon icon-down" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6 9L12 15L18 9"></path>
                                </svg>
                            </span>
                </button>
            </div>
        `;

        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
        } else {
            taskCard.style.backgroundColor = "#F7F3E3";
        }

        addStatusMenu(taskCard, task);

        doneList.appendChild(taskCard);
    });

    if (tareasHechas.length > 5) {

        const more = document.createElement("div");

        more.classList.add("more-tasks");

        more.textContent = "...";

        doneList.appendChild(more);
    }
}


//ORGANIZAR TAREAS PARA MAÑANA--------------------------------------------------------

function renderTomorrowTasks() {

    const tomorrowList = document.getElementById("tomorrowList");

    tomorrowList.innerHTML = "";

    const tomorrow = new Date();

    tomorrow.setDate(tomorrow.getDate() + 1);

    const tomorrowDate = tomorrow.toISOString().split("T")[0];

    const tomorrowTasks = tasks.filter(task => {

        return task.date === tomorrowDate && task.status !== "done";

    });


    if (tomorrowTasks.length === 0) {

        tomorrowList.innerHTML = `
            <div class="empty-message">
                <p>No hay tareas para mañana.</p>
                <span>¡Buen trabajo! Puedes crear una nueva tarea cuando la necesites.</span>
            </div>
        `;

        return;
    }

    tomorrowTasks
    .sort((a, b) =>(a.time || "").localeCompare(b.time || ""))
    .forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.classList.add("task-card");
        
        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
        } else {
            taskCard.style.backgroundColor = "#F7F3E3";
        }

        taskCard.addEventListener("click", () => {
            openTaskInfo(task);
        });

        taskCard.innerHTML = `

            <div class="task-main">
                <h3>${task.title}</h3>
            </div>

            <div class="task-actions">
                <span class="task-date">${task.date.split("-").reverse().slice(0, 2).join("/")}</span>
                <button class="task-status-button">
                    <span class="icon icon-down" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6 9L12 15L18 9"></path>
                                </svg>
                            </span>
                </button>
            </div>
        `;

        addStatusMenu(taskCard, task);

        tomorrowList.appendChild(taskCard);

    });
}


//ORGANIZAR TAREAS PENDIENTES--------------------------------------------------------

function renderPendingTasks() {

    const pendingAllList = document.getElementById("pendingAllList");

    pendingAllList.innerHTML = "";

    const pendingTasks = tasks.filter(task => task.status !== "done");

    if (pendingTasks.length === 0) {

        pendingAllList.innerHTML = `
            <div class="empty-message">
                <p>¡No tienes ninguna tarea pendiente!</p>
            </div>
        `;

        return;
    }

    


    


    pendingTasks
    .sort((a, b) => a.date.localeCompare(b.date))
    .forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.classList.add("task-card");
        
        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
        } else {
            taskCard.style.backgroundColor = "#F7F3E3";
        }


        taskCard.addEventListener("click", () => {
            openTaskInfo(task);
        });

        taskCard.innerHTML = `

            <div class="task-main">
                <h3>${task.title}</h3>
            </div>

            <div class="task-actions">
                <span class="task-date">${task.date.split("-").reverse().slice(0, 2).join("/")}</span>
                <button class="task-status-button">
                    <span class="icon icon-down" aria-hidden="true">
                                <svg viewBox="0 0 24 24">
                                    <path d="M6 9L12 15L18 9"></path>
                                </svg>
                            </span>
                </button>
            </div>
        `;

        addStatusMenu(taskCard, task);

        pendingAllList.appendChild(taskCard);
    })

}






//MODAL INFO TAREA------------------------------------------------------------------------------------------------------------------------------------------------------------------------


//ABRIR MODAL DE INFO DE TAREA--------------------------------------------------------


function openTaskInfo(task) {

    taskSelected = task;

    const subject = getSubjectById(task.subject);

    taskInfoTitle.textContent = task.title;

    taskInfoSubject.textContent = subject ? subject.name : "Sin asignatura";

    taskInfoDate.textContent =
        task.date.split("-").reverse().slice(0, 2).join("/");

    taskInfoTime.textContent =
        task.time || "Sin hora";

    if (task.status === "pending") {
        taskInfoStatus.textContent = "Pendiente";
    }

    if (task.status === "progress") {
        taskInfoStatus.textContent = "En progreso";
    }

    if (task.status === "done") {
        taskInfoStatus.textContent = "Hecho";
    }

    taskInfoDescription.textContent =
        task.description || "Sin descripción";

    taskInfoModal.classList.add("show");
}



//CERRAR MODAL DE INFO DE TAREA--------------------------------------------------------

closeTaskInfo.addEventListener("click", () => {

    taskInfoModal.classList.remove("show");

});

taskInfoModal.addEventListener("click", (event) => {

    if (event.target === taskInfoModal) {
        taskInfoModal.classList.remove("show");
    }

});


//EDITAR TAREA CON BOTON EN INFO MODAL--------------------------------------------------------

editTask.addEventListener("click", () => {

    editingTask = true;

    taskInfoModal.classList.remove("show");

    document.getElementById("taskFormTitle").textContent = "Editar tarea";

    document.getElementById("taskTitle").value = taskSelected.title;

    document.getElementById("taskSubject").value = taskSelected.subject;

    document.getElementById("taskDate").value = taskSelected.date;

    document.getElementById("taskTime").value = taskSelected.time;

    document.getElementById("taskDescription").value = taskSelected.description;

    taskModal.classList.add("show");

});


//ELIMINAR TAREA CON BOTON EN INFO MODAL--------------------------------------------------------

deleteTask.addEventListener("click", async () => {

    if (!confirm("¿Quieres eliminar esta tarea?")) {
        return;
    }

    const { error } = await supabaseClient
        .from("tasks")
        .delete()
        .eq("id", taskSelected.id);

    if (error) {
        console.error("Error eliminando tarea:", error);
        return;
    }

    tasks = tasks.filter(task => task.id !== taskSelected.id);

    taskInfoModal.classList.remove("show");

    renderTasks();
    renderTomorrowTasks();
    renderPendingTasks();
    updateTaskCounters();

});










loadTasks();