document.addEventListener("DOMContentLoaded", () => {
    startCarousel();
    startCountdown();
    initBurnTrigger();
});

// 1. Carousel Slide Show Logic
function startCarousel() {
    const slides = document.querySelectorAll('.carousel-slide');
    if (slides.length === 0) return;
    let currentSlide = 0;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 4000);
}

// 2. Countdown & Midnight Trigger Logic
function startCountdown() {
    const countdownElement = document.getElementById('countdown-timer');
    const demoBtn = document.getElementById('demo-burn-btn');
    if (!countdownElement) return;

    function update() {
        const now = new Date();
        const target = new Date();
        target.setHours(24, 0, 0, 0); // Midnight of next rolling day

        const diff = target - now;

        if (diff <= 0) {
            countdownElement.textContent = "00:00:00";
            
            // Show the button when clock hits 12:00 AM
            if (demoBtn) {
                demoBtn.style.display = 'inline-block';
            }
            
            // Automatically burn away at 12:00 AM
            triggerBurnAway();
            return;
        }

        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        countdownElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    setInterval(update, 1000);
    update();
}

// 3. Burn Away Action & Global Click Listener
function triggerBurnAway() {
    const overlayElement = document.getElementById('birthday-overlay');
    if (overlayElement && !overlayElement.classList.contains('burning')) {
        overlayElement.classList.add('burning');
        
        setTimeout(() => {
            overlayElement.style.display = 'none';
        }, 2000);
    }
}

function initBurnTrigger() {
    document.addEventListener('click', (event) => {
        if (event.target && event.target.id === 'demo-burn-btn') {
            triggerBurnAway();
        }
    });
}
