document.addEventListener("DOMContentLoaded", () => {
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

    // Manual brochure carousel (no auto-advance)
    const carousels = document.querySelectorAll('[data-carousel]');
    carousels.forEach((carousel) => {
        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
        const prevButton = carousel.querySelector('[data-carousel-prev]');
        const nextButton = carousel.querySelector('[data-carousel-next]');
        let currentIndex = slides.findIndex((slide) => slide.classList.contains('is-active'));

        if (slides.length === 0 || !prevButton || !nextButton) {
            return;
        }

        if (currentIndex < 0) {
            currentIndex = 0;
            slides[0].classList.add('is-active');
        }

        const setActiveSlide = (index) => {
            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === index);
            });
        };

        prevButton.addEventListener('click', () => {
            currentIndex = (currentIndex - 1 + slides.length) % slides.length;
            setActiveSlide(currentIndex);
        });

        nextButton.addEventListener('click', () => {
            currentIndex = (currentIndex + 1) % slides.length;
            setActiveSlide(currentIndex);
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