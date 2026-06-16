const THREE = window.THREE;

if (!THREE) {
  throw new Error("Three.js 加载失败，请检查网络或本地 vendor/three.module.min.js 文件。");
}

const SITE_CONTENT = window.SITE_CONTENT || {};

function stripShaderComments(source) {
  return String(source)
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "");
}

/*
  绗笁闃舵棣栭〉鍦烘櫙璇存槑
  ------------------------------------------------------------------
  1. 閫氳繃 Points + BufferGeometry 缁樺埗鑳屾櫙鏄熺偣鍜岄珮瀵嗗害閾舵渤绮掑瓙銆?  2. 閫氳繃鑷畾涔?ShaderMaterial 缁樺埗鏌斿拰鍙戝厜鍦嗙幆锛岄伩鍏嶅閮ㄨ创鍥句緷璧栥€?  3. 涓績 AI 琚偣鍑诲悗锛岀矑瀛愪緷娆＄粡鍘嗙垎鐐搞€佹敹缂╃幆缁曘€佹按娉㈠睍寮€鍜岄摱娌虫垚褰€?  4. 閾舵渤鎴愬舰鍚庤 HTML UI 鎺ョ鏍囬銆佺伀绠寜閽拰杩斿洖绠ご锛岀悆褰?UI 涓庨紶鏍囬粦娲炰氦浜掔户缁鐣欍€?*/

const canvas = document.querySelector("#space-canvas");
const CONFIG = {
  cameraZ: 8,
  ringHitRadius: 2.08,
  ringBaseScale: 0.28,
  ringCollapseDuration: 0.42,
  galaxyParticleCount: 26208,
  galaxyOuterRadius: 4.9,
  starCount: 360,
  spaceDustCount: 720,
  centerLabel: "AI",
  galaxyMoveDuration: 2.7,
  armFormationDurationScale: 1.4,
  galaxyCenterMoveDuration: 3,
  // 5 个作品 UI 的运行轨迹半径比例。
  portfolioUIRadiusRatio: 0.5,
  portfolioZoomDuration: 1.35,
  qiuRingCounts: [6, 8, 10, 12, 12, 12, 10, 8, 6],
  qiuSphereRadius: 2.62,
  qiuCardHeight: 0.78,
  qiuDisplayScale: 0.72,
  qiuFormDuration: 1.5,
  qiuFormStagger: 0.85,
  qiuScatterDuration: 0.83,
  qiuRotationSpeed: 0.0018,
  qiuExplosionDistance: 3.55,
  qiuAxisTiltDegrees: 20,
  qiuLayerFov: 42,
  qiuLayerCameraZ: 8.3,
  qiuViewportWidthRatio: 0.52,
  qiuViewportHeightRatio: 0.82,
  qiuViewportRightRatio: 0,
  qiuViewportTopRatio: 0.02,
  qiuScrollBoostMax: 0.0105,
  qiuScrollBoostDecay: 0.9,
  qiuPhotoBrightness: 1.28,
  spaceBackgroundParallaxMax: 18,
};

const PORTFOLIO_UI_ITEMS = Object.freeze([
  { key: "Design", name: getPortfolioItemName("Design"), icon: "./assets/ui-icons/Design.png", iconKey: "Design" },
  { key: "Photograph", name: getPortfolioItemName("Photograph"), icon: "./assets/ui-icons/Photograph.png", iconKey: "Photograph" },
  { key: "Poster", name: getPortfolioItemName("Poster"), icon: "./assets/ui-icons/Poster.png", iconKey: "Poster" },
  { key: "Project", name: getPortfolioItemName("Project"), icon: "./assets/ui-icons/Project.png", iconKey: "Project" },
  { key: "Video", name: getPortfolioItemName("Video"), icon: "./assets/ui-icons/Video.png", iconKey: "Video" },
]);

function getPortfolioItemName(key) {
  return SITE_CONTENT.portfolioItems?.find((item) => item.key === key)?.name || key;
}

function getPortfolioItemKey(nameOrKey) {
  return PORTFOLIO_UI_ITEMS.find((item) => item.name === nameOrKey || item.key === nameOrKey)?.key || nameOrKey;
}

const WORKS_LIBRARY = Object.freeze({
  Design: [],
  Photograph: [],
  Poster: [],
  Project: [],
  Video: [],
  QIU: [],
});
let worksLibrary = WORKS_LIBRARY;
const PROJECT_ASSET_ROOT = "works/Project";
const FIRST_PROJECT_VIDEO_SRC = `${PROJECT_ASSET_ROOT}/project01.mp4`;
const SECOND_PROJECT_VIDEO_SRC = `${PROJECT_ASSET_ROOT}/project02.mp4`;
const THIRD_PROJECT_VIDEO_SRC = `${PROJECT_ASSET_ROOT}/project03.mp4`;

/*
  绗笁闃舵娌跨敤鐨勭矑瀛愮姸鎬佹満銆?  idle: 鍦烘櫙灏氭湭瀹屾垚鎸傝浇鏃剁殑闈欐鐘舵€併€?  ringPulse: AI 鍏夊湀寰呯偣鍑诲苟鍛煎惛鍙戝厜銆?  explode: 鍏夊湀鏀剁缉瀹屾垚锛岀矑瀛愪粠涓績鍚戝鍐插紑銆?  contractAndOrbit: 淇濈暀鐘舵€佸悕缁欏悗缁墿灞曪紱褰撳墠鐢ㄤ簬鍚屾壒绮掑瓙鐨勫洖缂╋紝涓嶅仛鏃嬭浆銆?  rippleExpand: 鍚屾壒绮掑瓙鍐嶆鑶ㄨ儉锛屽鍥存洿蹇€佸唴灞傛洿鎱紝鐩村埌瀹屽叏鐐稿紑銆?  galaxyFormed: 閾舵渤闆忓舰绋冲畾涓嬫潵骞舵寔缁紦鎱㈡棆杞€?*/
const PARTICLE_PHASES = Object.freeze({
  idle: "idle",
  ringPulse: "ringPulse",
  explode: "explode",
  contractAndOrbit: "contractAndOrbit",
  rippleExpand: "rippleExpand",
  galaxyFormed: "galaxyFormed",
});

const PHASE_DURATIONS = Object.freeze({
  // 第一次爆炸开始到第二次爆炸开始的总时长，保留之前压缩后的节奏。
  explode: 0.648,
  contractAndOrbit: 0.414,
  rippleExpand: 2.16,
});

const state = {
  scene: null,
  camera: null,
  qiuLayerScene: null,
  qiuCamera: null,
  renderer: null,
  clock: new THREE.Clock(),
  raycaster: new THREE.Raycaster(),
  pointer: new THREE.Vector2(),
  pointerClient: new THREE.Vector2(window.innerWidth / 2, window.innerHeight / 2),
  pointerWorld: new THREE.Vector3(),
  isPointerInside: false,
  blackHoleStrength: 0,
  blackHoleTargetStrength: 0,
  stars: null,
  spaceDust: null,
  blackHoleCursor: null,
  ringGroup: null,
  ringMesh: null,
  ringHitTarget: null,
  labelSprite: null,
  galaxy: null,
  qiuAxisGroup: null,
  qiuSphereGroup: null,
  qiuSphereInterior: null,
  qiuPhotoCards: [],
  qiuTransition: { mode: "hidden", start: 0, duration: 1 },
  qiuScrollBoost: 0,
  portfolioUIGroup: null,
  portfolioUIItems: [],
  portfolioUIHitTargets: [],
  isPortfolioMenuOpen: false,
  detailPage: null,
  detailTitle: null,
  detailBackButton: null,
  detailGallery: null,
  mediaLightbox: null,
  mediaLightboxStage: null,
  mediaLightboxClose: null,
  designLightboxReturn: null,
  backgroundMusic: null,
  isBackgroundMusicBlocked: false,
  isBackgroundMusicPausedForVideo: false,
  detailPageParticles: null,
  selectedPortfolioItem: null,
  selectedPortfolioGroup: null,
  detailTransition: null,
  isDetailHistoryActive: false,
  overlayUI: null,
  galaxyMove: null,
  galaxyLayout: "center",
  scrollProgress: 0,
  galaxyTilt: 0,
  isPortfolioTitleReady: false,
  particlePhase: PARTICLE_PHASES.idle,
  particlePhaseStartTime: null,
  isHoveringRing: false,
  isExplosionStarted: false,
  collapseStartTime: null,
};

initScene();
createStarsBackground();
createSpaceDustParticles();
createGoRing();
createOverlayUI();
applyEditableContent();
createBlackHoleCursor();
initBackgroundMusic();
loadWorksManifest();
state.particlePhase = PARTICLE_PHASES.ringPulse;
bindInteractions();
animate();

/**
 * 鍒濆鍖?WebGL 鍦烘櫙銆侀€忚鐩告満鍜岄€忔槑娓叉煋鍣ㄣ€? * 鍚庣画闃舵澧炲姞閾舵渤銆侀粦娲炴垨鐞冨舰 UI 鏃讹紝閮藉彲浠ョ户缁鐢ㄥ悓涓€濂?scene銆? */
function initScene() {
  state.scene = new THREE.Scene();
  state.scene.fog = new THREE.FogExp2(0x02030b, 0.032);
  state.camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 100);
  state.camera.position.set(0, 0, CONFIG.cameraZ);
  state.qiuLayerScene = new THREE.Scene();
  state.qiuCamera = new THREE.PerspectiveCamera(CONFIG.qiuLayerFov, 1, 0.1, 100);
  state.qiuCamera.position.set(0, 0, CONFIG.qiuLayerCameraZ);
  state.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  state.renderer.autoClear = false;
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  state.renderer.setClearColor(0x02030b, 0);
  state.renderer.outputColorSpace = THREE.SRGBColorSpace;
  state.scene.add(new THREE.AmbientLight(0x88aaff, 0.42));
}

/**
 * 鍒涘缓娣辫壊澶滅┖涓殑绋€鐤忔槦鐐广€? * 鍚庣画鈥滈摱娌冲舰鎴愨€濋鐣欙細鍙粠杩欓噷缁х画鍔犲叆閾舵渤鏃嬭噦鐐逛簯鍜屾棆杞建閬撱€? */
function createStarsBackground() {
  const positions = new Float32Array(CONFIG.starCount * 3);
  const colors = new Float32Array(CONFIG.starCount * 3);
  const sizes = new Float32Array(CONFIG.starCount);
  const color = new THREE.Color();

  for (let index = 0; index < CONFIG.starCount; index += 1) {
    const stride = index * 3;
    const distance = THREE.MathUtils.randFloat(11, 34);
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
    positions[stride] = distance * Math.sin(phi) * Math.cos(theta);
    positions[stride + 1] = distance * Math.sin(phi) * Math.sin(theta);
    positions[stride + 2] = THREE.MathUtils.randFloat(-26, -2);
    color.setHSL(THREE.MathUtils.randFloat(0.56, 0.71), THREE.MathUtils.randFloat(0.22, 0.62), THREE.MathUtils.randFloat(0.68, 0.98));
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
    sizes[index] = THREE.MathUtils.randFloat(0.035, 0.12);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    vertexShader: stripShaderComments(`
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * (280.0 / -viewPosition.z);
      }
    `),
    fragmentShader: stripShaderComments(`
      varying vec3 vColor;
      void main() {
        float distanceToCenter = distance(gl_PointCoord, vec2(0.5));
        float core = smoothstep(0.48, 0.0, distanceToCenter);
        float halo = smoothstep(0.5, 0.08, distanceToCenter) * 0.65;
        float alpha = core + halo;
        if (alpha < 0.02) { discard; }
        gl_FragColor = vec4(vColor, alpha);
      }
    `),
  });
  state.stars = new THREE.Points(geometry, material);
  state.scene.add(state.stars);
}

/**
 * 鍒涘缓鍏ㄥ睆婕傛诞绌洪棿绮掑瓙銆? * 杩欏眰鐙珛浜庨摱娌冲姩鐢伙細绮掑瓙娌?z 杞存潵鍥炵┛琛岋紝闈犺繎闀滃ご鏃舵洿澶э紝杩滅鏃舵洿灏忋€? */
function createSpaceDustParticles() {
  const count = CONFIG.spaceDustCount;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const driftSpeeds = new Float32Array(count);
  const driftPhases = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const palettePick = Math.random();

    positions[stride] = THREE.MathUtils.randFloatSpread(25);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(15);
    positions[stride + 2] = THREE.MathUtils.randFloat(-34, 5.6);
    sizes[index] = THREE.MathUtils.randFloat(0.035, 0.14);
    driftSpeeds[index] = THREE.MathUtils.randFloat(0.18, 0.72);
    driftPhases[index] = Math.random() * Math.PI * 2;

    if (palettePick < 0.34) {
      color.setRGB(0.72, THREE.MathUtils.randFloat(0.3, 0.48), 1);
    } else if (palettePick < 0.7) {
      color.setRGB(THREE.MathUtils.randFloat(0.82, 1), 0.94, 1);
    } else {
      color.setRGB(1, THREE.MathUtils.randFloat(0.68, 0.84), THREE.MathUtils.randFloat(0.26, 0.48));
    }

    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aDriftSpeed", new THREE.BufferAttribute(driftSpeeds, 1));
  geometry.setAttribute("aDriftPhase", new THREE.BufferAttribute(driftPhases, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aDriftSpeed;
      attribute float aDriftPhase;
      varying vec3 vColor;
      varying float vDepthGlow;
      uniform float uTime;

      void main() {
        vColor = color;
        float depthRange = 39.6;
        float depthTravel = mod(position.z + uTime * aDriftSpeed + 34.0, depthRange) - 34.0;
        vec3 animatedPosition = position;
        animatedPosition.z = depthTravel;
        animatedPosition.x += sin(uTime * (0.18 + aDriftSpeed * 0.24) + aDriftPhase) * 0.42;
        animatedPosition.y += cos(uTime * (0.15 + aDriftSpeed * 0.2) + aDriftPhase * 1.7) * 0.3;

        vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        float perspectiveScale = clamp(340.0 / max(1.0, -viewPosition.z), 2.0, 42.0);
        vDepthGlow = smoothstep(-34.0, 4.8, depthTravel);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * perspectiveScale;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vDepthGlow;

      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float core = smoothstep(0.18, 0.0, radius);
        float halo = smoothstep(0.5, 0.04, radius);
        float alpha = (core * 1.18 + halo * 0.58) * mix(0.3, 0.92, vDepthGlow);

        if (alpha < 0.02) {
          discard;
        }

        gl_FragColor = vec4(vColor * (0.9 + core * 0.7), alpha);
      }
    `,
  });

  state.spaceDust = new THREE.Points(geometry, material);
  state.scene.add(state.spaceDust);
}

/** 鍒涘缓 DOM 榛戞礊榧犳爣锛屽昂瀵告帴杩戠郴缁熺澶达紝澶栧洿閫忛暅鑼冨洿鐢?CSS 浼厓绱犺礋璐ｃ€?*/
function createBlackHoleCursor() {
  state.blackHoleCursor = document.querySelector("[data-black-hole-cursor]");
}

/** 鍒涘缓涓績 AI 鍏夊湀锛屽苟淇濈暀鍚庣画 UI 鎵╁睍鍛戒腑鍖哄煙銆?*/
function createGoRing() {
  state.ringGroup = new THREE.Group();
  const ringGeometry = new THREE.PlaneGeometry(4.8, 4.8, 1, 1);
  const ringMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 }, uCollapse: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uTime;
      uniform float uHover;
      uniform float uCollapse;
      void main() {
        vec2 centeredUv = vUv - vec2(0.5);
        float radius = length(centeredUv);
        float pulse = 0.5 + 0.5 * sin(uTime * 1.65);
        float breathingRadius = mix(0.345, 0.362, pulse);
        float thinRing = smoothstep(0.022, 0.0, abs(radius - breathingRadius));
        float softHalo = smoothstep(0.145, 0.0, abs(radius - breathingRadius));
        float innerMist = smoothstep(0.405, 0.08, radius) * 0.11;
        float circularMask = 1.0 - smoothstep(0.455, 0.49, radius);
        float energy = 0.88 + pulse * 0.34 + uHover * 0.34;
        vec3 ice = vec3(0.76, 0.94, 1.0);
        vec3 violet = vec3(0.58, 0.26, 1.0);
        vec3 ringColor = mix(ice, violet, 0.42 + pulse * 0.32);
        vec3 haloColor = mix(vec3(0.18, 0.52, 1.0), violet, 0.58);
        float collapseFade = 1.0 - smoothstep(0.72, 1.0, uCollapse);
        vec3 finalColor = ringColor * thinRing * 1.7;
        finalColor += haloColor * softHalo * energy;
        finalColor += ice * innerMist;
        float alpha = (thinRing + softHalo * 0.58 + innerMist) * energy * collapseFade * circularMask;
        if (alpha < 0.01) { discard; }
        gl_FragColor = vec4(finalColor, alpha);
      }
    `,
  });
  state.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
  state.ringGroup.add(state.ringMesh);
  state.labelSprite = createCenterLabelSprite(CONFIG.centerLabel);
  state.ringGroup.add(state.labelSprite);

  /* 鍚庣画 UI 鎺ュ叆鐐癸細鍛戒腑闈㈠彲鏇挎崲鎴愰粦娲炲叆鍙ｃ€佹寜閽姸鎬佹垨鏇村涓績浜や簰缁勪欢銆?*/
  state.ringHitTarget = new THREE.Mesh(new THREE.CircleGeometry(CONFIG.ringHitRadius, 64), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }));
  state.ringGroup.add(state.ringHitTarget);
  state.scene.add(state.ringGroup);
}

/** 浣跨敤 2D Canvas 鐢熸垚 AI 绾圭悊锛涘悗缁闇€鍒囨崲鏂囨锛屽彧瑕佹敼 CONFIG.centerLabel銆?*/
function createCenterLabelSprite(text) {
  const textureCanvas = document.createElement("canvas");
  const size = 512;
  textureCanvas.width = size;
  textureCanvas.height = size;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, size, size);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = '650 168px "Orbitron", "Rajdhani", "Segoe UI", sans-serif';
  context.shadowBlur = 28;
  context.shadowColor = "rgba(172, 221, 255, 0.95)";
  context.fillStyle = "rgba(230, 246, 255, 0.98)";
  context.fillText(text, size / 2, size / 2);
  context.shadowBlur = 42;
  context.shadowColor = "rgba(158, 88, 255, 0.72)";
  context.strokeStyle = "rgba(176, 106, 255, 0.68)";
  context.lineWidth = 3;
  context.strokeText(text, size / 2, size / 2);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(2.08, 2.08, 1);
  return sprite;
}

/**
 * 鍒涘缓閾舵渤绮掑瓙銆? * 涓€鎵圭矑瀛愪細瀹屾暣璧拌繃 explode -> contractAndOrbit -> rippleExpand -> galaxyFormed銆? * 鍚嶅瓧閲屼粛淇濈暀 contractAndOrbit 鍏煎鐜版湁鐘舵€佸叆鍙ｏ紝浣嗕腑娈电幇鍦ㄥ彧鏄悓涓€鍥㈢矑瀛愮殑鍥炵缉銆? * 鏁翠釜杩囩▼涓嶆浛鎹?Points 瀵硅薄锛岀涓夐樁娈垫帴 UI 鏃朵篃鏇村鏄撴帶鍒躲€? */
function createGalaxyParticles() {
  const count = CONFIG.galaxyParticleCount;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count);
  const sizes = new Float32Array(count);
  const explodeAngles = new Float32Array(count);
  const explodeRadii = new Float32Array(count);
  const galaxyAngles = new Float32Array(count);
  const galaxyRadii = new Float32Array(count);
  const layerIds = new Float32Array(count);
  const armIds = new Float32Array(count);
  const thicknesses = new Float32Array(count);
  const rippleDelays = new Float32Array(count);
  const phaseBoosts = new Float32Array(count);
  const spiralStrengths = new Float32Array(count);
  const ringCount = 14;
  const armCount = 2;

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const seed = Math.random();
    const pairIndex = Math.floor(index / 2);
    const pairSeed = seededUnitRandom(pairIndex + 1);
    const pairRadiusSeed = seededUnitRandom(pairIndex + 13.7);
    const pairOffsetSeed = seededUnitRandom(pairIndex + 29.3);
    const isPhaseBoost = index >= count * 0.5;
    const layer = index % ringCount;
    const ringT = layer / (ringCount - 1);
    const arm = index % armCount;
    const ringDensityBias = Math.pow(Math.random(), 0.68);
    const isCoreParticle = index < count * 0.24;
    const isArmEnhanceParticle = !isCoreParticle && pairSeed > 0.44;
    const isOuterVapor = !isCoreParticle && !isArmEnhanceParticle && seed > 0.62;
    const coreFillBias = Math.pow(Math.random(), 1.8);
    const compactDiskRadius = THREE.MathUtils.lerp(0, CONFIG.galaxyOuterRadius * 0.92, Math.pow(Math.random(), 0.72));
    const vaporRadius = THREE.MathUtils.lerp(1.65, CONFIG.galaxyOuterRadius, Math.pow(Math.random(), 0.56));
    const armRadius = THREE.MathUtils.lerp(0.22, CONFIG.galaxyOuterRadius, Math.pow(pairRadiusSeed, 0.82));
    const galaxyRadius = isCoreParticle
      ? THREE.MathUtils.lerp(0, CONFIG.galaxyOuterRadius * 0.54, Math.pow(Math.random(), 2.85))
      : (isArmEnhanceParticle ? armRadius : (isOuterVapor ? vaporRadius : compactDiskRadius));
    const spiralTwist = galaxyRadius * (isOuterVapor ? 1.08 : 1.62);
    const armAngle = (arm / armCount) * Math.PI * 2;
    const scarfOffset = Math.sin(ringT * Math.PI * 8 + seed * Math.PI * 2) * (isOuterVapor ? 0.92 : 0.34);

    // 绮掑瓙璧风偣鎸ゅ湪涓績闄勮繎锛岃绗竴娆＄垎鐐告洿鍍忕敱 AI 鏍稿績鐐圭噧銆?
    positions[stride] = THREE.MathUtils.randFloatSpread(0.08);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(0.08);
    positions[stride + 2] = THREE.MathUtils.randFloatSpread(0.04);
    seeds[index] = seed;
    sizes[index] = THREE.MathUtils.randFloat(0.032, isOuterVapor ? 0.098 : ringT < 0.2 ? 0.15 : 0.11);
    explodeAngles[index] = Math.random() * Math.PI * 2;
    explodeRadii[index] = (THREE.MathUtils.randFloat(0.92, isOuterVapor ? 2.95 : 2.08) + ringT * 0.45) * 0.5;
    const armTwistTurnsReduced = Math.max(0, 1.56 - (Math.PI * 2) / CONFIG.galaxyOuterRadius);
    const pairArmBaseAngle = pairRadiusSeed * Math.PI * 2;
    const symmetricArmAngle = isArmEnhanceParticle
      ? pairArmBaseAngle + arm * Math.PI + galaxyRadius * armTwistTurnsReduced
      : armAngle + galaxyRadius * armTwistTurnsReduced;
    const armSoftness = (isOuterVapor ? 0.62 : 0.34) * 1.12;
    const offsetSign = pairOffsetSeed < 0.5 ? -1 : 1;
    const offsetMagnitude = Math.pow(Math.abs(pairOffsetSeed * 2 - 1), 1.42) * armSoftness;
    const symmetricOffset = offsetSign * offsetMagnitude;
    const baseDiskAngle = Math.random() * Math.PI * 2;
    const baseVaporAngle = Math.random() * Math.PI * 2 + scarfOffset * 0.22;
    const armAngleTarget = isArmEnhanceParticle
      ? symmetricArmAngle + symmetricOffset
      : symmetricArmAngle + symmetricOffset + scarfOffset * (isOuterVapor ? 0.16 : 0.08);
    galaxyRadii[index] = galaxyRadius;
    layerIds[index] = ringT;
    armIds[index] = arm / Math.max(1, armCount - 1);
    thicknesses[index] = THREE.MathUtils.randFloatSpread(isOuterVapor ? 0.78 : 0.16) * (1.08 - ringT * 0.24);
    // 瓒婇潬澶栬秺鏃╁畬鎴愬啀娆¤啫鑳€锛岃秺闈犲唴瓒婃參锛屽舰鎴愬鍦堝厛鎾戝紑鐨勫眰娆°€?
    rippleDelays[index] = (1 - ringT) * 0.38 + (isOuterVapor ? -0.08 : 0.08) + THREE.MathUtils.randFloat(0, 0.1);
    phaseBoosts[index] = isPhaseBoost ? 1 : 0;
    /*
      鍙岃灪鏃嬭噦瀵嗗害鎺у埗锛?      鍚庢澧炲己绮掑瓙閲屾湁涓€閮ㄥ垎鍚戜腑蹇冨绉扮殑 spiralAngle 闈犳嫝锛?      鍋忕Щ瓒婂皬鐨勭矑瀛愯秺闆嗕腑锛屽鍥寸洏闈粛淇濈暀鍘熸湁浜戦浘绮掑瓙浣滀负铻嶅悎灞傘€?    */
    const armCloseness = 1 - Math.min(1, Math.abs(symmetricOffset) / armSoftness);
    const softDensityFalloff = Math.pow(armCloseness * armCloseness * (3 - 2 * armCloseness), 0.72);
    const armDensityWeight = isArmEnhanceParticle ? THREE.MathUtils.lerp(0.24, 0.82, softDensityFalloff) : 0;
    galaxyAngles[index] = isArmEnhanceParticle
      ? armAngleTarget
      : THREE.MathUtils.lerp(isOuterVapor ? baseVaporAngle : baseDiskAngle, armAngleTarget, armDensityWeight);
    spiralStrengths[index] = armDensityWeight;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aExplodeAngle", new THREE.BufferAttribute(explodeAngles, 1));
  geometry.setAttribute("aExplodeRadius", new THREE.BufferAttribute(explodeRadii, 1));
  geometry.setAttribute("aGalaxyAngle", new THREE.BufferAttribute(galaxyAngles, 1));
  geometry.setAttribute("aGalaxyRadius", new THREE.BufferAttribute(galaxyRadii, 1));
  geometry.setAttribute("aLayer", new THREE.BufferAttribute(layerIds, 1));
  geometry.setAttribute("aArm", new THREE.BufferAttribute(armIds, 1));
  geometry.setAttribute("aThickness", new THREE.BufferAttribute(thicknesses, 1));
  geometry.setAttribute("aRippleDelay", new THREE.BufferAttribute(rippleDelays, 1));
  geometry.setAttribute("aPhaseBoost", new THREE.BufferAttribute(phaseBoosts, 1));
  geometry.setAttribute("aSpiralStrength", new THREE.BufferAttribute(spiralStrengths, 1));

  /*
    粒子显示保底方案：
    之前的复杂 ShaderMaterial 在反复修改中文注释后，个别浏览器会因为 shader 注释/编码问题导致粒子对象创建了但不可见。
    这里改为 CPU 更新 BufferGeometry 的 position/color，仍然使用同一批粒子完成：
    1. 第一次爆炸
    2. 连续收缩
    3. 第二次水波式展开
    4. 银河成形后持续旋转
    后续如果要恢复更高级的 shader 光效，可以只替换 updateCpuGalaxyParticles() 的计算部分。
  */
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const whiteCore = new THREE.Color(0.78, 1.0, 1.0);
  const goldCore = new THREE.Color(1.0, 0.72, 0.24);
  const cyanMix = new THREE.Color(0.24, 0.92, 1.0);
  const blueMix = new THREE.Color(0.06, 0.48, 1.0);
  const violetMix = new THREE.Color(0.48, 0.16, 0.95);
  const deepOuter = new THREE.Color(0.08, 0.2, 0.62);
  const magentaSpark = new THREE.Color(0.88, 0.1, 0.86);
  for (let index = 0; index < count; index += 1) {
    const radiusT = THREE.MathUtils.clamp(galaxyRadii[index] / CONFIG.galaxyOuterRadius, 0, 1);
    const accent = Math.random() > 0.955;
    const goldAccent = radiusT < 0.25 && Math.random() > 0.84;
    if (goldAccent) {
      color.copy(whiteCore).lerp(goldCore, THREE.MathUtils.smoothstep(radiusT, 0, 0.25) * 0.72 + 0.24);
    } else if (accent) {
      color.copy(blueMix).lerp(magentaSpark, 0.72);
    } else if (radiusT < 0.22) {
      color.copy(whiteCore).lerp(cyanMix, THREE.MathUtils.smoothstep(radiusT, 0, 0.22) * 0.34);
    } else if (radiusT < 0.52) {
      color.copy(cyanMix).lerp(blueMix, THREE.MathUtils.smoothstep(radiusT, 0.22, 0.52));
    } else if (radiusT < 0.82) {
      color.copy(blueMix).lerp(violetMix, THREE.MathUtils.smoothstep(radiusT, 0.52, 0.82));
    } else {
      color.copy(violetMix).lerp(deepOuter, THREE.MathUtils.smoothstep(radiusT, 0.82, 1));
    }
    colors[index * 3] = color.r;
    colors[index * 3 + 1] = color.g;
    colors[index * 3 + 2] = color.b;
  }
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  const pointMaterial = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    depthTest: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      attribute vec3 color;
      varying vec3 vColor;
      varying float vGlow;

      void main() {
        vColor = color;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * (960.0 / max(1.0, -viewPosition.z));
        vGlow = clamp(gl_PointSize / 24.0, 0.65, 1.45);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vGlow;

      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float core = smoothstep(0.2, 0.0, radius);
        float halo = smoothstep(0.5, 0.08, radius);
        float alpha = core * 0.82 + halo * 0.49;
        if (radius > 0.5 || alpha < 0.02) {
          discard;
        }
        vec3 glowColor = vColor * (1.1 + core * 1.2) + vColor * halo * 0.52;
        gl_FragColor = vec4(glowColor, alpha * vGlow);
      }
    `,
  });

  state.galaxy = new THREE.Points(geometry, pointMaterial);
  state.galaxy.scale.setScalar(getResponsiveGalaxyScale());
  state.galaxy.userData.cpuGalaxy = {
    positions,
    seeds,
    sizes,
    explodeAngles,
    explodeRadii,
    galaxyAngles,
    galaxyRadii,
    thicknesses,
    rippleDelays,
    phaseBoosts,
    spiralStrengths,
    galaxyStartTime: 0,
    blackHolePosition: new THREE.Vector3(999, 999, 0),
    blackHoleStrength: 0,
  };
  state.scene.add(state.galaxy);
  beginParticlePhase(PARTICLE_PHASES.explode);
  return state.galaxy;

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uPhase: { value: 0 },
      uPhaseProgress: { value: 0 },
      uTime: { value: 0 },
      uOuterRadius: { value: CONFIG.galaxyOuterRadius },
      uGalaxyStartTime: { value: 0 },
      uBlackHolePosition: { value: new THREE.Vector3(999, 999, 0) },
      uBlackHoleStrength: { value: 0 },
    },
    vertexShader: stripShaderComments(`
      attribute float aSeed;
      attribute float aSize;
      attribute float aExplodeAngle;
      attribute float aExplodeRadius;
      attribute float aGalaxyAngle;
      attribute float aGalaxyRadius;
      attribute float aLayer;
      attribute float aArm;
      attribute float aThickness;
      attribute float aRippleDelay;
      attribute float aPhaseBoost;
      attribute float aSpiralStrength;

      varying vec3 vGalaxyColor;
      varying float vGlow;
      varying float vReveal;

      uniform float uPhase;
      uniform float uPhaseProgress;
      uniform float uTime;
      uniform float uOuterRadius;
      uniform float uGalaxyStartTime;
      uniform vec3 uBlackHolePosition;
      uniform float uBlackHoleStrength;

      float easeOutCubic(float x) {
        return 1.0 - pow(1.0 - x, 3.0);
      }

      float easeInOutCubic(float x) {
        return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5;
      }

      vec3 polarPoint(float angle, float radius, float zValue) {
        return vec3(cos(angle) * radius, sin(angle) * radius, zValue);
      }

      void main() {
        float progress = clamp(uPhaseProgress, 0.0, 1.0);
        float radiusT = clamp(aGalaxyRadius / uOuterRadius, 0.0, 1.0);
        float flutter = sin(aGalaxyRadius * 2.85 - uTime * 1.35 + aSeed * 17.0);
        float explodeAngle = aExplodeAngle + aSeed * 0.7;
        float filledCore = pow(radiusT, 0.72);
        float explodeRadius = aExplodeRadius * easeOutCubic(progress) * filledCore;
        vec3 explodePoint = polarPoint(explodeAngle, explodeRadius, aThickness * 0.34);
        explodePoint.y *= mix(0.98, 0.72, progress);

        /*
          鍚屾壒绮掑瓙鐨勪腑娈佃繍鍔ㄦā鍨嬶細
          绗竴娈靛厛鑶ㄨ儉锛岀浜屾娌垮師鏂瑰悜鍥炵缉锛岀涓夋娌垮師鏂瑰悜鍐嶆鑶ㄨ儉鍒版渶澶с€?          杩欓噷娌℃湁瑙掑害閲嶆帓锛屽洜姝や腑闂磋繃绋嬩笉浼氬嚭鐜版彁鍓嶆棆杞垨鈥滄崲涓€鎵圭矑瀛愨€濈殑閿欒銆?        */
        // 棣栫垎鏈€澶у崐寰勫氨鏄洖缂╄捣鐐癸紝闃舵鍒囨崲鏃朵笉鍐嶈拷鍔犱换浣曞崐寰勪慨姝ｃ€?
        float firstBurstRadius = aExplodeRadius * filledCore;
        float contractedRadius = firstBurstRadius * mix(1.0, 0.24 + radiusT * 0.06, easeInOutCubic(progress));
        vec3 orbitPoint = polarPoint(explodeAngle, contractedRadius, aThickness * mix(0.34, 0.84, progress));
        orbitPoint.y *= mix(0.72, 0.68, progress);

        // 鍐嶈啫鑳€闃舵锛氬灞傚欢杩熸洿灏忋€佹帹杩涙洿蹇紱鍐呭眰浼氱◢鏅氳拷涓娿€?
        float rippleProgress = smoothstep(aRippleDelay, min(1.0, aRippleDelay + 0.44), progress);
        float rippleEase = easeOutCubic(rippleProgress);
        float fullBurstRadius = max(aGalaxyRadius * (1.02 + radiusT * 0.12), aExplodeRadius * 1.28 * filledCore);
        float outerSpeed = mix(0.76, 1.18, radiusT);
        float reExpandRadius = mix(contractedRadius, fullBurstRadius, clamp(rippleEase * outerSpeed, 0.0, 1.0));
        float radialWave = sin(rippleProgress * 3.14159 + aSeed * 4.0) * radiusT * 0.22;
        vec3 ripplePoint = polarPoint(explodeAngle, reExpandRadius + radialWave, aThickness + flutter * 0.12);
        ripplePoint.y *= mix(0.68, 0.56, rippleEase);
        ripplePoint.x += sin(explodeAngle * 2.0 + aSeed * 13.0) * radiusT * 0.14;

        // 鍏ㄩ儴鐐稿紑鍚庣殑浜戝洟浣嶇疆锛屼笅涓€娈垫墠浠庤繖閲屾棆鍏ラ摱娌崇洏闈€?
        vec3 fullBurstPoint = polarPoint(explodeAngle, fullBurstRadius, aThickness + flutter * (0.06 + radiusT * 0.09));
        fullBurstPoint.y *= 0.56 + radiusT * 0.08;
        fullBurstPoint.x += sin(explodeAngle * 2.0 + aSeed * 13.0) * radiusT * 0.14;

        /*
          閾舵渤鏃嬭浆鎺у埗浣嶇疆锛?          galaxyRotation 鍐冲畾鏈€缁堥洀褰㈡寔缁紦鎱㈡棆杞殑閫熷害锛岀涓夐樁娈典篃鍙粠杩欓噷鎺ュ彸绉诲竷灞€銆?        */
        float galaxyAge = max(0.0, uTime - uGalaxyStartTime);
        float galaxyRotation = galaxyAge * 0.13;
        float galaxyMotion = smoothstep(0.0, 0.55, galaxyAge);
        float breathingWave = sin(fullBurstRadius * 3.6 - uTime * 0.88 + aSeed * 11.0) * radiusT * 0.11 * galaxyMotion;
        float vaporWarp = sin(explodeAngle * 2.2 - uTime * 0.38 + aSeed * 19.0) * radiusT * 0.18 * galaxyMotion;
        /*
          鍙岃灪鏃嬬嚎鐢熸垚浣嶇疆锛?          璧疯浆鍚庣殑 2 绉掑唴锛屾瘡涓寮虹矑瀛愭寜闅忔満寤惰繜鍚戜腑蹇冨绉拌灪鏃嬬洰鏍囬潬鎷€?          aSpiralStrength 瓒婇珮锛岃鏄庡畠瓒婅创杩戣灪鏃嬬嚎锛屽眬閮ㄥ瘑搴︿篃瓒婇珮銆?        */
        // 铻烘棆鑷傚舰鎴愰€熷害鎺у埗锛氬綋鍓嶉€熷害涓轰笂涓€鐗堢殑 60%锛屽洜姝ょ敓鎴愭椂闂寸害鎷夐暱鍒?1 / 0.6銆?
        float spiralDelay = aSeed * 2.13;
        float spiralGrow = smoothstep(spiralDelay, spiralDelay + 1.2, galaxyAge);
        float spiralAngle = mix(explodeAngle, aGalaxyAngle, spiralGrow * aSpiralStrength);
        /*
          浜屾澶栫垎鐨勭粓鐐瑰氨鏄摱娌宠捣杞洏闈細
          浣跨敤鍚屼竴涓?explodeAngle 涓?fullBurstRadius锛岄樁娈靛垏鎹㈡椂浣嶇疆杩炵画锛岄殢鍚庡彧鍙犲姞鏃嬭浆瑙掋€?        */
        vec3 galaxyPoint = polarPoint(spiralAngle + galaxyRotation, fullBurstRadius + breathingWave, aThickness + flutter * (0.06 + radiusT * 0.09));
        galaxyPoint.y *= 0.56 + radiusT * 0.08;
        galaxyPoint.x += sin(explodeAngle * 2.0 + aSeed * 13.0) * radiusT * 0.14 + vaporWarp;
        galaxyPoint.y += cos(explodeAngle * 1.6 + aSeed * 9.0) * radiusT * 0.06 * galaxyMotion;

        vec3 animatedPosition = explodePoint;
        if (uPhase > 0.5 && uPhase < 1.5) {
          animatedPosition = orbitPoint;
        } else if (uPhase > 1.5 && uPhase < 2.5) {
          animatedPosition = ripplePoint;
        } else if (uPhase > 2.5) {
          animatedPosition = galaxyPoint;
        }

        /*
          榧犳爣榛戞礊寮曞姏鎺у埗浣嶇疆锛?          榛戞礊涓嶅啀鐢熸垚鐙珛鐜粫绮掑瓙锛岃€屾槸浣滀负闅愬舰寮曞姏鐐规煍鍜屽奖鍝嶉摱娌冲凡鏈夌矑瀛愩€?          璺濈瓒婅繎鍚稿紩瓒婂己锛涘垏鍚戝亸绉昏绮掑瓙杞诲井缁曡锛寀BlackHoleStrength 鍥炶惤鏃朵細鑷劧鍥炲埌鍘熻建閬撱€?        */
        float blackHoleEnabled = step(2.5, uPhase) * uBlackHoleStrength;
        vec3 toBlackHole = uBlackHolePosition - animatedPosition;
        float blackHoleDistance = length(toBlackHole.xy);
        float gravityRange = mix(0.78, 1.18, radiusT);
        float gravityMask = smoothstep(gravityRange, 0.0, blackHoleDistance) * blackHoleEnabled;
        float softGravity = pow(gravityMask, 1.65);
        vec2 gravityDirection = blackHoleDistance > 0.0001 ? toBlackHole.xy / blackHoleDistance : vec2(0.0);
        vec2 tangentDirection = vec2(-gravityDirection.y, gravityDirection.x);
        float orbitSpin = sin(uTime * 2.35 + aSeed * 23.0 + radiusT * 5.0);
        float attraction = softGravity * mix(0.16, 0.42, 1.0 - radiusT);
        float orbitAmount = softGravity * mix(0.035, 0.16, radiusT) * orbitSpin;
        animatedPosition.xy += gravityDirection * attraction + tangentDirection * orbitAmount;
        animatedPosition.z += softGravity * sin(uTime * 3.0 + aSeed * 17.0) * 0.035;

        /*
          绗簩娆″鐖嗗瀵嗘帶鍒讹細
          aPhaseBoost 鏍囪鏂板鐨勪竴鍗婄矑瀛愶紝瀹冧滑浠?rippleExpand 寮€濮嬪姞鍏ョ敾闈€?        */
        float rippleReveal = smoothstep(0.0, 0.34, progress + radiusT * 0.18 - aSeed * 0.08);
        vReveal = aPhaseBoost < 0.5 ? 1.0 : (uPhase < 1.5 ? 0.0 : (uPhase < 2.5 ? rippleReveal : 1.0));

        /*
          绮掑瓙棰滆壊姊害鎺у埗浣嶇疆锛?          radiusT 瓒婃帴杩?0 瓒婂亸浜潚钃濓紝澶栧眰閫愭笎娌夊埌鐢佃摑涓庢繁闈掕壊锛屽苟鍙犲皯閲忔磱绾㈢伀鑺便€?        */
        vec3 cyanCore = vec3(0.35, 1.0, 1.0);
        vec3 electricBlue = vec3(0.05, 0.45, 1.0);
        vec3 deepTeal = vec3(0.02, 0.56, 0.72);
        vec3 vaporBlue = vec3(0.02, 0.16, 0.48);
        vec3 magentaSpark = vec3(0.88, 0.08, 0.8);
        vec3 diskBlue = mix(cyanCore, electricBlue, smoothstep(0.06, 0.4, radiusT));
        vec3 cyanVapor = mix(electricBlue, deepTeal, smoothstep(0.32, 0.74, radiusT));
        vec3 videoBlue = mix(diskBlue, cyanVapor, smoothstep(0.24, 0.68, radiusT));
        videoBlue = mix(videoBlue, vaporBlue, smoothstep(0.78, 1.0, radiusT) * 0.62);
        float accentSeed = step(0.91, fract(aSeed * 41.0 + aArm * 7.0));
        float accentBand = smoothstep(0.12, 0.84, radiusT) * (1.0 - smoothstep(0.92, 1.0, radiusT));
        vGalaxyColor = mix(videoBlue, magentaSpark, accentSeed * accentBand * 0.82);
        vGlow = 0.92 + (1.0 - radiusT) * 0.44 + aSpiralStrength * spiralGrow * 0.24 + softGravity * 0.42 + sin(aSeed * 31.0 + uTime * 1.4) * 0.08;

        vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * (720.0 / -viewPosition.z) * (1.0 + (1.0 - radiusT) * 0.28) * max(0.001, vReveal);
      }
    `),
    fragmentShader: stripShaderComments(`
      varying vec3 vGalaxyColor;
      varying float vGlow;
      varying float vReveal;

      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float core = smoothstep(0.22, 0.0, radius);
        float halo = smoothstep(0.5, 0.05, radius);
        float alpha = (core * 1.15 + halo * 0.82) * vGlow * vReveal;

        if (alpha < 0.02) {
          discard;
        }

        gl_FragColor = vec4(vGalaxyColor * (1.1 + core * 0.85), alpha);
      }
    `),
  });

  material.vertexShader = `
    attribute float aSeed;
    attribute float aSize;
    attribute float aExplodeAngle;
    attribute float aExplodeRadius;
    attribute float aGalaxyAngle;
    attribute float aGalaxyRadius;
    attribute float aThickness;
    attribute float aRippleDelay;
    attribute float aPhaseBoost;
    attribute float aSpiralStrength;

    varying vec3 vGalaxyColor;
    varying float vGlow;
    varying float vReveal;

    uniform float uPhase;
    uniform float uPhaseProgress;
    uniform float uTime;
    uniform float uOuterRadius;
    uniform float uGalaxyStartTime;
    uniform vec3 uBlackHolePosition;
    uniform float uBlackHoleStrength;

    float easeOutCubic(float x) {
      return 1.0 - pow(1.0 - x, 3.0);
    }

    float easeInOutCubic(float x) {
      return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2.0 * x + 2.0, 3.0) * 0.5;
    }

    vec3 polarPoint(float angle, float radius, float zValue) {
      return vec3(cos(angle) * radius, sin(angle) * radius, zValue);
    }

    void main() {
      float progress = clamp(uPhaseProgress, 0.0, 1.0);
      float radiusT = clamp(aGalaxyRadius / uOuterRadius, 0.0, 1.0);
      float explodeAngle = aExplodeAngle + aSeed * 0.7;
      float firstRadius = aExplodeRadius * (0.28 + radiusT * 0.9);
      vec3 explodePoint = polarPoint(explodeAngle, firstRadius * easeOutCubic(progress), aThickness * 0.28);
      explodePoint.y *= mix(1.0, 0.72, progress);

      float contractedRadius = firstRadius * mix(1.0, 0.24 + radiusT * 0.05, easeInOutCubic(progress));
      vec3 contractPoint = polarPoint(explodeAngle, contractedRadius, aThickness * mix(0.28, 0.78, progress));
      contractPoint.y *= 0.7;

      float rippleProgress = smoothstep(aRippleDelay, min(1.0, aRippleDelay + 0.44), progress);
      float finalRadius = max(aGalaxyRadius * (1.02 + radiusT * 0.12), firstRadius * 1.55);
      float expandRadius = mix(contractedRadius, finalRadius, easeOutCubic(rippleProgress));
      vec3 ripplePoint = polarPoint(explodeAngle, expandRadius, aThickness + sin(rippleProgress * 3.14159 + aSeed * 4.0) * radiusT * 0.12);
      ripplePoint.y *= mix(0.7, 0.56, rippleProgress);

      float galaxyAge = max(0.0, uTime - uGalaxyStartTime);
      float galaxyRotation = galaxyAge * 0.13;
      float spiralGrow = smoothstep(aSeed * 1.28, aSeed * 1.28 + 1.2, galaxyAge);
      float spiralAngle = mix(explodeAngle, aGalaxyAngle, spiralGrow * max(0.22, aSpiralStrength));
      vec3 galaxyPoint = polarPoint(spiralAngle + galaxyRotation, finalRadius, aThickness * 0.74);
      galaxyPoint.y *= 0.58 + radiusT * 0.08;

      vec3 animatedPosition = explodePoint;
      if (uPhase > 0.5 && uPhase < 1.5) {
        animatedPosition = contractPoint;
      } else if (uPhase > 1.5 && uPhase < 2.5) {
        animatedPosition = ripplePoint;
      } else if (uPhase > 2.5) {
        animatedPosition = galaxyPoint;
      }

      float blackHoleEnabled = step(2.5, uPhase) * uBlackHoleStrength;
      vec3 toBlackHole = uBlackHolePosition - animatedPosition;
      float blackHoleDistance = length(toBlackHole.xy);
      float gravityMask = smoothstep(1.05, 0.0, blackHoleDistance) * blackHoleEnabled;
      vec2 gravityDirection = blackHoleDistance > 0.0001 ? toBlackHole.xy / blackHoleDistance : vec2(0.0);
      vec2 tangentDirection = vec2(-gravityDirection.y, gravityDirection.x);
      animatedPosition.xy += gravityDirection * gravityMask * 0.24 + tangentDirection * sin(uTime * 2.4 + aSeed * 23.0) * gravityMask * 0.08;

      float phaseReveal = aPhaseBoost < 0.5 ? 1.0 : smoothstep(1.5, 2.5, uPhase + progress * 0.5);
      vReveal = phaseReveal;

      vec3 cyanCore = vec3(0.35, 1.0, 1.0);
      vec3 electricBlue = vec3(0.05, 0.45, 1.0);
      vec3 deepBlue = vec3(0.02, 0.16, 0.48);
      vec3 magentaSpark = vec3(0.88, 0.08, 0.8);
      vec3 baseColor = mix(cyanCore, electricBlue, smoothstep(0.06, 0.5, radiusT));
      baseColor = mix(baseColor, deepBlue, smoothstep(0.74, 1.0, radiusT) * 0.55);
      float accent = step(0.92, fract(aSeed * 41.0));
      vGalaxyColor = mix(baseColor, magentaSpark, accent * 0.55);
      vGlow = 0.9 + (1.0 - radiusT) * 0.55 + aSpiralStrength * spiralGrow * 0.25 + gravityMask * 0.35;

      vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
      gl_Position = projectionMatrix * viewPosition;
      gl_PointSize = aSize * (760.0 / max(1.0, -viewPosition.z)) * (1.0 + (1.0 - radiusT) * 0.4) * max(0.001, vReveal);
    }
  `;
  material.fragmentShader = `
    varying vec3 vGalaxyColor;
    varying float vGlow;
    varying float vReveal;

    void main() {
      float radius = distance(gl_PointCoord, vec2(0.5));
      float core = smoothstep(0.22, 0.0, radius);
      float halo = smoothstep(0.5, 0.05, radius);
      float alpha = (core * 1.2 + halo * 0.82) * vGlow * vReveal;
      if (alpha < 0.02) {
        discard;
      }
      gl_FragColor = vec4(vGalaxyColor * (1.12 + core * 0.88), alpha);
    }
  `;
  material.needsUpdate = true;

  state.galaxy = new THREE.Points(geometry, material);
  state.galaxy.scale.setScalar(getResponsiveGalaxyScale());
  state.scene.add(state.galaxy);
  beginParticlePhase(PARTICLE_PHASES.explode);
  return state.galaxy;
}

function createPortfolioGalaxyUI() {
  if (state.portfolioUIGroup) { return; }

  const textureLoader = new THREE.TextureLoader();
  const group = new THREE.Group();
  group.visible = false;
  state.portfolioUIGroup = group;
  state.scene.add(group);

  PORTFOLIO_UI_ITEMS.forEach((item, index) => {
    const angle = (index / PORTFOLIO_UI_ITEMS.length) * Math.PI * 2 - Math.PI * 0.5;
    const itemGroup = new THREE.Group();
    itemGroup.position.copy(getPortfolioUIContourPosition(angle));
    itemGroup.scale.setScalar(0.75);
    itemGroup.userData = { portfolioItem: item };

    const orb = createGoldenParticleOrb(0.465, 620);
    orb.userData.isGoldenOrb = true;
    orb.userData.baseScale = 1;
    itemGroup.add(orb);

    const iconMaterial = new THREE.SpriteMaterial({
      transparent: true,
      opacity: 0.98,
      depthWrite: false,
      depthTest: false,
      blending: THREE.NormalBlending,
    });
    const iconSource = window.PORTFOLIO_ICON_DATA?.[item.iconKey] || item.icon;
    const iconTexture = textureLoader.load(
      iconSource,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
      },
      undefined,
      () => {
        iconMaterial.map = createFallbackIconTexture(item.name);
        iconMaterial.needsUpdate = true;
      }
    );
    iconTexture.colorSpace = THREE.SRGBColorSpace;
    iconMaterial.map = iconTexture;
    const icon = new THREE.Sprite(iconMaterial);
    icon.userData.isPortfolioIcon = true;
    // 图标本体尺寸控制：外层 itemGroup 会整体缩小 50%。
    icon.scale.set(0.429, 0.3601, 1);
    icon.position.z = 0.08;
    itemGroup.add(icon);

    const label = createTextSprite(item.name, 176, "rgba(255, 237, 176, 0.98)", "rgba(255, 196, 71, 0.95)");
    label.userData.isPortfolioLabel = true;
    label.scale.set(1.16, 0.34, 1);
    label.position.set(0, 0.49, 0.1);
    itemGroup.add(label);

    const hitTarget = new THREE.Mesh(
      new THREE.CircleGeometry(0.34, 40),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    hitTarget.position.z = 0.12;
    hitTarget.userData = { portfolioItem: item, itemGroup };
    itemGroup.add(hitTarget);
    state.portfolioUIHitTargets.push(hitTarget);
    state.portfolioUIItems.push({ item, itemGroup, hitTarget });
    group.add(itemGroup);
  });
}

function createQiuPhotoSphere() {
  if (state.qiuAxisGroup) { return; }

  const photos = worksLibrary.QIU?.filter((item) => item.type === "image" && (item.sphereSrc || item.src)) || [];
  if (!photos.length) { return; }

  const textureLoader = new THREE.TextureLoader();
  const textureCache = new Map();
  const points = buildQiuLatitudeSpherePoints();
  const repeatedPhotos = points.map((_, index) => photos[index % photos.length]);
  const transparentTexture = createQiuTransparentTexture();
  const cardAspect = 0.75;
  const cardGeometry = new THREE.PlaneGeometry(CONFIG.qiuCardHeight * cardAspect, CONFIG.qiuCardHeight);
  const imageGeometry = new THREE.PlaneGeometry(CONFIG.qiuCardHeight * cardAspect, CONFIG.qiuCardHeight);

  state.qiuAxisGroup = new THREE.Group();
  state.qiuAxisGroup.visible = false;
  state.qiuAxisGroup.rotation.z = THREE.MathUtils.degToRad(-CONFIG.qiuAxisTiltDegrees);
  state.qiuAxisGroup.scale.setScalar(CONFIG.qiuDisplayScale);
  state.qiuLayerScene.add(state.qiuAxisGroup);

  state.qiuSphereGroup = new THREE.Group();
  state.qiuSphereGroup.frustumCulled = false;
  state.qiuAxisGroup.add(state.qiuSphereGroup);

  state.qiuPhotoCards.length = 0;

  points.forEach((point, index) => {
    /*
      照片球固定生成控制：
      无论 QIU 文件夹里有多少张图片，都按照纬度点数量生成完整球体。
      当前纬度点为 84 个；图片不够时循环使用真实图片，只有加载失败才进入占位图。
    */
    const photo = repeatedPhotos[index];
    const texturePath = photo.sphereSrc || photo.src;
    const material = new THREE.MeshBasicMaterial({
      map: transparentTexture,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthTest: false,
      depthWrite: false,
    });

    const card = new THREE.Mesh(cardGeometry, material);
    card.renderOrder = 120;
    card.frustumCulled = false;
    const imagePlane = createQiuImagePlane(textureLoader, textureCache, photo, texturePath, index, imageGeometry);
    card.add(imagePlane);
    card.userData.imagePlane = imagePlane;
    const scatter = createQiuExplosionPoint(point.position, index);
    card.position.copy(scatter);
    card.userData.target = point.position.clone();
    card.userData.scatter = scatter;
    card.userData.basis = point.basis;
    card.userData.baseScale = THREE.MathUtils.randFloat(0.94, 1.06);
    card.userData.phase = Math.random() * Math.PI * 2;
    card.userData.qiuIndex = index;
    orientQiuCard(card, point.basis, point.position);
    state.qiuSphereGroup.add(card);
    state.qiuPhotoCards.push(card);
  });

  state.qiuSphereInterior = new THREE.Mesh(
    new THREE.SphereGeometry(CONFIG.qiuSphereRadius * 0.982, 64, 40),
    new THREE.MeshBasicMaterial({
      color: 0x020308,
      side: THREE.BackSide,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
  );
  state.qiuSphereInterior.renderOrder = -2;
  state.qiuSphereInterior.visible = false;
  state.qiuSphereGroup.add(state.qiuSphereInterior);
}

function createQiuFallbackTexture(text, detail = "") {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 680;
  const context = textureCanvas.getContext("2d");
  drawQiuWindowCard(context, textureCanvas, text, true, detail);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createQiuTransparentTexture() {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 16;
  textureCanvas.height = 16;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createQiuImagePlane(textureLoader, textureCache, photo, texturePath, index, sharedGeometry = null) {
  const imageUrl = new URL(texturePath, window.location.href).href;
  const windowAspect = 0.75;
  const imageWidth = CONFIG.qiuCardHeight * windowAspect;
  const imageHeight = CONFIG.qiuCardHeight;

  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0,
    side: THREE.DoubleSide,
    depthTest: false,
    depthWrite: false,
  });

  let cacheEntry = textureCache.get(imageUrl);
  if (!cacheEntry) {
    cacheEntry = { texture: null, materials: [], loaded: false, failed: false };
    textureCache.set(imageUrl, cacheEntry);

    const image = new Image();
    image.decoding = "async";
    image.onload = () => {
      const optimizedTexture = createOptimizedQiuPhotoTexture(image, windowAspect);
      cacheEntry.texture = optimizedTexture;
      cacheEntry.loaded = true;
      if (state.renderer?.initTexture) {
        state.renderer.initTexture(optimizedTexture);
      }
      cacheEntry.materials.forEach((queuedMaterial) => {
        queuedMaterial.map = optimizedTexture;
        queuedMaterial.opacity = 1;
        queuedMaterial.needsUpdate = true;
      });
      cacheEntry.materials.length = 0;
    };
    image.onerror = () => {
      cacheEntry.failed = true;
      cacheEntry.materials.forEach((queuedMaterial) => {
        queuedMaterial.opacity = 0;
        queuedMaterial.needsUpdate = true;
      });
      cacheEntry.materials.length = 0;
    };
    image.src = imageUrl;
  }

  if (cacheEntry.loaded && cacheEntry.texture) {
    material.map = cacheEntry.texture;
    material.opacity = 1;
  } else if (!cacheEntry.failed) {
    cacheEntry.materials.push(material);
  }

  const plane = new THREE.Mesh(sharedGeometry || new THREE.PlaneGeometry(imageWidth, imageHeight), material);
  plane.position.z = 0.006;
  plane.renderOrder = 130;
  plane.frustumCulled = false;
  return plane;
}

function createOptimizedQiuPhotoTexture(image, targetAspect) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 384;
  textureCanvas.height = Math.round(textureCanvas.width / targetAspect);
  const context = textureCanvas.getContext("2d", { alpha: true });

  const imageWidth = image.naturalWidth || image.width || 1;
  const imageHeight = image.naturalHeight || image.height || 1;
  const imageAspect = imageWidth / imageHeight;
  let sourceX = 0;
  let sourceY = 0;
  let sourceWidth = imageWidth;
  let sourceHeight = imageHeight;

  if (imageAspect > targetAspect) {
    sourceWidth = imageHeight * targetAspect;
    sourceX = (imageWidth - sourceWidth) / 2;
  } else if (imageAspect < targetAspect) {
    sourceHeight = imageWidth / targetAspect;
    sourceY = (imageHeight - sourceHeight) / 2;
  }

  context.filter = `brightness(${CONFIG.qiuPhotoBrightness}) saturate(1.08)`;
  context.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    textureCanvas.width,
    textureCanvas.height
  );
  context.filter = "none";

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  return texture;
}

function applyCoverCropToTexture(texture, image, targetAspect) {
  const imageWidth = image?.naturalWidth || image?.width || 1;
  const imageHeight = image?.naturalHeight || image?.height || 1;
  const imageAspect = imageWidth / imageHeight;

  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.repeat.set(1, 1);
  texture.offset.set(0, 0);
  texture.center.set(0.5, 0.5);

  if (imageAspect > targetAspect) {
    const visibleWidthRatio = targetAspect / imageAspect;
    texture.repeat.x = visibleWidthRatio;
    texture.offset.x = (1 - visibleWidthRatio) / 2;
  } else if (imageAspect < targetAspect) {
    const visibleHeightRatio = imageAspect / targetAspect;
    texture.repeat.y = visibleHeightRatio;
    texture.offset.y = (1 - visibleHeightRatio) / 2;
  }
}

function createQiuCardCanvasTexture(photo, texturePath) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 600;
  textureCanvas.height = 800;
  const context = textureCanvas.getContext("2d");

  drawQiuWindowCard(context, textureCanvas, photo.title || "PHOTO");

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  const image = new Image();
  image.onload = () => {
    drawQiuWindowCard(context, textureCanvas, photo.title || "PHOTO", false);

    const imageAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
    const padding = 28;
    const contentX = padding;
    const contentY = padding;
    const contentWidth = textureCanvas.width - padding * 2;
    const contentHeight = textureCanvas.height - padding * 2;
    const contentAspect = contentWidth / contentHeight;
    let drawWidth = contentWidth;
    let drawHeight = contentHeight;
    let drawX = contentX;
    let drawY = contentY;

    if (imageAspect > contentAspect) {
      drawHeight = contentHeight;
      drawWidth = drawHeight * imageAspect;
      drawX = contentX + (contentWidth - drawWidth) / 2;
    } else {
      drawWidth = contentWidth;
      drawHeight = drawWidth / imageAspect;
      drawY = contentY + (contentHeight - drawHeight) / 2;
    }

    context.save();
    context.beginPath();
    context.rect(contentX, contentY, contentWidth, contentHeight);
    context.clip();
    context.drawImage(image, drawX, drawY, drawWidth, drawHeight);
    context.restore();
    drawQiuWindowFrame(context, textureCanvas);
    texture.needsUpdate = true;
  };
  image.onerror = () => {
    drawQiuWindowCard(context, textureCanvas, photo.title || "PHOTO");
    texture.needsUpdate = true;
  };
  image.src = encodeURI(texturePath);

  return texture;
}

function drawQiuWindowCard(context, textureCanvas, text, showText = true, detail = "") {
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = "rgba(246, 251, 255, 0.98)";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  if (showText) {
    context.fillStyle = "#061126";
    context.font = "700 46px Arial, sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("PHOTO", textureCanvas.width / 2, textureCanvas.height * 0.45);
    context.font = "400 24px Arial, sans-serif";
    context.fillText(text.slice(0, 18), textureCanvas.width / 2, textureCanvas.height * 0.53);
    if (detail) {
      const fileName = detail.split("/").pop();
      context.font = "400 18px Arial, sans-serif";
      context.fillText(fileName.slice(0, 26), textureCanvas.width / 2, textureCanvas.height * 0.6);
    }
  }
  drawQiuWindowFrame(context, textureCanvas);
}

function drawQiuWindowFrame(context, textureCanvas) {
  context.strokeStyle = "rgba(36, 158, 255, 0.95)";
  context.lineWidth = 8;
  context.strokeRect(14, 14, textureCanvas.width - 28, textureCanvas.height - 28);
  context.strokeStyle = "rgba(190, 235, 255, 0.42)";
  context.lineWidth = 2;
  context.strokeRect(28, 28, textureCanvas.width - 56, textureCanvas.height - 56);
}

function drawQiuFallbackCard(context, textureCanvas, text) {
  context.fillStyle = "rgba(245, 250, 255, 0.98)";
  context.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.strokeStyle = "rgba(40, 160, 255, 0.92)";
  context.lineWidth = 8;
  context.strokeRect(18, 18, textureCanvas.width - 36, textureCanvas.height - 36);
  context.fillStyle = "#061126";
  context.font = "700 42px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("PHOTO", 256, 310);
  context.font = "400 22px Arial, sans-serif";
  context.fillText(text.slice(0, 16), 256, 370);
}

function buildQiuLatitudeSpherePoints() {
  const points = [];
  const ringTotal = CONFIG.qiuRingCounts.length;

  CONFIG.qiuRingCounts.forEach((count, ringIndex) => {
    const v = ringTotal === 1 ? 0.5 : ringIndex / (ringTotal - 1);
    const latitude = THREE.MathUtils.lerp(-1.18, 1.18, v);
    const y = Math.sin(latitude) * CONFIG.qiuSphereRadius;
    const shell = Math.cos(latitude) * CONFIG.qiuSphereRadius;
    const stagger = ringIndex % 2 ? 0.5 : 0;

    for (let localIndex = 0; localIndex < count; localIndex += 1) {
      const angle = ((localIndex + stagger) / count) * Math.PI * 2;
      const position = new THREE.Vector3(
        Math.cos(angle) * shell,
        y,
        Math.sin(angle) * shell
      );
      points.push({ position, basis: createQiuCardBasis(position, angle) });
    }
  });

  return points;
}

function createQiuCardBasis(position, angle) {
  const normal = position.clone().normalize();
  const right = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)).normalize();
  const up = new THREE.Vector3().crossVectors(normal, right).normalize();
  return { normal, right, up };
}

function createQiuExplosionPoint(target, index) {
  const normal = target.clone().normalize();
  const tangent = new THREE.Vector3(-normal.z, 0, normal.x).normalize();
  const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
  const sideJitter = Math.sin(index * 12.9898) * 0.42;
  const upJitter = Math.cos(index * 7.233) * 0.34;
  const outward = CONFIG.qiuExplosionDistance + THREE.MathUtils.randFloat(0.3, 1.25);

  return target.clone()
    .add(normal.multiplyScalar(outward))
    .add(tangent.multiplyScalar(sideJitter))
    .add(bitangent.multiplyScalar(upJitter));
}

function orientQiuCard(card, basis, position) {
  const normal = position.clone().normalize();
  const right = basis.right.clone().negate();
  const up = basis.up.clone().negate();
  const matrix = new THREE.Matrix4().makeBasis(right, up, normal);
  card.quaternion.setFromRotationMatrix(matrix);
}

function getQiuSphereScreenPosition() {
  /*
    照片球位置控制：
    照片球已独立到右上角小视口渲染层。
    这里的 x/y/z 是照片球在“自己的相机视口”里的局部位置，不再是主银河世界坐标。
    x 保持 0，让球体留在小视口中心，避免越靠屏幕右侧越被主相机透视拉扯。
    y 保持 0.75，让球体在右上角视口里略微上移；后续微调只改 y，不要改 z 和 scale。
  */
  return new THREE.Vector3(0, 0.75, -0.35);
}

function formQiuPhotoSphere() {
  createQiuPhotoSphere();
  if (!state.qiuAxisGroup) { return; }
  state.qiuAxisGroup.visible = true;
  state.qiuTransition = {
    mode: "forming",
    start: state.clock.getElapsedTime(),
    duration: CONFIG.qiuFormDuration + CONFIG.qiuFormStagger,
  };
}

function scatterQiuPhotoSphere() {
  if (!state.qiuAxisGroup) { return; }
  state.qiuAxisGroup.visible = true;
  state.qiuTransition = {
    mode: "scattering",
    start: state.clock.getElapsedTime(),
    duration: CONFIG.qiuScatterDuration,
  };
}

function updateQiuPhotoSphere(elapsed) {
  if (!state.qiuAxisGroup || !state.qiuSphereGroup) { return; }

  const mode = state.qiuTransition.mode;
  if (mode === "hidden") {
    state.qiuAxisGroup.visible = false;
    return;
  }

  state.qiuAxisGroup.position.lerp(getQiuSphereScreenPosition(), 0.08);
  state.qiuScrollBoost *= CONFIG.qiuScrollBoostDecay;
  if (state.qiuScrollBoost < 0.00002) {
    state.qiuScrollBoost = 0;
  }
  state.qiuSphereGroup.rotation.y += CONFIG.qiuRotationSpeed + state.qiuScrollBoost;

  const transitionElapsed = elapsed - state.qiuTransition.start;
  const progress = THREE.MathUtils.clamp(transitionElapsed / state.qiuTransition.duration, 0, 1);
  const eased = mode === "forming" ? easeOutQuintLocal(progress) : progress * progress * progress;

  state.qiuPhotoCards.forEach((card) => {
    if (mode === "formed") {
      card.position.copy(card.userData.target);
      card.material.opacity = 1;
      if (card.userData.imagePlane) {
        card.userData.imagePlane.material.opacity = card.userData.imagePlane.material.map ? 1 : 0;
      }
      orientQiuCard(card, card.userData.basis, card.userData.target);
    } else {
      const from = mode === "forming" ? card.userData.scatter : card.userData.target;
      const to = mode === "forming" ? card.userData.target : card.userData.scatter;
      const cardDelay = mode === "forming"
        ? (card.userData.qiuIndex / Math.max(1, state.qiuPhotoCards.length - 1)) * CONFIG.qiuFormStagger
        : 0;
      const cardProgress = mode === "forming"
        ? THREE.MathUtils.clamp((transitionElapsed - cardDelay) / CONFIG.qiuFormDuration, 0, 1)
        : progress;
      const cardEased = mode === "forming" ? easeOutQuintLocal(cardProgress) : eased;
      card.position.lerpVectors(from, to, cardEased);
      card.material.opacity = mode === "forming" ? cardEased : 1 - eased;
      if (card.userData.imagePlane) {
        const imageTargetOpacity = card.userData.imagePlane.material.map ? card.material.opacity : 0;
        card.userData.imagePlane.material.opacity = imageTargetOpacity;
      }
      orientQiuCard(card, card.userData.basis, card.position);
    }
    const breathe = 1 + Math.sin(elapsed * 0.9 + card.userData.phase) * 0.012;
    card.scale.setScalar(card.userData.baseScale * breathe);
  });

  if (state.qiuSphereInterior) {
    state.qiuSphereInterior.visible = false;
    state.qiuSphereInterior.material.opacity = 0;
  }

  if (progress >= 1) {
    if (mode === "forming") {
      state.qiuTransition.mode = "formed";
    } else if (mode === "scattering") {
      state.qiuTransition.mode = "hidden";
      state.qiuAxisGroup.visible = false;
    }
  }
}

function easeOutQuintLocal(value) {
  return 1 - Math.pow(1 - value, 5);
}

function easeOutCubic(value) {
  return 1 - Math.pow(1 - value, 3);
}

function easeInOutCubic(value) {
  return value < 0.5
    ? 4 * value * value * value
    : 1 - Math.pow(-2 * value + 2, 3) / 2;
}

function lerpAngleClockwise(fromAngle, toAngle, progress) {
  const fullCircle = Math.PI * 2;
  let delta = (toAngle - fromAngle) % fullCircle;
  if (delta < 0) {
    delta += fullCircle;
  }
  return fromAngle + delta * progress;
}

function seededUnitRandom(seedValue) {
  const raw = Math.sin(seedValue * 12.9898 + 78.233) * 43758.5453;
  return raw - Math.floor(raw);
}

function getPortfolioUIContourPosition(angle) {
  /*
    绗洓闃舵 5 涓悆褰?UI 鎺ュ叆鐐癸細
    杩欓噷鎺у埗 UI 鍦ㄩ摱娌崇洏闈笂鐨勬湰鍦拌建杩广€傚綋鍓嶄负鏍囧噯妞渾杞ㄩ亾锛?    鍦嗗績瀵归綈閾舵渤涓績锛岄暱杞村钩琛岄〉闈笂涓嬭竟妗嗭紝闀垮崐杞翠负閾舵渤鍗婂緞鐨勪竴鍗婏紝鐭崐杞翠负闀垮崐杞寸殑 3/4銆?    portfolioUIGroup 浼氬湪 updatePortfolioGalaxyUI() 閲屽鍒堕摱娌?rotation.x锛屽洜姝ゆき鍦嗗钩闈細璺熼殢閾舵渤鐩橀潰缈昏浆杩愬姩銆?    鍚庣画濡傛灉瑕佽姣忎釜 UI 鍦ㄨ建杩逛笂鐙珛娓稿姩锛屽彧闇€瑕佺粰 angle 鍙犲姞鏃堕棿鍋忕Щ鍗冲彲銆?  */
  const longSemiAxis = CONFIG.galaxyOuterRadius * CONFIG.portfolioUIRadiusRatio;
  const shortSemiAxis = longSemiAxis * 0.75;
  return new THREE.Vector3(
    Math.cos(angle) * shortSemiAxis,
    Math.sin(angle) * longSemiAxis,
    0.18
  );
}

function createFallbackIconTexture(text) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 512;
  textureCanvas.height = 512;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.fillStyle = "rgba(255, 246, 210, 0.96)";
  context.shadowColor = "rgba(255, 196, 71, 0.95)";
  context.shadowBlur = 26;
  context.font = "700 82px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text.slice(0, 2).toUpperCase(), 256, 256);
  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createGoldenParticleOrb(radius, count) {
  const positions = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const colors = new Float32Array(count * 3);
  const color = new THREE.Color();
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    const y = 1 - (index / Math.max(1, count - 1)) * 2;
    const ringRadius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = index * goldenAngle;
    const shell = radius * THREE.MathUtils.randFloat(0.985, 1.015);
    positions[stride] = Math.cos(theta) * ringRadius * shell;
    positions[stride + 1] = y * shell;
    positions[stride + 2] = Math.sin(theta) * ringRadius * shell;
    sizes[index] = THREE.MathUtils.randFloat(0.024, 0.052);
    color.setRGB(1, THREE.MathUtils.randFloat(0.68, 0.92), THREE.MathUtils.randFloat(0.18, 0.36));
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

  return new THREE.Points(geometry, new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSize;
      varying vec3 vColor;
      void main() {
        vColor = color;
        vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * (520.0 / -viewPosition.z);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float alpha = smoothstep(0.5, 0.04, radius);
        if (alpha < 0.02) { discard; }
        gl_FragColor = vec4(vColor * 1.7, alpha);
      }
    `,
  }));
}

function createTextSprite(text, fontSize, fillStyle, glowStyle) {
  const textureCanvas = document.createElement("canvas");
  textureCanvas.width = 1024;
  textureCanvas.height = 256;
  const context = textureCanvas.getContext("2d");
  context.clearRect(0, 0, textureCanvas.width, textureCanvas.height);
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.font = `600 ${fontSize}px "Orbitron", "Rajdhani", "Segoe UI", sans-serif`;
  context.shadowBlur = 24;
  context.shadowColor = glowStyle;
  context.fillStyle = fillStyle;
  context.fillText(text, textureCanvas.width / 2, textureCanvas.height / 2);

  const texture = new THREE.CanvasTexture(textureCanvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  return new THREE.Sprite(new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }));
}

/** 缁戝畾灏哄鍙樺寲銆佹偓鍋滄娴嬪拰涓€娆℃€х偣鍑讳氦浜掋€?*/
/**
 * 鍒涘缓骞剁粦瀹氱涓夐樁娈?HTML UI銆? * UI 鍙彂鍑衡€滃幓涓績鈥濆拰鈥滃洖鏍囬椤碘€濆懡浠わ紝閾舵渤鎬庝箞绉诲姩浠嶇敱 Three.js 渚ц礋璐ｃ€? */
function createOverlayUI() {
  state.overlayUI = {
    title: document.querySelector("[data-portfolio-title]"),
    rocketButton: document.querySelector("[data-rocket-button]"),
    returnArrow: document.querySelector("[data-return-arrow]"),
  };
  state.detailPage = document.querySelector("[data-detail-page]");
  state.detailTitle = document.querySelector("[data-detail-title]");
  state.detailBackButton = document.querySelector("[data-detail-back]");
  state.detailGallery = document.querySelector("[data-works-gallery]");
  state.mediaLightbox = document.querySelector("[data-media-lightbox]");
  state.mediaLightboxStage = document.querySelector("[data-media-lightbox-stage]");
  state.mediaLightboxClose = document.querySelector("[data-media-lightbox-close]");
  state.backgroundMusic = document.querySelector("#background-music");
  state.overlayUI.title.inert = true;
  state.overlayUI.returnArrow.tabIndex = -1;

  state.overlayUI.rocketButton.addEventListener("click", () => {
    hidePortfolioTitle();
    showReturnArrow();
    moveGalaxyToCenter();
  });

  state.overlayUI.returnArrow.addEventListener("click", () => {
    hideReturnArrow();
    state.isPortfolioMenuOpen = false;
    showPortfolioTitle();
    moveGalaxyToRight();
  });

  state.detailBackButton.addEventListener("click", () => returnToPortfolioMenu());
  document.querySelectorAll("[data-layer-back]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      returnToPreviousLayer();
    });
  });
  state.mediaLightbox.addEventListener("click", closeMediaLightbox);
  state.mediaLightboxClose.addEventListener("click", (event) => {
    event.stopPropagation();
    closeMediaLightbox();
  });
  state.mediaLightboxStage.addEventListener("click", (event) => event.stopPropagation());
  window.addEventListener("popstate", onBrowserHistoryBack);
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.mediaLightbox.classList.contains("is-visible")) {
        closeMediaLightbox();
      } else {
        returnToPortfolioMenu();
      }
    }
  });
}

function returnToPreviousLayer() {
  if (state.mediaLightbox?.classList.contains("is-visible")) {
    closeMediaLightbox();
    return;
  }
  returnToPortfolioMenu();
}

function initBackgroundMusic() {
  /*
    背景音乐控制：
    - 音量保持很低，只作为宇宙氛围音。
    - 浏览器如果禁止自动播放，就等用户第一次点击/滚动/按键后再启动。
    - 页面内视频播放时暂停，视频关闭后恢复。
  */
  if (!state.backgroundMusic) { return; }
  state.backgroundMusic.volume = 0.16;
  state.backgroundMusic.loop = true;
  state.backgroundMusic.play().catch(() => {
    state.isBackgroundMusicBlocked = true;
  });
}

function tryResumeBackgroundMusic() {
  if (!state.backgroundMusic || state.isBackgroundMusicPausedForVideo) { return; }
  if (!state.backgroundMusic.paused && !state.isBackgroundMusicBlocked) { return; }
  state.backgroundMusic.volume = 0.16;
  state.backgroundMusic.play()
    .then(() => {
      state.isBackgroundMusicBlocked = false;
    })
    .catch(() => {
      state.isBackgroundMusicBlocked = true;
    });
}

function pauseBackgroundMusicForVideo() {
  if (!state.backgroundMusic) { return; }
  state.isBackgroundMusicPausedForVideo = true;
  state.backgroundMusic.pause();
}

function resumeBackgroundMusicAfterVideo() {
  state.isBackgroundMusicPausedForVideo = false;
  tryResumeBackgroundMusic();
}

function applyEditableContent() {
  const home = SITE_CONTENT.home || {};
  const profile = SITE_CONTENT.profile || {};
  const ui = SITE_CONTENT.ui || {};
  const closingContact = SITE_CONTENT.closingContact || {};

  const owner = document.querySelector(".title-owner");
  const title = document.querySelector(".title-work");
  const explore = document.querySelector(".title-explore");
  const rocketButton = document.querySelector("[data-rocket-button]");
  const returnArrow = document.querySelector("[data-return-arrow]");
  const detailBack = document.querySelector("[data-detail-back]");
  const detailKicker = document.querySelector(".detail-kicker");
  const lightboxClose = document.querySelector("[data-media-lightbox-close]");
  const resumePhoto = document.querySelector(".resume-photo");
  const contact = document.querySelector(".resume-contact");
  const resumeCopy = document.querySelector(".resume-copy");
  const workExperience = document.querySelector("[data-work-experience]");
  const closingPanel = document.querySelector(".closing-contact-panel");
  const closingTitles = document.querySelectorAll(".closing-contact-title");
  const closingInfo = document.querySelector(".closing-contact-info");
  const closingQr = document.querySelector(".closing-contact-qr img");
  const closingQrCaption = document.querySelector(".closing-contact-qr p");

  if (owner && home.owner) { owner.textContent = home.owner; }
  if (title && home.title) { title.textContent = home.title; }
  if (explore && home.explore) { explore.textContent = home.explore; }
  if (rocketButton && home.rocketLabel) { rocketButton.setAttribute("aria-label", home.rocketLabel); }
  if (returnArrow && ui.returnArrowLabel) { returnArrow.setAttribute("aria-label", ui.returnArrowLabel); }
  if (detailBack && ui.detailBackText) { detailBack.textContent = ui.detailBackText; }
  if (detailBack && ui.detailBackLabel) { detailBack.setAttribute("aria-label", ui.detailBackLabel); }
  if (detailKicker && ui.detailKicker) { detailKicker.textContent = ui.detailKicker; }
  if (lightboxClose && ui.lightboxCloseLabel) { lightboxClose.setAttribute("aria-label", ui.lightboxCloseLabel); }
  if (resumePhoto && profile.photoAlt) { resumePhoto.alt = profile.photoAlt; }

  if (contact) {
    contact.replaceChildren();
    const tel = document.createElement("p");
    tel.textContent = `${profile.telLabel || "TEL"}:${profile.tel || ""}`;
    const email = document.createElement("p");
    email.textContent = `${profile.emailLabel || "EMAIL"}:${profile.email || ""}`;
    contact.append(tel, email);
  }

  if (resumeCopy) {
    resumeCopy.replaceChildren();
    const name = document.createElement("h2");
    name.textContent = profile.name || "";
    const role = document.createElement("p");
    role.className = "resume-role";
    role.textContent = profile.role || "";
    resumeCopy.append(name, role);

    (profile.intro || []).forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      resumeCopy.append(paragraph);
    });
  }

  if (workExperience) {
    workExperience.replaceChildren();
    const heading = document.createElement("h3");
    heading.textContent = profile.experience?.title || "工作经历";
    workExperience.append(heading);

    const lines = profile.experience?.items?.length
      ? profile.experience.items
      : ["这里可填写工作经历、项目职责、团队协作和代表成果。"];
    lines.forEach((line) => {
      const paragraph = document.createElement("p");
      paragraph.textContent = line;
      workExperience.append(paragraph);
    });
  }

  if (closingPanel && closingContact.label) {
    closingPanel.setAttribute("aria-label", closingContact.label);
  }
  if (closingTitles[0] && closingContact.line1) { closingTitles[0].textContent = closingContact.line1; }
  if (closingTitles[1] && closingContact.line2) { closingTitles[1].textContent = closingContact.line2; }
  if (closingInfo && closingContact.info) { closingInfo.textContent = closingContact.info; }
  if (closingQr && closingContact.qrAlt) { closingQr.alt = closingContact.qrAlt; }
  if (closingQrCaption && closingContact.qrCaption) { closingQrCaption.textContent = closingContact.qrCaption; }
}

/**
 * 閾舵渤绋冲畾鏃嬭浆鍚庣殑绗笁闃舵鍏ュ彛銆? * 绗洓闃舵鐞冨舰 UI 棰勭暀锛氫腑蹇冪晫闈㈡墦寮€鍚庯紝鍙湪杩欓噷鍐冲畾鐞冨舰 UI 鐨勬樉绀烘椂鏈恒€? */
function revealPortfolioScene() {
  if (state.isPortfolioTitleReady) { return; }
  state.isPortfolioTitleReady = true;
  moveGalaxyToRight();
  showPortfolioTitle();
}

/** 鏍囬涓庣伀绠寜閽贰鍏ャ€?*/
function showPortfolioTitle() {
  if (!state.overlayUI) { return; }
  state.overlayUI.title.classList.remove("is-leaving");
  state.overlayUI.title.classList.add("is-visible");
  state.overlayUI.title.setAttribute("aria-hidden", "false");
  state.overlayUI.title.inert = false;
}

/** 鏍囬涓庣伀绠寜閽悜宸︽贰鍑恒€?*/
function hidePortfolioTitle() {
  if (!state.overlayUI) { return; }
  state.overlayUI.title.classList.remove("is-visible");
  state.overlayUI.title.classList.add("is-leaving");
  state.overlayUI.title.setAttribute("aria-hidden", "true");
  state.overlayUI.title.inert = true;
}

function showReturnArrow() {
  state.overlayUI.returnArrow.classList.add("is-visible");
  state.overlayUI.returnArrow.tabIndex = 0;
}

function hideReturnArrow() {
  state.overlayUI.returnArrow.classList.remove("is-visible");
  state.overlayUI.returnArrow.tabIndex = -1;
}

/** 灏嗛摱娌冲钩婊戠Щ鍒扮敾闈㈠彸渚э紝涓哄乏渚ф爣棰樼暀鍑虹┖闂淬€?*/
function moveGalaxyToRight() {
  startGalaxyMove(getGalaxyRightOffset(), CONFIG.galaxyMoveDuration, "right");
}

/** 鐏瑙﹀彂鍚庯紝閾舵渤鍦?3 绉掑唴鍥炲埌鐢婚潰涓績銆?*/
function moveGalaxyToCenter() {
  state.isPortfolioMenuOpen = true;
  createPortfolioGalaxyUI();
  scatterQiuPhotoSphere();
  startGalaxyMove(0, CONFIG.galaxyCenterMoveDuration, "center");
}

function startGalaxyMove(targetX, duration, layoutName) {
  if (!state.galaxy) { return; }
  state.galaxyLayout = layoutName;
  state.galaxyMove = {
    fromX: state.galaxy.position.x,
    targetX,
    duration,
    layoutName,
    startTime: state.clock.getElapsedTime(),
  };
}

/**
 * 浠ュ綋鍓嶈鍙ｆ帹绠楀彸渚х洰鏍囩偣銆? * 妯睆澶氱暀鍑烘爣棰樺尯锛岀獎灞忓垯鏀朵綇浣嶇Щ锛岄伩鍏嶉摱娌宠鎺ㄥ嚭瑙嗗彛銆? */
function getGalaxyRightOffset() {
  const aspect = window.innerWidth / window.innerHeight;
  return THREE.MathUtils.clamp(aspect * 1.7, 1.05, 2.68);
}

function easeInOutQuint(value) {
  return value < 0.5 ? 16 * value ** 5 : 1 - ((-2 * value + 2) ** 5) / 2;
}

/** Three.js 浣嶇Щ鎺у埗涓?UI class 鍒囨崲瑙ｈ€︼紝鎵€鏈夐摱娌冲竷灞€缂撳姩閮介泦涓湪杩欓噷銆?*/
function updateGalaxyPosition(elapsed) {
  if (!state.galaxy || !state.galaxyMove) { return; }
  const moveProgress = THREE.MathUtils.clamp((elapsed - state.galaxyMove.startTime) / state.galaxyMove.duration, 0, 1);
  const easedProgress = easeInOutQuint(moveProgress);
  state.galaxy.position.x = THREE.MathUtils.lerp(state.galaxyMove.fromX, state.galaxyMove.targetX, easedProgress);

  if (moveProgress >= 1) {
    state.galaxy.position.x = state.galaxyMove.targetX;
    if (state.galaxyMove.layoutName === "right") {
      formQiuPhotoSphere();
    }
    state.galaxyMove = null;
  }
}

function updateScrollProgress() {
  if (state.detailPage?.classList.contains("is-visible")) {
    const maxDetailScroll = Math.max(1, state.detailPage.scrollHeight - state.detailPage.clientHeight);
    state.scrollProgress = THREE.MathUtils.clamp(state.detailPage.scrollTop / maxDetailScroll, 0, 1);
    return;
  }

  const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  state.scrollProgress = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
}

function bindInteractions() {
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("wheel", onWheelScroll, { passive: true });
  window.addEventListener("pointerdown", tryResumeBackgroundMusic, { passive: true });
  window.addEventListener("keydown", tryResumeBackgroundMusic);
  window.addEventListener("wheel", tryResumeBackgroundMusic, { passive: true });
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerleave", onPointerLeave);
  window.addEventListener("pointerdown", onPointerDown);
  state.detailPage?.addEventListener("scroll", onDetailPageScroll, { passive: true });
}

function onResize() {
  state.camera.aspect = window.innerWidth / window.innerHeight;
  state.camera.updateProjectionMatrix();
  updateQiuLayerCamera();
  state.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  state.renderer.setSize(window.innerWidth, window.innerHeight);
  if (state.galaxy) {
    state.galaxy.scale.setScalar(getResponsiveGalaxyScale());
    if (!state.galaxyMove) {
      state.galaxy.position.x = state.galaxyLayout === "right" ? getGalaxyRightOffset() : 0;
    }
  }
  updateScrollProgress();
}

function onDetailPageScroll() {
  updateScrollProgress();
  boostQiuRotationFromScroll();
  updateBlackHoleCursor();
}

function onWheelScroll(event) {
  if (state.detailPage?.classList.contains("is-visible")) {
    state.detailPage.scrollTop += event.deltaY;
  }
  updateScrollProgress();
  boostQiuRotationFromScroll(event.deltaY);
  updateBlackHoleCursor();
}

function boostQiuRotationFromScroll(deltaY = 360) {
  /*
    照片球滚动加速：
    只在用户滚动动作发生时给照片球一个短暂加速度；
    停止滚动后在 updateQiuPhotoSphere() 中逐帧衰减回正常自转速度。
  */
  if (!state.qiuAxisGroup || !state.qiuAxisGroup.visible) { return; }
  const boost = THREE.MathUtils.clamp(Math.abs(deltaY) * 0.000018, 0.0012, CONFIG.qiuScrollBoostMax);
  state.qiuScrollBoost = Math.min(CONFIG.qiuScrollBoostMax, state.qiuScrollBoost + boost);
}

/**
 * 绔栧睆鏃剁浉鏈烘í鍚戝彲瑙佽寖鍥存洿绐勶紝闇€瑕佷富鍔ㄦ敹浣忎腑蹇冨厜鍦堛€? * 鍚庣画 UI 鎵╁睍濡傛灉鍔犲叆宸﹀彸闈㈡澘锛屼篃鍙互缁х画娌跨敤杩欎釜瑙嗗彛淇濇姢閫昏緫銆? */
function getResponsiveRingScale() {
  const aspect = window.innerWidth / window.innerHeight;
  return THREE.MathUtils.clamp(aspect * 1.25, 0.58, 1);
}

/**
 * 閾舵渤澶栧湀姣?AI 鍏夊湀瀹藉緱澶氾紝绔栧睆鏃堕渶瑕佹洿鏄庢樉鐨勬暣浣撴敹鏀俱€? * 鍚庣画閾舵渤绉诲埌鍙充晶鏃讹紝鍙妸杩欐鏀规垚璺?UI 鐣欑櫧鑱斿姩鐨勫竷灞€缂╂斁銆? */
function getResponsiveGalaxyScale() {
  const aspect = window.innerWidth / window.innerHeight;
  return THREE.MathUtils.clamp(aspect * 1.02, 0.44, 1);
}

function onPointerMove(event) {
  updatePointer(event);
  state.isHoveringRing = isPointerOverRing();
  updateBlackHoleCursor();
  document.body.classList.add("black-hole-active");
  state.isPointerInside = true;
  state.blackHoleTargetStrength = 1;
}

function onPointerLeave() {
  state.isHoveringRing = false;
  state.isPointerInside = false;
  state.blackHoleTargetStrength = 0;
  if (state.blackHoleCursor) {
    state.blackHoleCursor.classList.remove("is-visible");
    state.blackHoleCursor.style.opacity = "0";
    state.blackHoleCursor.style.transform = "translate3d(-50%, -50%, 0) scale(0.86)";
  }
}

function onPointerDown(event) {
  updatePointer(event);
  if (state.isExplosionStarted) {
    if (handlePortfolioUIClick()) { return; }
    return;
  }
  if (!isPointerOverRing()) { return; }
  state.isExplosionStarted = true;
  state.collapseStartTime = state.clock.getElapsedTime();
  document.body.classList.add("galaxy-active");
}

function handlePortfolioUIClick() {
  if (
    !state.portfolioUIGroup
    || !state.portfolioUIGroup.visible
    || state.detailTransition
    || state.detailPage?.classList.contains("is-visible")
  ) { return false; }
  state.raycaster.setFromCamera(state.pointer, state.camera);
  const hits = state.raycaster.intersectObjects(state.portfolioUIHitTargets, false);
  if (hits.length) {
    startPortfolioDetailTransition(hits[0].object.userData);
    return true;
  }

  const bounds = canvas.getBoundingClientRect();
  const projectedPosition = new THREE.Vector3();
  const worldPosition = new THREE.Vector3();
  const fallbackHit = state.portfolioUIItems.find(({ itemGroup }) => {
    itemGroup.getWorldPosition(worldPosition);
    projectedPosition.copy(worldPosition).project(state.camera);
    const screenX = (projectedPosition.x * 0.5 + 0.5) * bounds.width + bounds.left;
    const screenY = (-projectedPosition.y * 0.5 + 0.5) * bounds.height + bounds.top;
    return Math.hypot(screenX - state.pointerClient.x, screenY - state.pointerClient.y) < 110;
  });

  if (!fallbackHit) { return false; }
  startPortfolioDetailTransition({
    portfolioItem: fallbackHit.item,
    itemGroup: fallbackHit.itemGroup,
  });
  return true;
}

function startPortfolioDetailTransition(targetData) {
  if (!targetData || !state.galaxy) { return; }
  const worldPosition = new THREE.Vector3();
  targetData.itemGroup.getWorldPosition(worldPosition);
  state.selectedPortfolioItem = targetData.portfolioItem;
  state.selectedPortfolioGroup = targetData.itemGroup;
  state.detailTransition = {
    startTime: state.clock.getElapsedTime(),
    fromCameraZ: state.camera.position.z,
    targetCameraZ: 2.25,
    fromGalaxyPosition: state.galaxy.position.clone(),
    targetGalaxyPosition: state.galaxy.position.clone().sub(new THREE.Vector3(worldPosition.x * 1.18, worldPosition.y * 1.18, 0)),
  };
  if (state.detailTitle) {
    state.detailTitle.textContent = targetData.portfolioItem.name;
  }
  renderWorksGallery(targetData.portfolioItem.key || targetData.portfolioItem.name);
  if (state.detailPage) {
    state.detailPage.scrollTop = 0;
  }
  state.isPortfolioMenuOpen = false;
  pushPortfolioDetailHistory();
  hidePortfolioTitle();
  hideReturnArrow();
  createDetailGalaxyParticles();
}

function pushPortfolioDetailHistory() {
  /*
    浏览器回退接入：
    打开 5 个 UI 的作品分页面时，额外压入一层历史记录。
    这样用户点击浏览器左上角回退箭头时，会先回到银河 UI，而不是直接离开网站。
  */
  if (state.isDetailHistoryActive) { return; }
  window.history.pushState({ aiGalaxyPortfolioDetail: true }, "", window.location.href);
  state.isDetailHistoryActive = true;
}

function onBrowserHistoryBack() {
  if (!state.isDetailHistoryActive) { return; }
  if (!state.detailPage?.classList.contains("is-visible") && !state.detailTransition) { return; }
  state.isDetailHistoryActive = false;
  returnToPortfolioMenu({ fromHistory: true });
}

function returnToPortfolioMenu(options = {}) {
  if (!state.detailPage?.classList.contains("is-visible") && !state.detailTransition) { return; }
  const shouldRepairHistory = state.isDetailHistoryActive && !options.fromHistory;
  state.isDetailHistoryActive = false;
  state.detailTransition = null;
  closeMediaLightbox();
  state.isPortfolioMenuOpen = true;
  if (state.detailPage) {
    document.body.classList.remove("portfolio-detail-active");
    state.detailPage.classList.remove("is-visible");
    state.detailPage.setAttribute("aria-hidden", "true");
    state.detailPage.scrollTop = 0;
  }
  if (state.detailPageParticles) {
    state.detailPageParticles.visible = false;
    state.detailPageParticles.material.uniforms.uOpacity.value = 0;
  }
  state.camera.position.z = CONFIG.cameraZ;
  if (state.galaxy) {
    state.galaxy.visible = true;
    state.galaxy.position.x = 0;
    state.galaxy.position.y = 0;
  }
  restorePortfolioItemVisibility();
  state.selectedPortfolioGroup = null;
  showReturnArrow();
  window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  updateScrollProgress();
  if (shouldRepairHistory) {
    window.history.replaceState(null, "", window.location.href);
  }
}

async function loadWorksManifest() {
  /*
    浣滃搧娓呭崟鎺ュ叆鐐癸細
    鍙戝竷鍓嶈繍琛?scripts/generate-works-manifest.cjs 浼氭壂鎻?works 鏂囦欢澶瑰苟鐢熸垚 works-manifest.json銆?    缃戦〉浼樺厛璇诲彇杩欎釜娓呭崟锛涘鏋滄竻鍗曚笉瀛樺湪鎴栬鍙栧け璐ワ紝灏卞洖閫€鍒颁笂鏂?WORKS_LIBRARY锛岄伩鍏嶄綔鍝侀〉绌虹櫧銆?  */
  if (window.WORKS_MANIFEST) {
    worksLibrary = { ...WORKS_LIBRARY, ...window.WORKS_MANIFEST };
    createQiuPhotoSphere();
    return;
  }

  try {
    const response = await fetch(`./works-manifest.json?v=${Date.now()}`, { cache: "no-store" });
    if (!response.ok) { throw new Error(`manifest status ${response.status}`); }
    const manifest = await response.json();
    worksLibrary = { ...WORKS_LIBRARY, ...manifest };
  } catch (error) {
    console.warn("Using fallback works library.", error);
    worksLibrary = WORKS_LIBRARY;
  }
  createQiuPhotoSphere();
}

function renderWorksGallery(categoryName) {
  if (!state.detailGallery) { return; }
  const categoryKey = getPortfolioItemKey(categoryName);
  const ui = SITE_CONTENT.ui || {};
  if (categoryKey === "Project") {
    renderProjectProcessPage();
    return;
  }

  const isVideoCategory = categoryKey === "Video";
  state.detailGallery.className = isVideoCategory ? "works-gallery video-gallery" : "works-gallery";
  const works = [...(worksLibrary[categoryKey] || [])].sort((a, b) => a.title.localeCompare(b.title, "zh-CN", { numeric: true, sensitivity: "base" }));
  state.detailGallery.replaceChildren();

  if (!works.length) {
    const empty = document.createElement("p");
    empty.className = "works-empty";
    empty.textContent = ui.emptyWorksText || "作品内容即将更新";
    state.detailGallery.append(empty);
    return;
  }

  if (categoryKey === "Poster") {
    renderPosterGroupedGallery(works, ui);
    return;
  }

  if (categoryKey === "Design") {
    renderDesignGroupedGallery(works, ui);
    return;
  }

  works.forEach((work, workIndex) => {
    state.detailGallery.append(createWorkCard(work, { isVideoCategory, workIndex, ui }));
  });
}

function renderPosterGroupedGallery(works, ui) {
  const groups = [
    { prefix: "1", title: "电商海报" },
    { prefix: "2", title: "影视海报" },
    { prefix: "3", title: "Banner" },
    { prefix: "4", title: "其他" },
  ];

  groups.forEach((group) => {
    const title = document.createElement("h2");
    title.className = "poster-category-title";
    title.textContent = group.title;
    state.detailGallery.append(title);

    works
      .filter((work) => getPosterFilePrefix(work) === group.prefix)
      .forEach((work, workIndex) => {
        state.detailGallery.append(createWorkCard(work, { isVideoCategory: false, workIndex, ui }));
      });
  });
}

function getPosterFilePrefix(work) {
  const fileName = decodeURIComponent(work.src || work.title || "")
    .split(/[\\/]/)
    .pop() || "";
  return fileName.trim().charAt(0);
}

function renderDesignGroupedGallery(works, ui) {
  state.detailGallery.className = "works-gallery design-gallery";
  const designPage = SITE_CONTENT.designPage || {};
  const groups = designPage.groups || [
    { prefix: "1", title: "超级符号", description: "品牌核心视觉符号与延展画面。" },
    { prefix: "2", title: "IP设计延展", description: "围绕角色或品牌 IP 的视觉延展。" },
    { prefix: "3", title: "图标", description: "图标风格、系统符号与界面视觉。" },
    { prefix: "4", title: "启动页", description: "启动页、开屏与入口视觉设计。" },
  ];

  groups.forEach((group) => {
    const groupWorks = works.filter((work) => getDesignFilePrefix(work) === group.prefix);
    state.detailGallery.append(createDesignGroupCard(group, groupWorks, ui));
  });
}

function getDesignFilePrefix(work) {
  const fileName = decodeURIComponent(work.src || work.title || "")
    .split(/[\\/]/)
    .pop() || "";
  return fileName.trim().charAt(0);
}

function createDesignGroupCard(group, groupWorks, ui) {
  const card = document.createElement("button");
  card.className = "design-group-card";
  card.type = "button";
  card.disabled = !groupWorks.length;
  card.setAttribute("aria-label", `${ui.viewLabelPrefix || "查看"} ${group.title}`);

  const title = document.createElement("h2");
  title.className = "design-group-title";
  title.textContent = group.title;

  const mediaFrame = document.createElement("span");
  mediaFrame.className = "design-group-media";

  if (groupWorks.length) {
    const cover = groupWorks[0];
    const image = document.createElement("img");
    image.src = encodeURI(cover.src);
    image.alt = cover.title;
    image.loading = "lazy";
    mediaFrame.append(image);
  } else {
    const empty = document.createElement("span");
    empty.className = "design-group-empty";
    empty.textContent = ui.emptyWorksText || "作品内容即将更新";
    mediaFrame.append(empty);
  }

  const copy = document.createElement("span");
  copy.className = "design-group-copy";
  const description = document.createElement("span");
  description.textContent = group.description || "";
  const count = document.createElement("span");
  count.className = "design-group-count";
  count.textContent = `${groupWorks.length} 张图片`;
  copy.append(description, count);

  card.append(title, mediaFrame, copy);
  card.addEventListener("click", () => openDesignGroupLightbox(group, groupWorks));
  return card;
}

function createWorkCard(work, { isVideoCategory = false, workIndex = 0, ui = {} } = {}) {
  const card = document.createElement(isVideoCategory && work.type === "video" ? "article" : "button");
  card.className = `work-card ${work.layout === "wide" ? "is-wide" : "is-portrait"}${isVideoCategory && work.type === "video" ? " is-video-card" : ""}`;
  if (card.tagName === "BUTTON") {
    card.type = "button";
    card.setAttribute("aria-label", `${ui.viewLabelPrefix || "查看"} ${work.title}`);
  }

  const mediaFrame = document.createElement("span");
  mediaFrame.className = "work-media-frame";

  const media = document.createElement(work.type === "video" ? "video" : "img");
  media.src = encodeURI(work.src);
  media.loading = "lazy";
  if (work.type === "video") {
    media.muted = !isVideoCategory;
    media.loop = !isVideoCategory;
    media.playsInline = true;
    media.preload = "metadata";
    if (isVideoCategory) {
      media.controls = true;
    }
    media.addEventListener("loadedmetadata", () => classifyMediaCard(card, media.videoWidth, media.videoHeight));
  } else {
    media.alt = work.title;
    media.addEventListener("load", () => classifyMediaCard(card, media.naturalWidth, media.naturalHeight));
  }

  mediaFrame.append(media);

  const caption = document.createElement("span");
  caption.className = "work-caption";
  caption.textContent = work.title;
  card.append(mediaFrame, caption);
  if (isVideoCategory && work.type === "video") {
    const description = createVideoDescription(work, workIndex);
    card.append(description);
  } else {
    card.addEventListener("click", () => openMediaLightbox(work));
  }
  return card;
}

function createVideoDescription(work, workIndex = 0) {
  const videoPage = SITE_CONTENT.videoPage || {};
  const rawDescription = videoPage.descriptions?.[workIndex] || videoPage.descriptions?.find?.((item) => item.title === work.title);
  const customDescription = typeof rawDescription === "string" ? { description: rawDescription } : rawDescription;
  const panel = document.createElement("div");
  panel.className = "video-card-copy";
  const category = document.createElement("p");
  category.className = "video-card-category";
  category.textContent = customDescription?.category || videoPage.category || "视频作品";
  const title = document.createElement("h2");
  title.textContent = customDescription?.title || work.title;
  const description = document.createElement("p");
  description.className = "video-card-description";
  description.textContent = customDescription?.description || videoPage.defaultDescription || "AIGC 视频创作练习，结合画面概念、镜头节奏和后期包装，呈现产品、角色或场景的动态视觉表达。";
  const hint = document.createElement("p");
  hint.className = "video-card-hint";
  hint.textContent = customDescription?.hint || videoPage.hint || "可在页面内直接播放";
  panel.append(category, title, description, hint);
  return panel;
}

function renderProjectProcessPage() {
  if (!state.detailGallery) { return; }
  state.detailGallery.replaceChildren();
  state.detailGallery.className = "project-process-page";

  const projects = SITE_CONTENT.projectPage?.videos || [];
  const projectPage = SITE_CONTENT.projectPage || {};
  const metaLabels = projectPage.metaLabels || {};

  projects.forEach((project, projectIndex) => {
    const article = document.createElement("article");
    article.className = "project-video-panel";
    const isInitiallyOpen = projectIndex === 0;
    article.classList.toggle("is-open", isInitiallyOpen);

    const summary = document.createElement("div");
    summary.className = "project-video-summary";

    const videoButton = document.createElement("button");
    videoButton.className = "project-video-thumb";
    videoButton.type = "button";
    videoButton.setAttribute("aria-label", `${SITE_CONTENT.ui?.playLabelPrefix || "播放"} ${project.title}`);
    const previewVideoSrc = getProjectVideoSrc(project, projectIndex);
    const posterSrc = project.poster || "";
    videoButton.innerHTML = `
      ${posterSrc ? `<img class="project-video-preview" src="${encodeURI(posterSrc)}" alt="" loading="lazy">` : previewVideoSrc ? `<video class="project-video-preview" src="${encodeURI(previewVideoSrc)}" preload="metadata" muted playsinline></video>` : ""}
      <span class="project-play-mark" aria-hidden="true"></span>
      <span class="project-video-title">${project.title}</span>
    `;
    const previewVideo = videoButton.querySelector(".project-video-preview");
    if (previewVideo?.tagName === "VIDEO") {
      previewVideo.addEventListener("loadedmetadata", () => {
        if (previewVideo.duration > 0.12) {
          previewVideo.currentTime = 0.1;
        }
      }, { once: true });
      previewVideo.addEventListener("loadeddata", () => {
        videoButton.classList.add("has-preview");
      }, { once: true });
      previewVideo.addEventListener("error", () => {
        videoButton.classList.remove("has-preview");
      }, { once: true });
    } else if (previewVideo) {
      previewVideo.addEventListener("load", () => {
        videoButton.classList.add("has-preview");
      }, { once: true });
      previewVideo.addEventListener("error", () => {
        videoButton.classList.remove("has-preview");
      }, { once: true });
    }
    videoButton.addEventListener("click", () => openProjectVideo(project, projectIndex));

    const meta = document.createElement("div");
    meta.className = "project-video-meta";
    [
      [metaLabels.duration || "时长", project.duration || ""],
      [metaLabels.style || "风格", project.style || ""],
      [metaLabels.tools || "工具", project.tools || ""],
    ].forEach(([label, value]) => {
      const row = document.createElement("p");
      const labelElement = document.createElement("span");
      labelElement.textContent = label;
      row.append(labelElement, document.createTextNode(value));
      meta.append(row);
    });

    summary.append(videoButton, meta);

    const toggle = document.createElement("button");
    toggle.className = "project-process-toggle";
    toggle.type = "button";
    toggle.setAttribute("aria-expanded", String(isInitiallyOpen));
    toggle.setAttribute("aria-label", SITE_CONTENT.ui?.expandProcessLabel || "展开制作流程");
    toggle.innerHTML = `<span></span><b>${projectPage.processToggle || "⌄"}</b><span></span>`;

    const process = document.createElement("div");
    process.className = "project-process-detail";
    process.hidden = !isInitiallyOpen;
    process.append(createProjectTimeline(projectIndex, project));

    toggle.addEventListener("click", () => {
      const isOpen = article.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
      process.hidden = !isOpen;
    });

    article.append(summary, toggle, process);
    state.detailGallery.append(article);
  });
}

function createProjectTimeline(projectIndex, project = {}) {
  const steps = project.steps || SITE_CONTENT.projectPage?.steps || [];

  const timeline = document.createElement("ol");
  timeline.className = "project-timeline";

  steps.forEach((step, stepIndex) => {
    const item = document.createElement("li");
    item.className = "project-step";

    const copy = document.createElement("div");
    copy.className = "project-step-copy";
    copy.innerHTML = `<h3>${stepIndex + 1}. ${step.title || ""}</h3><p>${step.description || ""}</p>`;

    const images = document.createElement("div");
    images.className = "project-step-images";
    for (let imageIndex = 0; imageIndex < 3; imageIndex += 1) {
      const imageButton = document.createElement("button");
      imageButton.className = "project-step-image";
      imageButton.type = "button";
      const imageSrc = getProjectProcessImageSrc(projectIndex, stepIndex, imageIndex);
      imageButton.innerHTML = `<img src="${encodeURI(imageSrc)}" alt="" loading="lazy"><span>${stepIndex + 1}.${imageIndex + 1}</span>`;
      imageButton.querySelector("img")?.addEventListener("error", () => {
        imageButton.classList.add("is-missing");
      }, { once: true });
      imageButton.addEventListener("click", () => openProjectProcessImage(projectIndex, stepIndex, imageIndex));
      images.append(imageButton);
    }

    item.append(copy, images);
    timeline.append(item);
  });

  return timeline;
}

function getProjectVideoSrc(project, projectIndex) {
  if (project.src) { return project.src; }
  if (projectIndex === 0) { return FIRST_PROJECT_VIDEO_SRC; }
  if (projectIndex === 1) { return SECOND_PROJECT_VIDEO_SRC; }
  if (projectIndex === 2) { return THIRD_PROJECT_VIDEO_SRC; }
  return "";
}

function getProjectProcessImageSrc(projectIndex, stepIndex, imageIndex) {
  return `${PROJECT_ASSET_ROOT}/${projectIndex + 1}-${stepIndex + 1}-${imageIndex + 1}.png`;
}

function formatProjectTemplate(template, projectIndex, stepIndex, imageIndex) {
  return String(template)
    .replaceAll("{project}", projectIndex + 1)
    .replaceAll("{step}", stepIndex + 1)
    .replaceAll("{image}", imageIndex + 1);
}

function openProjectVideo(project, projectIndex) {
  if (project.url) {
    window.open(project.url, "_blank", "noopener,noreferrer");
    return;
  }
  if (!state.mediaLightbox || !state.mediaLightboxStage) { return; }
  state.mediaLightboxStage.replaceChildren();
  const videoSrc = getProjectVideoSrc(project, projectIndex);
  if (videoSrc) {
    const media = document.createElement("video");
    media.src = encodeURI(videoSrc);
    media.controls = true;
    media.autoplay = true;
    media.playsInline = true;
    media.addEventListener("play", pauseBackgroundMusicForVideo);
    media.addEventListener("pause", resumeBackgroundMusicAfterVideo);
    media.addEventListener("ended", resumeBackgroundMusicAfterVideo);
    media.addEventListener("error", () => {
      resumeBackgroundMusicAfterVideo();
      showProjectPlaceholder(project.title, SITE_CONTENT.projectPage?.emptyVideoText || "");
    }, { once: true });
    pauseBackgroundMusicForVideo();
    state.mediaLightboxStage.append(media);
    state.mediaLightbox.classList.add("is-visible");
    state.mediaLightbox.setAttribute("aria-hidden", "false");
    return;
  }
  showProjectPlaceholder(project.title, SITE_CONTENT.projectPage?.emptyVideoText || "");
}

function showProjectPlaceholder(title, text) {
  if (!state.mediaLightbox || !state.mediaLightboxStage) { return; }
  state.mediaLightboxStage.replaceChildren();
  const placeholder = document.createElement("div");
  placeholder.className = "project-lightbox-placeholder";
  placeholder.innerHTML = `<strong>${title}</strong><span>${text}</span>`;
  state.mediaLightboxStage.append(placeholder);
  state.mediaLightbox.classList.add("is-visible");
  state.mediaLightbox.setAttribute("aria-hidden", "false");
}

function openProjectProcessImage(projectIndex, stepIndex, imageIndex) {
  if (!state.mediaLightbox || !state.mediaLightboxStage) { return; }
  state.mediaLightboxStage.replaceChildren();
  const imageSrc = getProjectProcessImageSrc(projectIndex, stepIndex, imageIndex);
  const projectPage = SITE_CONTENT.projectPage || {};
  const image = document.createElement("img");
  image.src = encodeURI(imageSrc);
  image.alt = formatProjectTemplate(projectPage.processImageAltTemplate || "流程图片 {project}-{step}-{image}", projectIndex, stepIndex, imageIndex);
  image.addEventListener("error", () => {
    const placeholderTitle = formatProjectTemplate(projectPage.processImagePlaceholderTemplate || "流程图片占位 {project}-{step}-{image}", projectIndex, stepIndex, imageIndex);
    showProjectPlaceholder(placeholderTitle, projectPage.emptyImageText || "");
  }, { once: true });
  state.mediaLightboxStage.append(image);
  state.mediaLightbox.classList.add("is-visible");
  state.mediaLightbox.setAttribute("aria-hidden", "false");
}

function classifyMediaCard(card, width, height) {
  if (!width || !height) { return; }
  const aspect = width / height;
  card.style.setProperty("--preview-aspect", `${width} / ${height}`);
  card.classList.toggle("is-wide", aspect >= 1.45);
  card.classList.toggle("is-portrait", aspect < 1.45);
}

function openMediaLightbox(work, options = {}) {
  if (!state.mediaLightbox || !state.mediaLightboxStage) { return; }
  state.mediaLightboxStage.replaceChildren();
  const media = document.createElement(work.type === "video" ? "video" : "img");
  media.src = encodeURI(work.src);
  if (work.type === "video") {
    pauseBackgroundMusicForVideo();
    media.controls = true;
    media.autoplay = true;
    media.playsInline = true;
    media.addEventListener("play", pauseBackgroundMusicForVideo);
    media.addEventListener("pause", resumeBackgroundMusicAfterVideo);
    media.addEventListener("ended", resumeBackgroundMusicAfterVideo);
  } else {
    media.alt = work.title;
  }
  state.mediaLightboxStage.append(media);
  state.mediaLightbox.classList.add("is-visible");
  state.mediaLightbox.setAttribute("aria-hidden", "false");
  if (options.returnToDesignGroup) {
    state.designLightboxReturn = options.returnToDesignGroup;
  } else {
    state.designLightboxReturn = null;
  }
}

function openDesignGroupLightbox(group, groupWorks) {
  if (!state.mediaLightbox || !state.mediaLightboxStage || !groupWorks.length) { return; }
  state.mediaLightboxStage.replaceChildren();

  const gallery = document.createElement("div");
  gallery.className = "design-lightbox-gallery";

  const title = document.createElement("h2");
  title.textContent = group.title;
  gallery.append(title);

  const grid = document.createElement("div");
  grid.className = "design-lightbox-grid";

  groupWorks.forEach((work) => {
    const figure = document.createElement("figure");
    const button = document.createElement("button");
    button.className = "design-lightbox-image-button";
    button.type = "button";
    button.setAttribute("aria-label", `${SITE_CONTENT.ui?.viewLabelPrefix || "查看"} ${work.title}`);
    const image = document.createElement("img");
    image.src = encodeURI(work.src);
    image.alt = work.title;
    image.loading = "lazy";
    button.append(image);
    button.addEventListener("click", () => {
      state.designLightboxReturn = {
        group,
        groupWorks,
        scrollTop: gallery.scrollTop,
      };
      openMediaLightbox(work, { returnToDesignGroup: state.designLightboxReturn });
    });
    figure.append(button);
    grid.append(figure);
  });

  gallery.append(grid);
  state.mediaLightboxStage.append(gallery);
  state.mediaLightbox.classList.add("is-visible");
  state.mediaLightbox.setAttribute("aria-hidden", "false");
}

function closeMediaLightbox() {
  if (!state.mediaLightbox || !state.mediaLightboxStage) { return; }
  const hadVideo = Boolean(state.mediaLightboxStage.querySelector("video"));
  const designReturn = state.designLightboxReturn;
  if (designReturn && !hadVideo) {
    state.designLightboxReturn = null;
    openDesignGroupLightbox(designReturn.group, designReturn.groupWorks);
    const restoredGallery = state.mediaLightboxStage.querySelector(".design-lightbox-gallery");
    if (restoredGallery) {
      restoredGallery.scrollTop = designReturn.scrollTop || 0;
    }
    return;
  }
  state.mediaLightbox.classList.remove("is-visible");
  state.mediaLightbox.setAttribute("aria-hidden", "true");
  state.mediaLightboxStage.replaceChildren();
  state.designLightboxReturn = null;
  if (hadVideo) {
    resumeBackgroundMusicAfterVideo();
  }
  if (state.detailGallery) {
    state.detailGallery.classList.add("is-lightbox-returning");
    state.detailGallery.querySelectorAll(".work-card").forEach((card) => card.blur());
    window.setTimeout(() => {
      state.detailGallery?.classList.remove("is-lightbox-returning");
    }, 260);
  }
}

function updatePointer(event) {
  const bounds = canvas.getBoundingClientRect();
  state.pointer.x = ((event.clientX - bounds.left) / bounds.width) * 2 - 1;
  state.pointer.y = -((event.clientY - bounds.top) / bounds.height) * 2 + 1;
  state.pointerClient.set(event.clientX, event.clientY);
  state.pointerWorld.copy(screenToWorld(state.pointer.x, state.pointer.y, 0));
  updateSpaceBackgroundParallax();
}

function updateSpaceBackgroundParallax() {
  const amount = CONFIG.spaceBackgroundParallaxMax;
  const offsetX = `${(-state.pointer.x * amount).toFixed(2)}px`;
  const offsetY = `${(state.pointer.y * amount).toFixed(2)}px`;
  document.body.style.setProperty("--space-parallax-x", offsetX);
  document.body.style.setProperty("--space-parallax-y", offsetY);
}

function screenToWorld(ndcX, ndcY, z = 0) {
  const visibleHeight = 2 * Math.tan(THREE.MathUtils.degToRad(state.camera.fov * 0.5)) * (state.camera.position.z - z);
  const visibleWidth = visibleHeight * state.camera.aspect;
  return new THREE.Vector3(ndcX * visibleWidth * 0.5, ndcY * visibleHeight * 0.5, z);
}

function updateBlackHoleCursor() {
  if (!state.blackHoleCursor) { return; }
  state.blackHoleCursor.style.left = `${state.pointerClient.x}px`;
  state.blackHoleCursor.style.top = `${state.pointerClient.y}px`;
  state.blackHoleCursor.style.opacity = "1";
  state.blackHoleCursor.style.transform = "translate3d(-50%, -50%, 0) scale(1)";
  state.blackHoleCursor.classList.add("is-visible");
}

function isPointerOverRing() {
  if (!state.ringHitTarget || state.ringGroup.scale.x < 0.14) { return false; }
  state.raycaster.setFromCamera(state.pointer, state.camera);
  return state.raycaster.intersectObject(state.ringHitTarget, false).length > 0;
}

/** 涓诲姩鐢诲惊鐜細闆嗕腑璋冨害鍛煎惛銆佸垎闃舵閾舵渤绮掑瓙鍜岃儗鏅槦鐐规紓绉汇€?*/
function animate() {
  requestAnimationFrame(animate);
  const elapsed = state.clock.getElapsedTime();
  updateRingAnimation(elapsed);
  updateGalaxyParticles(elapsed);
  updateGalaxyPosition(elapsed);
  updateGalaxyScrollTilt();
  updatePortfolioDetailTransition(elapsed);
  updatePortfolioGalaxyUI(elapsed);
  updateQiuPhotoSphere(elapsed);
  updateDetailGalaxyParticles(elapsed);
  updateBlackHoleGalaxyInfluence();
  updateStarsAnimation(elapsed);
  renderFrame();
}

function renderFrame() {
  state.renderer.setScissorTest(false);
  state.renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
  state.renderer.clear(true, true, true);
  state.renderer.render(state.scene, state.camera);

  if (!state.qiuAxisGroup || !state.qiuAxisGroup.visible || !state.qiuCamera) { return; }

  const viewport = getQiuLayerViewport();
  updateQiuLayerCamera(viewport);
  state.renderer.clearDepth();
  state.renderer.setScissor(viewport.x, viewport.y, viewport.width, viewport.height);
  state.renderer.setViewport(viewport.x, viewport.y, viewport.width, viewport.height);
  state.renderer.setScissorTest(true);
  state.renderer.render(state.qiuLayerScene, state.qiuCamera);
  state.renderer.setScissorTest(false);
}

function getQiuLayerViewport() {
  /*
    照片球右上角独立视口：
    这个视口像一个透明的小舞台，只有照片球在这里渲染。
    球体在自己的视口中心附近，因此不会受到主相机画面边缘透视畸变影响。
    视口固定在右上角；页面滚动只临时加速照片球自转，不再移动视口位置。
  */
  const width = Math.round(window.innerWidth * CONFIG.qiuViewportWidthRatio);
  const height = Math.round(window.innerHeight * CONFIG.qiuViewportHeightRatio);
  const x = Math.round(window.innerWidth - width - window.innerWidth * CONFIG.qiuViewportRightRatio);
  const y = Math.round(window.innerHeight - height - window.innerHeight * CONFIG.qiuViewportTopRatio);
  return { x, y, width, height };
}

function updateQiuLayerCamera(viewport = getQiuLayerViewport()) {
  if (!state.qiuCamera || viewport.height <= 0) { return; }
  state.qiuCamera.aspect = viewport.width / viewport.height;
  state.qiuCamera.updateProjectionMatrix();
}

/**
 * 椤甸潰婊氬姩鑱斿姩閾舵渤鐩橀潰銆? * 婊氬埌搴曢儴鏃剁粫 X 杞村悜涓嬬炕杞?135 搴︼紱shader 鍐呴儴鐨勯摱娌宠嚜杞粛缁х画杩涜銆? */
function updateGalaxyScrollTilt() {
  if (!state.galaxy) { return; }
  const targetTilt = state.scrollProgress * -THREE.MathUtils.degToRad(135);
  state.galaxyTilt = THREE.MathUtils.lerp(state.galaxyTilt, targetTilt, 0.085);
  state.galaxy.rotation.x = state.galaxyTilt;
}

function getGalaxyAge() {
  if (!state.galaxy) { return 0; }
  if (state.galaxy.userData.cpuGalaxy) {
    return Math.max(0, state.clock.getElapsedTime() - state.galaxy.userData.cpuGalaxy.galaxyStartTime);
  }
  return Math.max(0, state.clock.getElapsedTime() - state.galaxy.material.uniforms.uGalaxyStartTime.value);
}

function updatePortfolioGalaxyUI(elapsed) {
  if (!state.portfolioUIGroup || !state.galaxy) { return; }
  const isTransitioning = Boolean(state.detailTransition);
  const isVisible = (state.isPortfolioMenuOpen || isTransitioning)
    && state.particlePhase === PARTICLE_PHASES.galaxyFormed
    && !state.detailPage?.classList.contains("is-visible");
  state.portfolioUIGroup.visible = isVisible;
  if (!isVisible) { return; }

  state.portfolioUIGroup.position.copy(state.galaxy.position);
  state.portfolioUIGroup.scale.copy(state.galaxy.scale);
  state.portfolioUIGroup.rotation.set(state.galaxy.rotation.x, 0, getGalaxyAge() * 0.13);

  state.portfolioUIItems.forEach(({ itemGroup }, index) => {
    const isSelectedDuringTransition = isTransitioning && itemGroup === state.selectedPortfolioGroup;
    itemGroup.visible = !isTransitioning || isSelectedDuringTransition;
    itemGroup.children.forEach((child) => {
      if (child.userData.isGoldenOrb) {
        child.rotation.y = elapsed * (0.45 + index * 0.04);
        child.rotation.z = elapsed * (0.28 + index * 0.03);
      }
      if (child.isSprite) {
        child.quaternion.copy(state.camera.quaternion);
      }
    });
  });
}

function restorePortfolioItemVisibility() {
  state.portfolioUIItems.forEach(({ itemGroup }) => {
    itemGroup.visible = true;
    itemGroup.children.forEach((child) => {
      if (child.userData.isPortfolioIcon || child.userData.isPortfolioLabel) {
        child.visible = true;
      }
      if (child.userData.isGoldenOrb) {
        child.scale.setScalar(child.userData.baseScale || 1);
      }
    });
  });
}

function createDetailGalaxyParticles() {
  if (state.detailPageParticles) { return; }
  const count = 1800;
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const speeds = new Float32Array(count);
  const color = new THREE.Color();

  for (let index = 0; index < count; index += 1) {
    const stride = index * 3;
    positions[stride] = THREE.MathUtils.randFloatSpread(12);
    positions[stride + 1] = THREE.MathUtils.randFloatSpread(7);
    positions[stride + 2] = THREE.MathUtils.randFloat(-10, 4);
    sizes[index] = THREE.MathUtils.randFloat(0.035, 0.11);
    speeds[index] = THREE.MathUtils.randFloat(0.22, 0.75);
    const pick = Math.random();
    if (pick < 0.45) {
      color.setRGB(0.35, 0.9, 1);
    } else if (pick < 0.78) {
      color.setRGB(0.68, 0.42, 1);
    } else {
      color.setRGB(1, 0.92, 0.72);
    }
    colors[stride] = color.r;
    colors[stride + 1] = color.g;
    colors[stride + 2] = color.b;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geometry.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

  const material = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      attribute float aSize;
      attribute float aSpeed;
      varying vec3 vColor;
      varying float vAlpha;
      uniform float uTime;
      uniform float uOpacity;
      void main() {
        vColor = color;
        vec3 animatedPosition = position;
        animatedPosition.z = -12.0 + mod(uTime * aSpeed * 3.2 + position.z + 12.0, 17.2);
        animatedPosition.x += sin(uTime * 0.45 + position.y) * 0.18;
        animatedPosition.y += cos(uTime * 0.35 + position.x) * 0.12;
        vec4 viewPosition = modelViewMatrix * vec4(animatedPosition, 1.0);
        gl_Position = projectionMatrix * viewPosition;
        gl_PointSize = aSize * (650.0 / -viewPosition.z) * uOpacity;
        vAlpha = uOpacity;
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        float radius = distance(gl_PointCoord, vec2(0.5));
        float alpha = smoothstep(0.5, 0.04, radius) * vAlpha;
        if (alpha < 0.02) { discard; }
        gl_FragColor = vec4(vColor * 1.22, alpha);
      }
    `,
  });

  state.detailPageParticles = new THREE.Points(geometry, material);
  state.detailPageParticles.visible = false;
  state.scene.add(state.detailPageParticles);
}

function updatePortfolioDetailTransition(elapsed) {
  if (!state.detailTransition || !state.galaxy) { return; }
  const progress = THREE.MathUtils.clamp((elapsed - state.detailTransition.startTime) / CONFIG.portfolioZoomDuration, 0, 1);
  const eased = easeInOutQuint(progress);
  state.camera.position.z = THREE.MathUtils.lerp(state.detailTransition.fromCameraZ, state.detailTransition.targetCameraZ, eased);
  state.galaxy.position.lerpVectors(state.detailTransition.fromGalaxyPosition, state.detailTransition.targetGalaxyPosition, eased);
  if (state.selectedPortfolioGroup) {
    state.selectedPortfolioGroup.children.forEach((child) => {
      if (child.userData.isPortfolioIcon || child.userData.isPortfolioLabel) {
        child.visible = false;
      }
      if (child.userData.isGoldenOrb) {
        child.visible = true;
        child.scale.setScalar(THREE.MathUtils.lerp(1, 4.6, eased));
      }
    });
  }
  if (state.detailPageParticles) {
    state.detailPageParticles.visible = true;
  }

  if (progress >= 1) {
    state.detailTransition = null;
    state.galaxy.visible = false;
    state.portfolioUIGroup.visible = false;
    restorePortfolioItemVisibility();
    if (state.detailPage) {
      document.body.classList.add("portfolio-detail-active");
      state.detailPage.classList.add("is-visible");
      state.detailPage.setAttribute("aria-hidden", "false");
      state.detailPage.scrollTop = 0;
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      state.scrollProgress = 0;
      updateScrollProgress();
    }
    if (state.detailPageParticles) {
      state.detailPageParticles.visible = true;
    }
  }
}

function updateDetailGalaxyParticles(elapsed) {
  if (!state.detailPageParticles) { return; }
  const isVisible = state.detailPage?.classList.contains("is-visible") || state.detailTransition;
  state.detailPageParticles.visible = Boolean(isVisible);
  const targetOpacity = isVisible ? 1 : 0;
  const material = state.detailPageParticles.material;
  material.uniforms.uTime.value = elapsed;
  material.uniforms.uOpacity.value = THREE.MathUtils.lerp(material.uniforms.uOpacity.value, targetOpacity, 0.06);
  state.detailPageParticles.rotation.z = elapsed * 0.018;
  state.detailPageParticles.rotation.y = Math.sin(elapsed * 0.1) * 0.12;
}

/**
 * 榧犳爣榛戞礊瀵归摱娌崇殑鏌斿拰寮曞姏銆? * 杩欓噷鍙洿鏂?shader uniform锛屼笉鏂板缓绮掑瓙锛涢紶鏍囧揩閫熺寮€鏃?strength 浼氱紦鎱㈣“鍑忥紝绮掑瓙鑷劧鍥炶建銆? */
function updateBlackHoleGalaxyInfluence() {
  if (!state.galaxy) { return; }
  state.blackHoleStrength = THREE.MathUtils.lerp(state.blackHoleStrength, state.blackHoleTargetStrength, 0.075);
  if (state.blackHoleStrength < 0.001) {
    state.blackHoleStrength = 0;
  }

  state.galaxy.updateMatrixWorld(true);
  const localBlackHolePosition = state.galaxy.worldToLocal(getPointerOnGalaxyPlane());
  if (state.galaxy.userData.cpuGalaxy) {
    state.galaxy.userData.cpuGalaxy.blackHolePosition.copy(localBlackHolePosition);
    state.galaxy.userData.cpuGalaxy.blackHoleStrength = state.blackHoleStrength;
    return;
  }
  state.galaxy.material.uniforms.uBlackHolePosition.value.copy(localBlackHolePosition);
  state.galaxy.material.uniforms.uBlackHoleStrength.value = state.blackHoleStrength;
}

function getPointerOnGalaxyPlane() {
  /*
    榛戞礊鍚搁檮鍧愭爣闇€瑕佽窡闅忛摱娌崇洏闈㈢炕杞€?    涓嶈兘鍙敤 z=0 鐨勫睆骞曠偣锛屽惁鍒欓〉闈㈡粴鍔ㄥ鑷撮摱娌?rotation.x 鏀瑰彉鍚庯紝榧犳爣瑙嗚浣嶇疆鍜岀矑瀛愬惛闄勪綅缃細閿欎綅銆?  */
  const rayOrigin = state.camera.position.clone();
  const rayDirection = new THREE.Vector3(state.pointer.x, state.pointer.y, 0.5)
    .unproject(state.camera)
    .sub(rayOrigin)
    .normalize();
  const galaxyNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(state.galaxy.quaternion).normalize();
  const denominator = rayDirection.dot(galaxyNormal);

  if (Math.abs(denominator) < 0.0001) {
    return state.pointerWorld.clone();
  }

  const distance = state.galaxy.position.clone().sub(rayOrigin).dot(galaxyNormal) / denominator;
  return rayOrigin.add(rayDirection.multiplyScalar(distance));
}

function updateRingAnimation(elapsed) {
  const pulseScale = 1 + Math.sin(elapsed * 1.65) * 0.045;
  const hoverBoost = state.isHoveringRing && !state.isExplosionStarted ? 1.035 : 1;
  let collapseProgress = 0;
  if (state.collapseStartTime !== null) {
    collapseProgress = THREE.MathUtils.clamp((elapsed - state.collapseStartTime) / CONFIG.ringCollapseDuration, 0, 1);
  }
  const collapseScale = THREE.MathUtils.lerp(1, 0.04, collapseProgress * collapseProgress);
  const responsiveScale = getResponsiveRingScale();
  state.ringGroup.scale.setScalar(CONFIG.ringBaseScale * responsiveScale * pulseScale * hoverBoost * collapseScale);
  state.ringMesh.material.uniforms.uTime.value = elapsed;
  state.ringMesh.material.uniforms.uHover.value = THREE.MathUtils.lerp(state.ringMesh.material.uniforms.uHover.value, state.isHoveringRing && !state.isExplosionStarted ? 1 : 0, 0.08);
  state.ringMesh.material.uniforms.uCollapse.value = collapseProgress;
  state.labelSprite.material.opacity = 1 - collapseProgress;
  if (collapseProgress >= 1 && !state.galaxy) {
    state.ringGroup.visible = false;
    createGalaxyParticles();
  }
}

/**
 * 鍒囨崲绮掑瓙鐘舵€侊紝骞舵妸褰撳墠鐘舵€佺殑璧风偣鏃堕棿璁颁笅鏉ャ€? * UI 鎺ュ叆鐐癸細鐘舵€侀泦涓鐞嗗悗锛屾爣棰?UI 鍙互浠庤繖閲岀洃鍚€滈摱娌冲凡褰㈡垚鈥濄€? */
function beginParticlePhase(phaseName) {
  state.particlePhase = phaseName;
  state.particlePhaseStartTime = state.clock.getElapsedTime();
  if (phaseName === PARTICLE_PHASES.galaxyFormed && state.galaxy) {
    if (state.galaxy.userData.cpuGalaxy) {
      state.galaxy.userData.cpuGalaxy.galaxyStartTime = state.particlePhaseStartTime;
      revealPortfolioScene();
      return;
    }
    state.galaxy.material.uniforms.uGalaxyStartTime.value = state.particlePhaseStartTime;
    revealPortfolioScene();
  }
}

function getCpuGalaxyPoint(data, index, phase, progress, elapsed) {
  const seed = data.seeds[index];
  const radiusT = THREE.MathUtils.clamp(data.galaxyRadii[index] / CONFIG.galaxyOuterRadius, 0, 1);
  const explodeAngle = data.explodeAngles[index] + seed * 0.7;
  /*
    爆炸中心填充控制：
    半径越靠近银河中心的粒子，第一次爆炸和二次展开时保留越多中心填充，
    避免所有粒子同时被推到外圈形成黑色空洞。
  */
  const coreHold = Math.pow(1 - radiusT, 2.2);
  const firstRadius = data.explodeRadii[index] * (0.06 + radiusT * 1.12);
  const centerFillRadius = data.galaxyRadii[index] * 0.48 * coreHold;
  const explodeTargetRadius = THREE.MathUtils.lerp(firstRadius, centerFillRadius, coreHold * 0.82);
  const thickness = data.thicknesses[index];

  if (phase === PARTICLE_PHASES.explode) {
    const radius = explodeTargetRadius * easeOutCubic(progress);
    return {
      x: Math.cos(explodeAngle) * radius,
      y: Math.sin(explodeAngle) * radius * THREE.MathUtils.lerp(1, 0.72, progress),
      z: thickness * 0.28,
    };
  }

  const contractedRadius = explodeTargetRadius * THREE.MathUtils.lerp(1, 0.24 + radiusT * 0.05, easeInOutCubic(progress));
  if (phase === PARTICLE_PHASES.contractAndOrbit) {
    return {
      x: Math.cos(explodeAngle) * contractedRadius,
      y: Math.sin(explodeAngle) * contractedRadius * 0.7,
      z: thickness * THREE.MathUtils.lerp(0.28, 0.78, progress),
    };
  }

  const rippleProgress = THREE.MathUtils.smoothstep(progress, data.rippleDelays[index], Math.min(1, data.rippleDelays[index] + 0.44));
  /*
    银河中心填充控制：
    之前这里用 firstRadius 做最小半径，会把靠近中心的粒子也推到外圈，形成中间空洞。
    现在中心粒子允许从半径 0 开始，只有外层粒子才保留更大的爆炸半径。
  */
  const galaxyTargetRadius = data.galaxyRadii[index] * (1.02 + radiusT * 0.12);
  const outerBurstRadius = Math.max(galaxyTargetRadius, firstRadius * 1.55);
  const coreBlend = THREE.MathUtils.smoothstep(radiusT, 0.08, 0.34);
  const finalRadius = THREE.MathUtils.lerp(galaxyTargetRadius, outerBurstRadius, coreBlend);
  if (phase === PARTICLE_PHASES.rippleExpand) {
    const radius = THREE.MathUtils.lerp(contractedRadius, finalRadius, easeOutCubic(rippleProgress));
    const wave = Math.sin(rippleProgress * Math.PI + seed * 4) * radiusT * 0.12;
    return {
      x: Math.cos(explodeAngle) * radius,
      y: Math.sin(explodeAngle) * radius * THREE.MathUtils.lerp(0.7, 0.56, rippleProgress),
      z: thickness + wave,
    };
  }

  const galaxyAge = Math.max(0, elapsed - data.galaxyStartTime);
  const galaxyRotation = galaxyAge * 0.13;
  /*
    悬臂形成控制：
    爆炸过程不参与悬臂整理。只有当银河完全炸开并进入向右移动阶段后，
    粒子才在持续旋转中逐渐从完整盘面整理出密度更高的中心对称悬臂。
  */
  const armFormationProgress = easeInOutCubic(THREE.MathUtils.clamp(galaxyAge / (CONFIG.galaxyMoveDuration * CONFIG.armFormationDurationScale), 0, 1));
  const spiralAngle = lerpAngleClockwise(explodeAngle, data.galaxyAngles[index], armFormationProgress);
  const breathing = Math.sin(finalRadius * 3.6 - elapsed * 0.88 + seed * 11) * radiusT * 0.08;
  return {
    x: Math.cos(spiralAngle + galaxyRotation) * (finalRadius + breathing),
    y: Math.sin(spiralAngle + galaxyRotation) * (finalRadius + breathing) * (0.58 + radiusT * 0.08),
    z: thickness * 0.74 + Math.sin(elapsed * 0.7 + seed * 9) * radiusT * 0.04,
  };
}

function updateCpuGalaxyParticles(elapsed, phaseProgress) {
  const data = state.galaxy?.userData.cpuGalaxy;
  if (!data) { return; }

  const positionAttribute = state.galaxy.geometry.getAttribute("position");
  const positions = positionAttribute.array;
  const phase = state.particlePhase;
  const count = data.seeds.length;

  for (let index = 0; index < count; index += 1) {
    const point = getCpuGalaxyPoint(data, index, phase, phaseProgress, elapsed);
    let x = point.x;
    let y = point.y;
    let z = point.z;

    if (phase === PARTICLE_PHASES.galaxyFormed && data.blackHoleStrength > 0.001) {
      const dx = data.blackHolePosition.x - x;
      const dy = data.blackHolePosition.y - y;
      const distance = Math.hypot(dx, dy);
      const mask = THREE.MathUtils.smoothstep(1.05 - distance, 0, 1.05) * data.blackHoleStrength;
      if (distance > 0.0001 && mask > 0.001) {
        const gx = dx / distance;
        const gy = dy / distance;
        const tangentX = -gy;
        const tangentY = gx;
        const spin = Math.sin(elapsed * 2.4 + data.seeds[index] * 23);
        x += gx * mask * 0.24 + tangentX * spin * mask * 0.08;
        y += gy * mask * 0.24 + tangentY * spin * mask * 0.08;
        z += Math.sin(elapsed * 3 + data.seeds[index] * 17) * mask * 0.035;
      }
    }

    const stride = index * 3;
    positions[stride] = x;
    positions[stride + 1] = y;
    positions[stride + 2] = z;
  }

  positionAttribute.needsUpdate = true;
}

/**
 * 鎺ㄨ繘绮掑瓙鐘舵€佹満銆? * 姣忎釜鐘舵€佸彧璐熻矗鑷繁鐨勮妭濂忥紱鐪熸鐨勭矑瀛愪綅绉诲湪 shader 涓畬鎴愩€? */
function updateGalaxyParticles(elapsed) {
  if (!state.galaxy) { return; }

  const material = state.galaxy.material;
  const phaseElapsed = elapsed - state.particlePhaseStartTime;
  const isCpuGalaxy = Boolean(state.galaxy.userData.cpuGalaxy);

  if (isCpuGalaxy) {
    let phaseProgress = 1;
    if (state.particlePhase === PARTICLE_PHASES.explode) {
      phaseProgress = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.explode, 0, 1);
      updateCpuGalaxyParticles(elapsed, phaseProgress);
      if (phaseElapsed >= PHASE_DURATIONS.explode) {
        beginParticlePhase(PARTICLE_PHASES.contractAndOrbit);
      }
      return;
    }

    if (state.particlePhase === PARTICLE_PHASES.contractAndOrbit) {
      phaseProgress = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.contractAndOrbit, 0, 1);
      updateCpuGalaxyParticles(elapsed, phaseProgress);
      if (phaseElapsed >= PHASE_DURATIONS.contractAndOrbit) {
        beginParticlePhase(PARTICLE_PHASES.rippleExpand);
      }
      return;
    }

    if (state.particlePhase === PARTICLE_PHASES.rippleExpand) {
      phaseProgress = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.rippleExpand, 0, 1);
      updateCpuGalaxyParticles(elapsed, phaseProgress);
      if (phaseElapsed >= PHASE_DURATIONS.rippleExpand) {
        beginParticlePhase(PARTICLE_PHASES.galaxyFormed);
      }
      return;
    }

    updateCpuGalaxyParticles(elapsed, 1);
    return;
  }

  material.uniforms.uTime.value = elapsed;

  if (state.particlePhase === PARTICLE_PHASES.explode) {
    material.uniforms.uPhase.value = 0;
    material.uniforms.uPhaseProgress.value = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.explode, 0, 1);
    if (phaseElapsed >= PHASE_DURATIONS.explode) {
      beginParticlePhase(PARTICLE_PHASES.contractAndOrbit);
    }
    return;
  }

  if (state.particlePhase === PARTICLE_PHASES.contractAndOrbit) {
    material.uniforms.uPhase.value = 1;
    material.uniforms.uPhaseProgress.value = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.contractAndOrbit, 0, 1);
    if (phaseElapsed >= PHASE_DURATIONS.contractAndOrbit) {
      beginParticlePhase(PARTICLE_PHASES.rippleExpand);
    }
    return;
  }

  if (state.particlePhase === PARTICLE_PHASES.rippleExpand) {
    material.uniforms.uPhase.value = 2;
    material.uniforms.uPhaseProgress.value = THREE.MathUtils.clamp(phaseElapsed / PHASE_DURATIONS.rippleExpand, 0, 1);
    if (phaseElapsed >= PHASE_DURATIONS.rippleExpand) {
      beginParticlePhase(PARTICLE_PHASES.galaxyFormed);
    }
    return;
  }

  // galaxyFormed: 绗簩娆″鐖嗙粨鏉熷嵆鍒囧叆閾舵渤鐩橀潰锛屽苟浠庤繖涓€鍒诲紑濮嬫參鏃嬭浆銆?
  material.uniforms.uPhase.value = 3;
  material.uniforms.uPhaseProgress.value = 1;
}

function updateStarsAnimation(elapsed) {
  state.stars.rotation.z = elapsed * 0.004;
  state.stars.rotation.y = Math.sin(elapsed * 0.05) * 0.018;
  if (state.spaceDust) {
    state.spaceDust.material.uniforms.uTime.value = elapsed;
  }
}
