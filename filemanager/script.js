let currentFolder = 'home';
let currentFile = null;

function loadFiles(folder) {
  currentFolder = folder;
  fetch(`get_files.php?folder=${folder}`)
    .then(res => res.json())
    .then(files => {
      const fileList = document.getElementById("file-list");
      fileList.innerHTML = "";
      if (files.length === 0) {
        fileList.innerHTML = "<p>No files found.</p>";
        return;
      }
      files.forEach(filename => {
        const fileItem = document.createElement("div");
        fileItem.className = "file-item";
        fileItem.textContent = filename;
        fileItem.addEventListener("click", () => openFile(filename));
        fileList.appendChild(fileItem);
      });
      clearEditor();
    })
    .catch(err => console.error("Error loading files:", err));
}

function openFile(filename) {
  console.log("Opening file:", filename);
  currentFile = filename;
  fetch(`get_file_content.php?folder=${currentFolder}&filename=${encodeURIComponent(filename)}`)
    .then(res => res.json())
    .then(data => {
      if (data.error) {
        alert(data.error);
        return;
      }
      showEditor(filename, data.content);
    })
    .catch(err => console.error("Error loading file content:", err));
}

function showEditor(filename, content) {
  const fileList = document.getElementById("file-list");
  fileList.innerHTML = `
    <h3>${filename}</h3>
    <textarea id="file-editor" style="width: 100%; height: 300px;">${content}</textarea>
    <button id="save-btn">Save</button>
    <button id="cancel-btn">Cancel</button>
  `;

  document.getElementById("save-btn").onclick = saveFile;
  document.getElementById("cancel-btn").onclick = () => loadFiles(currentFolder);
}

function saveFile() {
  const newContent = document.getElementById("file-editor").value;
  fetch('save_file_content.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/x-www-form-urlencoded'},
    body: `folder=${encodeURIComponent(currentFolder)}&filename=${encodeURIComponent(currentFile)}&content=${encodeURIComponent(newContent)}`
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      alert("File saved successfully!");
      loadFiles(currentFolder);
    } else {
      alert("Error saving file: " + (data.error || 'Unknown error'));
    }
  })
  .catch(err => console.error("Error saving file:", err));
}

function clearEditor() {
  currentFile = null;
}

window.onload = () => {
  loadFiles("home");
};
