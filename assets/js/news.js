document.addEventListener('DOMContentLoaded', function () {
    const sortBtn = document.querySelector('.sort-btn');
    const newsList = document.querySelector('.news-list');
    // 預設狀態：true 代表由近到遠 (Newest First)
    let isNewestFirst = true;

    if (sortBtn && newsList) {
        sortBtn.style.cursor = 'pointer'; // 讓滑鼠移上去顯示手指形狀

        sortBtn.addEventListener('click', function () {
            // 1. 取得所有的新聞項目並轉成陣列
            const items = Array.from(newsList.querySelectorAll('.news-item'));

            // 2. 切換排序邏輯
            isNewestFirst = !isNewestFirst;

            // 3. 執行排序
            items.sort((a, b) => {
                const dateA = new Date(a.querySelector('.n-date').textContent);
                const dateB = new Date(b.querySelector('.n-date').textContent);

                if (isNewestFirst) {
                    return dateB - dateA; // 近 -> 遠 (降冪)
                } else {
                    return dateA - dateB; // 遠 -> 近 (升冪)
                }
            });

            // 4. 更新按鈕文字
            sortBtn.textContent = isNewestFirst ? '近 → 遠' : '遠 → 近';

            // 5. 將排序後的項目重新加入容器 (appendChild 會移動現有元素)
            items.forEach(item => newsList.appendChild(item));
        });
    }
});