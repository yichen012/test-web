$(document).ready(function() {
    const $cardList = $('#cards');
    const $prevBtn = $('#card-prev');
    const $nextBtn = $('#card-next');
    const $menu = $('#card-menu');

    let startX, isDown = false;
    let isAnimating = false;

    // 定義每次滑動的距離 (需與您 CSS 中 .card-list 的寬度+margin 相符)
    const slideDistance = '-22rem'; 

    function moveNext() {
        if (isAnimating) return;
        isAnimating = true;

        // 1. 開啟過渡動畫，並往左滑動
        $cardList.css({
            'transition': 'transform 0.4s ease-in-out',
            'transform': `translateX(${slideDistance})`
        });

        // 2. 等動畫結束後 (400ms)，「偷偷」把第一個搬到最後面並瞬間歸位
        setTimeout(() => {
            // 關閉動畫，這樣歸位時才不會有回彈的殘影
            $cardList.css('transition', 'none'); 
            $cardList.append($cardList.find('.card-list:first')); 
            $cardList.css('transform', 'translateX(0)'); 
            
            isAnimating = false;
        }, 400); // 這裡的時間必須與上面 transition 的 0.4s 一致
    }

    function movePrev() {
        if (isAnimating) return;
        isAnimating = true;

        // 1. 關閉動畫，先「偷偷」把最後一個搬到最前面，並讓整個容器往左移
        $cardList.css('transition', 'none');
        $cardList.prepend($cardList.find('.card-list:last'));
        $cardList.css('transform', `translateX(${slideDistance})`);

        // 2. 強制瀏覽器重繪 (Reflow)！這行是防止生硬閃爍的超級關鍵
        $cardList[0].offsetHeight; 

        // 3. 開啟過渡動畫，並滑順地推回原位 (0)
        $cardList.css({
            'transition': 'transform 0.4s ease-in-out',
            'transform': 'translateX(0)'
        });

        setTimeout(() => {
            isAnimating = false;
        }, 400);
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
