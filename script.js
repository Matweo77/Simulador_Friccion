// ========================================
// PHYSICS LAB - NEWTON'S SECOND LAW SIMULATOR
// ========================================

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// ===== CANVAS SIZE =====
function resizeCanvas() {
  const container = canvas.parentElement;
  const rect = container.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.width * (9 / 16);
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);

// ===== CONSTANTS =====
const SCALE = 50; // 50 px = 1 m
const GRAVITY = 9.8;
const CAMERA_OFFSET = 150; // Offset de camara para que el objeto sea visible
const VELOCITY_STOP_THRESHOLD = 0.02;
const INITIAL_POSITION_METERS = 0; // El objeto inicia exactamente en 0 metros

// ===== GAME STATE =====
let state = "idle"; // "idle" | "running" | "end"

// ===== OBJECT STATE =====
let objectX = INITIAL_POSITION_METERS * SCALE; // Posicion en pixeles (0 metros = 0 pixeles)
let velocity = 0;
let mass = 5;
let appliedForce = 50;
let acceleration = 0;

// ===== CAMERA =====
let cameraX = -CAMERA_OFFSET; // Camara inicial para ver el metro 0

// ===== DISTANCE =====
let startX = INITIAL_POSITION_METERS * SCALE; // Posicion inicial en pixeles
let distance = 0;

// ===== FRICTION COEFFICIENTS =====
let muStatic = 0.03;
let muKinetic = 0.02;

// ===== SURFACE =====
let currentSurface = "ice";
const surfaces = {
  ice: {
    muStatic: 0.03,
    muKinetic: 0.02,
    groundColor: "#a5f3fc",
    groundGradient: ["#cffafe", "#a5f3fc", "#67e8f9"],
    skyGradient: ["#0c4a6e", "#0ea5e9", "#7dd3fc"],
    name: "Hielo"
  },
  wood: {
    muStatic: 0.6,
    muKinetic: 0.4,
    groundColor: "#d97706",
    groundGradient: ["#fbbf24", "#d97706", "#92400e"],
    skyGradient: ["#292524", "#78716c", "#d6d3d1"],
    name: "Madera"
  },
  sand: {
    muStatic: 0.7,
    muKinetic: 0.6,
    groundColor: "#fbbf24",
    groundGradient: ["#fef3c7", "#fde68a", "#fbbf24"],
    skyGradient: ["#7c2d12", "#ea580c", "#fed7aa"],
    name: "Arena"
  }
};

// ===== OBJECT TYPES =====
// Solo objetos que se deslizan (NO ruedas, pelotas, automóviles)
let currentObject = "metal-box";
const objects = {
  "metal-box": {
    name: "Caja Metálica",
    width: 55,
    height: 55,
    defaultMass: 8,
    frictionMultiplier: 0.47,  // Metal sobre superficies
    color: "#6b7280",
    draw: drawMetalBox
  },
  "wood-box": {
    name: "Caja de Madera",
    width: 50,
    height: 50,
    defaultMass: 5,
    frictionMultiplier: 0.40,  // Madera sobre superficies
    color: "#d97706",
    draw: drawWoodBox
  },
  "cardboard-box": {
    name: "Caja de Cartón",
    width: 48,
    height: 45,
    defaultMass: 2,
    frictionMultiplier: 0.35,  // Cartón sobre superficies
    color: "#a16207",
    draw: drawCardboardBox
  },
  "concrete-block": {
    name: "Bloque de Concreto",
    width: 60,
    height: 50,
    defaultMass: 15,
    frictionMultiplier: 0.55,  // Concreto sobre superficies
    color: "#6b7280",
    draw: drawConcreteBlock
  }
};

// ===== TIME =====
let lastTime = 0;
let simulationTime = 0;  // Tiempo de simulación en segundos
let frictionForce = 0;   // Fuerza de fricción actual

// ===== HELPERS =====
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (val, min, max) => Math.max(min, Math.min(max, val));

// ===== UI ELEMENTS =====
const forceInput = document.getElementById("force");
const massInput = document.getElementById("mass");
const forceRange = document.getElementById("forceRange");
const massRange = document.getElementById("massRange");
const simulateBtn = document.getElementById("simulateBtn");
const resetBtn = document.getElementById("resetBtn");
const objectSelector = document.getElementById("objectSelector");
const surfaceSelector = document.getElementById("surfaceSelector");
const canvasOverlay = document.getElementById("canvasOverlay");

// ===== HUD ELEMENTS =====
const hudState = document.getElementById("hudState");
const hudVelocity = document.getElementById("hudVelocity");
const hudDistance = document.getElementById("hudDistance");
const hudTime = document.getElementById("hudTime");
const hudAcceleration = document.getElementById("hudAcceleration");
const hudAppliedForce = document.getElementById("hudAppliedForce");
const hudMass = document.getElementById("hudMass");
const hudFrictionCoef = document.getElementById("hudFrictionCoef");
const hudNormalForce = document.getElementById("hudNormalForce");
const hudFrictionForce = document.getElementById("hudFrictionForce");
const hudFrictionType = document.getElementById("hudFrictionType");
const stateIndicator = document.getElementById("stateIndicator");

// ===== OBJECT INFO ELEMENTS =====
const objectMassEl = document.getElementById("objectMass");
const objectFrictionEl = document.getElementById("objectFriction");

// ===== FORMULA ELEMENTS =====
const formulaNewton = document.getElementById("formulaNewton");
const formulaFriction = document.getElementById("formulaFriction");
const formulaNormal = document.getElementById("formulaNormal");

// ===== RESULT ELEMENTS =====
const resultPanel = document.getElementById("resultPanel");
const resultIcon = document.getElementById("resultIcon");
const resultText = document.getElementById("resultText");

// ===== INPUT SYNC =====
function syncInputs() {
  forceInput.addEventListener("input", () => {
    forceRange.value = forceInput.value;
    appliedForce = parseFloat(forceInput.value) || 0;
  });

  forceRange.addEventListener("input", () => {
    forceInput.value = forceRange.value;
    appliedForce = parseFloat(forceRange.value) || 0;
  });

  massInput.addEventListener("input", () => {
    massRange.value = massInput.value;
    mass = parseFloat(massInput.value) || 1;
    updateHUD();
  });

  massRange.addEventListener("input", () => {
    massInput.value = massRange.value;
    mass = parseFloat(massRange.value) || 1;
    updateHUD();
  });
}

// ===== OBJECT SELECTION =====
function setupObjectSelector() {
  const buttons = objectSelector.querySelectorAll(".object-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentObject = btn.dataset.object;
      
      // Actualizar masa con el valor predeterminado del objeto
      const obj = objects[currentObject];
      mass = obj.defaultMass;
      massInput.value = mass;
      massRange.value = mass;
      
      // Actualizar info del objeto
      updateObjectInfo();
      updateHUD();
      updateFormulas();
    });
  });
}

// ===== UPDATE OBJECT INFO =====
function updateObjectInfo() {
  const obj = objects[currentObject];
  const effectiveMu = obj.frictionMultiplier * (muKinetic / 0.02); // Normalizado respecto al hielo
  objectMassEl.textContent = `${obj.defaultMass} kg`;
  objectFrictionEl.textContent = `μ = ${obj.frictionMultiplier.toFixed(2)}`;
}

// ===== SURFACE SELECTION =====
function setupSurfaceSelector() {
  const buttons = surfaceSelector.querySelectorAll(".surface-btn");
  buttons.forEach(btn => {
    btn.addEventListener("click", () => {
      buttons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentSurface = btn.dataset.surface;
      applySurface();
    });
  });
}

// ===== APPLY SURFACE =====
function applySurface() {
  const surface = surfaces[currentSurface];
  muStatic = surface.muStatic;
  muKinetic = surface.muKinetic;
}

// ===== START SIMULATION =====
function startSimulation() {
  appliedForce = parseFloat(forceInput.value) || 0;
  mass = parseFloat(massInput.value) || 1;
  applySurface();

  // Obtener el multiplicador de fricción del objeto
  const obj = objects[currentObject];
  const effectiveMuStatic = muStatic * obj.frictionMultiplier;
  const effectiveMuKinetic = muKinetic * obj.frictionMultiplier;

  // Normal force
  const normalForce = mass * GRAVITY;

  // Max static friction (usando fricción efectiva del objeto)
  const maxStaticFriction = effectiveMuStatic * normalForce;

  // Reset - El objeto inicia en 0 metros
  objectX = INITIAL_POSITION_METERS * SCALE;
  startX = INITIAL_POSITION_METERS * SCALE;
  distance = 0;
  velocity = 0;
  acceleration = 0;
  simulationTime = 0;
  frictionForce = 0;
  cameraX = -CAMERA_OFFSET; // Reset camara para ver el inicio

  // Hide overlay
  canvasOverlay.classList.remove("visible");

  // Check if force overcomes static friction
  if (appliedForce <= maxStaticFriction) {
    state = "end";
    setResult("warning", "⚠️", `La fuerza aplicada (${appliedForce.toFixed(1)} N) no supera la fricción estática (${maxStaticFriction.toFixed(1)} N). El objeto no se mueve.`);
    updateHUD();
    updateFormulas();
    return;
  }

  // Initial velocity from impulse
  velocity = appliedForce / mass;
  state = "running";
  
  setResult("info", "🚀", "Simulación en progreso...");
  updateHUD();
  updateFormulas();
}

// ===== RESET SIMULATION =====
function resetSimulation() {
  state = "idle";
  objectX = INITIAL_POSITION_METERS * SCALE;
  startX = INITIAL_POSITION_METERS * SCALE;
  velocity = 0;
  distance = 0;
  acceleration = 0;
  cameraX = -CAMERA_OFFSET;
  simulationTime = 0;
  frictionForce = 0;

  setResult("info", "📊", "Configura los parámetros y presiona \"Iniciar Simulación\"");
  updateHUD();
  updateFormulas();
}

// ===== SET RESULT =====
function setResult(type, icon, text) {
  resultPanel.className = "result-panel";
  if (type === "success") resultPanel.classList.add("success");
  if (type === "warning") resultPanel.classList.add("warning");
  resultIcon.textContent = icon;
  resultText.textContent = text;
}

// ===== UPDATE HUD =====
function updateHUD() {
  const stateNames = {
    idle: "En reposo",
    running: "En movimiento",
    end: "Detenido"
  };

  const obj = objects[currentObject];
  const effectiveMu = muKinetic * obj.frictionMultiplier;
  const normalForce = mass * GRAVITY;

  hudState.textContent = stateNames[state];
  hudVelocity.textContent = velocity.toFixed(2);
  hudDistance.textContent = distance.toFixed(2);
  hudTime.textContent = simulationTime.toFixed(2);
  hudAcceleration.textContent = Math.abs(acceleration).toFixed(2);
  hudAppliedForce.textContent = appliedForce.toFixed(2);
  hudMass.textContent = mass.toFixed(2);
  hudFrictionCoef.textContent = `μ = ${effectiveMu.toFixed(3)}`;
  hudNormalForce.textContent = normalForce.toFixed(2);
  hudFrictionForce.textContent = frictionForce.toFixed(2);
  hudFrictionType.textContent = state === "running" ? "Cinética" : "Estática";

  stateIndicator.className = "hud-indicator " + state;
}

// ===== UPDATE FORMULAS =====
function updateFormulas() {
  const obj = objects[currentObject];
  const effectiveMu = muKinetic * obj.frictionMultiplier;
  const normalForce = mass * GRAVITY;
  const currentFrictionForce = effectiveMu * normalForce;
  const currentAccel = state === "running" ? Math.abs(acceleration) : (appliedForce / mass);

  // F = m × a
  formulaNewton.textContent = `${appliedForce.toFixed(1)} N = ${mass.toFixed(1)} kg × ${currentAccel.toFixed(2)} m/s²`;
  
  // Fr = μ × N
  formulaFriction.textContent = `Fr = ${effectiveMu.toFixed(3)} × ${normalForce.toFixed(1)} N = ${currentFrictionForce.toFixed(2)} N`;
  
  // N = m × g
  formulaNormal.textContent = `N = ${mass.toFixed(1)} kg × ${GRAVITY} m/s² = ${normalForce.toFixed(2)} N`;
}

// ===== PHYSICS UPDATE =====
function update(dt) {
  if (state !== "running") {
    cameraX = lerp(cameraX, objectX - CAMERA_OFFSET, 0.08);
    return;
  }

  // Obtener el multiplicador de fricción del objeto
  const obj = objects[currentObject];
  const effectiveMuKinetic = muKinetic * obj.frictionMultiplier;

  const normalForce = mass * GRAVITY;
  frictionForce = effectiveMuKinetic * normalForce;
  acceleration = -frictionForce / mass;

  velocity += acceleration * dt;
  if (velocity < 0) velocity = 0;

  objectX += velocity * SCALE * dt;

  // Actualizar tiempo de simulación
  simulationTime += dt;

  // Smooth camera
  const targetCam = objectX - CAMERA_OFFSET;
  cameraX = lerp(cameraX, targetCam, 0.12);

  // Distance in meters
  distance = (objectX - startX) / SCALE;

  // Update HUD
  updateHUD();
  updateFormulas();

  // Stop condition
  if (velocity <= VELOCITY_STOP_THRESHOLD) {
    velocity = 0;
    state = "end";
    setResult("success", "✅", `El objeto recorrió ${distance.toFixed(2)} metros en ${simulationTime.toFixed(2)} segundos antes de detenerse por la fricción.`);
    updateHUD();
    updateFormulas();
  }
}

// ===== DRAW FUNCTIONS =====
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const surface = surfaces[currentSurface];
  const groundY = canvas.height * 0.75;

  // Sky gradient
  const skyGradient = ctx.createLinearGradient(0, 0, 0, groundY);
  skyGradient.addColorStop(0, surface.skyGradient[0]);
  skyGradient.addColorStop(0.5, surface.skyGradient[1]);
  skyGradient.addColorStop(1, surface.skyGradient[2]);
  ctx.fillStyle = skyGradient;
  ctx.fillRect(0, 0, canvas.width, groundY);

  // Draw clouds
  drawClouds(groundY);

  // Ground gradient
  const groundGradient = ctx.createLinearGradient(0, groundY, 0, canvas.height);
  groundGradient.addColorStop(0, surface.groundGradient[0]);
  groundGradient.addColorStop(0.3, surface.groundGradient[1]);
  groundGradient.addColorStop(1, surface.groundGradient[2]);
  ctx.fillStyle = groundGradient;
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Surface texture
  drawSurfaceTexture(groundY);

  // Distance markers
  drawDistanceMarkers(groundY);

  // Draw object
  // objectX representa el CENTRO del objeto en el mundo
  const obj = objects[currentObject];
  const objScreenX = objectX - cameraX - (obj.width / 2); // Ajustar para dibujar desde el borde izquierdo
  const objY = groundY - obj.height;
  
  // Object shadow
  drawShadow(objScreenX, groundY, obj.width);
  
  // Object
  obj.draw(objScreenX, objY, obj.width, obj.height);

  // Velocity vector
  if (velocity > 0.1) {
    drawVelocityVector(objScreenX + obj.width / 2, objY - 20);
  }
}

// ===== DRAW CLOUDS =====
function drawClouds(groundY) {
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  
  const cloudPositions = [
    { x: 100, y: groundY * 0.2, size: 40 },
    { x: 300, y: groundY * 0.15, size: 50 },
    { x: 600, y: groundY * 0.25, size: 35 },
    { x: 850, y: groundY * 0.1, size: 45 }
  ];

  cloudPositions.forEach(cloud => {
    const screenX = (cloud.x - cameraX * 0.1) % (canvas.width + 200);
    drawCloud(screenX, cloud.y, cloud.size);
  });
}

function drawCloud(x, y, size) {
  ctx.beginPath();
  ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y - size * 0.2, size * 0.4, 0, Math.PI * 2);
  ctx.arc(x + size * 0.8, y, size * 0.45, 0, Math.PI * 2);
  ctx.arc(x + size * 0.4, y + size * 0.1, size * 0.35, 0, Math.PI * 2);
  ctx.fill();
}

// ===== DRAW SURFACE TEXTURE =====
function drawSurfaceTexture(groundY) {
  if (currentSurface === "ice") {
    // Ice reflection lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    for (let i = 0; i < canvas.width; i += 60) {
      const offset = (i - cameraX * 0.5) % (canvas.width + 100);
      ctx.beginPath();
      ctx.moveTo(offset, groundY + 10);
      ctx.lineTo(offset + 40, groundY + 10);
      ctx.stroke();
    }
  } else if (currentSurface === "sand") {
    // Sand dots
    ctx.fillStyle = "rgba(120, 53, 15, 0.3)";
    for (let i = 0; i < 100; i++) {
      const x = ((i * 37 + cameraX * 0.2) % canvas.width);
      const y = groundY + 10 + (i % 5) * 15;
      ctx.beginPath();
      ctx.arc(x, y, 2, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (currentSurface === "wood") {
    // Wood grain
    ctx.strokeStyle = "rgba(146, 64, 14, 0.4)";
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 20) {
      const offset = (i - cameraX * 0.3) % (canvas.width + 50);
      ctx.beginPath();
      ctx.moveTo(offset, groundY);
      ctx.lineTo(offset, canvas.height);
      ctx.stroke();
    }
  }
}

// ===== DRAW DISTANCE MARKERS =====
function drawDistanceMarkers(groundY) {
  const meterStep = 5;
  const pixelStep = meterStep * SCALE;
  const start = Math.floor(cameraX / pixelStep) * pixelStep - pixelStep;
  const end = cameraX + canvas.width + pixelStep;

  for (let i = start; i < end; i += pixelStep) {
    const screenX = i - cameraX;
    const meters = Math.round(i / SCALE);

    // Marker pole
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(screenX - 2, groundY - 50, 4, 50);

    // Marker flag
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.moveTo(screenX + 2, groundY - 50);
    ctx.lineTo(screenX + 25, groundY - 40);
    ctx.lineTo(screenX + 2, groundY - 30);
    ctx.closePath();
    ctx.fill();

    // Distance label
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 14px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(`${meters}m`, screenX, groundY - 55);
  }
}

// ===== DRAW SHADOW =====
function drawShadow(x, y, width) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
  ctx.beginPath();
  ctx.ellipse(x + width / 2, y + 5, width * 0.6, 8, 0, 0, Math.PI * 2);
  ctx.fill();
}

// ===== DRAW METAL BOX =====
function drawMetalBox(x, y, width, height) {
  // Main body
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#9ca3af");
  gradient.addColorStop(0.3, "#d1d5db");
  gradient.addColorStop(0.7, "#9ca3af");
  gradient.addColorStop(1, "#6b7280");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Border
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  // Shine
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.fillRect(x + 5, y + 5, width - 15, 8);

  // Rivets
  ctx.fillStyle = "#4b5563";
  const rivetPositions = [[8, 8], [width - 12, 8], [8, height - 12], [width - 12, height - 12]];
  rivetPositions.forEach(([rx, ry]) => {
    ctx.beginPath();
    ctx.arc(x + rx, y + ry, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // Metal texture lines
  ctx.strokeStyle = "rgba(0, 0, 0, 0.1)";
  ctx.lineWidth = 1;
  for (let i = 0; i < height; i += 6) {
    ctx.beginPath();
    ctx.moveTo(x + 3, y + i);
    ctx.lineTo(x + width - 3, y + i);
    ctx.stroke();
  }
}

// ===== DRAW WOOD BOX =====
function drawWoodBox(x, y, width, height) {
  // Wood base color
  ctx.fillStyle = "#d97706";
  ctx.fillRect(x, y, width, height);

  // Wood grain pattern
  ctx.strokeStyle = "#92400e";
  ctx.lineWidth = 2;
  for (let i = 0; i < width; i += 7) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.bezierCurveTo(
      x + i + 3, y + height * 0.3,
      x + i - 3, y + height * 0.7,
      x + i + 1, y + height
    );
    ctx.stroke();
  }

  // Horizontal planks
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + height * 0.33);
  ctx.lineTo(x + width, y + height * 0.33);
  ctx.moveTo(x, y + height * 0.66);
  ctx.lineTo(x + width, y + height * 0.66);
  ctx.stroke();

  // Border
  ctx.strokeStyle = "#78350f";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  // Highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.fillRect(x + 3, y + 3, width - 6, 6);

  // Nails
  ctx.fillStyle = "#57534e";
  const nailPositions = [[6, height * 0.33], [width - 10, height * 0.33], [6, height * 0.66], [width - 10, height * 0.66]];
  nailPositions.forEach(([nx, ny]) => {
    ctx.beginPath();
    ctx.arc(x + nx, y + ny, 2, 0, Math.PI * 2);
    ctx.fill();
  });
}

// ===== DRAW CARDBOARD BOX =====
function drawCardboardBox(x, y, width, height) {
  // Main cardboard color
  const gradient = ctx.createLinearGradient(x, y, x, y + height);
  gradient.addColorStop(0, "#d4a574");
  gradient.addColorStop(0.5, "#c4956a");
  gradient.addColorStop(1, "#a67c52");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Corrugated cardboard pattern
  ctx.strokeStyle = "rgba(139, 90, 43, 0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < width; i += 4) {
    ctx.beginPath();
    ctx.moveTo(x + i, y);
    ctx.lineTo(x + i, y + height);
    ctx.stroke();
  }

  // Box flap lines (top)
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + width, y + 10);
  ctx.stroke();

  // Tape in the middle
  ctx.fillStyle = "#d4b896";
  ctx.fillRect(x + width * 0.3, y, width * 0.4, height);
  
  ctx.strokeStyle = "#a67c52";
  ctx.lineWidth = 1;
  ctx.strokeRect(x + width * 0.3, y, width * 0.4, height);

  // Border
  ctx.strokeStyle = "#8b5a2b";
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, width, height);

  // Crease marks
  ctx.strokeStyle = "rgba(139, 90, 43, 0.3)";
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(x + width * 0.3, y);
  ctx.lineTo(x + width * 0.3, y + height);
  ctx.moveTo(x + width * 0.7, y);
  ctx.lineTo(x + width * 0.7, y + height);
  ctx.stroke();
  ctx.setLineDash([]);
}

// ===== DRAW CONCRETE BLOCK =====
function drawConcreteBlock(x, y, width, height) {
  // Main concrete color
  const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
  gradient.addColorStop(0, "#9ca3af");
  gradient.addColorStop(0.3, "#6b7280");
  gradient.addColorStop(0.7, "#4b5563");
  gradient.addColorStop(1, "#374151");
  
  ctx.fillStyle = gradient;
  ctx.fillRect(x, y, width, height);

  // Concrete texture (speckles)
  ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
  for (let i = 0; i < 40; i++) {
    const px = x + Math.random() * width;
    const py = y + Math.random() * height;
    const size = Math.random() * 3 + 1;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light speckles
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  for (let i = 0; i < 20; i++) {
    const px = x + Math.random() * width;
    const py = y + Math.random() * height;
    const size = Math.random() * 2 + 0.5;
    ctx.beginPath();
    ctx.arc(px, py, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Cracks
  ctx.strokeStyle = "rgba(0, 0, 0, 0.2)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x + width * 0.2, y + height * 0.3);
  ctx.lineTo(x + width * 0.35, y + height * 0.5);
  ctx.lineTo(x + width * 0.3, y + height * 0.8);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + width * 0.7, y + height * 0.2);
  ctx.lineTo(x + width * 0.65, y + height * 0.45);
  ctx.stroke();

  // Border with rough edges
  ctx.strokeStyle = "#374151";
  ctx.lineWidth = 3;
  ctx.strokeRect(x, y, width, height);

  // Highlight on top edge
  ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
  ctx.fillRect(x + 2, y + 2, width - 4, 5);
}

// ===== DRAW VELOCITY VECTOR =====
function drawVelocityVector(x, y) {
  const arrowLength = Math.min(velocity * 10, 60);
  
  ctx.strokeStyle = "#22c55e";
  ctx.fillStyle = "#22c55e";
  ctx.lineWidth = 3;

  // Arrow line
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + arrowLength, y);
  ctx.stroke();

  // Arrow head
  ctx.beginPath();
  ctx.moveTo(x + arrowLength + 10, y);
  ctx.lineTo(x + arrowLength, y - 6);
  ctx.lineTo(x + arrowLength, y + 6);
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.fillStyle = "#22c55e";
  ctx.font = "bold 12px Inter, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(`v = ${velocity.toFixed(1)} m/s`, x + arrowLength / 2, y - 10);
}

// ===== ANIMATION LOOP =====
function loop(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = (timestamp - lastTime) / 1000;
  lastTime = timestamp;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

// ===== INITIALIZATION =====
function init() {
  syncInputs();
  setupObjectSelector();
  setupSurfaceSelector();
  
  simulateBtn.addEventListener("click", startSimulation);
  resetBtn.addEventListener("click", resetSimulation);

  // Initial state - cargar valores del objeto inicial
  const initialObj = objects[currentObject];
  mass = initialObj.defaultMass;
  massInput.value = mass;
  massRange.value = mass;
  
  applySurface();
  appliedForce = parseFloat(forceInput.value) || 50;
  
  // Posicion inicial en 0 metros
  objectX = INITIAL_POSITION_METERS * SCALE;
  startX = INITIAL_POSITION_METERS * SCALE;
  cameraX = -CAMERA_OFFSET;
  
  updateObjectInfo();
  updateHUD();
  updateFormulas();

  // Start loop
  requestAnimationFrame(loop);
}

// Start the application
init();
