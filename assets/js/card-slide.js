$(document).ready(function() {
    const $cardList = $('#cards');
    const $prevBtn = $('#card-prev');
    const $nextBtn = $('#card-next');
    const $menu = $('#card-menu');

    let startX, isDown = false;
    let isAnimating = false;

    const slideDistance = '-22rem'; 

    function moveNext() {
    if (isAnimating) return;
    
    // 獲取當前第一張卡片的寬度 + 邊距
    const firstCard = $cardList.find('.card-list:first');
    const moveX = firstCard.outerWidth(true); 

    isAnimating = true;

    $cardList.css({
        'transition': 'transform 0.4s ease-in-out',
        'transform': `translateX(-${moveX}px)`
    });

    setTimeout(() => {
        $cardList.css('transition', 'none'); 
        $cardList.append(firstCard); 
        $cardList.css('transform', 'translateX(0)'); 
        isAnimating = false;
    }, 400);
}

    function movePrev() {
        if (isAnimating) return;
        isAnimating = true;

        $cardList.css('transition', 'none');
        $cardList.prepend($cardList.find('.card-list:last'));
        $cardList.css('transform', `translateX(${slideDistance})`);

        $cardList[0].offsetHeight; 

        $cardList.css({
            'transition': 'transform 0.4s ease-in-out',
            'transform': 'translateX(0)'
        });

        setTimeout(() => {
            isAnimating = false;
        }, 400);
    }

    $nextBtn.on('click', moveNext);
    $prevBtn.on('click', movePrev);

    const getX = (e) => e.originalEvent.touches ? e.originalEvent.touches[0].pageX : e.pageX;

    $menu.on('mousedown touchstart', function(e) {
        isDown = true;
        startX = getX(e);
    });

    $(window).on('mouseup touchend', function(e) {
        if (!isDown) return;
        isDown = false;
        
        let endX = e.originalEvent.changedTouches ? e.originalEvent.changedTouches[0].pageX : e.pageX;
        let distance = startX - endX;

        if (distance > 50) moveNext();
        else if (distance < -50) movePrev();
    });

    $menu.on('mousemove touchmove', function(e) {
        if (isDown) e.preventDefault(); 
    });
});

//--------------------about------------//
$(document).ready(function() {
    const $slides = $('.about-slide');
    let currentIndex = 0;
    let isTransitioning = false; // 防止連續點擊造成混亂

    function showSlide(index) {
        if (isTransitioning) return;
        isTransitioning = true;

        const $currentSlide = $slides.filter('.active');
        const $nextSlide = $slides.eq(index);

        $currentSlide.addClass('leaving').removeClass('active');

        $nextSlide.addClass('active');

        setTimeout(() => {
            $currentSlide.removeClass('leaving');
            isTransitioning = false;
        }, 800); // 對應 CSS 的 0.8s
        
        currentIndex = index;
    }

    $('#about-next').on('click', () => {
        let next = (currentIndex + 1) % $slides.length;
        showSlide(next);
    });

    $('#about-prev').on('click', () => {
        let prev = (currentIndex - 1 + $slides.length) % $slides.length;
        showSlide(prev);
    });
});
