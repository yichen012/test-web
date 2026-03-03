import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

THREE.DefaultLoadingManager.onLoad = function () {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        loadingScreen.classList.add('loader-hidden');
    }
};

const activeScenes = {};

function initThreeScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modelPath = container.getAttribute('data-model');
    const scene = new THREE.Scene();

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 500;

    // 根據螢幕寬度決定相機深度，解決模型視覺上太大的問題
    const isMobileDevice = window.innerWidth <= 768;
    const isSmallDevice = window.innerWidth <= 375;
    const cameraZ = isSmallDevice ? -7 : (isMobileDevice ? -5.5 : -4);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    // 應用動態計算的 cameraZ
    camera.position.set(-1.4, 0, cameraZ);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    // 環境貼圖處理
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load('assets/img/3d-model/DayEnvironmentHDRI025_1K_HDR.exr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    }, undefined, function (error) {
        console.error('環境貼圖載入失敗：', error);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // --- 配置 Draco 解碼器 ---
    const dracoLoader = new DRACOLoader();
    // 使用 Google 託管的解碼器組件，省去自己放檔案的麻煩
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader); // 核心：設定解壓縮工具

    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.material.envMap = scene.environment;
                if (child.material.roughness < 0.18) {
                    child.material.roughness = 0.18;
                }
                child.material.needsUpdate = true;
            }
        });

        // 模型置中處理
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        // 響應式縮放邏輯
        let responsiveScale;
        if (isSmallDevice) {
            responsiveScale = 2.2; // iPhone SE
        } else if (isMobileDevice) {
            responsiveScale = 2.8; // 一般手機
        } else {
            responsiveScale = 3.8; // 桌機
        }

        model.scale.set(responsiveScale, responsiveScale, responsiveScale);
        scene.add(model);

        activeScenes[containerId] = { scene, camera, renderer, controls };
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
    }
    animate();
}

// 監聽視窗縮放
window.addEventListener('resize', () => {
    Object.keys(activeScenes).forEach(id => {
        const item = activeScenes[id];
        const container = document.getElementById(id);
        if (container && item) {
            const w = container.clientWidth;
            const h = container.clientHeight;
            item.camera.aspect = w / h;
            item.camera.updateProjectionMatrix();
            item.renderer.setSize(w, h);
        }
    });
});

document.addEventListener('DOMContentLoaded', async () => {
    // 1. 取得所有需要加載的容器 ID
    const containers = Array.from(document.querySelectorAll('.three-canvas-container'));
    
    if (containers.length > 0) {
        // 2. 先加載第一個（確保使用者最快看到首屏）
        const firstId = containers[0].id;
        await initThreeScene(firstId); 

        // 3. 重點：依序「偷偷」加載剩下的模型
        // 這樣在你還在看第一張圖時，第二、三張已經在背景排隊下載了
        for (let i = 1; i < containers.length; i++) {
            const containerId = containers[i].id;
            if (!activeScenes[containerId]) {
                // 給一點小延遲，避免跟第一張搶頻寬
                setTimeout(() => {
                    initThreeScene(containerId);
                }, i * 1500); // 每隔 1.5 秒載一個
            }
        }
    }

    // 4. 輪播設定與 Resize 邏輯維持不變
    const myCarouselElement = document.getElementById('hero-carousel');
    if (myCarouselElement) {
        const carousel = new bootstrap.Carousel(myCarouselElement, {
            interval: 10000,
            pause: 'hover',
            ride: 'carousel',
            touch: false 
        });
        new bootstrap.Carousel(myCarouselElement, { interval: 10000 });
        myCarouselElement.addEventListener('slid.bs.carousel', () => {
            window.dispatchEvent(new Event('resize'));
        });
    }
});