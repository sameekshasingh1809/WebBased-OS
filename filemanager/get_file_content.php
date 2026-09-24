<?php
header('Content-Type: application/json');
$folder = $_GET['folder'] ?? '';
$filename = $_GET['filename'] ?? '';

if (!in_array($folder, ['home', 'downloads', 'desktop']) || !$filename) {
    echo json_encode(['error' => 'Invalid folder or filename']);
    exit;
}

$filePath = __DIR__ . "/folders/$folder.json";
if (!file_exists($filePath)) {
    echo json_encode(['error' => 'Folder not found']);
    exit;
}

$data = json_decode(file_get_contents($filePath), true);

foreach ($data as $file) {
    if ($file['name'] === $filename) {
        echo json_encode(['content' => $file['content']]);
        exit;
    }
}

echo json_encode(['error' => 'File not found']);
