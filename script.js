

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

if (window.innerWidth <= 768) {
    sidebar.classList.add("hide");
}

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






function obtenerColorTexto(colorFondo) {

    if (!colorFondo) {
        return "#191923";
    }

    let color = colorFondo.replace("#", "").trim();

    if (color.length === 3) {
        color =
            color[0] + color[0] +
            color[1] + color[1] +
            color[2] + color[2];
    }

    if (color.length !== 6) {
        return "#191923";
    }

    const r = parseInt(color.substring(0, 2), 16);
    const g = parseInt(color.substring(2, 4), 16);
    const b = parseInt(color.substring(4, 6), 16);

    const luminosidad =
        (0.299 * r +
         0.587 * g +
         0.114 * b) / 255;

    if (luminosidad < 0.35) {
        return "#F7F3E3";
    }

    return "#191923";
}






























cargarFotoUsuario();