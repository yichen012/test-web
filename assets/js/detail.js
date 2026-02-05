document.addEventListener('DOMContentLoaded', function() {
    const productItems = document.querySelectorAll('.product-item');
    const anatomyMain = document.querySelector('.anatomy-main');
    const pointers = document.querySelectorAll('.pointer');
    const infoTitle = document.getElementById('info-title');
    const infoDescription = document.getElementById('info-description');
    const infoImage = document.getElementById('info-image');
    
    // 【新增】一個變數來記住當前是否已固定
    let isPinned = false;
    let pinnedItem = null;

    if (!productItems.length || !anatomyMain) return;

    const showDetails = (item) => {
        // 如果已經有固定的項目，且不是當前滑鼠移入的項目，則不做任何事
        if (isPinned && pinnedItem !== item) return;

        const pointerId = item.getAttribute('data-pointer');
        const title = item.getAttribute('data-title');
        const description = item.getAttribute('data-description');
        const detailImgSrc = item.getAttribute('data-detail-image');

        // 更新內容
        infoTitle.textContent = title;
        infoDescription.textContent = description;
        if (detailImgSrc) infoImage.src = detailImgSrc;

        // 觸發展開動畫
        anatomyMain.classList.add('is-active');

        // 高亮指標
        const targetPointer = document.getElementById(pointerId);
        pointers.forEach(p => p.classList.remove('is-active'));
        if (targetPointer) targetPointer.classList.add('is-active');

        // 高亮列表項
        productItems.forEach(i => i.classList.remove('is-active'));
        item.classList.add('is-active');
    };

    const hideDetails = () => {
        // 【關鍵】如果已經固定了，就不要隱藏
        if (isPinned) return;
        
        anatomyMain.classList.remove('is-active');
        pointers.forEach(p => p.classList.remove('is-active'));
        productItems.forEach(i => i.classList.remove('is-active'));
    };

    productItems.forEach(item => {
        // 滑鼠移入：正常顯示
        item.addEventListener('mouseenter', () => showDetails(item));

        // 【新增】點擊事件
        item.addEventListener('click', function(e) {
            e.preventDefault(); // 防止<a>標籤跳轉

            // 如果點擊的是已經固定的項目，則取消固定
            if (isPinned && pinnedItem === item) {
                isPinned = false;
                pinnedItem = null;
                item.classList.remove('is-pinned'); // 移除固定的樣式
                // (可以選擇讓它保持顯示，或呼叫 hideDetails() 直接收回)
            } 
            // 否則，設定為固定
            else {
                isPinned = true;
                pinnedItem = item;
                
                // 移除其他項目的固定樣式
                productItems.forEach(i => i.classList.remove('is-pinned'));
                // 為當前項加上固定樣式
                item.classList.add('is-pinned');
                
                // 確保內容是顯示的
                showDetails(item);
            }
        });
    });

    const sidebar = document.querySelector('.anatomy-sidebar');
    if (sidebar) {
        sidebar.addEventListener('mouseleave', hideDetails);
    }
});
