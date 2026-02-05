import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 儲存每個容器的控制實例
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
    container.appendChild(renderer.domElement);

    // 燈光
    scene.add(new THREE.AmbientLight(0xffffff, 2.5));
    const light = new THREE.DirectionalLight(0xffffff, 3);
    light.position.set(-10, 10, 10);
    scene.add(light);

    // --- 關鍵：加入控制項 (允許放大縮小與移動) ---
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // 讓旋轉有慣性更順滑
    controls.dampingFactor = 0.05;
    controls.enablePan = true;    // 允許右鍵平移
    controls.enableZoom = true;   // 允許滾輪縮放

    const loader = new GLTFLoader();
    loader.load(modelPath, (gltf) => {
        const model = gltf.scene;
        
        // 置中
        const box = new THREE.Box3().setFromObject(model);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center);

        model.scale.set(3.8, 3.8, 3.8);
        scene.add(model);

        // 儲存引用以便 resize 使用
        activeScenes[containerId] = { scene, camera, renderer, controls };
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update(); // 更新控制項
        renderer.render(scene, camera);
    }
    animate();
}

// 處理視窗大小改變 (縮放不會跑掉)
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

// 初始化與 Carousel 箭頭連動
document.addEventListener('DOMContentLoaded', () => {
    // 找出所有 3D 容器並初始化
    document.querySelectorAll('.three-canvas-container').forEach(el => {
        initThreeScene(el.id);
    });

    // 處理 Bootstrap Carousel 切換
    const myCarousel = document.getElementById('hero-carousel');
    if (myCarousel) {
        myCarousel.addEventListener('slid.bs.carousel', function () {
            // 切換完畢後，確保當前畫布正確渲染
            window.dispatchEvent(new Event('resize'));
        });
    }
});