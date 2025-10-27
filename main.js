const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('solarCanvas'), antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Lighting
const light = new THREE.PointLight(0xffffff, 2, 500);
scene.add(light);

// sun
const sunGeometry = new THREE.SphereGeometry(4, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffff00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// star background
function createStars(count) {
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < count; i++) {
        positions.push((Math.random() - 0.5) * 2000);
        positions.push((Math.random() - 0.5) * 2000);
        positions.push((Math.random() - 0.5) * 2000);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.PointsMaterial({ color: 0xffffff });
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}
createStars(2000);

// planets
const planetData = [
  { name: 'Mercury', color: 0xaaaaaa, radius: 0.6, distance: 6, speed: 0.04 },
  { name: 'Venus',   color: 0xffaa00, radius: 1.2, distance: 10, speed: 0.03 },
  { name: 'Earth',   color: 0x0000ff, radius: 1.3, distance: 14, speed: 0.025 },
  { name: 'Mars',    color: 0xff0000, radius: 1.0, distance: 16, speed: 0.02 },
  { name: 'Jupiter', color: 0xff8800, radius: 2.4, distance: 22, speed: 0.015 },
  { name: 'Saturn',  color: 0xffd700, radius: 2.2, distance: 26, speed: 0.01 },
  { name: 'Uranus',  color: 0x00ffff, radius: 1.8, distance: 30, speed: 0.008 },
  { name: 'Neptune', color: 0x0000ff, radius: 1.8, distance: 34, speed: 0.006 }
];

const planets = [];
const planetSpeeds = [];
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

planetData.forEach(data => {
    const geoRadius = new THREE.SphereGeometry(data.radius, 32, 32);
    const matColor = new THREE.MeshStandardMaterial({ color:data.color });
    const mesh = new THREE.Mesh(geoRadius, matColor);
    mesh.name = data.name;

    const pivot = new THREE.Object3D();
    pivot.add(mesh);
    mesh.position.x = data.distance;
    scene.add(pivot);

    planets.push({ pivot, mesh, ...data });
    planetSpeeds[data.name] = data.speed;

    // Speed Controls
    const ControlsDiv = document.getElementById('controls');
    const labels = document.createElement('label');
    labels.innerText = `${data.name} speed: `;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 0.1;
    slider.step = 0.001;
    slider.value = data.speed;
    slider.addEventListener('input', e => {
        planetSpeeds[data.name] = parseFloat(e.target.value);
    });
    labels.appendChild(slider);
    ControlsDiv.appendChild(labels);
    ControlsDiv.appendChild(document.createElement("br"));
});

// Pause/Resume Button
let isPaused = false;
const pausedBtn = document.createElement('button');
pausedBtn.innerText = 'Pause';
pausedBtn.onclick = () => {
    isPaused = !isPaused;
    pausedBtn.innerText = isPaused ? 'Resume' : 'Pause';
};
document.getElementById('controls').appendChild(pausedBtn);

// Dark/Light Toggle
const toggleBtn = document.createElement('button');
toggleBtn.innerText = 'Toggle Light/Dark';
toggleBtn.onclick = () => {
    const isDark = document.body.classList.toggle('light-mode');
    renderer.setClearColor(isDark ? 0xffffff : 0x000000);
};
document.getElementById('controls').appendChild(toggleBtn);

// Tooltip
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.color = '#fff';
tooltip.style.padding = '4px';
tooltip.style.background = 'rgba(0, 0, 0, 0.7)';
tooltip.style.borderRadius = '5px';
tooltip.style.pointerEvents = 'none';
tooltip.style.zIndex = '3';
document.body.appendChild(tooltip);

// Camera Setup
camera.position.z = window.innerWidth <600 ? 75 : 40;

// Click to ZoomIn & ZoomOut
let isZoomedIn = false;
let originalCameraPos = camera.position.clone();

window.addEventListener('click', event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const targetObj = intersects[0].object;
        const targetPos = targetObj.getWorldPosition(new THREE.Vector3());

        if (!isZoomedIn) {
            // ZoomIn
            gsap.to(camera.position, {
                duration: 1.2,
                x: targetPos.x + 5,
                y: targetPos.y + 2,
                z: targetPos.z + 5,
                onUpdate: () => {
                    camera.lookAt(targetPos);
                }
            });
            isZoomedIn = true;
        } else {
            // ZoomOut
            gsap.to(camera.position, {
                duration: 1.2,
                x: originalCameraPos.x,
                y: originalCameraPos.y,
                z: originalCameraPos.z,
                onUpdate: () => {
                    camera.lookAt(scene.position);
                }
            });
            isZoomedIn = false;
        }
    }
});

// Mouse Move for tooltip
window.addEventListener('mousemove', event => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));
    if (intersects.length > 0) {
        tooltip.innerText = intersects[0].object.name;
        tooltip.style.left = `${event.clientX + 10}px`;
        tooltip.style.top = `${event.clientY + 10}px`;
        tooltip.style.display = 'block'
    } else {
        tooltip.style.display = 'none';
    }
});

// Animate
function animate() {
    requestAnimationFrame(animate);
    if (!isPaused) {
        planets.forEach(p => {
            p.pivot.rotation.y += planetSpeeds[p.name];
        });
    }
    renderer.render(scene, camera);
}

animate();

// Responsive
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});