let marks = JSON.parse(localStorage.getItem("agendahub-marks")) || [];

function saveMarks() {
    localStorage.setItem("agendahub-marks", JSON.stringify(marks));
}

let selectedSubject = null;



//BOTON ABRIR MODAL PARA CREAR NOTA NUEVA----------------------------------------------------------------------------------------------------------------------------------------------

const markModal = document.getElementById("markModal");

const newmarkButton = document.getElementById("newMark");

newmarkButton.addEventListener("click", () => {

    markModal.classList.add("show");
})


//BOTON ABRIR MODAL PARA CREAR NOTA NUEVA--------------------------------------------------------------------------------------------------------------------------

const cancelmarkButton = document.getElementById("cancelMark");

cancelmarkButton.addEventListener("click", () => {

    markModal.classList.remove("show");
})


//GUARDAR NOTA NUEVA-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------

const saveMark = document.getElementById("saveMark");

saveMark.addEventListener("click", () => {

    const title = document.getElementById("markTitle").value.trim();
    const subject = document.getElementById("markSubject").value;
    const value = Number(document.getElementById("markValue").value);
    const date = document.getElementById("markDate").value;

    //COMPROBAR QUE LOS CAMPOS ESTAN COMPLETOS

    const formError = document.getElementById("formError");

    formError.textContent = "";
    formError.classList.remove("show");

    if (!title) {

        formError.textContent = "Escribe el nombre de la nota.";
        formError.classList.add("show");
        return;

    }

    if (!subject) {

        formError.textContent = "Selecciona una asignatura.";
        formError.classList.add("show");
        return;

    }

    if (!date) {

        formError.textContent = "Selecciona una fecha.";
        formError.classList.add("show");
        return;

    }

    if (isNaN(value)) {

        formError.textContent = "Introduce una nota.";
        formError.classList.add("show");
        return;

    }

    if (value < 0 || value > 10) {

        formError.textContent = "La nota debe estar entre 0 y 10.";
        formError.classList.add("show");
        return;

    }

    const mark = {

        id: Date.now(),

        title: title,

        subject: subject,

        value: value,

        date: date
    }

    marks.push(mark);

    saveMarks();

    renderMarks();
    renderGeneralAverage();

    markModal.classList.remove("show");

    document.getElementById("markTitle").value = "";
    document.getElementById("markSubject").value = "";
    document.getElementById("markValue").value = "";
    document.getElementById("markDate").value = "";
})


//MOSTRAR TARJETAS DE ASIGNATURAS--------------------------------------------------------------------------------------------------------------------------


function renderMarks() {

    const asignaturasFeed = document.getElementById("asignaturasFeed");

    asignaturasFeed.innerHTML = "";


    if (marks.length === 0) {

        asignaturasFeed.innerHTML = `
            <div class="empty-message">
                <p>Aún no tienes calificaciones.</p>
                <span>¡Añade tu primera calificación para empezar a ver tu progreso!</span>
            </div>
        `;

        return;
    }

    const subjects = JSON.parse(localStorage.getItem("agendahub-subjects")) || [];


    subjects.forEach(subject => {

        const subjectMarks = marks.filter(mark => mark.subject == subject.id);

        let media = 0;

        if(subjectMarks.length > 0) {

            const total = subjectMarks.reduce((sum, mark) => sum + mark.value, 0);

            media = total / subjectMarks.length;
        }

        const card = document.createElement("div");

        card.classList.add("mark-subject-card");

        card.style.backgroundColor = subject.color;

        card.innerHTML = `
        
            <div class="mark-subject-header">

                <h2>${subject.name}</h2>

                <strong>
                    ${subjectMarks.length > 0
                        ? media.toFixed(1).replace(".", ",")
                        : "—"}
                </strong>

            </div>

            <p>
                ${subjectMarks.length}
                ${subjectMarks.length === 1 ? "nota" : "notas"}
            </p>

            <div class="mark-progress">
                <div 
                    class="mark-progress-fill"
                    style="width: ${media * 10}%"
                ></div>
            </div>
        `;

        card.addEventListener("click", () => {

            selectedSubject = subject;

            renderSubjectMarks();

        });

        asignaturasFeed.appendChild(card);
    });

}


//CALCULAR MEDIA GENERAL------------------------------------------------------------------

function renderGeneralAverage() {

    const totalMarks = document.getElementById("totalMarks");
    const generalProgress = document.getElementById("generalProgress");

    if (marks.length === 0) {
        marksContainer.innerHTML = `
            <div class="empty-message">
                <p>Aún no tienes calificaciones.</p>
                <span>Añade tu primera nota para empezar a ver tu progreso.</span>
            </div>
        `;

        totalMarks.textContent = "-";
        return;
    }

    const total = marks.reduce((sum,mark) => sum + mark.value, 0);

    const media = total / marks.length;

    totalMarks.textContent = media.toFixed(1).replace(".", ",");

    generalProgress.style.width = `${media * 10}%`;
}


//MOSTRAR NOTAS DE UNA ASIGNATURA----------------------------------------------------------------

function renderSubjectMarks() {

    const modal = document.getElementById("subjectMarksModal");
    const title = document.getElementById("subjectMarksTitle");
    const average = document.getElementById("subjectMarksAverage");
    const list = document.getElementById("subjectMarksList");

    list.innerHTML = "";

    if (!selectedSubject) {
        return;
    }

    const subjectMarks = marks

        .filter(mark => mark.subject == selectedSubject.id)

        .sort((a, b) => new Date(b.date) - new Date(a.date));

    let media = 0;

    if (subjectMarks.length > 0) {

        const total = subjectMarks.reduce(
            (sum, mark) => sum + mark.value,
            0
        );

        media = total / subjectMarks.length;

    }

    title.textContent = selectedSubject.name;

    average.textContent =
        subjectMarks.length > 0
            ? `Media: ${media.toFixed(1).replace(".", ",")}`
            : "Sin calificaciones";

    if (subjectMarks.length === 0) {

        list.innerHTML = `
            <p class="empty-marks">
                Todavía no tienes calificaciones en esta asignatura.
            </p>
        `;

    } else {

        subjectMarks.forEach(mark => {

            const markCard = document.createElement("div");

            markCard.classList.add("mark-card");

            markCard.innerHTML = `
                <div>
                    <h3>${mark.title}</h3>

                    <span>
                        ${mark.date.split("-").reverse().join("/")}
                    </span>
                </div>

                <strong>
                    ${mark.value.toFixed(1).replace(".", ",")}
                </strong>
            `;

            markCard.addEventListener("click", () => {

                const confirmDelete = confirm(
                    `¿Quieres eliminar la nota "${mark.title}"?`
                );

                if (!confirmDelete) {
                    return;
                }

                marks = marks.filter(item => item.id !== mark.id);

                saveMarks();

                renderMarks();
                renderGeneralAverage();
                renderSubjectMarks();

            });

            list.appendChild(markCard);

        });

    }

    modal.classList.add("show");

}

const closeSubjectMarks =
    document.getElementById("closeSubjectMarks");

const subjectMarksModal =
    document.getElementById("subjectMarksModal");


closeSubjectMarks.addEventListener("click", () => {

    subjectMarksModal.classList.remove("show");

});

subjectMarksModal.addEventListener("click", (event) => {

    if (event.target === subjectMarksModal) {

        subjectMarksModal.classList.remove("show");

    }

});



loadSubjectsIntoSelect("markSubject");

renderMarks();
renderGeneralAverage();