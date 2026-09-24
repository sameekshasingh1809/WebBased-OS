<?php
$host = "localhost";
$user = "root";
$pass = "";
$db   = "myos";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    echo json_encode([]);
    exit;
}

$result = $conn->query("SELECT username FROM users");
$users = [];

while ($row = $result->fetch_assoc()) {
    $users[] = $row['username'];
}

echo json_encode($users);
?>
