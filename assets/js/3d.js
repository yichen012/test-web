import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const activeScenes = {};

function initThreeScene(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const modelPath = container.getAttribute('data-model');
    const scene = new THREE.Scene();

    const width = container.clientWidth;
    const height = container.clientHeight;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(-1.4, 0, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    // --- 關鍵優化 1：解決白斑與剝落感 ---
    renderer.toneMapping = THREE.ACESFilmicToneMapping; // 使用電影級色調映射
    renderer.toneMappingExposure = 1.2;               // 調整亮度（若太亮可降至 1.0）
    renderer.outputColorSpace = THREE.SRGBColorSpace;

    container.appendChild(renderer.domElement);

    //環境
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    pmremGenerator.compileEquirectangularShader();

    new EXRLoader().load('assets/img/3d-model/DayEnvironmentHDRI025_1K_HDR.exr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;
        scene.environment = envMap;
        texture.dispose(); // 釋放原始記憶體
        pmremGenerator.dispose();
    }, undefined, function (error) {
        console.error('載入失敗：', error);
    });

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = true;
    controls.enableZoom = true;

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;

        // --- 關鍵優化 2：方案 A - 強制增加粗糙度下限 ---
        model.traverse((child) => {
            if (child.isMesh) {
                // 確保材質抓取環境反射
                child.material.envMap = scene.environment;

                // 強制設定粗糙度下限，消除銳利白斑
                // 0.15~0.2 之間最能保持金屬感且不產生鋸齒
                if (child.material.roughness < 0.18) {
                    child.material.roughness = 0.18;
                }

                child.material.needsUpdate = true;
            }
        });

        // 置中
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.scale.set(3.8, 3.8, 3.8);
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

// (其餘視窗縮放與 Carousel 監聽程式碼保持不變...)
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
    document.querySelectorAll('.three-canvas-container').forEach(el => {
        initThreeScene(el.id);
    });

    const myCarousel = document.getElementById('hero-carousel');
    if (myCarousel) {
        myCarousel.addEventListener('slid.bs.carousel', function () {
            window.dispatchEvent(new Event('resize'));
        });
    }
});