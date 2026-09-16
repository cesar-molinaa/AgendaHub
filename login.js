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