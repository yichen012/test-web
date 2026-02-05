$(document).ready(function() {
    const $cardList = $('#cards');
    const $prevBtn = $('#card-prev');
    const $nextBtn = $('#card-next');
    const $menu = $('#card-menu');

    let startX, isDown = false;

    // --- 核心：搬運邏輯 ---
    function moveNext() {
        $cardList.stop().animate({ marginLeft: '-22rem' }, 400, function() {
            $cardList.append($cardList.find('.card-list:first'));
            $cardList.css('margin-left', '0');
        });
    }

    function movePrev() {
        $cardList.prepend($cardList.find('.card-list:last'));
        $cardList.css('margin-left', '-22rem');
        $cardList.stop().animate({ marginLeft: '0' }, 400);
    }

    // --- 1. 按鈕點擊 ---
    $nextBtn.on('click', moveNext);
    $prevBtn.on('click', movePrev);

    // --- 2. 拖曳偵測 (支援滑鼠與觸控) ---
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

        // 判定滑動方向 (50px 為門檻)
        if (distance > 50) moveNext();
        else if (distance < -50) movePrev();
    });

    // 避免拖曳時選取到文字或圖片
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

        // 1. 舊圖標記為離開中
        $currentSlide.addClass('leaving').removeClass('active');

        // 2. 新圖進入
        $nextSlide.addClass('active');

        // 3. 等動畫結束後清理狀態
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
