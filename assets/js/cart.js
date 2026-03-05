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
    let ticking = false; // 用於 requestAnimationFrame 節流

    function updateCartAnimation() {
        const rect = track.getBoundingClientRect();
        const windowHeight = window.innerHeight;

        // 只有當 track 進入視窗範圍時才進行計算
        if (rect.top <= windowHeight && rect.bottom >= 0) {
            
            // 限制進度在 0 ~ 1 之間
            let progress = -rect.top / (rect.height - windowHeight);
            progress = Math.max(0, Math.min(1, progress));

            /* ---------- 車子（極致 GPU 加速版） ---------- */
            const carStart = 10;
            const carEnd = 80;
            const carLeftPercent = carStart + progress * (carEnd - carStart);
            
            // 利用已知的 track 寬度 (rect.width) 算出實際像素位置
            const currentX = (rect.width * (carLeftPercent / 100)) - 150;

            // 強制開啟硬體加速，不拖累 CPU
            car.style.transform = `translate3d(${currentX}px, 0, 0)`; 

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
        ticking = false; // 允許下一次的 scroll 事件觸發更新
    }

    // 監聽滾動，使用 passive 提升流暢度
    window.addEventListener('scroll', () => {
        if (!ticking) {
            requestAnimationFrame(updateCartAnimation);
            ticking = true;
        }
    }, { passive: true }); 
});