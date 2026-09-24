let showterminal = 1;

function openTerminal()
{
    console.log(showterminal);
    if (showterminal == 1)
    {
        document.getElementById("terminalid").style.display = "block"
    }
    else
    {
        document.getElementById("terminalid").style.display = "none"
    }
    showterminal = showterminal * -1;
}

document.addEventListener("DOMContentLoaded", () => {
    const closeButton = document.getElementById("close-terminal");
    if (closeButton) {
        closeButton.addEventListener("click", () => {
            // Access the parent window from within the iframe
            window.parent.document.getElementById("terminalid").style.display = "none";
            // Optional: Reset the showfile variable if needed
            window.parent.showfile = 1;
        });
    }
});
