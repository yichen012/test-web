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

// --- 優化核心：全域共用單一的 Renderer、Scene、Camera ---
let globalRenderer, globalScene, globalCamera, globalControls;
let currentModel = null;
let animationId = null;
let currentContainer = null;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// 初始化全域的 3D 環境 (只執行一次)
function initGlobalThree() {
    if (globalRenderer) return;

    globalScene = new THREE.Scene();
    
    // 預設給個尺寸，後面 resize 會更新
    globalCamera = new THREE.PerspectiveCamera(45, window.innerWidth / 500, 0.1, 1000);
    
    globalRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // 降級處理：強制設為 1，大幅減輕低階電腦負擔
    globalRenderer.setPixelRatio(1); 
    globalRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    globalRenderer.toneMappingExposure = 1.2;
    globalRenderer.outputColorSpace = THREE.SRGBColorSpace;

    const pmremGenerator = new THREE.PMREMGenerator(globalRenderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load('assets/img/3d-model/DayEnvironmentHDRI025_1K_HDR.exr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        globalScene.environment = envMap;
        texture.dispose();
        pmremGenerator.dispose();
    });

    globalControls = new OrbitControls(globalCamera, globalRenderer.domElement);
    globalControls.enableDamping = true;
    globalControls.dampingFactor = 0.05;
}

// 核心動畫迴圈
function animate() {
    if (!currentContainer) return;
    animationId = requestAnimationFrame(animate);
    globalControls.update();
    globalRenderer.render(globalScene, globalCamera);
}

// 載入模型並掛載到指定容器
function loadModelToContainer(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    // 1. 初始化環境
    initGlobalThree();
    currentContainer = container;

    // 2. 停止舊的動畫迴圈
    if (animationId) {
        cancelAnimationFrame(animationId);
    }

    // 3. 移除舊模型，釋放記憶體
    if (currentModel) {
        globalScene.remove(currentModel);
        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.dispose();
                if (child.material) {
                    if(Array.isArray(child.material)){
                        child.material.forEach(m => m.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        currentModel = null;
    }

    // 4. 設定新的尺寸與相機位置
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || 500;
    const isMobileDevice = window.innerWidth <= 768;
    const isSmallDevice = window.innerWidth <= 375;
    const cameraZ = isSmallDevice ? -7 : (isMobileDevice ? -5.5 : -4);

    globalCamera.aspect = width / height;
    globalCamera.position.set(-1.4, 0, cameraZ);
    globalCamera.updateProjectionMatrix();
    globalRenderer.setSize(width, height);

    // --- 🌟 關鍵修正：防閃爍處理 ---
    // 先把畫布變透明，並加上 CSS 漸變動畫
    globalRenderer.domElement.style.transition = 'opacity 0.4s ease-in-out';
    globalRenderer.domElement.style.opacity = '0'; 
    
    // 將畫布搬到新的容器中
    container.appendChild(globalRenderer.domElement);

    // 強制渲染一幀「沒有模型」的空場景，徹底洗掉舊殘影
    globalRenderer.render(globalScene, globalCamera);
    // -----------------------------

    // 6. 載入新模型
    const modelPath = container.getAttribute('data-model');
    gltfLoader.load(modelPath, (gltf) => {
        currentModel = gltf.scene;

        currentModel.traverse((child) => {
            if (child.isMesh) {
                child.geometry.computeVertexNormals();
                child.material.flatShading = false;
                child.material.envMap = globalScene.environment;
                if (child.material.roughness < 0.18) {
                    child.material.roughness = 0.18;
                }
                child.material.needsUpdate = true;
            }
        });

        const box = new THREE.Box3().setFromObject(currentModel);
        const center = box.getCenter(new THREE.Vector3());
        currentModel.position.sub(center);

        let responsiveScale = isSmallDevice ? 2.2 : (isMobileDevice ? 2.8 : 3.8);
        currentModel.scale.set(responsiveScale, responsiveScale, responsiveScale);
        
        globalScene.add(currentModel);

        // --- 🌟 關鍵修正：模型載入完畢後淡入顯示 ---
        // 稍微延遲一下確保畫面已經畫上去，再把透明度改回 1
        requestAnimationFrame(() => {
            globalRenderer.domElement.style.opacity = '1';
        });
        // -----------------------------

        // 7. 啟動動畫
        animate();
    });
}

// 監聽視窗縮放
window.addEventListener('resize', () => {
    clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        if (currentContainer && globalRenderer && globalCamera) {
            const w = currentContainer.clientWidth;
            const h = currentContainer.clientHeight;
            globalCamera.aspect = w / h;
            globalCamera.updateProjectionMatrix();
            globalRenderer.setSize(w, h);
        }
    }, 250);
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
        loadModelToContainer(firstItem.id);
    }

    if (myCarouselElement) {
        // 使用 slid 事件 (滑動結束後) 再載入新模型，避免切換過程卡頓
        myCarouselElement.addEventListener('slid.bs.carousel', function (e) {
            const nextContainer = e.relatedTarget.querySelector('.three-canvas-container');
            if (nextContainer) {
                loadModelToContainer(nextContainer.id);
            }
        });
    }
});