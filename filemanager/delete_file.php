<?php
header('Content-Type: application/json');
$folder = $_POST['folder'] ?? '';
$filename = $_POST['filename'] ?? '';

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
$newData = array_values(array_filter($data, fn($f) => $f['name'] !== $filename));

if (count($newData) === count($data)) {
    echo json_encode(['error' => 'File not found']);
    exit;
}

file_put_contents($filePath, json_encode($newData, JSON_PRETTY_PRINT));
echo json_encode(['success' => true]);
