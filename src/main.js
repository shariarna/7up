import * as THREE from 'three';
import { gsap } from 'gsap';
import { createSevenUpTextureCanvas } from './logo.js';

// --- State Variables ---
let scene, camera, renderer;
let canGroup, canBody, canRims, droplets = [];
let podiumMesh;
let fluidParticles, bubbleParticles;
const mouse = new THREE.Vector2(0, 0);
const targetMouse = new THREE.Vector2(0, 0);
let audioCtx = null;
let fizzInterval = null;
let isPlayingSound = false;

// --- Pointer/Touch Drag Rotation Variables ---
let isDragging = false;
let prevMouseX = 0;
let rotationVelocityY = 0;
let autoRotate = true;
let autoRotateTimeout = null;

// --- Scroll-stop Snap Variables ---
// FRONT_FACE_ANGLE = Math.PI because Three.js CylinderGeometry maps
// u=0 of the texture to the +Z face (toward camera). Our label is
// centered at u=0.5 which maps to the -Z face. Rotating by PI
// brings it to face the camera perfectly.
const FRONT_FACE_ANGLE = Math.PI;
let lastScrollY = 0;
let scrollMoveTimeout = null;
let isScrolling = false;
let snapTargetY = null;

// --- Startup guard: prevents diagnostic mode firing during page load ---
let startupComplete = false;

// --- Diagnostic Mode State ---
let isDiagnosticMode = false;
let diagnosticTriggered = false;
let hoverScaleMultiplier = { value: 1.0 };

const particleCount = 150;
const particleData = [];

// --- Web Audio API Procedural Fizz Sound ---
function createBubbleSound() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Create a bubble pop sound
  const osc = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  osc.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Pop characteristics
  const now = audioCtx.currentTime;
  const startFreq = 150 + Math.random() * 800;
  const endFreq = startFreq + 200 + Math.random() * 300;

  osc.frequency.setValueAtTime(startFreq, now);
  osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.1);

  gainNode.gain.setValueAtTime(0.01 + Math.random() * 0.03, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

  osc.type = 'sine';
  osc.start(now);
  osc.stop(now + 0.12);
}

function startFizzSound() {
  if (fizzInterval) clearInterval(fizzInterval);
  fizzInterval = setInterval(() => {
    if (Math.random() > 0.3) {
      createBubbleSound();
    }
  }, 80);
}

function stopFizzSound() {
  if (fizzInterval) {
    clearInterval(fizzInterval);
    fizzInterval = null;
  }
}

// --- Initialize Three.js Scene ---
function initThree() {
  const container = document.getElementById('canvas-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  // Scene
  scene = new THREE.Scene();

  // Camera
  camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0.4, 13);
  camera.lookAt(0, 0.4, 0);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setSize(width, height);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  container.appendChild(renderer.domElement);

  // Groups
  canGroup = new THREE.Group();
  scene.add(canGroup);

  // Setup Lights
  setupLights();

  // Build Objects
  buildPodium();
  buildCan(); // Restored to build the hyper-realistic metallic can
  buildFluidSplash();
  buildAmbientBubbles();

  // Event Listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);

  // Mouse & Touch Drag Listeners for Interactive Rotation
  window.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  window.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp, { passive: true });

  // Initial Placement
  adjustLayoutForMobile();

  // Kick off render loop
  animate();
}

// --- Lights ---
function setupLights() {
  // Ambient — moderate fill so edges stay dark like the photo
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
  scene.add(ambientLight);

  // Main directional (stadium key light)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.6);
  dirLight.position.set(5, 8, 5);
  scene.add(dirLight);

  // Warm yellow-green side fill
  const fillLight = new THREE.DirectionalLight(0xb8ffd0, 0.5);
  fillLight.position.set(-5, 3, 2);
  scene.add(fillLight);

  // Backlight for subtle rim glow
  const rimLight = new THREE.DirectionalLight(0x00c060, 1.2);
  rimLight.position.set(0, 2, -5);
  scene.add(rimLight);

  // Base point light
  const pointLight = new THREE.PointLight(0x00cc66, 2.0, 10);
  pointLight.position.set(0, -2, 1);
  scene.add(pointLight);

  // Front light — strong enough to see logo, not so strong it bleaches
  const frontLight = new THREE.DirectionalLight(0xffffff, 1.8);
  frontLight.position.set(0, 0, 10);
  scene.add(frontLight);

  // Gentle top fill
  const topFill = new THREE.DirectionalLight(0xffffff, 0.6);
  topFill.position.set(0, 10, 2);
  scene.add(topFill);
}

// --- Build Podium ---
function buildPodium() {
  const podiumGroup = new THREE.Group();
  podiumGroup.position.y = -2.8;

  // Outer ring
  const outerGeo = new THREE.CylinderGeometry(2.5, 2.7, 0.2, 64);
  const outerMat = new THREE.MeshStandardMaterial({
    color: 0x051a0d,
    roughness: 0.4,
    metalness: 0.9,
    flatShading: false
  });
  const outerRing = new THREE.Mesh(outerGeo, outerMat);
  podiumGroup.add(outerRing);

  // Glowing neon inner disc
  const innerGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.15, 64);
  const innerMat = new THREE.MeshStandardMaterial({
    color: 0x00e676,
    emissive: 0x00a74c,
    emissiveIntensity: 0.8,
    roughness: 0.1,
    metalness: 0.8
  });
  const innerRing = new THREE.Mesh(innerGeo, innerMat);
  innerRing.position.y = 0.05;
  podiumGroup.add(innerRing);

  // Center glass/reflective metal plate
  const centerGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.1, 64);
  const centerMat = new THREE.MeshStandardMaterial({
    color: 0x0a1f12,
    roughness: 0.05,
    metalness: 0.95
  });
  const centerPlate = new THREE.Mesh(centerGeo, centerMat);
  centerPlate.position.y = 0.1;
  podiumGroup.add(centerPlate);

  podiumMesh = podiumGroup;
  scene.add(podiumMesh);
}

// --- Build Can (Metallic & Realistic) ---
function buildCan() {
  const labelCanvas = createSevenUpTextureCanvas();
  const labelTexture = new THREE.CanvasTexture(labelCanvas);
  labelTexture.wrapS = THREE.ClampToEdgeWrapping;
  labelTexture.wrapT = THREE.ClampToEdgeWrapping;
  
  // Can body material — lower metalness so the vibrant green texture shines through,
  // add a subtle green emissive so dark areas never look black.
  const bodyMaterial = new THREE.MeshStandardMaterial({
    map: labelTexture,
    roughness: 0.25,
    metalness: 0.4,
    emissive: new THREE.Color(0x041008),
    emissiveIntensity: 0.2,
    bumpScale: 0.03
  });

  // Metallic rim material (chrome/silver)
  const rimMaterial = new THREE.MeshStandardMaterial({
    color: 0xcccccc,
    roughness: 0.1,
    metalness: 0.95
  });

  // Can Cylinder Geometry — slightly shorter and thicker per user request
  const CAN_R = 1.08;  // radius — thicker
  const CAN_H = 4.7;   // height — a bit shorter
  const bodyGeo = new THREE.CylinderGeometry(CAN_R, CAN_R, CAN_H, 64, 1, true);
  canBody = new THREE.Mesh(bodyGeo, bodyMaterial);
  canBody.position.y = 0;
  canGroup.add(canBody);

  // Top Cap / Rim
  const topRimGeo = new THREE.CylinderGeometry(CAN_R, CAN_R, 0.1, 64);
  const topRim = new THREE.Mesh(topRimGeo, rimMaterial);
  topRim.position.y = CAN_H / 2 + 0.05;
  canGroup.add(topRim);

  const topInnerGeo = new THREE.CylinderGeometry(CAN_R * 0.86, CAN_R * 0.86, 0.06, 64);
  const topInner = new THREE.Mesh(topInnerGeo, rimMaterial);
  topInner.position.y = CAN_H / 2 + 0.1;
  canGroup.add(topInner);

  // Bottom Cap / Rim — slightly thicker plate
  const bottomRimGeo = new THREE.CylinderGeometry(CAN_R * 0.98, CAN_R, 0.18, 64);
  const bottomRim = new THREE.Mesh(bottomRimGeo, rimMaterial);
  bottomRim.position.y = -(CAN_H / 2) - 0.07;
  canGroup.add(bottomRim);


  // Add water droplets for hyper-realistic condensation
  const dropletCount = 120;
  const dropletMat = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.0,
    metalness: 0.1,
    transparent: true,
    opacity: 0.65,
    transmission: 0.9, // Refraction
    ior: 1.333
  });

  for (let i = 0; i < dropletCount; i++) {
    // Distribute randomly around the cylinder surface
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * (CAN_H - 0.5); // leave rims clean
    const dropletRadius = CAN_R + 0.008; // slightly larger than can radius
    const dropletSize = 0.012 + Math.random() * 0.028;

    // Make some droplets elongated (streaks)
    let dropletGeo;
    if (Math.random() > 0.85) {
      dropletGeo = new THREE.SphereGeometry(dropletSize, 8, 8);
      dropletGeo.scale(1, 2 + Math.random() * 2, 0.5); // running drop
    } else {
      dropletGeo = new THREE.SphereGeometry(dropletSize, 8, 8);
      dropletGeo.scale(1, 1, 0.5); // flat drops
    }

    const droplet = new THREE.Mesh(dropletGeo, dropletMat);
    
    // Position
    droplet.position.set(
      dropletRadius * Math.cos(theta),
      y,
      dropletRadius * Math.sin(theta)
    );

    // Rotate droplet to align with cylinder normal
    droplet.rotation.y = -theta + Math.PI / 2;

    canGroup.add(droplet);
    droplets.push(droplet);
  }

  // Start with label facing the camera (rotation.y = Math.PI)
  canGroup.position.set(0, 1.2, 0);
  canGroup.rotation.set(0.05, Math.PI, 0.02);
}

// --- Snap Helper ---
// Returns the nearest angle (in radians) that is equivalent to FRONT_FACE_ANGLE
// modulo 2*PI, measured from currentAngle, so the rotation always takes the
// shortest possible arc back to the label-facing position.
function _nearestFrontAngle(currentAngle) {
  const TWO_PI = Math.PI * 2;
  // How far currentAngle is past the front angle (in full rotations)
  const delta = currentAngle - FRONT_FACE_ANGLE;
  const fullRotations = Math.round(delta / TWO_PI);
  return FRONT_FACE_ANGLE + fullRotations * TWO_PI;
}

// --- Pointer/Touch Drag Handlers ---
function onPointerDown(event) {

  // Only start drag if clicking the canvas container or empty space, not widgets/buttons
  const targetTag = event.target.tagName.toLowerCase();
  if (targetTag === 'button' || targetTag === 'a' || event.target.closest('.glass-panel')) {
    return;
  }

  isDragging = true;
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  prevMouseX = clientX;
  autoRotate = false;
  
  if (autoRotateTimeout) {
    clearTimeout(autoRotateTimeout);
    autoRotateTimeout = null;
  }
}

function onPointerMove(event) {
  if (!isDragging) return;
  
  const clientX = event.touches ? event.touches[0].clientX : event.clientX;
  const deltaX = clientX - prevMouseX;
  
  // Rotate the bottle/can group
  canGroup.rotation.y += deltaX * 0.007;
  
  // Calculate spin velocity for inertia
  rotationVelocityY = deltaX * 0.006;
  
  prevMouseX = clientX;
}

function onPointerUp() {
  if (!isDragging) return;
  isDragging = false;

  // After the drag ends, snap the label back to the front once momentum fades
  autoRotateTimeout = setTimeout(() => {
    snapTargetY = _nearestFrontAngle(canGroup.rotation.y);
  }, 800);
}

// --- Build Fluid Splash ---
function buildFluidSplash() {
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);
  const colors = new Float32Array(particleCount * 3);
  const sizes = new Float32Array(particleCount);

  // Curated splash colors: Soda green and yellow
  const colorPalette = [
    new THREE.Color(0x00e676), // Green
    new THREE.Color(0xffd600), // Yellow
    new THREE.Color(0xffffff)  // White/Fizz
  ];

  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const radius = 1.4 + Math.random() * 1.5;
    const y = -1.5 + Math.random() * 3.5;

    const x = Math.cos(theta) * radius;
    const z = Math.sin(theta) * radius;

    positions[i * 3] = x;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = z;

    particleData.push({
      x: x,
      y: y,
      z: z,
      ox: x,
      oy: y,
      oz: z,
      speed: 0.5 + Math.random() * 1.5,
      angle: theta,
      radius: radius,
      freq: 1 + Math.random() * 2,
      amplitude: 0.1 + Math.random() * 0.3,
      size: 4 + Math.random() * 12
    });

    const chosenColor = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = chosenColor.r;
    colors[i * 3 + 1] = chosenColor.g;
    colors[i * 3 + 2] = chosenColor.b;

    sizes[i] = particleData[i].size;
  }

  particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  particleGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const pCanvas = document.createElement('canvas');
  pCanvas.width = 32;
  pCanvas.height = 32;
  const pCtx = pCanvas.getContext('2d');
  const pGrad = pCtx.createRadialGradient(16, 16, 0, 16, 16, 16);
  pGrad.addColorStop(0, 'rgba(255, 255, 255, 1)');
  pGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
  pGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
  pCtx.fillStyle = pGrad;
  pCtx.beginPath();
  pCtx.arc(16, 16, 16, 0, Math.PI * 2);
  pCtx.fill();
  const pTexture = new THREE.CanvasTexture(pCanvas);

  const particleMaterial = new THREE.PointsMaterial({
    size: 0.28,
    map: pTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  fluidParticles = new THREE.Points(particleGeo, particleMaterial);
  scene.add(fluidParticles);
}

// --- Build Ambient Rising Bubbles ---
function buildAmbientBubbles() {
  const bubbleCount = 80;
  const bubbleGeo = new THREE.BufferGeometry();
  const bubblePos = new Float32Array(bubbleCount * 3);

  for (let i = 0; i < bubbleCount * 3; i += 3) {
    bubblePos[i] = (Math.random() - 0.5) * 15;
    bubblePos[i + 1] = (Math.random() - 0.5) * 12;
    bubblePos[i + 2] = (Math.random() - 0.5) * 10 - 2;
  }

  bubbleGeo.setAttribute('position', new THREE.BufferAttribute(bubblePos, 3));

  const pCanvas = document.createElement('canvas');
  pCanvas.width = 64;
  pCanvas.height = 64;
  const pCtx = pCanvas.getContext('2d');
  
  pCtx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  pCtx.lineWidth = 3;
  pCtx.beginPath();
  pCtx.arc(32, 32, 26, 0, Math.PI * 2);
  pCtx.stroke();
  
  pCtx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  pCtx.beginPath();
  pCtx.arc(22, 22, 6, 0, Math.PI * 2);
  pCtx.fill();

  const bubbleTexture = new THREE.CanvasTexture(pCanvas);

  const bubbleMat = new THREE.PointsMaterial({
    size: 0.35,
    map: bubbleTexture,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  bubbleParticles = new THREE.Points(bubbleGeo, bubbleMat);
  scene.add(bubbleParticles);
}

// --- Interaction & Mouse Move Physics ---
function onMouseMove(event) {
  targetMouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  targetMouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

// --- Screen Resize ---
function onWindowResize() {
  const container = document.getElementById('canvas-container');
  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();

  renderer.setSize(width, height);
  adjustLayoutForMobile();
}

function getLayoutConfig() {
  const w = window.innerWidth;
  const isPhone = w < 480;
  const isMobile = w < 850;

  if (isPhone) {
    return {
      home:     { canY: 1.8, canScale: 0.42, canZ: 0, podiumY: 0.5 },
      features: { canY: 0.8, canScale: 0.36, canZ: 0.5, podiumY: -0.1 }
    };
  } else if (isMobile) {
    return {
      home:     { canY: 1.6, canScale: 0.46, canZ: 0, podiumY: 0.4 },
      features: { canY: 0.6, canScale: 0.40, canZ: 0.5, podiumY: -0.3 }
    };
  } else if (w < 1100) {
    return {
      home:     { canY: 1.2, canScale: 0.44, canZ: 0, podiumY: 0.3 },
      features: { canY: 0.2, canScale: 0.60, canZ: 0.5, podiumY: -0.7 }
    };
  } else {
    return {
      home:     { canY: 1.2, canScale: 0.50, canZ: 0, podiumY: 0.4 },
      features: { canY: 0.2, canScale: 0.62, canZ: 0.5, podiumY: -0.7 }
    };
  }
}

function updateThreeLayout(elapsedTime) {
  if (!canGroup || !podiumMesh) return;

  const scrollY = window.scrollY;
  const featuresSection = document.getElementById('features');
  const featuresTop = featuresSection ? featuresSection.offsetTop : window.innerHeight;

  const maxTransitionScroll = Math.max(100, featuresTop);
  const t = Math.min(1, Math.max(0, scrollY / maxTransitionScroll));

  const config = getLayoutConfig();

  // Target positions
  const targetCanY = config.home.canY + t * (config.features.canY - config.home.canY);
  const targetCanZ = config.home.canZ + t * (config.features.canZ - config.home.canZ);
  const targetCanScale = (config.home.canScale + t * (config.features.canScale - config.home.canScale)) * hoverScaleMultiplier.value;

  const targetPodiumY = config.home.podiumY + t * (config.features.podiumY - config.home.podiumY);
  const targetPodiumScale = targetCanScale;

  // Smoothly interpolate (lerp) position and scale
  canGroup.position.y += (targetCanY - canGroup.position.y) * 0.1;
  canGroup.position.z += (targetCanZ - canGroup.position.z) * 0.1;
  
  const nextScaleX = canGroup.scale.x + (targetCanScale - canGroup.scale.x) * 0.1;
  canGroup.scale.set(nextScaleX, nextScaleX, nextScaleX);

  podiumMesh.position.y += (targetPodiumY - podiumMesh.position.y) * 0.1;
  const nextPodiumScale = podiumMesh.scale.x + (targetPodiumScale - podiumMesh.scale.x) * 0.1;
  podiumMesh.scale.set(nextPodiumScale, nextPodiumScale, nextPodiumScale);

  // Add the float effect on top
  canGroup.position.y += Math.sin(elapsedTime * 1.5) * 0.002;

  // Handle Rotation
  if (isDragging) {
    // Rotation is updated directly in pointermove; clear any pending snap
    snapTargetY = null;
  } else {
    // Detect scroll activity
    const currentScrollY = window.scrollY;
    if (currentScrollY !== lastScrollY) {
      // User is scrolling — spin the can proportional to scroll delta
      const scrollDelta = currentScrollY - lastScrollY;
      canGroup.rotation.y += scrollDelta * 0.012;
      lastScrollY = currentScrollY;
      isScrolling = true;
      snapTargetY = null; // cancel any ongoing snap

      // After 350 ms of no scroll activity, queue a snap-to-front
      clearTimeout(scrollMoveTimeout);
      scrollMoveTimeout = setTimeout(() => {
        isScrolling = false;
        snapTargetY = _nearestFrontAngle(canGroup.rotation.y);
      }, 350);
    }

    // Apply inertia friction from drag
    rotationVelocityY *= 0.92;
    if (Math.abs(rotationVelocityY) < 0.0005) rotationVelocityY = 0;
    canGroup.rotation.y += rotationVelocityY;

    if (snapTargetY !== null) {
      // Smoothly ease toward the front-facing angle
      const diff = snapTargetY - canGroup.rotation.y;
      canGroup.rotation.y += diff * 0.06;
      // Add a gentle alive wobble once nearly snapped
      if (Math.abs(diff) < 0.01) {
        canGroup.rotation.y = snapTargetY + Math.sin(elapsedTime * 1.2) * 0.025;
      }
    } else if (!isScrolling && rotationVelocityY === 0 && !isDragging) {
      // Idle: very gentle wobble around current front position
      canGroup.rotation.y += Math.sin(elapsedTime * 0.8) * 0.0004;
    }
  }

  // Slight tilt based on mouse vertical movement for depth
  canGroup.rotation.x = 0.1 - mouse.y * 0.15;

  // Diagnostic trigger — only after startup is complete
  if (startupComplete) {
    if (t > 0.8 && !diagnosticTriggered) {
      diagnosticTriggered = true;
      activateDiagnosticMode();
    } else if (t < 0.3 && diagnosticTriggered) {
      diagnosticTriggered = false;
      deactivateDiagnosticMode();
    }
  }

  // Update navigation links highlight based on scroll position
  const activeLink = t > 0.5 ? '#features' : '#home';
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === activeLink);
  });
}

function adjustLayoutForMobile() {
  updateThreeLayout(0);
}


// --- Diagnostic Scan Mode Actions ---
function activateDiagnosticMode() {
  if (isDiagnosticMode) return;
  isDiagnosticMode = true;

  document.body.classList.add('features-active');

  // Update navbar
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#features');
  });

  // Move 3D can
  if (canGroup && podiumMesh) {
    const targetCanY = window.innerWidth < 850 ? 1.2 : 0.6;
    const targetCanScale = window.innerWidth < 850 ? 0.48 : 0.72;
    const targetPodiumY = window.innerWidth < 850 ? -0.3 : -0.7;
    gsap.to(canGroup.position, { x: 0, y: targetCanY, z: 0.5, duration: 0.8, ease: 'power3.out' });
    gsap.to(canGroup.scale, { x: targetCanScale, y: targetCanScale, z: targetCanScale, duration: 0.8, ease: 'power3.out' });
    gsap.to(podiumMesh.position, { y: targetPodiumY, duration: 0.8, ease: 'power3.out' });
    gsap.to(podiumMesh.scale, { x: targetCanScale, y: targetCanScale, z: targetCanScale, duration: 0.8, ease: 'power3.out' });
  }

  // Show scan header immediately
  const scanHeader = document.getElementById('scan-header');
  if (scanHeader) {
    gsap.fromTo(scanHeader,
      { opacity: 0, y: -20 },
      {
        opacity: 1,
        y: 0,
        duration: 0.5,
        ease: 'power3.out'
      }
    );
  }

  // GSAP staggered card reveals with gentle slide-in, no delays
  const cards = document.querySelectorAll('.diag-card');
  cards.forEach((card, i) => {
    const isLeft = card.closest('.left-diag') !== null;
    const startX = isLeft ? -40 : 40;
    const delay = i * 0.08; // small stagger for fluid entry

    gsap.fromTo(card,
      { opacity: 0, x: startX, scaleX: 0.95, filter: 'blur(5px)' },
      {
        opacity: 1, x: 0, scaleX: 1, filter: 'blur(0px)',
        duration: 0.5,
        delay: delay,
        ease: 'power2.out',
        onStart: () => {
          if (isPlayingSound) setTimeout(createBubbleSound, 0);
          // Subtle border flash on entry
          card.style.borderColor = 'var(--primary-green)';
          card.style.boxShadow = '0 0 20px rgba(0,230,118,0.3)';
          setTimeout(() => {
            card.style.borderColor = '';
            card.style.boxShadow = '';
          }, 400);
        }
      }
    );
  });
}


function deactivateDiagnosticMode() {
  if (!isDiagnosticMode) return;
  isDiagnosticMode = false;

  document.body.classList.remove('features-active');

  // Restore navigation link highlighting to Home
  document.querySelectorAll('.nav-link').forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#home');
  });

  // Reset scan header
  const scanHeader = document.getElementById('scan-header');
  if (scanHeader) {
    gsap.set(scanHeader, { opacity: 0, y: -20 });
  }

  // Reset cards for re-entry
  document.querySelectorAll('.diag-card').forEach(card => {
    gsap.set(card, { opacity: 0, x: 0, scaleX: 1, filter: 'none', clearProps: 'borderColor,boxShadow' });
  });

  // Smoothly return 3D can to normal dashboard position
  if (canGroup && podiumMesh) {
    let targetCanY, targetCanScale, targetPodiumY;
    if (window.innerWidth < 1100) {
      targetCanY = 1.8;
      targetCanScale = 0.5;
      targetPodiumY = 0.3;
    } else {
      targetCanY = 1.8;
      targetCanScale = 0.58;
      targetPodiumY = 0.4;
    }

    gsap.to(canGroup.position, { x: 0, y: targetCanY, z: 0, duration: 0.8, ease: 'power3.out' });
    gsap.to(canGroup.scale, { x: targetCanScale, y: targetCanScale, z: targetCanScale, duration: 0.8, ease: 'power3.out' });
    gsap.to(podiumMesh.position, { y: targetPodiumY, duration: 0.8, ease: 'power3.out' });
    gsap.to(podiumMesh.scale, { x: targetCanScale, y: targetCanScale, z: targetCanScale, duration: 0.8, ease: 'power3.out' });
  }
}

function updateDiagnosticLines() {
  const svg = document.getElementById('scan-svg');
  if (!svg) return;

  svg.setAttribute('viewBox', `0 0 ${window.innerWidth} ${window.innerHeight}`);

  // Base Y height for can center projection
  const canX = window.innerWidth / 2;
  const canY = window.innerHeight / 2 - (window.innerWidth < 850 ? 80 : 60);

  const cards = document.querySelectorAll('.diag-card');
  cards.forEach((card, i) => {
    const rect = card.getBoundingClientRect();
    const isLeft = card.closest('.left-diag') !== null;
    
    const startX = isLeft ? rect.right : rect.left;
    const startY = rect.top + rect.height / 2;

    const elbowSize = isLeft ? 45 : -45;
    const elbowX = startX + elbowSize;

    const path = document.getElementById(`path-${i + 1}`);
    if (path) {
      path.setAttribute('d', `M ${startX} ${startY} L ${elbowX} ${startY} L ${canX} ${canY}`);
    }
  });
}

// --- Main Animation Loop ---
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsedTime = clock.getElapsedTime();

  // Smooth mouse interpolation
  mouse.x += (targetMouse.x - mouse.x) * 0.1;
  mouse.y += (targetMouse.y - mouse.y) * 0.1;

  // 1 & 2. Update Three.js layout positioning and rotation smoothly
  updateThreeLayout(elapsedTime);
  
  // 3. Podium subtle rotation & hover reactivity
  podiumMesh.rotation.y = -elapsedTime * 0.08;

  // 4. Fluid Splash Dynamics
  const posAttr = fluidParticles.geometry.attributes.position;
  const positions = posAttr.array;

  for (let i = 0; i < particleCount; i++) {
    const data = particleData[i];

    data.angle += 0.008 * data.speed;
    const wobble = Math.sin(elapsedTime * data.freq + i) * data.amplitude;
    const currentRadius = data.radius + wobble;

    let targetX = Math.cos(data.angle) * currentRadius;
    let targetZ = Math.sin(data.angle) * currentRadius;
    let targetY = data.oy + Math.cos(elapsedTime * 0.8 + i) * 0.15;

    const mouseProjX = mouse.x * 3.5;
    const mouseProjY = mouse.y * 3.5;

    const dx = targetX - mouseProjX;
    const dy = targetY - mouseProjY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 1.8) {
      const force = (1.8 - dist) * 0.4;
      targetX += (dx / dist) * force;
      targetY += (dy / dist) * force;
    }

    positions[i * 3] += (targetX - positions[i * 3]) * 0.15;
    positions[i * 3 + 1] += (targetY - positions[i * 3 + 1]) * 0.15;
    positions[i * 3 + 2] += (targetZ - positions[i * 3 + 2]) * 0.15;
  }
  posAttr.needsUpdate = true;

  // 5. Ambient Bubble Rising
  const bubblePosAttr = bubbleParticles.geometry.attributes.position;
  const bPositions = bubblePosAttr.array;
  const bubbleLength = bPositions.length;

  for (let i = 1; i < bubbleLength; i += 3) {
    bPositions[i] += (isDiagnosticMode ? 0.024 : 0.012) + Math.sin(elapsedTime + i) * 0.003;
    bPositions[i - 1] += Math.sin(elapsedTime * 1.5 + i) * 0.004;

    if (bPositions[i] > 6) {
      bPositions[i] = -6;
      bPositions[i - 1] = (Math.random() - 0.5) * 15;
    }
  }
  bubblePosAttr.needsUpdate = true;

  // 6. Draw diagnostic lines if active
  if (isDiagnosticMode) {
    updateDiagnosticLines();
  }

  renderer.render(scene, camera);
}

// --- GSAP Scrolling and UI Animations ---
function initAnimations() {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out', duration: 1.2 } });

  tl.from('.header-hud', { y: -80, opacity: 0 });
  tl.from('#kit-widget', { x: -250, opacity: 0 }, '-=0.8');
  tl.from('#warning-widget', { x: -250, opacity: 0 }, '-=1.0');
  tl.from('#countdown-widget', { x: 250, opacity: 0 }, '-=1.2');
  tl.from('#stats-widget', { x: 250, opacity: 0 }, '-=1.0');
  tl.from('#trivia-widget', { x: 250, opacity: 0 }, '-=1.0');
  
  tl.from('.hero-text-wrap', { scale: 0.9, opacity: 0 }, '-=1.2');
  tl.from('.cta-container', { y: 50, opacity: 0 }, '-=0.9');

  // Wire up custom navigation clicks
  const featuresLink = document.querySelector('a[href="#features"]');
  if (featuresLink) {
    featuresLink.addEventListener('click', (e) => {
      e.preventDefault();
      const featuresSection = document.getElementById('features');
      if (featuresSection) {
        featuresSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  const homeLink = document.querySelector('a[href="#home"]');
  if (homeLink) {
    homeLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const closeBtn = document.getElementById('close-scan-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  const buyBtn = document.getElementById('buy-btn');
  if (buyBtn) {
    buyBtn.addEventListener('mouseenter', () => {
      gsap.to(hoverScaleMultiplier, { value: 1.15, duration: 0.4, ease: 'back.out(2)' });
      if (isPlayingSound) {
        for (let i = 0; i < 6; i++) {
          setTimeout(createBubbleSound, i * 60 + Math.random() * 30);
        }
      }
    });
    buyBtn.addEventListener('mouseleave', () => {
      gsap.to(hoverScaleMultiplier, { value: 1.0, duration: 0.4, ease: 'power2.out' });
    });
  }

  const soundBtn = document.getElementById('sound-btn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      isPlayingSound = !isPlayingSound;
      if (isPlayingSound) {
        startFizzSound();
        soundBtn.classList.add('active');
        soundBtn.style.color = 'var(--primary-green)';
        soundBtn.style.borderColor = 'var(--primary-green)';
        soundBtn.style.boxShadow = '0 0 15px rgba(0, 230, 118, 0.5)';
        createBubbleSound();
        setTimeout(createBubbleSound, 50);
        setTimeout(createBubbleSound, 120);
      } else {
        stopFizzSound();
        soundBtn.classList.remove('active');
        soundBtn.style.color = 'var(--text-primary)';
        soundBtn.style.borderColor = 'var(--glass-border)';
        soundBtn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
      }
    });
  }
}

// --- Run App ---
document.addEventListener('DOMContentLoaded', () => {
  // Prevent browser from restoring previous scroll position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  lastScrollY = 0;

  initThree();
  initAnimations();

  // Allow diagnostic mode only after page has fully settled
  setTimeout(() => { startupComplete = true; }, 800);
});
