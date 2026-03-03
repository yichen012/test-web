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

// --- 關鍵修正 1：將 animate 搬到外面，讓全域都能呼叫 ---
function animate(containerId) {
    const sceneData = activeScenes[containerId];
    if (!sceneData) return;

    // 確保動畫持續運行
    sceneData.animationId = requestAnimationFrame(() => animate(containerId));

    sceneData.controls.update();
    sceneData.renderer.render(sceneData.scene, sceneData.camera);
}

function initThreeScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modelPath = container.getAttribute('data-model');
    const scene = new THREE.Scene();

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 500;

    const isMobileDevice = window.innerWidth <= 768;
    const isSmallDevice = window.innerWidth <= 375;
    const cameraZ = isSmallDevice ? -7 : (isMobileDevice ? -5.5 : -4);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(-1.4, 0, cameraZ);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load('assets/img/3d-model/DayEnvironmentHDRI025_1K_HDR.exr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');

    const loader = new GLTFLoader();
    loader.setDRACOLoader(dracoLoader);

    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeVertexNormals();
                child.material.flatShading = false;
                if (child.material.envMap) {
                    child.material.needsUpdate = true;
                }
                child.material.envMap = scene.environment;
                if (child.material.roughness < 0.18) {
                    child.material.roughness = 0.18;
                }
                child.material.needsUpdate = true;
            }
        });

        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        let responsiveScale = isSmallDevice ? 2.2 : (isMobileDevice ? 2.8 : 3.8);
        model.scale.set(responsiveScale, responsiveScale, responsiveScale);
        scene.add(model);

        // --- 關鍵修正 2：存入全域物件並立即啟動動畫 ---
        activeScenes[containerId] = { scene, camera, renderer, controls };
        animate(containerId);
    });
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

document.addEventListener('DOMContentLoaded', () => {
    const myCarouselElement = document.getElementById('hero-carousel');

    if (myCarouselElement) {
        new bootstrap.Carousel(myCarouselElement, {
            interval: 10000,
            pause: 'hover',
            ride: 'carousel',
            touch: false
        });
    }

    const firstItem = document.querySelector('.carousel-item.active .three-canvas-container');
    if (firstItem) {
        initThreeScene(firstItem.id);
    }

    if (myCarouselElement) {
        myCarouselElement.addEventListener('slide.bs.carousel', function (e) {
            // 停止所有動畫節省效能
            Object.keys(activeScenes).forEach(id => {
                if (activeScenes[id].animationId) {
                    cancelAnimationFrame(activeScenes[id].animationId);
                }
            });

            const nextContainer = e.relatedTarget.querySelector('.three-canvas-container');
            if (nextContainer && !activeScenes[nextContainer.id]) {
                initThreeScene(nextContainer.id);
            }
        });

        myCarouselElement.addEventListener('slid.bs.carousel', function (e) {
            const activeContainer = e.relatedTarget.querySelector('.three-canvas-container');
            // 現在 animate 是全域的，這裡可以正確執行
            if (activeContainer && activeScenes[activeContainer.id]) {
                animate(activeContainer.id);
            }
            window.dispatchEvent(new Event('resize'));
        });
    }
});