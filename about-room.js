import * as THREE from "./assets/vendor/three.module.min.js";

const ACTIONS = [
  { name: "work", duration: 5600, position: [0.72, 0, 0.15], yaw: Math.PI * -0.9, arms: [-0.62, 0.62], armLift: 0.72 },
  { name: "draw", duration: 5000, position: [-1.34, 0, 0.38], yaw: Math.PI * -0.83, arms: [-0.18, 0.94], armLift: 0.46 },
  { name: "photo", duration: 4300, position: [0.15, 0, 1.24], yaw: Math.PI * 0.24, arms: [-0.78, 0.78], armLift: 1.12 },
  { name: "water", duration: 5000, position: [0.64, 0, 1.34], yaw: Math.PI * 0.62, arms: [-0.08, 1.02], armLift: 0.62 },
  { name: "write", duration: 5200, position: [0.4, 0, 0.18], yaw: Math.PI * -0.96, arms: [-0.42, 0.72], armLift: 0.74 },
  { name: "idle", duration: 4700, position: [0.48, 0, 1.3], yaw: Math.PI * 0.24, arms: [-0.08, 0.08], armLift: 0 },
];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const damp = (current, target, lambda, delta) => THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * delta));

function makeRoundedBodyGeometry(width, height) {
  const radius = 0.14;
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius * 0.75, y + 0.015);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width - 0.015, y + height - radius * 1.1);
  shape.quadraticCurveTo(x + width - 0.02, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius * 1.15, y + height - 0.018);
  shape.quadraticCurveTo(x, y + height, x + 0.015, y + height - radius);
  shape.lineTo(x, y + radius * 0.9);
  shape.quadraticCurveTo(x, y, x + radius, y);

  return new THREE.ShapeGeometry(shape, 8);
}

function createLine(points, material, closed = false) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  return closed ? new THREE.LineLoop(geometry, material) : new THREE.Line(geometry, material);
}

function createStudio(host) {
  host.classList.add("baifang-room", "is-loading");
  host.setAttribute("role", "img");
  host.setAttribute("aria-label", "Interactive isometric studio where AI Baifang works, draws, photographs and cares for plants");

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-4, 4, 4, -4, 0.1, 40);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.domElement.className = "baifang-room__canvas";
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.appendChild(renderer.domElement);

  const world = new THREE.Group();
  world.rotation.y = -0.05;
  scene.add(world);

  const materialRegistry = [];
  const edgeRegistry = [];
  const darkSurface = new THREE.MeshStandardMaterial({ color: 0x242825, roughness: 0.88, metalness: 0.03 });
  const darkSurfaceAlt = new THREE.MeshStandardMaterial({ color: 0x383e3a, roughness: 0.82, metalness: 0.05 });
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x171a18, roughness: 0.94, metalness: 0.01 });
  const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0eb, side: THREE.FrontSide });
  const bodyBackMaterial = new THREE.MeshBasicMaterial({ color: 0xf0f0eb, side: THREE.BackSide });
  const paperOutlineMaterial = new THREE.MeshBasicMaterial({ color: 0x111211, side: THREE.DoubleSide });
  const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x111413, emissive: 0xe8e8e2, emissiveIntensity: 0.08, roughness: 0.6 });
  const eyeMaterial = new THREE.MeshBasicMaterial({ color: 0x090a0a });
  const edgeMaterial = new THREE.LineBasicMaterial({ color: 0xf2f1eb, transparent: true, opacity: 0.9 });
  const softEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xf2f1eb, transparent: true, opacity: 0.38 });
  const bodyEdgeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.94 });
  materialRegistry.push(darkSurface, darkSurfaceAlt, floorMaterial, bodyMaterial, bodyBackMaterial, paperOutlineMaterial, screenMaterial);
  edgeRegistry.push(edgeMaterial, softEdgeMaterial, bodyEdgeMaterial);

  const addEdges = (mesh, material = edgeMaterial, threshold = 25) => {
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, threshold), material);
    edges.renderOrder = 3;
    mesh.add(edges);
    return edges;
  };

  const addBox = ({ size, position, rotation = [0, 0, 0], material = darkSurface, edge = edgeMaterial, shadow = true, parent = world, name = "" }) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = shadow;
    mesh.receiveShadow = shadow;
    mesh.name = name;
    parent.add(mesh);
    if (edge) addEdges(mesh, edge);
    return mesh;
  };

  const addCylinder = ({ radiusTop, radiusBottom = radiusTop, height, radialSegments = 16, position, rotation = [0, 0, 0], material = darkSurface, edge = edgeMaterial, parent = world }) => {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, radialSegments), material);
    mesh.position.set(...position);
    mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    if (edge) addEdges(mesh, edge, 34);
    return mesh;
  };

  const floor = addBox({ size: [6.5, 0.16, 4.85], position: [0, 0.02, 0], material: floorMaterial, edge: bodyEdgeMaterial });
  floor.receiveShadow = true;

  const floorGrid = new THREE.Group();
  for (let i = -2; i <= 2; i += 1) {
    floorGrid.add(createLine([[-3.15, 0.115, i * 0.8], [3.15, 0.115, i * 0.8]], softEdgeMaterial));
  }
  for (let i = -3; i <= 3; i += 1) {
    floorGrid.add(createLine([[i * 0.82, 0.115, -2.34], [i * 0.82, 0.115, 2.34]], softEdgeMaterial));
  }
  world.add(floorGrid);

  const wallLines = new THREE.Group();
  wallLines.add(createLine([[-3.18, 0.1, -2.35], [-3.18, 3.45, -2.35], [3.18, 3.45, -2.35], [3.18, 0.1, -2.35]], softEdgeMaterial));
  wallLines.add(createLine([[-3.18, 0.1, -2.35], [-3.18, 3.45, -2.35], [-3.18, 3.45, 1.05]], softEdgeMaterial));
  world.add(wallLines);

  const windowGroup = new THREE.Group();
  windowGroup.position.set(-2.55, 2.35, -2.31);
  world.add(windowGroup);
  addBox({ size: [1.05, 0.055, 0.04], position: [0, 0.66, 0], material: darkSurfaceAlt, parent: windowGroup, shadow: false });
  addBox({ size: [1.05, 0.055, 0.04], position: [0, -0.66, 0], material: darkSurfaceAlt, parent: windowGroup, shadow: false });
  addBox({ size: [0.055, 1.38, 0.04], position: [-0.52, 0, 0], material: darkSurfaceAlt, parent: windowGroup, shadow: false });
  addBox({ size: [0.055, 1.38, 0.04], position: [0.52, 0, 0], material: darkSurfaceAlt, parent: windowGroup, shadow: false });
  addBox({ size: [0.035, 1.3, 0.04], position: [0, 0, 0], material: darkSurfaceAlt, edge: softEdgeMaterial, parent: windowGroup, shadow: false });

  const desk = new THREE.Group();
  desk.position.set(0.15, 0, -1.12);
  world.add(desk);
  addBox({ size: [2.85, 0.15, 1.05], position: [0, 1.16, 0], material: darkSurfaceAlt, parent: desk });
  [[-1.22, 0.57, -0.38], [1.22, 0.57, -0.38], [-1.22, 0.57, 0.38], [1.22, 0.57, 0.38]].forEach((position) => {
    addBox({ size: [0.1, 1.08, 0.1], position, material: darkSurface, edge: softEdgeMaterial, parent: desk });
  });

  const monitor = new THREE.Group();
  monitor.position.set(0.25, 1.92, -1.03);
  monitor.userData.interactive = true;
  monitor.userData.baseScale = 1;
  world.add(monitor);
  const monitorBody = addBox({ size: [1.22, 0.76, 0.08], position: [0, 0, 0], material: screenMaterial, parent: monitor });
  monitorBody.userData.actionTarget = "monitor";
  addBox({ size: [0.08, 0.42, 0.08], position: [0, -0.56, 0], material: darkSurfaceAlt, parent: monitor });
  addBox({ size: [0.66, 0.06, 0.34], position: [0, -0.78, 0.1], material: darkSurfaceAlt, parent: monitor });
  const codeMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42 });
  edgeRegistry.push(codeMaterial);
  [[-0.42, 0.17, 0.045, 0.25], [-0.42, 0.02, 0.045, 0.65], [-0.42, -0.13, 0.045, 0.42]].forEach(([x, y, z, width]) => {
    monitor.add(createLine([[x, y, z], [x + width, y, z]], codeMaterial));
  });
  addBox({ size: [0.95, 0.055, 0.34], position: [0.2, 1.27, -0.53], rotation: [-0.05, 0, 0], material: darkSurface, edge: softEdgeMaterial });

  const easel = new THREE.Group();
  easel.position.set(-2.12, 0, -0.98);
  easel.rotation.y = 0.14;
  easel.userData.interactive = true;
  world.add(easel);
  addBox({ size: [1.42, 1.22, 0.08], position: [0, 1.86, 0], material: darkSurfaceAlt, parent: easel });
  addBox({ size: [0.1, 2.15, 0.1], position: [-0.45, 0.78, -0.05], rotation: [0, 0, -0.08], material: darkSurface, edge: softEdgeMaterial, parent: easel });
  addBox({ size: [0.1, 2.15, 0.1], position: [0.45, 0.78, -0.05], rotation: [0, 0, 0.08], material: darkSurface, edge: softEdgeMaterial, parent: easel });
  const sketchMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.36 });
  edgeRegistry.push(sketchMaterial);
  easel.add(createLine([[-0.42, 2.08, 0.05], [-0.15, 1.72, 0.05], [0.08, 2.13, 0.05], [0.4, 1.66, 0.05]], sketchMaterial));

  const shelf = new THREE.Group();
  shelf.position.set(2.3, 0, -1.72);
  world.add(shelf);
  [0.9, 1.75, 2.6].forEach((y) => addBox({ size: [1.45, 0.1, 0.52], position: [0, y, 0], material: darkSurfaceAlt, parent: shelf }));
  [-0.62, 0.62].forEach((x) => addBox({ size: [0.09, 2.65, 0.52], position: [x, 1.32, 0], material: darkSurface, edge: softEdgeMaterial, parent: shelf }));
  [-0.38, -0.12, 0.17].forEach((x, index) => addBox({ size: [0.16 + index * 0.03, 0.55, 0.34], position: [x, 1.22, 0], rotation: [0, 0, (index - 1) * 0.04], material: index % 2 ? darkSurfaceAlt : darkSurface, edge: softEdgeMaterial, parent: shelf }));

  const plant = new THREE.Group();
  plant.position.set(2.15, 0.12, 0.72);
  plant.userData.interactive = true;
  world.add(plant);
  addCylinder({ radiusTop: 0.34, radiusBottom: 0.25, height: 0.56, position: [0, 0.28, 0], material: darkSurfaceAlt, parent: plant });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: 0x242a27, roughness: 0.95 });
  materialRegistry.push(leafMaterial);
  const leaves = new THREE.Group();
  leaves.position.y = 0.68;
  plant.add(leaves);
  [[-0.22, 0.25, 0, -0.45], [0.2, 0.3, 0.02, 0.5], [0, 0.42, -0.06, 0.05], [-0.07, 0.22, 0.2, -0.12], [0.1, 0.2, -0.2, 0.25]].forEach(([x, y, z, rz]) => {
    const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.21, 10, 8), leafMaterial);
    leaf.scale.set(0.55, 1.5, 0.34);
    leaf.position.set(x, y, z);
    leaf.rotation.z = rz;
    leaf.castShadow = true;
    leaves.add(leaf);
    addEdges(leaf, softEdgeMaterial, 42);
  });

  const cameraProp = new THREE.Group();
  cameraProp.position.set(1.88, 1.13, -1.02);
  cameraProp.userData.interactive = true;
  world.add(cameraProp);
  addBox({ size: [0.48, 0.31, 0.24], position: [0, 0, 0], material: darkSurfaceAlt, parent: cameraProp });
  addCylinder({ radiusTop: 0.105, height: 0.14, radialSegments: 14, position: [0, 0, 0.18], rotation: [Math.PI / 2, 0, 0], material: darkSurface, parent: cameraProp });

  const waterCan = new THREE.Group();
  waterCan.position.set(2.55, 0.48, 0.75);
  waterCan.userData.interactive = true;
  world.add(waterCan);
  addCylinder({ radiusTop: 0.2, radiusBottom: 0.24, height: 0.42, position: [0, 0, 0], material: darkSurfaceAlt, parent: waterCan });
  addBox({ size: [0.38, 0.09, 0.09], position: [-0.32, 0.06, 0], rotation: [0, 0, 0.24], material: darkSurfaceAlt, edge: softEdgeMaterial, parent: waterCan });

  const character = new THREE.Group();
  character.position.set(...ACTIONS[ACTIONS.length - 1].position);
  character.rotation.y = ACTIONS[ACTIONS.length - 1].yaw;
  character.userData.interactive = true;
  world.add(character);

  const paperBody = new THREE.Group();
  character.add(paperBody);
  const bodyGeometry = makeRoundedBodyGeometry(1.4, 1.34);
  const paperOutline = new THREE.Mesh(bodyGeometry, paperOutlineMaterial);
  paperOutline.position.set(0, 1.42, 0);
  paperOutline.scale.set(1.035, 1.035, 1);
  paperOutline.renderOrder = 1;
  paperBody.add(paperOutline);
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  body.position.set(0, 1.42, 0.006);
  body.renderOrder = 2;
  body.castShadow = false;
  body.receiveShadow = false;
  body.userData.actionTarget = "character";
  paperBody.add(body);
  const bodyBack = new THREE.Mesh(bodyGeometry, bodyBackMaterial);
  bodyBack.position.set(0, 1.42, -0.006);
  bodyBack.renderOrder = 2;
  bodyBack.userData.actionTarget = "character";
  paperBody.add(bodyBack);

  const eyes = new THREE.Group();
  eyes.position.set(0, 1.5, 0.012);
  paperBody.add(eyes);
  [-0.22, 0.22].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), eyeMaterial);
    eye.position.x = x;
    eye.userData.actionTarget = "character";
    eyes.add(eye);
  });

  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, -0.02, 0),
    new THREE.Vector3(0, -0.085, 0.015),
    new THREE.Vector3(0.16, -0.02, 0),
  ]);
  const mouth = new THREE.Mesh(new THREE.TubeGeometry(mouthCurve, 12, 0.012, 5, false), eyeMaterial);
  mouth.position.set(0, 1.24, 0.014);
  mouth.scale.setScalar(0.001);
  paperBody.add(mouth);

  const limbMaterial = new THREE.MeshBasicMaterial({ color: 0xe5e5df, side: THREE.DoubleSide });
  materialRegistry.push(limbMaterial);
  const makeLimb = (x, y, length, parent = character) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, 0.018);
    const limb = new THREE.Mesh(new THREE.PlaneGeometry(0.038, length), limbMaterial);
    limb.position.y = -length / 2;
    limb.castShadow = false;
    pivot.add(limb);
    const hand = new THREE.Mesh(new THREE.CircleGeometry(0.042, 12), limbMaterial);
    hand.position.y = -length;
    hand.userData.actionTarget = "character";
    pivot.add(hand);
    parent.add(pivot);
    return pivot;
  };
  const leftArm = makeLimb(-0.7, 1.55, 0.5);
  const rightArm = makeLimb(0.7, 1.55, 0.5);
  const leftLeg = makeLimb(-0.25, 0.77, 0.45);
  const rightLeg = makeLimb(0.25, 0.77, 0.45);
  leftArm.rotation.z = -0.08;
  rightArm.rotation.z = 0.08;

  const heldCamera = new THREE.Group();
  heldCamera.position.set(0, -0.52, 0.025);
  heldCamera.scale.setScalar(0.001);
  rightArm.add(heldCamera);
  addBox({ size: [0.34, 0.23, 0.19], position: [0, 0, 0], material: darkSurfaceAlt, edge: bodyEdgeMaterial, parent: heldCamera, shadow: false });
  addCylinder({ radiusTop: 0.075, height: 0.11, radialSegments: 10, position: [0, 0, 0.14], rotation: [Math.PI / 2, 0, 0], material: darkSurface, edge: bodyEdgeMaterial, parent: heldCamera });

  const heldCan = new THREE.Group();
  heldCan.position.set(0, -0.53, 0.02);
  heldCan.scale.setScalar(0.001);
  rightArm.add(heldCan);
  addCylinder({ radiusTop: 0.16, radiusBottom: 0.19, height: 0.28, position: [0, 0, 0], material: darkSurfaceAlt, edge: bodyEdgeMaterial, parent: heldCan });
  addBox({ size: [0.3, 0.06, 0.06], position: [-0.23, 0.05, 0], rotation: [0, 0, 0.25], material: darkSurfaceAlt, edge: bodyEdgeMaterial, parent: heldCan, shadow: false });

  const pencil = addBox({ size: [0.025, 0.28, 0.018], position: [0, -0.55, 0.02], rotation: [0, 0, 0.18], material: bodyMaterial, edge: null, parent: rightArm, shadow: false });
  pencil.scale.setScalar(0.001);

  const waterDrops = Array.from({ length: 5 }, (_, index) => {
    const drop = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), bodyMaterial);
    drop.position.set(1.98 + index * 0.09, 1.04 - index * 0.11, 0.7);
    drop.visible = false;
    world.add(drop);
    return drop;
  });

  const ambient = new THREE.HemisphereLight(0xffffff, 0x090b0a, 2.15);
  scene.add(ambient);
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
  keyLight.position.set(4.8, 7.8, 5.5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  keyLight.shadow.camera.left = -6;
  keyLight.shadow.camera.right = 6;
  keyLight.shadow.camera.top = 6;
  keyLight.shadow.camera.bottom = -6;
  keyLight.shadow.bias = -0.0004;
  scene.add(keyLight);
  const fillLight = new THREE.PointLight(0xffffff, 0.8, 10);
  fillLight.position.set(-3, 4, 2);
  scene.add(fillLight);

  const interactiveGroups = [monitor, easel, plant, cameraProp, waterCan, character];
  interactiveGroups.forEach((group) => {
    group.traverse((child) => {
      if (child.isMesh) child.userData.interactiveRoot = group;
    });
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(0, 0);
  const characterPointerProbe = new THREE.Vector3();
  const cameraDrift = new THREE.Vector2(0, 0);
  const cameraDriftTarget = new THREE.Vector2(0, 0);
  const clock = new THREE.Clock();
  const targetPosition = new THREE.Vector3(...ACTIONS[0].position);
  let targetYaw = ACTIONS[0].yaw;
  let activeAction = ACTIONS[ACTIONS.length - 1];
  let actionIndex = ACTIONS.length - 1;
  let actionElapsed = 0;
  let pointerInside = false;
  let pointerOnCharacter = false;
  let hoveredGroup = null;
  let visible = true;
  let disposed = false;
  let frame = 0;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  function applyTheme() {
    const light = document.documentElement.dataset.theme === "light";
    const surface = light ? 0xcfd2cc : 0x242825;
    const surfaceAlt = light ? 0xe4e5e0 : 0x383e3a;
    const line = light ? 0x191b1a : 0xf2f1eb;
    const bodyLine = light ? 0x151716 : 0xffffff;

    darkSurface.color.setHex(surface);
    darkSurfaceAlt.color.setHex(surfaceAlt);
    floorMaterial.color.setHex(light ? 0xf3f2ed : 0x171a18);
    leafMaterial.color.setHex(light ? 0xd4d8d2 : 0x4a514c);
    screenMaterial.color.setHex(light ? 0xc2c7c1 : 0x4b524e);
    screenMaterial.emissive.setHex(light ? 0x222522 : 0xe8e8e2);
    bodyMaterial.color.setHex(light ? 0xf8f8f4 : 0xf0f0eb);
    bodyBackMaterial.color.copy(bodyMaterial.color);
    paperOutlineMaterial.color.setHex(0x111211);
    limbMaterial.color.setHex(light ? 0x202220 : 0xe8e8e2);
    edgeMaterial.color.setHex(line);
    softEdgeMaterial.color.setHex(line);
    bodyEdgeMaterial.color.setHex(bodyLine);
    codeMaterial.color.setHex(line);
    sketchMaterial.color.setHex(line);
    edgeMaterial.opacity = light ? 0.62 : 0.9;
    softEdgeMaterial.opacity = light ? 0.25 : 0.38;
    renderer.toneMappingExposure = light ? 1.05 : 1.08;
  }

  function setAction(action, resetElapsed = true) {
    activeAction = action;
    targetPosition.set(...action.position);
    targetYaw = action.yaw;
    host.dataset.action = action.name;
    if (resetElapsed) actionElapsed = 0;
  }

  function nextAction() {
    actionIndex = (actionIndex + 1) % ACTIONS.length;
    setAction(ACTIONS[actionIndex]);
  }

  function resize() {
    const rect = host.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const aspect = width / height;
    const view = aspect < 1 ? 8.55 : 7.9;
    camera.left = -view * aspect / 2;
    camera.right = view * aspect / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 700 ? 1.45 : 1.8));
    renderer.setSize(width, height, false);
    renderer.render(scene, camera);
  }

  function updatePointer(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = clamp(((event.clientX - rect.left) / rect.width) * 2 - 1, -1, 1);
    pointer.y = clamp(-((event.clientY - rect.top) / rect.height) * 2 + 1, -1, 1);
    cameraDriftTarget.set(pointer.x * 0.22, pointer.y * 0.16);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(interactiveGroups, true);
    hoveredGroup = hits[0]?.object?.userData?.interactiveRoot || null;
    characterPointerProbe.set(0, 1.35, 0);
    character.localToWorld(characterPointerProbe);
    characterPointerProbe.project(camera);
    const nearCharacter = Math.hypot(pointer.x - characterPointerProbe.x, pointer.y - characterPointerProbe.y) < 0.24;
    pointerOnCharacter = hoveredGroup === character || nearCharacter;
    host.classList.toggle("is-character-hovered", pointerOnCharacter);
  }

  function updateCharacter(delta, elapsed) {
    const distanceBefore = character.position.distanceTo(targetPosition);
    character.position.lerp(targetPosition, 1 - Math.exp(-2.2 * delta));
    const desiredYaw = pointerOnCharacter ? Math.PI * 0.24 : targetYaw;
    const yawDifference = THREE.MathUtils.euclideanModulo(desiredYaw - character.rotation.y + Math.PI, Math.PI * 2) - Math.PI;
    character.rotation.y += yawDifference * (1 - Math.exp(-3.2 * delta));

    const waving = pointerOnCharacter;
    const settled = distanceBefore < 0.16;
    const phase = actionElapsed / 1000;
    let leftTarget = activeAction.arms[0];
    let rightTarget = activeAction.arms[1];
    let armLift = activeAction.armLift;
    let bodyLean = 0;
    let bodyBob = Math.sin(elapsed * 2.1) * 0.018;
    let bodySquash = 1;

    if (settled && !waving) {
      if (activeAction.name === "work") {
        leftTarget += Math.sin(phase * 10.5) * 0.23;
        rightTarget += Math.sin(phase * 10.5 + Math.PI) * 0.23;
        armLift += Math.sin(phase * 7.5) * 0.12;
        bodyLean = -0.045 + Math.sin(phase * 2.2) * 0.018;
        bodyBob += Math.abs(Math.sin(phase * 5.2)) * 0.025;
      } else if (activeAction.name === "draw") {
        rightTarget += Math.sin(phase * 5.6) * 0.38;
        armLift += Math.cos(phase * 5.6) * 0.14;
        leftTarget += Math.sin(phase * 2.2) * 0.08;
        bodyLean = -0.085 + Math.sin(phase * 1.8) * 0.025;
      } else if (activeAction.name === "photo") {
        const shutter = Math.max(0, Math.sin(phase * 4.6) - 0.9) * 10;
        leftTarget -= 0.12 + shutter * 0.035;
        rightTarget += 0.12 + shutter * 0.035;
        armLift += 0.15;
        bodyLean = Math.sin(phase * 1.7) * 0.025;
        bodySquash = 1 - shutter * 0.012;
      } else if (activeAction.name === "water") {
        rightTarget += Math.sin(phase * 3.4) * 0.16;
        armLift += Math.sin(phase * 3.4) * 0.1;
        leftTarget += Math.sin(phase * 1.7) * 0.08;
        bodyLean = 0.07 + Math.sin(phase * 2) * 0.025;
      } else if (activeAction.name === "write") {
        rightTarget += Math.sin(phase * 11) * 0.24;
        armLift += Math.cos(phase * 11) * 0.1;
        leftTarget += Math.sin(phase * 2.4) * 0.05;
        bodyLean = -0.065 + Math.sin(phase * 2) * 0.018;
        bodyBob += Math.abs(Math.sin(phase * 5.5)) * 0.018;
      } else if (activeAction.name === "idle") {
        const stretch = clamp((Math.sin(phase * 1.25) - 0.55) * 2.2, 0, 1);
        leftTarget -= stretch * 0.85 + Math.sin(phase * 1.4) * 0.08;
        rightTarget += stretch * 0.85 - Math.sin(phase * 1.4) * 0.08;
        armLift += stretch * 0.22;
        bodyLean = Math.sin(phase * 0.9) * 0.045;
        bodyBob += stretch * 0.07;
        bodySquash = 1 + stretch * 0.025;
      }
    }

    if (waving) {
      leftTarget = -0.12;
      rightTarget = 1.72 + Math.sin(elapsed * 8.4) * 0.34;
      armLift = 0.05;
      bodyLean = Math.sin(elapsed * 3) * 0.025;
      bodyBob += 0.045;
    }

    leftArm.rotation.z = damp(leftArm.rotation.z, leftTarget, 5.5, delta);
    rightArm.rotation.z = damp(rightArm.rotation.z, rightTarget, 5.5, delta);
    leftArm.rotation.x = damp(leftArm.rotation.x, armLift, 5.2, delta);
    rightArm.rotation.x = damp(rightArm.rotation.x, armLift + (waving ? -0.18 : 0), 5.2, delta);

    const walking = clamp(distanceBefore * 3.6, 0, 1);
    const step = Math.sin(elapsed * 10) * 0.42 * walking;
    leftLeg.rotation.z = damp(leftLeg.rotation.z, step, 10, delta);
    rightLeg.rotation.z = damp(rightLeg.rotation.z, -step, 10, delta);
    paperBody.position.y = damp(paperBody.position.y, bodyBob + walking * Math.abs(Math.sin(elapsed * 10)) * 0.05, 8, delta);
    paperBody.rotation.z = damp(paperBody.rotation.z, bodyLean, 7, delta);
    paperBody.scale.x = damp(paperBody.scale.x, 2 - bodySquash, 8, delta);
    paperBody.scale.y = damp(paperBody.scale.y, bodySquash, 8, delta);

    const idleLook = activeAction.name === "idle" && !pointerInside ? Math.sin(phase * 1.1) * 0.035 : 0;
    const eyeTargetX = pointerInside ? pointer.x * 0.045 : idleLook;
    const eyeTargetY = pointerInside ? pointer.y * 0.035 : Math.sin(phase * 0.7) * 0.012;
    eyes.position.x = damp(eyes.position.x, eyeTargetX, 9, delta);
    eyes.position.y = damp(eyes.position.y, 1.5 + eyeTargetY, 9, delta);
    const blink = Math.sin(elapsed * 0.82) > 0.993 ? 0.08 : 1;
    eyes.scale.y = damp(eyes.scale.y, blink, 24, delta);
    mouth.scale.setScalar(damp(mouth.scale.x, waving ? 1 : 0.001, 9, delta));

    const showCamera = activeAction.name === "photo" && distanceBefore < 0.14;
    const showCan = activeAction.name === "water" && distanceBefore < 0.16;
    const showPencil = (activeAction.name === "draw" || activeAction.name === "write") && distanceBefore < 0.18;
    heldCamera.scale.setScalar(damp(heldCamera.scale.x, showCamera ? 1 : 0.001, 8, delta));
    heldCan.scale.setScalar(damp(heldCan.scale.x, showCan ? 1 : 0.001, 8, delta));
    pencil.scale.setScalar(damp(pencil.scale.x, showPencil ? 1 : 0.001, 8, delta));
    heldCamera.rotation.z = damp(heldCamera.rotation.z, showCamera ? Math.sin(phase * 1.8) * 0.06 : 0, 7, delta);
    heldCan.rotation.z = damp(heldCan.rotation.z, showCan ? -0.32 + Math.sin(phase * 3.4) * 0.07 : 0, 7, delta);
    pencil.rotation.z = damp(pencil.rotation.z, showPencil ? 0.18 + Math.sin(phase * 11) * 0.12 : 0.18, 9, delta);
  }

  function updateScene(delta, elapsed) {
    screenMaterial.emissiveIntensity = activeAction.name === "work" || activeAction.name === "write"
      ? 0.16 + Math.sin(elapsed * 2.4) * 0.035
      : 0.045;
    const photoFlash = activeAction.name === "photo" ? Math.max(0, Math.sin(elapsed * 4.6) - 0.96) * 28 : 0;
    keyLight.intensity = 3.1 + photoFlash;
    leaves.rotation.z = activeAction.name === "water" ? Math.sin(elapsed * 4.4) * 0.07 : Math.sin(elapsed * 1.2) * 0.018;
    cameraProp.rotation.y = Math.sin(elapsed * 1.05) * 0.035;
    monitor.rotation.y = damp(monitor.rotation.y, activeAction.name === "work" ? Math.sin(elapsed * 1.6) * 0.018 : 0, 4, delta);
    easel.rotation.z = damp(easel.rotation.z, activeAction.name === "draw" ? Math.sin(elapsed * 2.4) * 0.012 : 0, 4, delta);
    sketchMaterial.opacity = activeAction.name === "draw" ? 0.58 + Math.sin(elapsed * 5.6) * 0.2 : 0.3;
    codeMaterial.opacity = activeAction.name === "work" || activeAction.name === "write" ? 0.62 + Math.sin(elapsed * 3.2) * 0.15 : 0.28;

    waterDrops.forEach((drop, index) => {
      const watering = activeAction.name === "water" && character.position.distanceTo(targetPosition) < 0.2;
      drop.visible = watering;
      if (watering) {
        const progress = (elapsed * 0.72 + index * 0.18) % 1;
        drop.position.y = 1.26 - progress * 0.82;
        drop.position.x = 1.82 + index * 0.08 + progress * 0.24;
        drop.scale.setScalar(0.7 + progress * 0.4);
      }
    });

    interactiveGroups.forEach((group) => {
      const target = group === hoveredGroup && group !== character ? 1.045 : 1;
      const next = damp(group.scale.x, target, 8, delta);
      group.scale.setScalar(next);
    });
  }

  function renderLoop() {
    if (disposed) return;
    frame = window.requestAnimationFrame(renderLoop);
    if (!visible) return;
    const delta = Math.min(clock.getDelta(), 0.05);
    const elapsed = clock.elapsedTime;

    if (!reduceMotion.matches) {
      actionElapsed += delta * 1000;
      if (!pointerOnCharacter && actionElapsed >= activeAction.duration) nextAction();
      updateCharacter(delta, elapsed);
      updateScene(delta, elapsed);
      cameraDrift.lerp(cameraDriftTarget, 1 - Math.exp(-3.8 * delta));
      world.rotation.y = -0.05 + cameraDrift.x * 0.12;
      world.rotation.x = cameraDrift.y * 0.035;
    }

    camera.position.set(7.6 + cameraDrift.x, 6.6 + cameraDrift.y, 8.2);
    camera.lookAt(0, 1.25, 0);
    renderer.render(scene, camera);
  }

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
  const visibilityObserver = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible) clock.getDelta();
  }, { threshold: 0.04 });
  visibilityObserver.observe(host);
  const themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });

  host.addEventListener("pointerenter", () => {
    pointerInside = true;
  });
  host.addEventListener("pointermove", updatePointer, { passive: true });
  host.addEventListener("pointerleave", () => {
    pointerInside = false;
    pointerOnCharacter = false;
    hoveredGroup = null;
    cameraDriftTarget.set(0, 0);
    host.classList.remove("is-character-hovered");
  });
  host.addEventListener("click", () => {
    if (pointerOnCharacter) {
      pointerOnCharacter = false;
      nextAction();
    }
  });

  applyTheme();
  setAction(ACTIONS[actionIndex]);
  resize();
  camera.position.set(7.6, 6.6, 8.2);
  camera.lookAt(0, 1.25, 0);
  renderer.render(scene, camera);
  host.classList.remove("is-loading");
  host.classList.add("is-ready");
  renderLoop();

  const dispose = () => {
    disposed = true;
    window.cancelAnimationFrame(frame);
    frame = 0;
    resizeObserver.disconnect();
    visibilityObserver.disconnect();
    themeObserver.disconnect();
    window.removeEventListener("pagehide", handlePageHide);
    window.removeEventListener("pageshow", handlePageShow);
    scene.traverse((object) => {
      object.geometry?.dispose?.();
      if (Array.isArray(object.material)) object.material.forEach((material) => material.dispose());
    });
    [...new Set([...materialRegistry, ...edgeRegistry, eyeMaterial, codeMaterial, sketchMaterial])].forEach((material) => material.dispose());
    renderer.dispose();
  };

  function handlePageHide(event) {
    if (!event.persisted) {
      dispose();
      return;
    }
    visible = false;
    window.cancelAnimationFrame(frame);
    frame = 0;
  }

  function handlePageShow(event) {
    if (!event.persisted || disposed) return;
    visible = true;
    clock.start();
    resize();
    if (!frame) renderLoop();
  }

  window.addEventListener("pagehide", handlePageHide);
  window.addEventListener("pageshow", handlePageShow);
}

document.querySelectorAll("[data-baifang-room]").forEach((host) => {
  try {
    createStudio(host);
  } catch (error) {
    console.error("Unable to create the Baifang studio.", error);
    host.classList.remove("is-loading");
    host.classList.add("is-error");
    host.innerHTML = '<p class="baifang-room__fallback">The studio is resting.</p>';
  }
});
