
//SISTEMA DE TAREAS-----------------------------------------------------------------------------------------------------------------------------------------------


let tasks = JSON.parse(localStorage.getItem("agendahub-tasks")) || [];

function saveTasks() {
    localStorage.setItem("agendahub-tasks", JSON.stringify(tasks));
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

function createTask(title, subject, date, time, description) {

    const task = {

        id: Date.now(),
        title: title,
        subject: subject,
        date: date,
        time,
        description: description,
        status: "pending"
    }

    tasks.push(task);

    saveTasks();
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


saveTaskButton.addEventListener("click", () => {

    const title = document.getElementById("taskTitle").value.trim();
    const subject = document.getElementById("taskSubject").value;
    const date = document.getElementById("taskDate").value;
    const time = document.getElementById("taskTime").value;
    const description = document.getElementById("taskDescription").value.trim();


    if (editingTask) {

        taskSelected.title = title;
        taskSelected.subject = subject;
        taskSelected.date = date;
        taskSelected.time = time;
        taskSelected.description = description;

        editingTask = false;

    } else {

        createTask(title, subject, date, time, description);

    }

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

            button.addEventListener("click", (event) => {

                event.stopPropagation();

                task.status = button.dataset.status;

                saveTasks();

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
                <button class="task-status-button">▼</button>
            </div>
        `;
        

        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
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
                <button class="task-status-button">▼</button>
            </div>
        `;

        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
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
    .sort((a, b) => a.time.localeCompare(b.time))
    .forEach(task => {

        const taskCard = document.createElement("div");

        taskCard.classList.add("task-card");
        
        const subject = getSubjectById(task.subject);

        if (subject) {
            taskCard.style.backgroundColor = subject.color;
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
                <button class="task-status-button">▼</button>
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
                <button class="task-status-button">▼</button>
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

deleteTask.addEventListener("click", () => {

    if (!confirm("¿Quieres eliminar esta tarea?")) {
        return;
    }

    tasks = tasks.filter(task => task !== taskSelected);

    saveTasks();

    taskInfoModal.classList.remove("show");

    renderTasks();
    renderTomorrowTasks();
    renderPendingTasks();
    updateTaskCounters();

});










renderTasks();
renderTomorrowTasks();
renderPendingTasks();
updateTaskCounters();
loadSubjectsIntoSelect("taskSubject");