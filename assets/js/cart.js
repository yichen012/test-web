document.addEventListener('DOMContentLoaded', () => {
    const track = document.querySelector('.road-sticky-track');
    const car = document.getElementById('road-car');
    const textGroups = [
        document.getElementById('road-text-group-1'),
        document.getElementById('road-text-group-2'),
        document.getElementById('road-text-group-3'),
        document.getElementById('road-text-group-4'),
        document.getElementById('road-text-group-5')
    ];

    if (!track || !car) return;

    const triggerPoints = [0.02, 0.23, 0.45, 0.58, 0.75];

    window.addEventListener('scroll', () => {
        const rect = track.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        if (rect.top <= 0 && rect.bottom >= windowHeight) {

            const progress = -rect.top / (rect.height - windowHeight);

            /* ---------- 車子（不分裝置） ---------- */
            const carStart = -20;
            const carEnd = 80;
            const carLeft = carStart + progress * (carEnd - carStart);
            car.style.left = `calc(${carLeft}% - 150px)`;

            /* ---------- 文字邏輯分流 ---------- */
            const isMobile = window.innerWidth <= 430;

            if (isMobile) {
                let activeIndex = 0;
                for (let i = 0; i < triggerPoints.length; i++) {
                    if (progress >= triggerPoints[i]) {
                        activeIndex = i;
                    }
                }

                textGroups.forEach((group, index) => {
                    if (group) {
                        group.classList.toggle('is-visible', index === activeIndex);
                    }
                });

            } else {
                textGroups.forEach((group, index) => {
                    if (group) {
                        if (progress >= triggerPoints[index]) {
                            group.classList.add('is-visible');
                        } else {
                            group.classList.remove('is-visible');
                        }
                    }
                });
            }
        }
    });
});

