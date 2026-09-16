

async function comprobarUsuario() {

    const paginaActual = window.location.pathname;

    if (paginaActual.includes("login.html")) {
        return;
    }

    const { data: { session }, error } =
        await supabaseClient.auth.getSession();

    console.log("PÁGINA:", paginaActual);
    console.log("SESIÓN:", session);
    console.log("ERROR:", error);

    if (error) {
        console.error("Error comprobando sesión:", error);
        return;
    }

    if (!session) {
        console.log("NO HAY SESIÓN → REDIRIGIENDO");
        window.location.href = "login.html";
        return;
    }

    console.log("USUARIO CON SESIÓN");
}

comprobarUsuario();







//BOTON SIDEBAR

const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");


if(menuBtn){

    menuBtn.addEventListener("click", () => {

    sidebar.classList.toggle("hide");
})
}



// CERRAR MODALES AL HACER CLICK FUERA

document.querySelectorAll(".modal").forEach(modal => {

    modal.addEventListener("click", (event) => {

        if (event.target === modal) {
            modal.classList.remove("show");
        }

    });

});



const userIcon = document.getElementById("userIcon");

userIcon.addEventListener("click", () => {
    
    window.location.href = "user.html";
})


//FOTO USER

async function cargarFotoUsuario() {

    const userIcon = document.getElementById("userIcon");

    if (!userIcon) return;

    const { data: { user }, error } =
    await supabaseClient.auth.getUser();

    if (error || !user) return;

    const avatar = user.user_metadata?.avatar;

    if(avatar) {
        userIcon.src = avatar;
    }
}

cargarFotoUsuario();