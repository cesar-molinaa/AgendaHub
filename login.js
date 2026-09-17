let registerMode = false;
let recoveryMode = false;


// COMPROBAR SI ESTAMOS CAMBIANDO LA CONTRASEÑA

if (window.location.hash.includes("type=recovery")) {
    recoveryMode = true;
}


// COMPROBAR SESIÓN

async function comprobarSesion() {

    if (recoveryMode) {
        prepararRecuperacion();
        return;
    }

    const { data: { session }, error } =
        await supabaseClient.auth.getSession();

    if (error) {
        console.error("Error comprobando sesión:", error);
        return;
    }

    if (session) {
        window.location.href = "index.html";
    }
}

comprobarSesion();


// CAMBIAR ENTRE LOGIN Y REGISTRO

const changeAuthMode =
    document.getElementById("changeAuthMode");

changeAuthMode.addEventListener("click", () => {

    registerMode = !registerMode;

    updateAuthForm();

});


// ACTUALIZAR FORMULARIO

function updateAuthForm() {

    const authTitle =
        document.getElementById("authTitle");

    const authSubtitle =
        document.getElementById("authSubtitle");

    const authButton =
        document.getElementById("authButton");

    const nameField =
        document.getElementById("nameField");

    const courseField =
        document.getElementById("courseField");

    const email =
        document.getElementById("email");


    if (registerMode) {

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

        email.disabled = false;
    }
}


// ENVIAR FORMULARIO

const authForm =
    document.getElementById("authForm");

authForm.addEventListener("submit", async (event) => {

    event.preventDefault();

    const authButton =
        document.getElementById("authButton");

    const authError =
        document.getElementById("authError");

    const email =
        document.getElementById("email").value.trim();

    const password =
        document.getElementById("password").value;

    authError.textContent = "";

    authButton.disabled = true;


    // CAMBIAR CONTRASEÑA

    if (recoveryMode) {

        if (!password) {

            authError.textContent =
                "Introduce una nueva contraseña.";

            authButton.disabled = false;

            return;
        }

        if (password.length < 6) {

            authError.textContent =
                "La contraseña debe tener al menos 6 caracteres.";

            authButton.disabled = false;

            return;
        }

        const { error } =
            await supabaseClient.auth.updateUser({
                password: password
            });

        if (error) {

            console.error(
                "Error cambiando contraseña:",
                error
            );

            authError.textContent =
                "No se ha podido cambiar la contraseña.";

            authButton.disabled = false;

            return;
        }

        alert("Contraseña cambiada correctamente.");

        window.location.href = "index.html";

        return;
    }


// CREAR CUENTA

    if (registerMode) {

        const name =
            document.getElementById("name").value;

        const course =
            document.getElementById("course").value;

        const { error } =
            await supabaseClient.auth.signUp({

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

            authError.textContent =
                error.message;

            authButton.disabled = false;

            return;
        }

        window.location.href = "index.html";

        return;
    }


// INICIAR SESIÓN

    const { error } =
        await supabaseClient.auth.signInWithPassword({

            email: email,

            password: password

        });

    if (error) {

        authError.textContent =
            error.message;

        authButton.disabled = false;

        return;
    }

    window.location.href = "index.html";
});


// RECUPERAR CONTRASEÑA

const forgotPassword =
document.getElementById("forgotPassword");

forgotPassword.addEventListener("click", async (event) => {

    event.preventDefault();

    const email =
        document.getElementById("email").value.trim();

    const authError =
        document.getElementById("authError");


    if (!email) {

        authError.textContent =
            "Escribe primero tu correo electrónico.";

        return;
    }


    const { error } =
        await supabaseClient.auth.resetPasswordForEmail(
            email,
            {
                redirectTo:
                    "https://cesar-molinaa.github.io/AgendaHub/login.html"
            }
        );


    if (error) {

        console.error(
            "Error recuperando contraseña:",
            error
        );

        authError.textContent =
            error.message;

        return;
    }


    alert(
        "Te hemos enviado un correo para cambiar tu contraseña."
    );
});


// PREPARAR PANTALLA DE RECUPERACIÓN

function prepararRecuperacion() {

    const authTitle =
        document.getElementById("authTitle");

    const authSubtitle =
        document.getElementById("authSubtitle");

    const authButton =
        document.getElementById("authButton");

    const emailField =
        document.getElementById("emailField");

    const nameField =
        document.getElementById("nameField");

    const courseField =
        document.getElementById("courseField");

    const forgotPassword =
        document.getElementById("forgotPassword");

    const changeAuthMode =
        document.getElementById("changeAuthMode");

    const password =
        document.getElementById("password");

    const email =
    document.getElementById("email");

    email.disabled = true;
    email.required = false;

    authTitle.textContent =
        "Cambiar contraseña";

    authSubtitle.textContent =
        "Introduce tu nueva contraseña.";

    emailField.style.display = "none";
    nameField.style.display = "none";
    courseField.style.display = "none";

    password.value = "";
    password.placeholder = "Nueva contraseña";

    authButton.textContent =
        "Cambiar contraseña";

    forgotPassword.style.display = "none";

    changeAuthMode.style.display = "none";
}


// DETECTAR RECUPERACIÓN DE SUPABASE

supabaseClient.auth.onAuthStateChange((event) => {

    if (event === "PASSWORD_RECOVERY") {

        recoveryMode = true;

        prepararRecuperacion();
    }

});