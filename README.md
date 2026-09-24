# Web-Based OS Simulation

A desktop-style operating system experience that runs entirely in the browser — a desktop with draggable icons, a taskbar and start menu, and a set of integrated apps: a terminal, a file manager, a text editor, an online C code editor, a network status panel, and a settings panel. Login is PIN-based and backed by MySQL.

## Features

- **Desktop shell** — draggable icons, taskbar, and start menu (`desktop/`)
- **Terminal** — a simulated shell supporting `ls`, `ls -l`, `pwd`, `echo`, `cat`, `date`, `whoami`, `clear`, and `help` against a small mock file set (`terminal/`)
- **File Manager** — real create / read / update / delete of files, with each folder (`home`, `downloads`, `desktop`) persisted as its own JSON file on the server (`filemanager/`)
- **Code Editor** — a browser-based C IDE: write, save, compile with `gcc`, and run programs with custom stdin, with a 5-second timeout guard against infinite loops (`code/`)
- **Text Editor** — a lightweight standalone editor (`texteditor/`)
- **Network Panel** — a simulated Wi-Fi connect/disconnect flow with a randomized IP and signal strength, persisted via `localStorage` (`network/`)
- **Settings** — Account, System, Devices, Network & Internet, Personalization, Privacy & Security, and About sections, including live browser detection and permission checks (`settings/`)
- **Login / Logout** — PIN-based authentication against a MySQL `users` table, with full session teardown on logout (`login/`, `logout/`)

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript
- **Backend:** PHP
- **Database:** MySQL (used for login credentials only — file manager data is stored as JSON, not in the database)

## Requirements

- A PHP environment with MySQL support (e.g. XAMPP or a LAMP/WAMP stack)
- `gcc` available on the server's `PATH` (required for the code editor's compile/run feature)

## Setup

1. Clone the repository into your server's web root (e.g. `htdocs` for XAMPP):
```bash
   git clone https://github.com/sameekshasingh1809/WebBased-OS.git
```
2. Create a MySQL database named `myos` and a `users` table with at least `username` and `pin` columns, then add your login credentials as rows.
3. Update the database connection details (`$host`, `$user`, `$pass`, `$db`) in `login/login.php` and `login/get-users.php` if they differ from your local MySQL setup.
4. Start your Apache/MySQL server (e.g. via the XAMPP control panel).
5. Open `login/index.html` in your browser and sign in with a username and PIN from your `users` table.

## Project Structure
