document.addEventListener('scroll', function() {
    const track = document.querySelector('.sticky-track');
    if (!track) return;

    const rect = track.getBoundingClientRect();
    const windowHeight = window.innerHeight;
    
    if (rect.top < windowHeight && rect.bottom > 0) {
        
        let progress = (-rect.top) / (track.scrollHeight - windowHeight);
        const finalProgress = Math.max(0, Math.min(1, progress));

        const steps = [
            { 
                fill: document.getElementById('icon-fill-1'), 
                text: document.getElementById('flow-step-1'),
                wrapper: document.getElementById('icon-step-1')
            },
            { 
                fill: document.getElementById('icon-fill-2'), 
                text: document.getElementById('flow-step-2'),
                wrapper: document.getElementById('icon-step-2')
            },
            { 
                fill: document.getElementById('icon-fill-3'), 
                text: document.getElementById('flow-step-3'),
                wrapper: document.getElementById('icon-step-3')
            },
            { 
                fill: document.getElementById('icon-fill-4'), 
                text: document.getElementById('flow-step-4'),
                wrapper: document.getElementById('icon-step-4')
            }
        ];
        
        const totalSteps = steps.length;
        const stepSize = 1 / totalSteps;
        const activeTextIndex = Math.floor(finalProgress * totalSteps);

        steps.forEach((step, index) => {
            if (!step.fill || !step.text || !step.wrapper) return;

            const startProgress = index * stepSize;
            let fillPercent = 0;
            if (finalProgress >= startProgress) {
                fillPercent = Math.min(100, ((finalProgress - startProgress) / stepSize) * 100);
            }
            
            const fillOpacity = fillPercent / 100;
            step.fill.style.opacity = fillOpacity;

            step.wrapper.classList.toggle('is-active', fillOpacity > 0.01 && fillOpacity < 1);

            if (finalProgress >= 1) {
                step.text.classList.toggle('is-active', index === totalSteps - 1);
                step.text.classList.toggle('is-dimmed', index !== totalSteps - 1);
            } else {
                step.text.classList.toggle('is-active', index === activeTextIndex);
                step.text.classList.toggle('is-dimmed', index !== activeTextIndex);
            }
        });
    }
});

window.addEventListener('load', () => {
    document.dispatchEvent(new Event('scroll'));
});
