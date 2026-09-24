let showfile = 1;

function openfile()
{
    console.log(showfile);
    if (showfile == 1)
    {
        document.getElementById("fileid").style.display = "block"
    }
    else
    {
        document.getElementById("fileid").style.display = "none"
    }
    showfile = showfile * -1;
}