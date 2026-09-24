let showcode = 1;

function opencode()
{
    console.log(showcode);
    if (showcode == 1)
    {
        document.getElementById("codeid").style.display = "block"
    }
    else
    {
        document.getElementById("codeid").style.display = "none"
    }
    showcode = showcode * -1;
}