//SISTEMA DE ASIGNATURAS

let subjects = [];

async function loadSubjects() {

    const { data, error } = await supabaseClient
        .from("subjects")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error cargando asignaturas:", error);
        return;
    }

    subjects = data || [];

    renderSubjects();

    loadSubjectsIntoSelect("taskSubject");
    loadSubjectsIntoSelect("examSubject");
    loadSubjectsIntoSelect("eventSubject");
    loadSubjectsIntoSelect("markSubject");
}


//SUBIR IMÁGENES A CLOUDINARY

async function uploadImageToCloudinary(file) {

    const formData = new FormData();

    formData.append("file", file);
    formData.append("upload_preset", "agendahub_subjects");

    const response = await fetch(
        "https://api.cloudinary.com/v1_1/xaoiq5an/image/upload",
        {
            method: "POST",
            body: formData
        }
    );

    if (!response.ok) {
        throw new Error("No se pudo subir la imagen");
    }

    const data = await response.json();

    return data.secure_url;
}

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});





//CREAR NUEVA ASIGNATURA----------------------------------------------------------------------------------------------------------------------------------------

async function createSubject(name, color) {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) {
        console.error("No hay ningún usuario conectado.");
        return false;
    }

    const { data, error } = await supabaseClient
        .from("subjects")
        .insert({
            user_id: user.id,
            name: name,
            color: color,
            teacher: "",
            classroom: "",
            background: "",
            description: ""
        })
        .select()
        .single();

    if (error) {
        console.error("Error creando asignatura:", error);
        return false;
    }

    subjects.push(data);

    renderSubjects();

    return true;
}



const newSubjectButton = document.getElementById("newSubject");

const subjectModal = document.getElementById("subjectModal");

const cancelSubjectButton = document.getElementById("cancelSubject");

const saveSubjectButton = document.getElementById("saveSubject");


// ESTOS ELEMENTOS SOLO EXISTEN EN subjects.html

if (newSubjectButton) {

    newSubjectButton.addEventListener("click", () => {
        subjectModal.classList.add("show");
    });

}


if (cancelSubjectButton) {

    cancelSubjectButton.addEventListener("click", () => {
        subjectModal.classList.remove("show");
    });

}


if (saveSubjectButton) {

    saveSubjectButton.addEventListener("click", async () => {

        const name = document.getElementById("newSubjectName").value.trim();

        const color = document.getElementById("newSubjectColor").value;

        if (!name) {
            return;
        }

        const created = await createSubject(name, color);

        if (!created) {
            return;
        }

        subjectModal.classList.remove("show");

        document.getElementById("newSubjectName").value = "";

    });

}






//ACTUALIZAR FEED DE ASIGNATURAS---------------------------------------------------------------------------------------------------------------------------------------------------------

function renderSubjects() {
    
    const subjectsFeed = document.getElementById("subjectsFeed");

    if (!subjectsFeed) {
        return;
    }

    subjectsFeed.innerHTML = "";


    if (subjects.length === 0) {

        subjectsFeed.innerHTML = `
            <div class="empty-message">
                <p>Aún no tienes asignaturas.</p>
                <span>¡Crea tu primera asignatura para empezar a organizar tu curso!</span>
            </div>
        `;

        return;
    }

    subjects.forEach(subject => {

        const subjectCard = document.createElement("div");

        subjectCard.classList.add("subject-card");

        if (subject.background) {

            subjectCard.style.backgroundImage = `url("${subject.background}")`;
            subjectCard.style.backgroundSize = "cover";
            subjectCard.style.backgroundPosition = "center";

        } else {

            subjectCard.style.backgroundColor = subject.color;

        }

        subjectCard.innerHTML = `
        
            <h2>${subject.name}</h2>

        `;

        subjectCard.addEventListener("click", () => {
            openSubject(subject);
        });

        subjectsFeed.appendChild(subjectCard);
    })
};




//ACTUALIZAR ASIGNATURAS EN TODOS LOS SELECT-----------------------------------------------------------------------------------------------------------------------------------------------------

function loadSubjectsIntoSelect(selectId) {

    const select = document.getElementById(selectId);

    if(!select) {
        return;
    }

    select.innerHTML = `
    
    <option value="">Sin asignatura</option>

    `;

    subjects.forEach(subject => {

        const option = document.createElement("option");

        option.value = subject.id;

        option.textContent = subject.name;

        select.appendChild(option);
    })
}




//PESTAÑA DE ASIGNATURA-------------------------------------------------------------------------------------------------------------------------------------------------------------------

//ABRIR ASIGNATURA ADECUADA AL HACER CLICK----------------------------------------------------------------------

let currentSubject = null;


function openSubject(subject) {

    currentSubject = subject;

    const subjectsFeed = document.getElementById("subjectsFeed");
    const subjectPage = document.getElementById("subjectPage");
    const subjectName = document.getElementById("subjectName");

    subjectsFeed.style.display = "none";
    subjectPage.style.display = "block";

    subjectName.textContent = subject.name;

    const infoItems = document.querySelectorAll(".subject-info-item");

    infoItems.forEach(item => {

        const field = item.dataset.field;
        const value = item.querySelector(".subject-info-value");

        value.innerHTML = "";

        if (field === "classroom" && subject[field]) {

            const link = document.createElement("a");

            link.href = subject[field];
            link.textContent = "Abrir sitio web ↗";
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            value.appendChild(link);

        }else if(field === "color" && subject[field]) {

            const colorPreview = document.createElement("span");

            colorPreview.classList.add("color-preview");

            colorPreview.style.backgroundColor = subject[field];

            const colorText = document.createElement("span");

            colorText.textContent = subject[field];

            value.appendChild(colorPreview);

            value.appendChild(colorText);

        } else {

            value.textContent = subject[field] || "Sin información";

        }
    });


    renderSubjectContent();

}


// EDITAR NOMBRE DE LA ASIGNATURA

const editSubjectNameButton = document.getElementById("editSubjectName");

if (editSubjectNameButton) {

    editSubjectNameButton.addEventListener("click", async () => {

    
        const editButton = document.getElementById("editSubjectName");
    const subjectName = document.getElementById("subjectName");

    // GUARDAR NOMBRE
    if (subjectName.tagName === "INPUT") {

        const newName = subjectName.value.trim();

        // NO PERMITIR NOMBRE VACÍO
        if (!newName) {
            subjectName.focus();
            return;
        }

        const { error } = await supabaseClient
            .from("subjects")
            .update({
                name: newName
            })
            .eq("id", currentSubject.id);

        if (error) {
            console.error("Error actualizando nombre:", error);
            return;
        }

        currentSubject.name = newName;

        // CREAR DE NUEVO EL H2
        const newSubjectName = document.createElement("h2");

        newSubjectName.id = "subjectName";
        newSubjectName.textContent = newName;

        // CAMBIAR INPUT POR H2
        subjectName.replaceWith(newSubjectName);

        // CAMBIAR BOTÓN
        editButton.textContent = "✎";

        // ACTUALIZAR TARJETAS
        renderSubjects();

        return;
    }


    // EMPEZAR A EDITAR
    const input = document.createElement("input");

    input.id = "subjectName";
    input.type = "text";
    input.value = currentSubject.name;

    input.classList.add("subject-name-input");

    // CAMBIAR H2 POR INPUT
    subjectName.replaceWith(input);

    // CAMBIAR BOTÓN
    editButton.textContent = "✓";

    // ENFOCAR INPUT
    input.focus();

    // SELECCIONAR TODO
    input.select();


    });

}




// ELIMINAR ASIGNATURA

const deleteSubjectButton = document.getElementById("deleteSubject");

if (deleteSubjectButton) {

    deleteSubjectButton.addEventListener("click", async () => {

        if (!currentSubject) {
        return;
    }

    const confirmDelete = confirm(
        `¿Seguro que quieres eliminar la asignatura "${currentSubject.name}"?`
    );

    if (!confirmDelete) {
        return;
    }

    const subjectId = currentSubject.id;


    // ELIMINAR ASIGNATURA
    const { error } = await supabaseClient
            .from("subjects")
            .delete()
            .eq("id", currentSubject.id);

        if (error) {
            console.error("Error eliminando asignatura:", error);
            return;
        }

        subjects = subjects.filter(
            subject => subject.id !== currentSubject.id
        );


    // ELIMINAR TAREAS DE ESA ASIGNATURA
    let tasks = JSON.parse(localStorage.getItem("agendahub-tasks")) || [];

    tasks = tasks.filter(task => task.subject != subjectId);

    localStorage.setItem(
        "agendahub-tasks",
        JSON.stringify(tasks)
    );


    // ELIMINAR CALIFICACIONES DE ESA ASIGNATURA
    let marks = JSON.parse(localStorage.getItem("agendahub-marks")) || [];

    marks = marks.filter(mark => mark.subject != subjectId);

    localStorage.setItem(
        "agendahub-marks",
        JSON.stringify(marks)
    );


    // ELIMINAR EVENTOS DE ESA ASIGNATURA
    let events = JSON.parse(localStorage.getItem("eventos")) || [];

    events = events.filter(event => event.asignatura != subjectId);

    localStorage.setItem(
        "eventos",
        JSON.stringify(events)
    );


    // REINICIAR ASIGNATURA ACTUAL
    currentSubject = null;


    // CERRAR LA PÁGINA DE LA ASIGNATURA
    document.getElementById("subjectPage").style.display = "none";
    document.getElementById("subjectsFeed").style.display = "grid";


    // ACTUALIZAR TARJETAS
    renderSubjects();


    // ACTUALIZAR SELECTS
    loadSubjectsIntoSelect("taskSubject");
    loadSubjectsIntoSelect("examSubject");

    });

};




//BOTON PARA CERRAR ASIGNATURA----------------------------------------------------------------------

const closeSubjectButton = document.getElementById("closeSubject");

if (closeSubjectButton) {

    closeSubjectButton.addEventListener("click", () => {

        document.getElementById("subjectPage").style.display = "none";
        document.getElementById("subjectsFeed").style.display = "grid";

    });

}



// EDITAR INFO DE ASIGNATURA

document.querySelectorAll(".edit-field").forEach(button => {

    button.addEventListener("click", async () => {

        const item = button.closest(".subject-info-item");
        const field = item.dataset.field;
        const value = item.querySelector(".subject-info-value");


        // =====================================================
        // EDITAR
        // =====================================================

        if (!item.classList.contains("editing")) {

            let input;


            // PORTADA
            if (field === "background") {

                // CONTENEDOR DEL INPUT Y BOTÓN
                const controls = document.createElement("div");

                controls.classList.add("background-controls");


                // INPUT
                input = document.createElement("input");

                input.type = "file";
                input.accept = "image/*";

                input.classList.add("inline-edit");


                // BOTÓN ELIMINAR
                const deleteButton = document.createElement("button");

                deleteButton.type = "button";
                deleteButton.textContent = "Eliminar";

                deleteButton.classList.add("delete-background");


                // METER INPUT + BOTÓN EN EL CONTENEDOR
                controls.appendChild(input);
                controls.appendChild(deleteButton);


                // SUSTITUIR EL TEXTO POR EL CONTENEDOR
                value.replaceWith(controls);


                // BOTÓN ELIMINAR
                deleteButton.addEventListener("click", async () => {

                    const { error } = await supabaseClient
                        .from("subjects")
                        .update({
                            background: ""
                        })
                        .eq("id", currentSubject.id);

                    if (error) {
                        console.error("Error eliminando portada:", error);
                        return;
                    }

                    currentSubject.background = "";


                    // CREAR DE NUEVO EL TEXTO
                    const newValue = document.createElement("span");

                    newValue.classList.add("subject-info-value");

                    newValue.textContent = "Sin información";


                    controls.replaceWith(newValue);


                    item.classList.remove("editing");

                    button.textContent = "✎";


                    // ACTUALIZAR TARJETA
                    renderSubjects();

                });


                item.classList.add("editing");

                button.textContent = "✓";

                input.focus();


                // MUY IMPORTANTE:
                // Evita que el código de abajo vuelva a reemplazar
                // el input y saque el input del contenedor.
                return;

            }


            // DESCRIPCIÓN
            else if (field === "description") {

                input = document.createElement("textarea");

                input.value = currentSubject[field] || "";

            }


            // COLOR
            else if (field === "color") {

                input = document.createElement("input");

                input.type = "color";

                input.value = currentSubject[field] || "#FCB55F";

            }


            // RESTO
            else {

                input = document.createElement("input");

                input.value = currentSubject[field] || "";

            }


            input.classList.add("inline-edit");

            value.replaceWith(input);

            item.classList.add("editing");

            button.textContent = "✓";

            input.focus();

        }


        // =====================================================
        // GUARDAR
        // =====================================================

        else {

            const input = item.querySelector(".inline-edit");


            // =================================================
            // PORTADA
            // =================================================

            if (field === "background") {

                const file = input.files[0];


                // NO SE HA ELEGIDO NINGÚN ARCHIVO
                if (!file) {

                    const newValue = document.createElement("span");

                    newValue.classList.add("subject-info-value");

                    newValue.textContent = currentSubject.background
                        ? "Portada actual"
                        : "Sin información";


                    const controls = item.querySelector(".background-controls");

                    if(controls){
                        controls.replaceWith(newValue);
                    };


                    item.classList.remove("editing");

                    button.textContent = "✎";

                    return;

                }


                // SUBIR IMAGEN
                button.textContent = "↑";

                try {

                    const imageUrl = await uploadImageToCloudinary(file);


                    // GUARDAR PORTADA
                    const { error } = await supabaseClient
                        .from("subjects")
                        .update({
                            background: imageUrl
                        })
                        .eq("id", currentSubject.id);

                    if (error) {
                        console.error("Error guardando portada:", error);
                        return;
                    }

                    currentSubject.background = imageUrl;


                    // MOSTRAR NOMBRE DEL ARCHIVO
                    const newValue = document.createElement("span");

                    newValue.classList.add("subject-info-value");

                    newValue.textContent = file.name;


                    const controls = item.querySelector(".background-controls");

                    if (controls) {

                        controls.replaceWith(newValue);

                    }


                    item.classList.remove("editing");

                    button.textContent = "✎";


                    // ACTUALIZAR TARJETAS
                    renderSubjects();

                } catch (error) {

                    console.error(error);

                    alert("No se ha podido subir la imagen.");

                    button.textContent = "✓";

                }

            }


            // =================================================
            // RESTO DE CAMPOS
            // =================================================

            else {

                const newValueText = input.value.trim();

                const { error } = await supabaseClient
                    .from("subjects")
                    .update({
                        [field]: newValueText
                    })
                    .eq("id", currentSubject.id);

                if (error) {
                    console.error("Error actualizando asignatura:", error);
                    return;
                }

                currentSubject[field] = newValueText;


                const newValue = document.createElement("span");

                newValue.classList.add("subject-info-value");


                // SITIO WEB
                if (field === "classroom" && currentSubject[field]) {

                    const link = document.createElement("a");

                    link.href = currentSubject[field];

                    link.textContent = "Abrir sitio web ↗";

                    link.target = "_blank";

                    link.rel = "noopener noreferrer";

                    newValue.appendChild(link);

                }


                // COLOR
                else if (field === "color" && currentSubject[field]) {

                    const colorPreview = document.createElement("span");

                    colorPreview.classList.add("color-preview");

                    colorPreview.style.backgroundColor = currentSubject[field];


                    const colorText = document.createElement("span");

                    colorText.textContent = currentSubject[field];


                    newValue.appendChild(colorPreview);

                    newValue.appendChild(colorText);

                }


                // RESTO
                else {

                    newValue.textContent =
                        currentSubject[field] || "Sin información";

                }


                input.replaceWith(newValue);

                item.classList.remove("editing");

                button.textContent = "✎";


                // ACTUALIZAR TARJETAS
                renderSubjects();

            }

        }

    });

});




//MOSTRAR EVENTOS, TAREAS Y CALIFICACIONES DE LA ASIGNATURA---------------------------------------------------------------------------------------------------------------------------------



async function renderSubjectContent() {

    if (!currentSubject) {
        return;
    }

    const subjectEvents = document.getElementById("subjectEvents");
    const subjectTasks = document.getElementById("subjectTasks");
    const subjectMarks = document.getElementById("subjectMarks");

    // LIMPIAR

    subjectEvents.innerHTML = "";
    subjectTasks.innerHTML = "";
    subjectMarks.innerHTML = "";


    // EVENTOS

    const { data: events, error: eventsError } = await supabaseClient
        .from("events")
        .select("*")
        .eq("subject_id", currentSubject.id)
        .order("date", { ascending: true });

    if (eventsError) {
        console.error("Error cargando eventos de la asignatura:", eventsError);
        return;
    }


    if (!events || events.length === 0) {

        subjectEvents.innerHTML = `
            <p class="empty-subject-content">
                Ningún evento a la vista.
            </p>
        `;

    } else {

        events.forEach(evento => {

            const eventCard = document.createElement("div");

            eventCard.classList.add("subject-event-card");

            eventCard.innerHTML = `
                <div>
                    <h3>${evento.title}</h3>
                </div>

                <span>
                    ${evento.date.split("-").reverse().join("/")}
                </span>
            `;

            subjectEvents.appendChild(eventCard);

        });

    }


    // TAREAS

    const { data: tasks, error: tasksError } = await supabaseClient
        .from("tasks")
        .select("*")
        .eq("subject_id", currentSubject.id)
        .order("date", { ascending: true });

    if (tasksError) {
        console.error("Error cargando tareas de la asignatura:", tasksError);
        return;
    }


    if (!tasks || tasks.length === 0) {

        subjectTasks.innerHTML = `
            <p class="empty-subject-content">
                Yuju! no tienes tareas
            </p>
        `;

    } else {

        tasks.forEach(task => {

            const taskCard = document.createElement("div");

            taskCard.classList.add("subject-task-card");

            let statusText = "Pendiente";

            if (task.status === "progress") {
                statusText = "En progreso";
            }

            if (task.status === "done") {
                statusText = "Hecho";
            }

            taskCard.innerHTML = `
                <div>
                    <h3>${task.title}</h3>
                    <span>${task.date.split("-").reverse().join("/")}</span>
                </div>

                <span>${statusText}</span>
            `;

            subjectTasks.appendChild(taskCard);

        });

    }


    // CALIFICACIONES

    const { data: marks, error: marksError } = await supabaseClient
        .from("marks")
        .select("*")
        .eq("subject_id", currentSubject.id)
        .order("date", { ascending: true });

    if (marksError) {
        console.error("Error cargando calificaciones de la asignatura:", marksError);
        return;
    }


    if (!marks || marks.length === 0) {

        subjectMarks.innerHTML = `
            <p class="empty-subject-content">
                Vaya! Parece que no tienes calificaciones aún.
            </p>
        `;

    } else {

        marks.forEach(mark => {

            const markCard = document.createElement("div");

            markCard.classList.add("subject-mark-card");

            markCard.innerHTML = `
                <div>
                    <h3>${mark.title}</h3>
                    <span>${mark.date.split("-").reverse().join("/")}</span>
                </div>

                <strong>${mark.value}</strong>
            `;

            subjectMarks.appendChild(markCard);

        });

    }

};

























loadSubjects();