import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { EXRLoader } from 'three/addons/loaders/EXRLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


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
    const isMobile = window.innerWidth < 768;
    const cameraZ = isMobile ? -7 : -4;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(-1.4, 0, -4);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
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

        model.traverse((child) => {
            if (child.isMesh) {
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

        model.scale.set(3.8, 3.8, 3.8);
        scene.add(model);
        const isSmallMobile = window.innerWidth <= 375; // 針對 iPhone SE 等小螢幕
        const isMobile = window.innerWidth <= 768;      // 針對一般手機

        let responsiveScale;
        if (isSmallMobile) {
            responsiveScale = 2.2; // SE 用的比例，比原本 3.8 小很多
        } else if (isMobile) {
            responsiveScale = 2.8; // 一般手機 (如 12 Pro) 用的比例
        } else {
            responsiveScale = 3.8; // 電腦版維持原樣
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