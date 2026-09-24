setInterval(
function ()
    {
    let date = new Date();
    
    let n = date.toLocaleString([], {
        hour: "2-digit",
        minute: "2-digit",
    });
    
    n = n.toUpperCase()
    
    document.getElementById("mytime").innerHTML = n;
    
},
1000);