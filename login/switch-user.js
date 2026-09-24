let showUser = 1;

function toggleUser() {
  const userList = document.getElementById("userList");

  if (showUser === 1) {
    fetch("get-users.php")
      .then(response => response.json())
      .then(data => {
        userList.style.display = "inline";
        const html = data.map(user => `<li onclick="selectUser('${user}')">${user}</li>`).join("");
        userList.innerHTML = `<ul>${html}</ul>`;
      })
      .catch(error => console.error("Error loading users:", error));
  } else {
    userList.style.display = "none";
  }

  showUser *= -1;
}

function selectUser(username) {
  document.getElementById("usernameInput").value = username;
  document.getElementById("displayUsername").textContent = username;
  document.getElementById("userList").style.display = "none";
  showUser = -1;
}

let showPower = 1;

function togglePower() {
  const list = document.getElementById("powerList");
  list.style.display = showPower === 1 ? "block" : "none";
  showPower *= -1;
}
