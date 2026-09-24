<?php
// index.php — simple Web C IDE
// Requires: PHP with shell_exec enabled, gcc on PATH.
// Files live as plain .c files next to this script, same as before.

$files = glob("*.c");

function safeFilename($name) {
    $name = basename((string)$name);
    if (preg_match('/^[a-zA-Z0-9_\-]+\.c$/', $name)) {
        return $name;
    }
    return null;
}

$currentFile = null;
$output = "";
$stdinValue = "";
$compileOk = null; // null = nothing run yet, true/false otherwise

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    $currentFile = safeFilename($_POST['filename'] ?? '');
    $stdinValue = $_POST['stdin'] ?? '';

    if (isset($_POST['delete']) && $currentFile) {
        @unlink($currentFile);
        foreach (glob(pathinfo($currentFile, PATHINFO_FILENAME) . "_*.out") ?: [] as $old) {
            @unlink($old);
        }
        $files = glob("*.c");
        $currentFile = $files[0] ?? null;
    } elseif ($currentFile) {
        $code = $_POST['code'] ?? '';
        file_put_contents($currentFile, $code);
        $files = glob("*.c");

        if (isset($_POST['run'])) {
            $baseName = pathinfo($currentFile, PATHINFO_FILENAME);

            // Best-effort cleanup of old binaries for this file. Ignored if locked —
            // that's exactly why we don't reuse the same exe name below.
            foreach (glob($baseName . "_*.out") ?: [] as $old) {
                @unlink($old);
            }

            // Unique filename per run: on Windows, overwriting the exe from the
            // previous run can fail with "Permission denied" if the OS or an
            // antivirus scan still has a handle on it. A fresh name each time
            // sidesteps that entirely.
            $exeFile = $baseName . "_" . time() . ".out";

            $compileCmd = "gcc " . escapeshellarg($currentFile) . " -o " . escapeshellarg($exeFile) . " -Wall 2>&1";
            $compileMsg = trim((string) shell_exec($compileCmd));

            if (!file_exists($exeFile)) {
                $compileOk = false;
                $output = $compileMsg !== '' ? $compileMsg : "Compilation failed.";
            } else {
                $compileOk = true;

                // Write stdin to a temp file so scanf/gets-based programs get input.
                $stdinFile = ".stdin_tmp";
                file_put_contents($stdinFile, $stdinValue);

                $isWindows = strtoupper(substr(PHP_OS, 0, 3)) === 'WIN';
                if ($isWindows) {
                    $runCmd = escapeshellarg("./$exeFile") . " < " . escapeshellarg($stdinFile) . " 2>&1";
                } else {
                    // timeout guard so an infinite loop can't hang the page/server
                    $runCmd = "bash -c " . escapeshellarg(
                        "timeout 5 ./" . $exeFile . " < " . escapeshellarg($stdinFile) . " 2>&1"
                    );
                }
                $runOutput = (string) shell_exec($runCmd);
                @unlink($stdinFile);

                $output = ($compileMsg !== '' ? "Warnings:\n$compileMsg\n\n" : '') . $runOutput;
            }
        }
    }
} else {
    $requestedFile = $_GET['file'] ?? null;
    $currentFile = $requestedFile ? safeFilename($requestedFile) : null;
    if (!$currentFile) {
        $currentFile = $files[0] ?? "program.c";
    }
}

if ($currentFile && !file_exists($currentFile)) {
    file_put_contents($currentFile, "// New file. Start coding...\n");
    $files = glob("*.c");
}

$codeContent = $currentFile ? file_get_contents($currentFile) : "";
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8" />
  <title>Web C IDE</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>

* { box-sizing: border-box; }
html, body {
    margin: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
body {
    font-family: "Segoe UI", Arial, sans-serif;
    background: #0b0d0f;
    color: #d7dce3;
}

.code-window {
    position: relative;
    width: calc(100vw - 32px);
    height: calc(100vh - 32px);
    margin: 16px;
    background: #111315;
    border: 1px solid #343941;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,.45);
}

.header {
    height: 48px;
    padding: 0 16px;
    display: flex;
    align-items: center;
    background: #191b1e;
    border-bottom: 1px solid #30343a;
    color: #e7ebef;
    font-size: 14px;
    font-weight: 600;
}

#code-close-btn {
    position: absolute;
    top: 0;
    right: 0;
    width: 48px;
    height: 48px;
    border: 0;
    background: transparent;
    color: #aab1bb;
    font-size: 21px;
    cursor: pointer;
    z-index: 20;
}
#code-close-btn:hover { background: #e81123; color: white; }

.inner-body {
    height: calc(100% - 48px);
    min-height: 0;
    display: flex;
    overflow: hidden;
}

.sidebar {
    width: 54px;
    flex: 0 0 54px;
    background: #15171a;
    border-right: 1px solid #30343a;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 10px;
}
.sidebar i {
    width: 54px;
    height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    color: #858d98;
    font-size: 19px;
    cursor: pointer;
}
.sidebar i:hover { color: #fff; background: #202328; }

.explorer {
    width: 235px;
    flex: 0 0 235px;
    min-height: 0;
    background: #181a1d;
    border-right: 1px solid #30343a;
    display: flex;
    flex-direction: column;
}

.explorer h3 {
    height: 48px;
    flex: 0 0 48px;
    margin: 0;
    padding: 0 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #b8bec7;
    font-size: 11px;
    letter-spacing: 1px;
}
.new-file-button {
    border: 0;
    background: transparent;
    color: #8c96a2;
    font-size: 16px;
    cursor: pointer;
}
.new-file-button:hover { color: #fff; }

.explorer ul {
    list-style: none;
    margin: 0;
    padding: 4px 7px;
    overflow-y: auto;
    flex: 1;
}
.explorer ul li {
    min-height: 36px;
    margin-bottom: 2px;
    padding: 0 7px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 5px;
    cursor: pointer;
}
.explorer ul li:hover { background: #24282d; }
.explorer ul li.active { background: #2b5272; }
.file-name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #bfc6cf;
    font-size: 13px;
}
.explorer ul li.active .file-name { color: #fff; font-weight: 600; }
.delete-file-btn {
    border: 0;
    background: transparent;
    color: #727a84;
    cursor: pointer;
    padding: 5px;
    opacity: 1;
}
.delete-file-btn:hover { color: #ff6d6d; }

.explorer::after {
    content: "";
}
.side-panel-footer {
    border-top: 1px solid #30343a;
    padding: 9px 12px;
    display: flex;
    justify-content: space-between;
    color: #626a74;
    font-size: 10px;
}

.main {
    min-width: 0;
    min-height: 0;
    flex: 1 1 auto;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.editor-header {
    height: 42px;
    flex: 0 0 42px;
    padding: 0 15px;
    display: flex;
    align-items: center;
    background: #111315;
    border-bottom: 1px solid #30343a;
    color: #d8dde4;
    font-size: 12px;
}
.editor-header span { color: #6dbfff; }

#cForm {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.editor-area {
    flex: 1 1 auto;
    min-height: 0;
    height: auto;
    padding: 0;
    background: #111315;
    overflow: hidden;
}

#codeEditor {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    margin: 0;
    padding: 14px 18px;
    border: 0;
    outline: 0;
    resize: none;
    background: #111315;
    color: #d7dce4;
    font: 14px/1.55 "Cascadia Code", Consolas, "Courier New", monospace;
    overflow: auto;
    tab-size: 4;
}

.stdin-area {
    flex: 0 0 86px;
    height: 86px;
    min-height: 86px;
    padding: 0;
    display: flex;
    flex-direction: column;
    background: #15171a;
    border-top: 1px solid #30343a;
}
.stdin-area label {
    height: 31px;
    flex: 0 0 31px;
    padding: 0 12px;
    display: flex;
    align-items: center;
    color: #9ea6b0;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .7px;
}
.stdin-area textarea {
    flex: 1;
    min-height: 0;
    width: 100%;
    resize: none;
    border: 0;
    border-top: 1px solid #25292e;
    outline: 0;
    padding: 7px 12px;
    background: #0e1012;
    color: #d7dce4;
    font: 12px/1.4 Consolas, monospace;
}
.stdin-area textarea::placeholder { color: #4e5660; }

.button-group {
    flex: 0 0 48px;
    height: 48px;
    padding: 0 14px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
    background: #191b1e;
    border-top: 1px solid #30343a;
}
.save-button, .run-button {
    width: 84px;
    height: 31px;
    border-radius: 5px;
    border: 1px solid #3b424a;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
}
.save-button {
    background: #292d32;
    color: #cbd1d8;
}
.run-button {
    background: #2f9cf4;
    border-color: #2f9cf4;
    color: white;
}
.save-button:hover { background: #343a41; color: white; }
.run-button:hover { background: #1687e4; }

.terminal-header {
    flex: 0 0 36px;
    height: 36px;
    padding: 0 13px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #191b1e;
    border-top: 1px solid #30343a;
    border-bottom: 1px solid #30343a;
    color: #aeb5be;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .7px;
}
.output-section {
    flex: 0 0 145px;
    height: 145px;
    min-height: 80px;
    margin: 0;
    padding: 12px 14px;
    overflow: auto;
    white-space: pre-wrap;
    background: #0d0f11;
    color: #d0d6dd;
    font: 12px/1.5 Consolas, "Courier New", monospace;
}
.output-section.has-error { color: #ff9999; }

.status-badge {
    margin-left: 8px;
    padding: 3px 8px;
    border-radius: 10px;
    font-size: 9px;
}
.status-ok { color: #71dfa8; background: rgba(72,199,142,.12); }
.status-fail { color: #ff9292; background: rgba(243,107,107,.12); }

@media (max-height: 720px) {
    .stdin-area { flex-basis: 64px; height: 64px; min-height: 64px; }
    .output-section { flex-basis: 105px; height: 105px; }
    .button-group { flex-basis: 44px; height: 44px; }
}

</style>
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/theme/material-darker.min.css">
<style>
.CodeMirror {
    height: 100% !important;
    background: #111315 !important;
    color: #d7dce4;
    font: 14px/1.55 "Cascadia Code", Consolas, monospace;
}
.CodeMirror-gutters {
    background: #111315 !important;
    border-right: 1px solid #24282d !important;
}
.CodeMirror-linenumber { color: #505963; padding-right: 12px; }
.CodeMirror-scroll { overflow: auto !important; }
</style>
</head>

<body>


  <div class="code-window">
    <div class="header">Code Editor</div>
    <button id="code-close-btn" title="Close" aria-label="Close file manager">
      ×
    </button>
    <div class="inner-body">

      <div class="sidebar">
        <i class="fas fa-copy" title="Copy"></i>
        <i class="fas fa-magnifying-glass" title="Search"></i>
        <i class="fas fa-code" title="Code"></i>
        <i class="fas fa-gear" title="Settings"></i>
      </div>

      <div class="explorer">
        <h3>
          EXPLORER
          <button class="new-file-button" onclick="newFile()">+ New File</button>
        </h3>
        <ul id="fileList">
          <?php foreach ($files as $file): ?>
            <li data-filename="<?= htmlspecialchars($file) ?>" class="<?= $file === $currentFile ? "active" : "" ?>">
              <span class="file-name"><?= htmlspecialchars($file) ?></span>
              <i class="fas fa-trash delete-file-btn" title="Delete file" data-filename="<?= htmlspecialchars($file) ?>"></i>
            </li>
          <?php endforeach; ?>
        </ul>
      </div>

      <div class="main">
        <div class="editor-header">
          <span id="currentFilename"><?= htmlspecialchars($currentFile) ?></span>
        </div>

        <form method="POST" id="cForm" action="" autocomplete="off">
          <input type="hidden" name="filename" id="filenameInput" value="<?= htmlspecialchars($currentFile) ?>" />
          <div class="editor-area">
            <textarea id="codeEditor" name="code" spellcheck="false" rows="20"
              autofocus><?= htmlspecialchars($codeContent) ?></textarea>
          </div>

          <div class="stdin-area">
            <label for="stdinBox">stdin (input for scanf/gets)</label>
            <textarea id="stdinBox" name="stdin" rows="2" placeholder="Type program input here, one value per line…"><?= htmlspecialchars($stdinValue) ?></textarea>
          </div>

          <div class="button-group">
            <button type="submit" class="save-button" name="save" title="Save File">Save</button>
            <button type="submit" class="run-button" name="run" title="Compile & Run">Run</button>
          </div>
        </form>

        <div class="terminal-header">
          Output / Terminal
          <?php if ($compileOk === true): ?>
            <span class="status-badge status-ok">✓ Compiled</span>
          <?php elseif ($compileOk === false): ?>
            <span class="status-badge status-fail">✗ Compile error</span>
          <?php endif; ?>
        </div>
        <div class="output-section <?= $compileOk === false ? 'has-error' : '' ?>" id="output">
          <?= $output !== '' ? nl2br(htmlspecialchars($output)) : "No output yet. Click Run to compile and execute your code." ?>
        </div>
      </div>

    </div>
  </div>
  <script>
    const fileList = document.getElementById('fileList');
    const filenameInput = document.getElementById('filenameInput');
    const currentFilename = document.getElementById('currentFilename');
    const codeEditor = document.getElementById('codeEditor');
    const cForm = document.getElementById('cForm');

    // Click file in sidebar to load it
    fileList.addEventListener('click', e => {
      if (e.target.classList.contains('delete-file-btn')) {
        const name = e.target.getAttribute('data-filename');
        if (confirm(`Delete ${name}?`)) {
          filenameInput.value = name;
          const del = document.createElement('input');
          del.type = 'hidden';
          del.name = 'delete';
          del.value = '1';
          cForm.appendChild(del);
          cForm.submit();
        }
        return;
      }
      const li = e.target.closest('li[data-filename]');
      if (li) {
        window.location.href = "?file=" + encodeURIComponent(li.getAttribute('data-filename'));
      }
    });

    // New File button
    function newFile() {
      let newName = prompt("Enter new filename (with .c extension):");
      if (!newName) return;
      newName = newName.trim();
      if (!newName.match(/^[a-zA-Z0-9_\-]+\.c$/)) {
        alert("Invalid filename. Use letters, numbers, underscore, hyphen and end with .c");
        return;
      }
      window.location.href = "?file=" + encodeURIComponent(newName);
    }
  </script>



    <script>
      document.addEventListener("DOMContentLoaded", () => {
        const closeButton = document.getElementById("code-close-btn");
        if (closeButton) {
          closeButton.addEventListener("click", () => {
            window.parent.postMessage({ action: "close-code" }, "*");
          });
        }
      });
    </script>

<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.16/mode/clike/clike.min.js"></script>
<script>
(function () {
    const ta = document.getElementById('codeEditor');
    if (!ta || typeof CodeMirror === 'undefined') return;

    const cm = CodeMirror.fromTextArea(ta, {
        mode: 'text/x-csrc',
        theme: 'material-darker',
        lineNumbers: true,
        lineWrapping: false,
        indentUnit: 4,
        tabSize: 4,
        autofocus: true,
        viewportMargin: 30,
        extraKeys: {
            Tab: function(editor) {
                editor.replaceSelection('    ');
            },
            'Ctrl-S': function(editor) {
                editor.save();
                document.getElementById('cForm').submit();
            },
            'Ctrl-Enter': function(editor) {
                editor.save();
                const run = document.createElement('input');
                run.type = 'hidden';
                run.name = 'run';
                run.value = '1';
                document.getElementById('cForm').appendChild(run);
                document.getElementById('cForm').submit();
            }
        }
    });

    window.addEventListener('resize', function () {
        cm.setSize(null, '100%');
        cm.refresh();
    });

    setTimeout(function () {
        cm.setSize(null, '100%');
        cm.refresh();
    }, 0);
})();
</script>

</body>

</html>
