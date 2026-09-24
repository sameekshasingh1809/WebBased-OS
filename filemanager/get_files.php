<?php
header('Content-Type: application/json');
$folder = $_GET['folder'] ?? '';

if (!in_array($folder, ['home', 'downloads', 'desktop'])) {
    echo json_encode([]);
    exit;
}

$filePath = __DIR__ . "/folders/$folder.json";
if (!file_exists($filePath)) {
    echo json_encode([]);
    exit;
}

$data = json_decode(file_get_contents($filePath), true);
$files = array_map(fn($f) => $f['name'], $data);
echo json_encode($files);
