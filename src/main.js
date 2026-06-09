import './styles.css';
import * as THREE from 'three';
import { createIcons } from 'lucide';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

createIcons();

let currentStep = 1;

const stepTab1 = document.getElementById('step-tab-1');
const stepTab2 = document.getElementById('step-tab-2');
const step1Content = document.getElementById('step-1-content');
const step2Content = document.getElementById('step-2-content');
const btnBack = document.getElementById('btn-back');
const btnNext = document.getElementById('btn-next');

const inputFullPallets = document.getElementById('input-full-pallets');
const rangeFullPallets = document.getElementById('range-full-pallets');
const inputLayers = document.getElementById('input-layers');
const inputBoxes = document.getElementById('input-boxes');
const inputUnits = document.getElementById('input-units');
const inputUnitsNum = document.getElementById('input-units-num');
const inputActiveLayers = document.getElementById('input-active-layers');
const valActiveLayers = document.getElementById('val-active-layers');

const checkMissing = document.getElementById('check-missing');
const missingControlWrap = document.getElementById('missing-control-wrap');
const inputMissingCount = document.getElementById('input-missing-count');

const checkPartial = document.getElementById('check-partial');
const partialControlWrap = document.getElementById('partial-control-wrap');
const inputPartialUnits = document.getElementById('input-partial-units');

const valLayers = document.getElementById('val-layers');
const valBoxes = document.getElementById('val-boxes');

const resTotalPallets = document.getElementById('res-total-pallets');
const resTotalBoxes = document.getElementById('res-total-boxes');
const resUnitsBox = document.getElementById('res-units-box');
const resTotalUnits = document.getElementById('res-total-units');

const threeContainer = document.getElementById('three-container');
const twodContainer = document.getElementById('twod-container');

const fullPalletsBadge = document.getElementById('full-pallets-badge');
const fullPalletsBadgeCount = document.getElementById('full-pallets-badge-count');
const btnCopyReport = document.getElementById('btn-copy-report');
const btnResetFields = document.getElementById('btn-reset-fields');
const btnOrbit = document.getElementById('btn-orbit');
const viewModeTitle = document.getElementById('view-mode-title');

const btnView3D = document.getElementById('btn-view-3d');
const btnView2D = document.getElementById('btn-view-2d');

let scene, camera, renderer, palletGroup;
let isOrbiting = true;
let isDragging = false;
let previousMousePosition = { x: 0, y: 0 };
let webglActive = true;
let currentViewMode = '3d';
let boxesMeshesGroup = null;

function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch {
    return false;
  }
}

function activateFallback(reason) {
  console.warn('WebGL not supported or blocked: ' + reason);
  webglActive = false;
  btnView3D.classList.add('opacity-50', 'cursor-not-allowed');
  setViewMode('2d');
}

function setViewMode(mode) {
  if (mode === '3d' && !webglActive) return;

  currentViewMode = mode;
  if (mode === '3d') {
    btnView3D.className = 'px-3 py-1 text-[10px] font-bold rounded-md bg-blue-600 text-white shadow transition-all';
    btnView2D.className = 'px-3 py-1 text-[10px] font-bold rounded-md text-slate-400 hover:text-white transition-all';
    threeContainer.classList.remove('hidden');
    twodContainer.classList.add('hidden');
    btnOrbit.classList.remove('hidden');
  } else {
    btnView2D.className = 'px-3 py-1 text-[10px] font-bold rounded-md bg-blue-600 text-white shadow transition-all';
    btnView3D.className = 'px-3 py-1 text-[10px] font-bold rounded-md text-slate-400 hover:text-white transition-all';
    twodContainer.classList.remove('hidden');
    threeContainer.classList.add('hidden');
    btnOrbit.classList.add('hidden');
  }
  calculate();
}

btnView3D.addEventListener('click', () => setViewMode('3d'));
btnView2D.addEventListener('click', () => setViewMode('2d'));

function init3D() {
  if (!isWebGLAvailable()) {
    activateFallback('WebGL context not supported in this environment.');
    return;
  }

  try {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(45, threeContainer.clientWidth / threeContainer.clientHeight, 0.1, 1000);
    camera.position.set(0, 10, 18);
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    threeContainer.appendChild(renderer.domElement);

    palletGroup = new THREE.Group();
    scene.add(palletGroup);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff3e0, 0.8);
    dirLight.position.set(10, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    dirLight.shadow.bias = -0.0005;
    scene.add(dirLight);

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.4);
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    build3DPalletBase();
    setupInteractionEvents();
    animate();
  } catch (error) {
    activateFallback(error.message);
  }
}

function build3DPalletBase() {
  if (!webglActive || !palletGroup) return;
  const palletBaseGroup = new THREE.Group();

  const woodMaterial = new THREE.MeshStandardMaterial({
    color: 0x9a6229,
    roughness: 0.9,
    metalness: 0.1,
  });

  const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: 0x784817,
    roughness: 0.95,
    metalness: 0.1,
  });

  const runnerPositions = [-4.0, 0, 4.0];
  runnerPositions.forEach((x) => {
    const runnerGeom = new THREE.BoxGeometry(0.8, 0.8, 11.0);
    const runner = new THREE.Mesh(runnerGeom, darkWoodMaterial);
    runner.position.set(x, -0.9, 0);
    runner.castShadow = true;
    runner.receiveShadow = true;
    palletBaseGroup.add(runner);
  });

  runnerPositions.forEach((x) => {
    const boardGeom = new THREE.BoxGeometry(1.2, 0.15, 11.0);
    const board = new THREE.Mesh(boardGeom, woodMaterial);
    board.position.set(x, -1.3, 0);
    board.castShadow = true;
    board.receiveShadow = true;
    palletBaseGroup.add(board);
  });

  const deckPositions = [-5.0, -3.0, -1.0, 1.0, 3.0, 5.0];
  deckPositions.forEach((z) => {
    const boardGeom = new THREE.BoxGeometry(9.6, 0.15, 1.2);
    const board = new THREE.Mesh(boardGeom, woodMaterial);
    board.position.set(0, -0.42, z);
    board.castShadow = true;
    board.receiveShadow = true;
    palletBaseGroup.add(board);
  });

  palletGroup.add(palletBaseGroup);
}

function setupInteractionEvents() {
  if (!webglActive) return;

  const onPointerDown = (e) => {
    if (currentViewMode !== '3d') return;
    isDragging = true;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    previousMousePosition = { x: clientX, y: clientY };
  };

  const onPointerMove = (e) => {
    if (!isDragging || currentViewMode !== '3d') return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const deltaMove = {
      x: clientX - previousMousePosition.x,
      y: clientY - previousMousePosition.y,
    };

    palletGroup.rotation.y += deltaMove.x * 0.01;
    palletGroup.rotation.x = Math.max(0.1, Math.min(1.4, palletGroup.rotation.x + deltaMove.y * 0.01));

    previousMousePosition = { x: clientX, y: clientY };
  };

  const onPointerUp = () => {
    isDragging = false;
  };

  threeContainer.addEventListener('mousedown', onPointerDown);
  window.addEventListener('mousemove', onPointerMove);
  window.addEventListener('mouseup', onPointerUp);

  threeContainer.addEventListener('touchstart', onPointerDown, { passive: true });
  window.addEventListener('touchmove', onPointerMove, { passive: true });
  window.addEventListener('touchend', onPointerUp);

  threeContainer.addEventListener(
    'wheel',
    (e) => {
      if (currentViewMode !== '3d') return;
      e.preventDefault();
      camera.position.z = Math.max(10, Math.min(30, camera.position.z + e.deltaY * 0.01));
    },
    { passive: false },
  );
}

function animate() {
  requestAnimationFrame(animate);
  if (!webglActive || !palletGroup || !renderer || !scene) return;

  if (isOrbiting && !isDragging && currentViewMode === '3d') {
    palletGroup.rotation.y += 0.003;
    palletGroup.rotation.x += (0.42 - palletGroup.rotation.x) * 0.05;
  }
  if (currentViewMode === '3d') {
    renderer.render(scene, camera);
  }
}

function adjustVal(id, val) {
  const input = document.getElementById(id);
  const current = parseInt(input.value, 10) || 0;
  const newVal = current + val;
  if (newVal >= parseInt(input.min, 10) && newVal <= parseInt(input.max, 10)) {
    input.value = newVal;
    input.dispatchEvent(new Event('input'));
  }
}

document.querySelectorAll('.adjust-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    adjustVal(btn.dataset.adjust, parseInt(btn.dataset.delta, 10));
  });
});

btnOrbit.addEventListener('click', () => {
  if (!webglActive) return;
  isOrbiting = !isOrbiting;
  document.getElementById('orbit-icon').className = isOrbiting ? 'w-4 h-4 text-blue-400' : 'w-4 h-4 text-slate-400';
});

function setStep(step) {
  currentStep = step;
  if (currentStep === 1) {
    stepTab1.className = 'py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 bg-blue-600 text-white shadow';
    stepTab2.className = 'py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200';
    step1Content.classList.remove('hidden');
    step2Content.classList.add('hidden');
    btnBack.classList.add('hidden');
    btnNext.innerHTML = 'Continue <i data-lucide="arrow-right" class="w-4 h-4"></i>';
  } else {
    stepTab1.className = 'py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 text-slate-400 hover:text-slate-200';
    stepTab2.className = 'py-2.5 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 bg-blue-600 text-white shadow';
    step1Content.classList.add('hidden');
    step2Content.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    btnNext.innerHTML = 'Complete <i data-lucide="check" class="w-4 h-4"></i>';
  }
  createIcons();
}

btnNext.addEventListener('click', () => {
  if (currentStep === 1) {
    inputActiveLayers.value = inputLayers.value;
    valActiveLayers.innerText = inputLayers.value;
    setStep(2);
    calculate();
  } else {
    btnCopyReport.click();
  }
});

btnBack.addEventListener('click', () => {
  setStep(1);
  calculate();
});

stepTab1.addEventListener('click', () => {
  setStep(1);
  calculate();
});
stepTab2.addEventListener('click', () => {
  setStep(2);
  calculate();
});

function calculate() {
  const fullPallets = parseInt(inputFullPallets.value, 10) || 0;
  const standardLayers = parseInt(inputLayers.value, 10) || 0;
  const boxesPerLayer = parseInt(inputBoxes.value, 10) || 0;
  const unitsPerBox = parseInt(inputUnits.value, 10) || 0;
  const activeLayers = parseInt(inputActiveLayers.value, 10) || 0;

  const hasMissing = checkMissing.checked;
  const missingBoxes = hasMissing ? parseInt(inputMissingCount.value, 10) || 0 : 0;

  const hasPartial = checkPartial.checked;
  const partialUnits = hasPartial ? parseInt(inputPartialUnits.value, 10) || 0 : 0;

  inputPartialUnits.max = unitsPerBox - 1;
  if (parseInt(inputPartialUnits.value, 10) >= unitsPerBox) {
    inputPartialUnits.value = unitsPerBox - 1;
  }

  const maxMissingAllowed = boxesPerLayer;
  inputMissingCount.max = maxMissingAllowed;
  if (parseInt(inputMissingCount.value, 10) > maxMissingAllowed) {
    inputMissingCount.value = maxMissingAllowed;
  }

  valLayers.innerText = standardLayers;
  valBoxes.innerText = boxesPerLayer;
  valActiveLayers.innerText = activeLayers;

  const boxesPerStandardPallet = standardLayers * boxesPerLayer;
  const unitsPerStandardPallet = boxesPerStandardPallet * unitsPerBox;
  const totalUnitsFromFullPallets = fullPallets * unitsPerStandardPallet;
  const totalBoxesFromFullPallets = fullPallets * boxesPerStandardPallet;

  const boxesPerActivePallet = activeLayers * boxesPerLayer;
  let currentPalletFullBoxes = boxesPerActivePallet - missingBoxes;
  if (hasPartial) {
    currentPalletFullBoxes -= 1;
  }
  if (currentPalletFullBoxes < 0) currentPalletFullBoxes = 0;

  const currentPalletUnits = currentPalletFullBoxes * unitsPerBox + (hasPartial ? partialUnits : 0);
  const activePalletBoxesCount = currentPalletFullBoxes + (hasPartial && boxesPerActivePallet - missingBoxes > 0 ? 1 : 0);

  const finalTotalBoxes = totalBoxesFromFullPallets + activePalletBoxesCount;
  const finalTotalUnits = totalUnitsFromFullPallets + currentPalletUnits;

  let currentPalletRatio = boxesPerStandardPallet > 0 ? activePalletBoxesCount / boxesPerStandardPallet : 0;
  if (hasPartial && boxesPerStandardPallet > 0) {
    const partialRatio = partialUnits / unitsPerBox / boxesPerStandardPallet;
    currentPalletRatio = currentPalletFullBoxes / boxesPerStandardPallet + partialRatio;
  }
  const finalTotalPallets = (fullPallets + currentPalletRatio).toFixed(2);

  resTotalPallets.innerText = finalTotalPallets;
  resTotalBoxes.innerText = finalTotalBoxes;
  resUnitsBox.innerText = unitsPerBox;
  resTotalUnits.innerText = finalTotalUnits.toLocaleString('en-US');

  if (fullPallets > 0) {
    fullPalletsBadge.classList.remove('hidden');
    fullPalletsBadgeCount.innerText = fullPallets;
  } else {
    fullPalletsBadge.classList.add('hidden');
  }

  const displayLayers = currentStep === 1 ? standardLayers : activeLayers;
  const displayMissing = currentStep === 1 ? 0 : missingBoxes;
  const displayPartial = currentStep === 1 ? false : hasPartial;
  const displayPartialUnits = currentStep === 1 ? 0 : partialUnits;

  if (viewModeTitle) {
    if (currentViewMode === '3d') {
      if (currentStep === 1) {
        viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Standard Preview (Drag to rotate)';
      } else {
        viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Active Pallet 3D (Drag to rotate)';
      }
    } else {
      viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 2D Grid Layout';
    }
  }

  if (currentViewMode === '3d' && webglActive && scene && palletGroup) {
    rebuild3DBoxes(displayLayers, boxesPerLayer, displayMissing, displayPartial, displayPartialUnits, unitsPerBox);
  } else {
    renderFallback2D(displayLayers, boxesPerLayer, displayMissing, displayPartial, displayPartialUnits, unitsPerBox);
  }
}

function renderFallback2D(layers, boxesPerLayer, missingBoxes, hasPartial, partialUnits, unitsPerBox) {
  twodContainer.innerHTML = '';
  const gridContainer = document.createElement('div');
  gridContainer.className = 'w-full max-w-[280px] flex flex-col-reverse gap-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-xl mx-auto';
  for (let l = 0; l < layers; l++) {
    const isTopLayer = l === layers - 1;
    const layerRow = document.createElement('div');
    layerRow.className = 'flex gap-1.5 justify-center';
    for (let i = 0; i < boxesPerLayer; i++) {
      const box = document.createElement('div');
      box.className = 'w-9 h-9 rounded border flex items-center justify-center text-[10px] font-black transition-all shadow-md';
      const isMissing = isTopLayer && i >= boxesPerLayer - missingBoxes;
      const isPartial = isTopLayer && hasPartial && i === boxesPerLayer - missingBoxes - 1;
      if (isMissing) {
        box.className += ' border-dashed border-slate-700 bg-transparent text-slate-600';
        box.innerHTML = '<i data-lucide="square-dashed" class="w-4 h-4 opacity-40"></i>';
      } else if (isPartial) {
        box.className += ' bg-blue-600 border-blue-800 text-white shadow-[0_0_10px_rgba(37,99,235,0.4)]';
        box.innerText = partialUnits;
      } else {
        box.className += ' bg-[#cd813f] border-[#b36b2d] text-slate-950';
        box.innerText = unitsPerBox;
      }
      layerRow.appendChild(box);
    }
    gridContainer.appendChild(layerRow);
  }
  twodContainer.appendChild(gridContainer);
  createIcons();
}

function rebuild3DBoxes(layers, boxesPerLayer, missingBoxes, hasPartial, partialUnits, unitsPerBox) {
  if (!webglActive || !palletGroup) return;
  if (boxesMeshesGroup) palletGroup.remove(boxesMeshesGroup);
  boxesMeshesGroup = new THREE.Group();
  const boxCardboardMaterial = new THREE.MeshStandardMaterial({ color: 0xcd813f, roughness: 0.8, metalness: 0.1 });
  const cols = boxesPerLayer <= 4 ? 2 : 3;
  const rows = boxesPerLayer <= 4 ? 2 : boxesPerLayer >= 7 ? 3 : 2;
  const boxW = 2.6;
  const boxH = 1.8;
  const boxD = 2.2;
  const stepX = boxW + 0.1;
  const stepZ = boxD + 0.1;
  const stepY = boxH + 0.05;
  const offsetX = ((cols - 1) * stepX) / 2;
  const offsetZ = ((rows - 1) * stepZ) / 2;
  for (let l = 0; l < layers; l++) {
    const isTopLayer = l === layers - 1;
    for (let i = 0; i < boxesPerLayer; i++) {
      const r = Math.floor(i / cols);
      const c = i % cols;
      const posX = c * stepX - offsetX;
      const posZ = r * stepZ - offsetZ;
      const posY = -0.15 + l * stepY;
      const singleBoxGroup = new THREE.Group();
      singleBoxGroup.position.set(posX, posY, posZ);
      const isMissing = isTopLayer && i >= boxesPerLayer - missingBoxes;
      const isPartial = isTopLayer && hasPartial && i === boxesPerLayer - missingBoxes - 1;
      if (isMissing) {
        const edgeGeom = new THREE.BoxGeometry(boxW, boxH, boxD);
        const edges = new THREE.EdgesGeometry(edgeGeom);
        singleBoxGroup.add(new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x475569 })));
      } else if (isPartial) {
        const shell = new THREE.Mesh(
          new THREE.BoxGeometry(boxW, boxH, boxD),
          new THREE.MeshStandardMaterial({ color: 0x2563eb, transparent: true, opacity: 0.5 }),
        );
        singleBoxGroup.add(shell);
        const fillPercent = partialUnits / unitsPerBox;
        if (fillPercent > 0.05) {
          const fillMesh = new THREE.Mesh(
            new THREE.BoxGeometry(boxW - 0.1, boxH * fillPercent - 0.05, boxD - 0.1),
            new THREE.MeshStandardMaterial({ color: 0x1d4ed8 }),
          );
          fillMesh.position.y = -(boxH / 2) + (boxH * fillPercent) / 2 + 0.025;
          singleBoxGroup.add(fillMesh);
        }
      } else {
        singleBoxGroup.add(new THREE.Mesh(new THREE.BoxGeometry(boxW, boxH, boxD), boxCardboardMaterial));
      }
      boxesMeshesGroup.add(singleBoxGroup);
    }
  }
  palletGroup.add(boxesMeshesGroup);
}

window.addEventListener('resize', () => {
  if (!webglActive || !camera || !renderer) return;
  camera.aspect = threeContainer.clientWidth / threeContainer.clientHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(threeContainer.clientWidth, threeContainer.clientHeight);
});

inputFullPallets.addEventListener('input', (e) => {
  rangeFullPallets.value = e.target.value;
  calculate();
});
rangeFullPallets.addEventListener('input', (e) => {
  inputFullPallets.value = e.target.value;
  calculate();
});
inputLayers.addEventListener('input', calculate);
inputBoxes.addEventListener('input', calculate);
inputActiveLayers.addEventListener('input', calculate);
inputUnits.addEventListener('input', (e) => {
  inputUnitsNum.value = e.target.value;
  calculate();
});
inputUnitsNum.addEventListener('input', (e) => {
  inputUnits.value = e.target.value;
  calculate();
});
checkMissing.addEventListener('change', (e) => {
  missingControlWrap.classList.toggle('opacity-40', !e.target.checked);
  missingControlWrap.classList.toggle('pointer-events-none', !e.target.checked);
  calculate();
});
inputMissingCount.addEventListener('input', calculate);
checkPartial.addEventListener('change', (e) => {
  partialControlWrap.classList.toggle('opacity-40', !e.target.checked);
  partialControlWrap.classList.toggle('pointer-events-none', !e.target.checked);
  calculate();
});
inputPartialUnits.addEventListener('input', calculate);

async function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }, 2500);
}

btnCopyReport.addEventListener('click', async () => {
  const textToCopy = `PALLET INVENTORY REPORT\nTotal Units: ${resTotalUnits.innerText}`;
  try {
    await navigator.clipboard.writeText(textToCopy);
  } catch {
    const textArea = document.createElement('textarea');
    textArea.value = textToCopy;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }
  showToast();
});

btnResetFields.addEventListener('click', () => {
  window.location.reload();
});

init3D();
calculate();
setStep(1);
