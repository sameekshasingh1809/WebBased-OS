const icons = document.querySelectorAll('.icon');
icons.forEach(icon => {
    icon.style.position = 'absolute'; // Important for dragging
    icon.style.position = 'relative'; // Important for dragging

    let offsetX, offsetY, isDragging = false;

    icon.addEventListener('mousedown', (e) => {
        isDragging = true;
        offsetX = e.clientX - icon.getBoundingClientRect().left;
        offsetY = e.clientY - icon.getBoundingClientRect().top;
        icon.style.zIndex = 1000;
    });

    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            icon.style.left = (e.clientX - offsetX) + 'px';
            icon.style.top = (e.clientY - offsetY) + 'px';
        }
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        icon.style.zIndex = '';
    });
});