async function cargarPerfil() {

    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error) {
        console.error("Error obteniendo usuario:", error);
        return;
    }

    if (!user) {
        console.error("No hay ningún usuario conectado.");
        return;
    }

    const nombre = user.user_metadata?.name || "Tu nombre";
    const curso = user.user_metadata?.course || "Curso que haces";
    const avatar = user.user_metadata?.avatar;
    const email = user.email;   

    document.getElementById("userName").textContent = nombre;
    document.getElementById("userCourse").textContent = curso;
    document.getElementById("userEmail").textContent = email;


    if (avatar) {
    document.getElementById("userImg").src = avatar;
    }
}

cargarPerfil();





function formatearFecha(fecha) {

    const partes = fecha.split("-");

    return `${partes[2]}/${partes[1]}`;
}


//BOTON VOLVER

const back = document.getElementById("back");

back.addEventListener("click", () => {
    
    window.location.href = "index.html";
})



//EDITAR PERFIL

const editarUser = document.getElementById("editarUser");
const userModal = document.getElementById("userModal");

editarUser.addEventListener("click", async () => {

    const { data: { user } } = await supabaseClient.auth.getUser();

    if (!user) return;

    document.getElementById("editUserName").value = user.user_metadata?.name || "";

    document.getElementById("editUserCourse").value = user.user_metadata?.course || "";

    userModal.classList.add("show");

})

//CANCELAR

const cancelUserEdit = document.getElementById("cancelUserEdit");

cancelUserEdit.addEventListener("click", () => {

    userModal.classList.remove("show");
});

//GUARDAR CAMBIOS

const saveUserEdit = document.getElementById("saveUserEdit");

saveUserEdit.addEventListener("click", async () => {

    const name = document.getElementById("editUserName").value.trim();
    const course = document.getElementById("editUserCourse").value.trim();
    const imageFile = document.getElementById("editUserImage").files[0];

    const formError = document.getElementById("userFormError");

    formError.textContent = "";
    formError.classList.remove("show");


    if (!name) {
        formError.textContent = "Escribe tu nombre.";
        formError.classList.add("show");
        return;
    }

    if (!course) {
        formError.textContent = "Escribe tu curso.";
        formError.classList.add("show");
        return;
    }

    let imageUrl = null;

    if (imageFile) {

        const formData = new FormData();

        formData.append("file", imageFile);
        formData.append("upload_preset", "agendahub_subjects");

        const response = await fetch(
            "https://api.cloudinary.com/v1_1/xaoiq5an/image/upload",
            {
                method: "POST",
                body: formData
            }
        );

        const data = await response.json();

        if (!response.ok) {
            console.error("Error subiendo foto:", data);

            formError.textContent = "No se ha podido subir la foto.";
            formError.classList.add("show");

            return;
        }

        imageUrl = data.secure_url;
    }

    const { error } = await supabaseClient.auth.updateUser({
        data: {
            name: name,
            course: course,
            avatar: imageUrl || undefined
        }
    });

    if (error) {
        console.error("Error actualizando perfil:", error);
        formError.textContent = "No se han podido guardar los cambios.";
        formError.classList.add("show");
        return;
    }

    document.getElementById("userName").textContent = name;
    document.getElementById("userCourse").textContent = course;
    document.getElementById("miCurso").textContent = course;

    if (imageUrl) {
    document.getElementById("userImg").src = imageUrl;
    }

    userModal.classList.remove("show");
})


async function cargarCurso() {

    const { data: { user }, error } =
        await supabaseClient.auth.getUser();

    if (error || !user) return;

    const curso = user.user_metadata?.course || "Curso que haces";

    document.getElementById("miCurso").textContent = curso;

    const inicio = user.user_metadata?.course_start;
    const final = user.user_metadata?.course_end;

    if (!inicio || !final) {
        document.getElementById("courseDate").textContent =
            "Configura las fechas";

        return;
    }

    mostrarProgresoCurso(inicio, final);
}


function mostrarProgresoCurso(inicio, final) {

    const fechaInicio = new Date(inicio);
    const fechaFinal = new Date(final);
    const hoy = new Date();

    const duracion = fechaFinal - fechaInicio;
    const transcurrido = hoy - fechaInicio;

    let progreso = (transcurrido / duracion) * 100;

    progreso = Math.max(0, Math.min(100, progreso));

    document.getElementById("courseDate").textContent =
        `${formatearFecha(inicio)} - ${formatearFecha(final)}`;

    document.getElementById("courseProgress").textContent =
        `${Math.round(progreso)}%`;

    document.getElementById("courseProgressBar").style.width =
        `${progreso}%`;
}


const courseCard = document.getElementById("courseCard");
const courseModal = document.getElementById("courseModal");

courseCard.addEventListener("click", async () => {

    const { data: { user } } =
        await supabaseClient.auth.getUser();

    if (!user) return;

    document.getElementById("courseStart").value =
        user.user_metadata?.course_start || "";

    document.getElementById("courseEnd").value =
        user.user_metadata?.course_end || "";

    courseModal.classList.add("show");
});


const cancelCourse = document.getElementById("cancelCourse");

cancelCourse.addEventListener("click", () => {
    courseModal.classList.remove("show");
});


const saveCourse = document.getElementById("saveCourse");

saveCourse.addEventListener("click", async () => {

    const start = document.getElementById("courseStart").value;
    const end = document.getElementById("courseEnd").value;
    const formError = document.getElementById("courseFormError");

    formError.textContent = "";
    formError.classList.remove("show");

    if (!start || !end) {
        formError.textContent = "Selecciona las dos fechas.";
        formError.classList.add("show");
        return;
    }

    if (new Date(end) <= new Date(start)) {
        formError.textContent =
            "La fecha final debe ser posterior a la inicial.";
        formError.classList.add("show");
        return;
    }

    const { error } = await supabaseClient.auth.updateUser({
        data: {
            course_start: start,
            course_end: end
        }
    });

    if (error) {
        console.error("Error guardando fechas del curso:", error);

        formError.textContent =
            "No se han podido guardar las fechas.";

        formError.classList.add("show");

        return;
    }

    courseModal.classList.remove("show");

    cargarCurso();
});







// CERRAR SESIÓN

const logoutUser = document.getElementById("logoutUser");

logoutUser.addEventListener("click", async () => {

    const { error } = await supabaseClient.auth.signOut();

    if (error) {
        console.error("Error cerrando sesión:", error);
        return;
    }

    window.location.href = "login.html";
});


cargarCurso();