

async function comprobarSesion() {

    if (window.location.hash.includes("type=recovery")) {
        return;
    }

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (session) {
        window.location.href = "index.html";
    }
}

comprobarSesion();


let registerMode = false;


// CAMBIAR ENTRE LOGIN Y REGISTRO

const changeAuthMode = document.getElementById("changeAuthMode");

changeAuthMode.addEventListener("click", () => {

    registerMode = !registerMode;

    updateAuthForm();

});


// ACTUALIZAR FORMULARIO

function updateAuthForm() {

    const authTitle = document.getElementById("authTitle");
    const authSubtitle = document.getElementById("authSubtitle");
    const authButton = document.getElementById("authButton");

    const nameField = document.getElementById("nameField");
    const courseField = document.getElementById("courseField");

    if (registerMode) {

        authTitle.textContent = "";
        authSubtitle.textContent = "";


        authTitle.textContent = "Crear cuenta";

        authSubtitle.textContent =
            "Crea tu cuenta para empezar a usar AgendaHub.";

        authButton.textContent = "Crear cuenta";

        nameField.style.display = "flex";
        courseField.style.display = "flex";

        changeAuthMode.textContent =
            "¿Ya tienes una cuenta? Iniciar sesión";

    } else {

        authTitle.textContent = "Iniciar sesión";

        authSubtitle.textContent =
            "Entra en tu cuenta de AgendaHub.";

        authButton.textContent = "Iniciar sesión";

        nameField.style.display = "none";
        courseField.style.display = "none";

        changeAuthMode.textContent =
            "¿No tienes una cuenta? Crear cuenta";
    }
}


// ENVIAR FORMULARIO

const authForm = document.getElementById("authForm");

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const authButton = document.getElementById("authButton");
    const authError = document.getElementById("authError");

    authButton.disabled = true;

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;


    authError.textContent = "";


    // CREAR CUENTA

    if (registerMode) {

        const name = document.getElementById("name").value;
        const course = document.getElementById("course").value;

        const { data, error } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name,
                    course: course
                }
            }
        });

        if (error) {

            authError.textContent = error.message;
            authButton.disabled = false;

            return;

        }

        authButton.disabled = false;
        window.location.href = "index.html";
        return;

    }


    // INICIAR SESIÓN

    else {

        const { error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });

        if (error) {

            authError.textContent = error.message;
            authButton.disabled = false;
            return;

        }

        window.location.href = "index.html";

    }

});




const forgotPassword = document.getElementById("forgotPassword");

forgotPassword.addEventListener("click", async (e) => {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    if (!email) {
        alert("Escribe primero tu correo electrónico.");
        return;
    }

    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: "https://cesar-molinaa.github.io/AgendaHub/login.html"
    });

    if (error) {
        console.error("Error recuperando contraseña:", error);
        alert("No se ha podido enviar el correo de recuperación.");
        return;
    }

    alert("Te hemos enviado un correo para cambiar tu contraseña.");
});

async function comprobarRecuperacion() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) return;

    const hash = window.location.hash;

    if (hash.includes("type=recovery")) {

        const authTitle = document.getElementById("authTitle");
        const authSubtitle = document.getElementById("authSubtitle");
        const authButton = document.getElementById("authButton");
        const emailField = document.getElementById("emailField");
        const nameField = document.getElementById("nameField");
        const courseField = document.getElementById("courseField");
        const password = document.getElementById("password");
        const changeAuthMode = document.getElementById("changeAuthMode");
        const forgotPassword = document.getElementById("forgotPassword");

        authTitle.textContent = "Cambiar contraseña";
        authSubtitle.textContent = "Introduce tu nueva contraseña.";

        emailField.style.display = "none";
        nameField.style.display = "none";
        courseField.style.display = "none";

        password.value = "";
        password.placeholder = "Nueva contraseña";

        authButton.textContent = "Cambiar contraseña";

        changeAuthMode.style.display = "none";

        if (forgotPassword) {
            forgotPassword.style.display = "none";
        }

        authButton.onclick = async (e) => {

            e.preventDefault();

            const nuevaPassword = password.value;

            if (!nuevaPassword) {
                alert("Introduce una nueva contraseña.");
                return;
            }

            if (nuevaPassword.length < 6) {
                alert("La contraseña debe tener al menos 6 caracteres.");
                return;
            }

            const { error } =
                await supabaseClient.auth.updateUser({
                    password: nuevaPassword
                });

            if (error) {
                console.error("Error cambiando contraseña:", error);
                alert("No se ha podido cambiar la contraseña.");
                return;
            }

            alert("Contraseña cambiada correctamente.");

            window.location.href = "index.html";
        };
    }
}

comprobarRecuperacion();