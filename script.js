document.addEventListener("DOMContentLoaded", () => {
    const images = document.querySelectorAll('.image');
    console.log("Images found:", images.length); // Debugging check

    if (images.length === 0) {
        console.error("No images found! Check your HTML.");
        return;
    }

    const nDisplay = 8;
    const displayDistance = 50;

    let globalIndex = 0;
    let lastMousePosition = { x: 0, y: 0 };

    function activatePic(image, x, y) {
        console.log("Activating image:", image.src); // Debugging
        image.dataset.status = "active";
        image.style.left = x + "px";
        image.style.top = y + "px";
        image.style.zIndex = globalIndex;
    }

    function mouseDistance(x, y) {
        return Math.hypot(x - lastMousePosition.x, y - lastMousePosition.y);
    }

    window.onmousemove = e => {
        if (mouseDistance(e.clientX, e.clientY) > displayDistance) {
            let activePic = images[globalIndex % images.length];
            let inactiveIndex = (globalIndex - nDisplay + images.length) % images.length;
            let inactivePic = images[inactiveIndex];

            activatePic(activePic, e.clientX, e.clientY);
            inactivePic.dataset.status = 'inactive';

            globalIndex++;
            lastMousePosition = { x: e.clientX, y: e.clientY };
        }
    };

    // card scripting begins below
    const cards = document.querySelectorAll('.card'); // Select all cards

    cards.forEach(card => {
        // Store the initial rotation for each card
        const initialRotation = getComputedStyle(card).getPropertyValue('transform');

        card.addEventListener('mousemove', (e) => {
            const { width, height } = card.getBoundingClientRect();
            const offsetX = e.clientX - card.offsetLeft;
            const offsetY = e.clientY - card.offsetTop;

            const centerX = width / 2;
            const centerY = height / 2;

            const deltaX = (offsetX - centerX) / centerX; // range from -1 to 1
            const deltaY = (offsetY - centerY) / centerY; // range from -1 to 1

            const translateX = deltaX * 75; // Move along X-axis
            const translateY = deltaY * 75; // Move along Y-axis

            // Apply the transformations to the card element
            card.style.transform = `${initialRotation} translate(${translateX}px, ${translateY}px)`;
        });

        card.addEventListener('mouseleave', () => {
            // Reset the card's position when the mouse leaves
            card.style.transform = initialRotation;
        });
    });

    // Reveal the second page div when scrolling using Intersection Observer
    const secondPage = document.getElementById('second-page');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                secondPage.style.opacity = 1;
            } else {
                secondPage.style.opacity = 0;
            }
        });
    }, { threshold: 0.1 });

    observer.observe(secondPage);
});