import * as THREE from 'three';

function initPowderEffect() {
    const container = document.getElementById('powder-container');
    if (!container) return;

    const scene = new THREE.Scene();
    // 相機稍微偏移，看斜向灑粉的角度更好看
    const camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 0, 7); 

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // --- 建立粒子系統 ---
    const particlesCount = 15000; // 增加數量，讓粉末堆積感更厚實
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particlesCount * 3);
    const velocities = []; // 儲存每個粒子的速度向量

    for (let i = 0; i < particlesCount; i++) {
        // 初始位置：集中在「左上方」
        positions[i * 3] = -6 + (Math.random() - 0.5) * 1;     // X: 左側
        positions[i * 3 + 1] = 4 + (Math.random() - 0.5) * 1;  // Y: 上方
        positions[i * 3 + 2] = (Math.random() - 0.5) * 2;      // Z

        velocities.push({
            x: 0.08 + Math.random() * 0.05, // 向右的推力
            y: -0.05 - Math.random() * 0.05 // 向下的重力
        });
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
        size: 0.035,
        color: 0x444444, // 專業金屬粉末深灰色
        transparent: true,
        opacity: 0.6
    });

    const particleSystem = new THREE.Points(geometry, material);
    scene.add(particleSystem);

    const floorY = -3; // 地板高度

    function animate() {
        requestAnimationFrame(animate);
        const pos = geometry.attributes.position.array;

        for (let i = 0; i < particlesCount; i++) {
            const i3 = i * 3;

            // 粒子如果還沒落地
            if (pos[i3 + 1] > floorY) {
                // 斜向移動邏輯
                pos[i3] += velocities[i].x;     // X 軸向右
                pos[i3 + 1] += velocities[i].y; // Y 軸向下
                
                // 模擬空氣阻力，稍微增加一點 Y 的重力感
                velocities[i].y -= 0.001; 
            } else {
                // --- 落地後的堆積行為 (核心修改) ---
                // 讓粒子停在右下角區域，並稍微左右晃動形成「粉末堆」
                if (Math.random() > 0.8) {
                    pos[i3] += (Math.random() - 0.5) * 0.1;
                    pos[i3 + 2] += (Math.random() - 0.5) * 0.1;
                    // 讓粉末慢慢堆高
                    if (pos[i3 + 1] < floorY + 1.5) {
                        pos[i3 + 1] += 0.005; 
                    }
                }

                // 循環機制：如果噴太遠或堆太久，重回左上角發射口
                if (pos[i3] > 8 || Math.random() > 0.996) {
                    pos[i3] = -6;
                    pos[i3 + 1] = 4;
                    velocities[i].y = -0.05; // 重置掉落速度
                }
            }
        }

        geometry.attributes.position.needsUpdate = true;
        renderer.render(scene, camera);
    }

    animate();

    const resizeObserver = new ResizeObserver(() => {
        if (container.clientWidth > 0) {
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.clientWidth, container.clientHeight);
        }
    });
    resizeObserver.observe(container);
}

document.addEventListener('DOMContentLoaded', initPowderEffect);
