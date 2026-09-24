<?php
header('Content-Type: application/json');
$folder = $_POST['folder'] ?? '';
$filename = $_POST['filename'] ?? '';
$content = $_POST['content'] ?? '';

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

foreach ($data as $f) {
    if ($f['name'] === $filename) {
        echo json_encode(['error' => 'A file with that name already exists']);
        exit;
    }
}

$data[] = ['name' => $filename, 'content' => $content];
file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT));
echo json_encode(['success' => true]);
