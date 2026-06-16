const THREE_SOURCES = [
  "./vendor/three.module.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.180.0/three.module.min.js",
  "https://cdn.bootcdn.net/ajax/libs/three.js/0.180.0/three.module.min.js",
  "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.min.js",
];

const CONFIG = {
  // 9 条纬度线，数量总和 84。后续如果想更密，只调这里即可。
  ringCounts: [6, 8, 10, 12, 12, 12, 10, 8, 6],
  sphereRadius: 2.62,
  cardHeight: 0.78,
  formDuration: 1.5,
  scatterDuration: 0.83,
  rotationSpeed: 0.0018,
  explosionDistance: 3.55,
  axisTiltDegrees: 20,
};

const canvas = document.querySelector("#qiu-sphere-canvas");
const statusNode = document.querySelector("[data-status]");

let THREE;
let scene;
let camera;
let renderer;
let axisGroup;
let sphereGroup;
let cards = [];
let stars;
let sphereInterior;
let clock;
let transition = {
  mode: "formed",
  start: 0,
  duration: CONFIG.formDuration,
};

main().catch((error) => {
  statusNode.textContent = `照片球加载失败：${error.message}`;
});

async function main() {
  THREE = await loadThree();
  initScene();
  createStars();
  await createPhotoSphere();
  bindControls();
  showFormedSphere();
  animate();
}

async function loadThree() {
  for (const source of THREE_SOURCES) {
    try {
      return await import(source);
    } catch (error) {
      // Continue trying the next source.
    }
  }
  throw new Error("Three.js 加载失败，请检查网络。");
}

function initScene() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(42, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0, 8.3);

  renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  clock = new THREE.Clock();
  window.addEventListener("resize", onResize);
}

function createStars() {
  const count = 760;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = THREE.MathUtils.randFloatSpread(14);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(8);
    positions[stride + 2] = THREE.MathUtils.randFloat(-13, -2.6);

    if (Math.random() < 0.58) {
      color.setRGB(0.24, THREE.MathUtils.randFloat(0.62, 0.92), 1);
    } else {
      color.setRGB(0.82, 0.72, 1);
    }

    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  stars = new THREE.Points(geometry, new THREE.PointsMaterial({
    size: 0.026,
    vertexColors: true,
    transparent: true,
    opacity: 0.72,
    depthWrite: false,
  }));
  scene.add(stars);
}

async function createPhotoSphere() {
  const photos = getQiuPhotos();
  if (!photos.length) {
    statusNode.textContent = "没有找到 QIU 图片，请先运行 更新作品清单.bat。";
    return;
  }

  axisGroup = new THREE.Group();
  axisGroup.rotation.z = THREE.MathUtils.degToRad(-CONFIG.axisTiltDegrees);
  scene.add(axisGroup);

  sphereGroup = new THREE.Group();
  axisGroup.add(sphereGroup);

  const points = buildLatitudeSpherePoints();
  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();

  for (let index = 0; index < points.length; index += 1) {
    const photo = photos[index % photos.length];
    const texture = await loadTexture(textureLoader, textureCache, photo.sphereSrc || photo.src);
    const card = createPhotoCard(photo, texture);
    const point = points[index];
    const scatter = createExplosionPoint(point.position, index);

    card.position.copy(scatter);
    card.userData.target = point.position.clone();
    card.userData.scatter = scatter;
    card.userData.baseScale = THREE.MathUtils.randFloat(0.94, 1.06);
    card.userData.phase = Math.random() * Math.PI * 2;
    card.userData.basis = point.basis;

    orientCardOnSphere(card, point.basis, point.position);
    sphereGroup.add(card);
    cards.push(card);
  }

  createSphereInterior();
  statusNode.textContent = `已加载 ${photos.length} 张 QIU 图片，按纬度线生成 ${cards.length} 张球面照片。`;
}

function getQiuPhotos() {
  return (window.WORKS_MANIFEST?.QIU || [])
    .filter((item) => item.type === "image" && (item.sphereSrc || item.src));
}

function createPhotoCard(photo, texture) {
  const aspect = photo.width && photo.height
    ? THREE.MathUtils.clamp(photo.width / photo.height, 0.64, 1.25)
    : 0.75;
  const width = CONFIG.cardHeight * aspect;
  const height = CONFIG.cardHeight;
  const geometry = new THREE.PlaneGeometry(width, height);
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0,
    depthTest: true,
    depthWrite: true,
  });
  return new THREE.Mesh(geometry, material);
}

function loadTexture(textureLoader, textureCache, src) {
  if (textureCache.has(src)) {
    return Promise.resolve(textureCache.get(src));
  }

  return new Promise((resolve) => {
    textureLoader.load(
      encodeURI(src),
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
        textureCache.set(src, texture);
        resolve(texture);
      },
      undefined,
      () => {
        const fallback = createFallbackTexture(src);
        textureCache.set(src, fallback);
        resolve(fallback);
      }
    );
  });
}

function createFallbackTexture(label) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 680;
  const context = textureCanvas.getContext("2d");
  context.fillStyle = "rgba(8, 14, 30, 0.96)";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.strokeStyle = "rgba(105, 205, 255, 0.62)";
  context.lineWidth = 8;
  context.strokeRect(18, 18, textureCanvas.width - 36, textureCanvas.height - 36);
  context.fillStyle = "#eef8ff";
  context.font = "700 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("PHOTO", 256, 310);
  context.font = "400 22px Arial, sans-serif";
  context.fillText(label.split("/").pop().slice(0, 16), 256, 370);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function buildLatitudeSpherePoints() {
  const points = [];
  const ringTotal = CONFIG.ringCounts.length;

  CONFIG.ringCounts.forEach((count, ringIndex) => {
    const v = ringTotal === 1 ? 0.5 : ringIndex / (ringTotal - 1);
    const latitude = THREE.MathUtils.lerp(-1.18, 1.18, v);
    const y = Math.sin(latitude) * CONFIG.sphereRadius;
    const shell = Math.cos(latitude) * CONFIG.sphereRadius;
    const stagger = ringIndex % 2 ? 0.5 : 0;

    for (let localIndex = 0; localIndex < count; localIndex += 1) {
      const angle = ((localIndex + stagger) / count) * Math.PI * 2;
      const position = new THREE.Vector3(
        Math.cos(angle) * shell,
        y,
        Math.sin(angle) * shell
      );
      const basis = createLatitudeCardBasis(position, angle);
      points.push({ position, basis });
    }
  });

  return points;
}

function createLatitudeCardBasis(position, angle) {
  /*
    照片朝向控制：
    - normal：照片贴在球面上的法线方向。
    - right：照片左右边缘沿纬度线切线方向排列。
    - up：照片上下边缘与纬度线平行后的垂直方向，保证同一纬度环看起来整齐。
  */
  const normal = position.clone().normalize();
  const right = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();
  return { normal, right, up };
}

function createExplosionPoint(target, index) {
  const normal = target.clone().normalize();
  const tangent = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const sideJitter = Math.sin(index * 12.9898) * 0.42;
  const upJitter = Math.cos(index * 7.233) * 0.34;
  const outward = CONFIG.explosionDistance + THREE.MathUtils.randFloat(0.3, 1.25);

  return target.clone()
    .add(normal.multiplyScalar(outward))
    .add(tangent.multiplyScalar(sideJitter))
    .add(bitangent.multiplyScalar(upJitter));
}

function orientCardOnSphere(card, basis, position) {
  /*
    当前调试页优先追求“看起来贴在球面上”的照片墙效果：
    位置仍然严格在球面纬度线上；朝向在球面法线和镜头方向之间做混合，
    这样侧面的照片不会全部变成一条线，同时仍保留球壳弧度。
  */
  const normal = position.clone().normalize();
  const right = basis.right.clone().negate();
  const up = basis.up.clone().negate();
  const matrix = new THREE.Matrix4().makeBasis(right, up, normal);
  card.quaternion.setFromRotationMatrix(matrix);
}

function createSphereInterior() {
  sphereInterior = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.sphereRadius * 0.982, 64, 40),
    new THREE.MeshBasicMaterial({
      color: 0x020308,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    })
  );
  sphereInterior.renderOrder = -2;
  sphereInterior.visible = false;
  sphereGroup.add(sphereInterior);
}

function bindControls() {
  document.querySelector("[data-action='form']")?.addEventListener("click", startForm);
  document.querySelector("[data-action='scatter']")?.addEventListener("click", startScatter);
  document.querySelector("[data-action='reset']")?.addEventListener("click", () => {
    cards.forEach((card) => {
      card.position.copy(card.userData.scatter);
      card.material.opacity = 0;
    });
    startForm();
  });
}

function startForm() {
  transition = { mode: "forming", start: clock.getElapsedTime(), duration: CONFIG.formDuration };
  if (sphereInterior) {
    sphereInterior.visible = true;
  }
}

function startScatter() {
  transition = { mode: "scattering", start: clock.getElapsedTime(), duration: CONFIG.scatterDuration };
}

function showFormedSphere() {
  transition = { mode: "formed", start: clock.getElapsedTime(), duration: 1 };
  cards.forEach((card) => {
    card.position.copy(card.userData.target);
    card.material.opacity = 1;
    orientCardOnSphere(card, card.userData.basis, card.userData.target);
  });
  if (sphereInterior) {
    sphereInterior.visible = true;
    sphereInterior.material.opacity = 0.18;
  }
}

function animate() {
  requestAnimationFrame(animate);
  const elapsed = clock.getElapsedTime();
  const progress = THREE.MathUtils.clamp((elapsed - transition.start) / transition.duration, 0, 1);
  const eased = transition.mode === "forming" ? easeOutQuint(progress) : easeInCubic(progress);

  if (sphereGroup) {
    sphereGroup.rotation.y += CONFIG.rotationSpeed;
  }

  cards.forEach((card) => {
    if (transition.mode === "formed") {
      card.position.copy(card.userData.target);
      card.material.opacity = 1;
      orientCardOnSphere(card, card.userData.basis, card.userData.target);
      const formedBreathe = 1 + Math.sin(elapsed * 0.9 + card.userData.phase) * 0.012;
      card.scale.setScalar(card.userData.baseScale * formedBreathe);
      return;
    }

    const from = transition.mode === "forming" ? card.userData.scatter : card.userData.target;
    const to = transition.mode === "forming" ? card.userData.target : card.userData.scatter;
    card.position.lerpVectors(from, to, eased);
    orientCardOnSphere(card, card.userData.basis, card.position);
    card.material.opacity = transition.mode === "forming" ? eased : 1 - easeInCubic(progress);
    const breathe = 1 + Math.sin(elapsed * 0.9 + card.userData.phase) * 0.012;
    card.scale.setScalar(card.userData.baseScale * breathe);
  });

  if (sphereInterior) {
    if (transition.mode === "forming") {
      sphereInterior.visible = true;
      sphereInterior.material.opacity = 0.18 * eased;
    } else {
      sphereInterior.material.opacity = 0.18 * (1 - easeInCubic(progress));
      if (progress >= 1) {
        sphereInterior.visible = false;
      }
    }
  }

  if (transition.mode === "forming" && progress >= 1) {
    transition.mode = "formed";
  }

  if (stars) {
    stars.rotation.y += 0.00025;
  }

  renderer.render(scene, camera);
}

function easeOutQuint(value) {
  return 1 - Math.pow(1 - value, 5);
}

function easeInCubic(value) {
  return value * value * value;
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
}
