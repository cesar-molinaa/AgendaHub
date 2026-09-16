

async function comprobarUsuario() {

    const { data: { session } } =
        await supabaseClient.auth.getSession();

    if (!session) {
        window.location.href = "login.html";
    }
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