import './styles.css';
import * as THREE from 'three';
import {
  ArrowLeft,
  ArrowRight,
  Box,
  Calculator,
  Check,
  CheckCircle,
  Copy,
  createIcons,
  FileSpreadsheet,
  Hash,
  Layers,
  Layout,
  Minus,
  Orbit,
  Package,
  PackageCheck,
  PackagePlus,
  PackageSearch,
  PackageX,
  Plus,
  RotateCcw,
  SquareDashed,
  X,
} from 'lucide';
import { registerSW } from 'virtual:pwa-register';

registerSW({ immediate: true });

const appIcons = {
  Package,
  RotateCcw,
  Layout,
  PackageSearch,
  ArrowLeft,
  ArrowRight,
  Orbit,
  FileSpreadsheet,
  Copy,
  CheckCircle,
  Check,
  SquareDashed,
  Layers,
  Box,
  Hash,
  PackageCheck,
  PackagePlus,
  PackageX,
  Calculator,
  Minus,
  Plus,
  X,
};

function refreshIcons() {
  createIcons({ icons: appIcons });
}

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
const inputLayersNum = document.getElementById('input-layers-num');
const inputBoxes = document.getElementById('input-boxes');
const inputBoxesNum = document.getElementById('input-boxes-num');
const inputUnits = document.getElementById('input-units');
const inputUnitsNum = document.getElementById('input-units-num');
const inputActiveLayers = document.getElementById('input-active-layers');
const inputActiveLayersNum = document.getElementById('input-active-layers-num');

const LIMITS = {
  layers: { min: 1, max: 9999, sliderDefaultMax: 12 },
  boxes: { min: 1, max: 9999, sliderDefaultMax: 12 },
};

const checkMissing = document.getElementById('check-missing');
const missingControlWrap = document.getElementById('missing-control-wrap');
const inputMissingCount = document.getElementById('input-missing-count');

const checkPartial = document.getElementById('check-partial');
const partialControlWrap = document.getElementById('partial-control-wrap');
const inputPartialUnits = document.getElementById('input-partial-units');

const checkIncludeActive = document.getElementById('check-include-active');
const toggleIncludeActive = document.getElementById('toggle-include-active');
const activePalletSection = document.getElementById('active-pallet-section');
const includeActiveHint = document.getElementById('include-active-hint');
const modeBadge = document.getElementById('mode-badge');
const previewEmptyMsg = document.getElementById('preview-empty-msg');

const resTotalPallets = document.getElementById('res-total-pallets');
const resTotalBoxes = document.getElementById('res-total-boxes');
const resUnitsBox = document.getElementById('res-units-box');
const resTotalUnits = document.getElementById('res-total-units');

const btnShowCalc = document.getElementById('btn-show-calc');
const calcBreakdown = document.getElementById('calc-breakdown');
const calcBreakdownContent = document.getElementById('calc-breakdown-content');

let calcBreakdownOpen = false;

function fmt(n) {
  return n.toLocaleString('en-US');
}

function clampCount(value, min, max) {
  const n = Number.parseInt(String(value), 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function readCount(numInput, slider, min, max) {
  if (numInput) return clampCount(numInput.value, min, max);
  return clampCount(slider?.value, min, max);
}

function syncSliderToValue(slider, value, defaultMax) {
  if (!slider) return;
  const v = Number.parseInt(String(value), 10) || 1;
  if (v > Number.parseInt(slider.max, 10)) slider.max = String(v);
  if (v <= defaultMax && Number.parseInt(slider.max, 10) > defaultMax) slider.max = String(defaultMax);
  slider.value = String(Math.min(Number.parseInt(slider.max, 10), v));
}

function setCountPair(numInput, slider, value, limits) {
  const v = clampCount(value, limits.min, limits.max);
  if (numInput) numInput.value = String(v);
  syncSliderToValue(slider, v, limits.sliderDefaultMax);
}

function bindCountPair(numInput, slider, limits, onChange) {
  if (!numInput || !slider) return;

  slider.addEventListener('input', () => {
    numInput.value = slider.value;
    onChange();
  });

  numInput.addEventListener('input', () => {
    setCountPair(numInput, slider, numInput.value, limits);
    onChange();
  });

  numInput.addEventListener('blur', () => {
    setCountPair(numInput, slider, numInput.value, limits);
    onChange();
  });
}

function renderCalcBreakdownCompact(data) {
  if (!calcBreakdownContent) return;

  const {
    includeActive,
    fullPallets,
    standardLayers,
    boxesPerLayer,
    unitsPerBox,
    activeLayers,
    hasMissing,
    missingBoxes,
    hasPartial,
    partialUnits,
    boxesPerStandardPallet,
    unitsPerStandardPallet,
    totalUnitsFromFullPallets,
    boxesPerActivePallet,
    currentPalletFullBoxes,
    currentPalletUnits,
    finalTotalUnits,
  } = data;

  const missingVal = hasMissing ? missingBoxes : 0;
  const partialSlot = hasPartial ? 1 : 0;
  const partialVal = hasPartial ? partialUnits : 0;

  const chip = (bind, value, min, max) =>
    `<input data-bind="${bind}" inputmode="numeric" class="calc-num" type="number" min="${min}" value="${value}">`;

  const icon = (name) => `<i data-lucide="${name}" class="calc-icon"></i>`;

  const fullPart =
    fullPallets > 0
      ? `${chip('fullPallets', fullPallets, 0, 9999)} ${icon('x')} (${chip('standardLayers', standardLayers, 1, 9999)} ${icon('layers')} ${icon('x')} ${chip('boxesPerLayer', boxesPerLayer, 1, 9999)} ${icon('box')} ${icon('x')} ${chip('unitsPerBox', unitsPerBox, 1, 400)})`
      : '';

  const activePart = includeActive
    ? `<span class="text-slate-500">${icon('plus')}</span> (${chip('activeLayers', activeLayers, 1, 9999)} ${icon('layers')} ${icon('x')} ${chip('boxesPerLayer', boxesPerLayer, 1, 9999)} ${icon('box')} ${icon('minus')} ${chip('missingBoxes', missingVal, 0, 9999)} ${icon('minus')} <span class="text-slate-300 font-black">${partialSlot}</span>) ${icon('x')} ${chip('unitsPerBox', unitsPerBox, 1, 400)} ${icon('plus')} ${chip('partialUnits', partialVal, 0, Math.max(0, unitsPerBox - 1))}`
    : '';

  calcBreakdownContent.innerHTML = `
    <div class="space-y-3">
      <div class="flex flex-wrap items-center gap-1.5 justify-center py-1">
        <span class="text-blue-300 font-black text-sm tabular-nums">${fmt(finalTotalUnits)}</span>
        <span class="text-slate-500">pcs</span>
        <span class="text-slate-600 mx-1">=</span>
        ${fullPart}
        ${activePart}
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800">
        <div class="bg-slate-900/70 border border-slate-800 rounded-lg p-2">
          <div class="flex items-center gap-1 text-[9px] text-emerald-500 mb-1">${icon('package-check')} full</div>
          <div class="text-[10px] text-slate-200 tabular-nums">${standardLayers}×${boxesPerLayer}×${unitsPerBox}</div>
          <div class="text-[10px] text-slate-400 tabular-nums">${fullPallets}×${fmt(unitsPerStandardPallet)}=${fmt(totalUnitsFromFullPallets)}</div>
        </div>
        <div class="bg-slate-900/70 border border-slate-800 rounded-lg p-2 ${includeActive ? '' : 'opacity-40'}">
          <div class="flex items-center gap-1 text-[9px] text-amber-500 mb-1">${icon('package-plus')} active</div>
          ${
            includeActive
              ? `<div class="text-[10px] text-slate-200 tabular-nums">${activeLayers}×${boxesPerLayer}−${missingVal}−${partialSlot}</div>
                 <div class="text-[10px] text-slate-400 tabular-nums">${currentPalletFullBoxes}×${unitsPerBox}+${partialVal}=${fmt(currentPalletUnits)}</div>`
              : `<div class="text-[10px] text-slate-500">off</div>`
          }
        </div>
      </div>
    </div>
  `;

  refreshIcons();
}

function updateCalcBreakdownPanel(data) {
  renderCalcBreakdownCompact(data);
}

const threeContainer = document.getElementById('three-container');
const twodContainer = document.getElementById('twod-container');

const fullPalletsStrip = document.getElementById('full-pallets-strip');
const fullPalletsStripGrid = document.getElementById('full-pallets-strip-grid');
const fullPalletsStripCount = document.getElementById('full-pallets-strip-count');
function updatePresetActiveStates() {
  const boxesValue = readCount(inputBoxesNum, inputBoxes, LIMITS.boxes.min, LIMITS.boxes.max);
  document.querySelectorAll('.preset-boxes-btn').forEach((btn) => {
    btn.classList.toggle('active', boxesValue === parseInt(btn.dataset.presetBoxes, 10));
  });

  const unitsValue = parseInt(inputUnits.value, 10);
  document.querySelectorAll('.preset-units-btn').forEach((btn) => {
    btn.classList.toggle('active', unitsValue === parseInt(btn.dataset.presetUnits, 10));
  });
}

function setIncludeActive(enabled) {
  checkIncludeActive.checked = enabled;
  toggleIncludeActive.classList.toggle('on', enabled);
  toggleIncludeActive.classList.toggle('off', !enabled);
  toggleIncludeActive.setAttribute('aria-checked', String(enabled));
  activePalletSection?.classList.toggle('section-disabled', !enabled);
  if (includeActiveHint) {
    includeActiveHint.textContent = enabled ? 'Active pallet included in total' : 'Counting full pallets only';
  }
  if (modeBadge) {
    modeBadge.textContent = enabled ? 'Full + Active' : 'Full only';
    modeBadge.className = `mode-badge ${enabled ? 'full-active' : 'full-only'}`;
  }
}

function buildMiniPalletLayers(layers, boxesPerLayer) {
  const displayLayers = Math.min(layers, 3);
  const boxDots = Math.min(boxesPerLayer, 6);
  let html = '';
  for (let l = 0; l < displayLayers; l++) {
    html += '<div class="flex justify-center gap-px">';
    for (let b = 0; b < boxDots; b++) {
      html += '<span class="w-1 h-1 rounded-[1px] bg-[#cd813f]"></span>';
    }
    html += '</div>';
  }
  if (layers > displayLayers) {
    html += '<div class="text-[6px] text-center text-slate-600 leading-none">⋯</div>';
  }
  return html;
}

function renderFullPalletsStrip(count, layers, boxesPerLayer) {
  if (!fullPalletsStrip || !fullPalletsStripGrid) return;

  if (count <= 0) {
    fullPalletsStrip.classList.add('hidden');
    fullPalletsStripGrid.innerHTML = '';
    return;
  }

  fullPalletsStrip.classList.remove('hidden');
  fullPalletsStripCount.textContent = count;
  fullPalletsStripGrid.innerHTML = '';

  const displayCount = Math.min(count, 40);
  for (let i = 1; i <= displayCount; i++) {
    const pallet = document.createElement('div');
    pallet.className = 'relative flex flex-col items-center w-12 shrink-0';
    pallet.title = `Full pallet #${i}`;
    pallet.innerHTML = `
      <span class="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full bg-blue-600 text-[8px] font-black text-white flex items-center justify-center border border-blue-400/50 z-10 shadow">${i}</span>
      <div class="w-full bg-slate-900/90 rounded-lg border border-emerald-500/30 p-1 flex flex-col gap-0.5 shadow-sm">
        ${buildMiniPalletLayers(layers, boxesPerLayer)}
        <div class="h-1 bg-[#9a6229] rounded-sm w-full border border-[#784817]/50"></div>
      </div>
    `;
    fullPalletsStripGrid.appendChild(pallet);
  }

  if (count > displayCount) {
    const more = document.createElement('div');
    more.className = 'flex items-center justify-center w-12 h-14 rounded-lg border border-dashed border-slate-700 text-[9px] font-bold text-slate-500 shrink-0';
    more.textContent = `+${count - displayCount}`;
    fullPalletsStripGrid.appendChild(more);
  }
}

document.querySelectorAll('.preset-boxes-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    setCountPair(inputBoxesNum, inputBoxes, btn.dataset.presetBoxes, LIMITS.boxes);
    calculate();
  });
});

document.querySelectorAll('.preset-units-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    inputUnits.value = btn.dataset.presetUnits;
    inputUnitsNum.value = btn.dataset.presetUnits;
    inputUnits.dispatchEvent(new Event('input'));
  });
});

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
    stepTab1.className = 'step-nav-btn active';
    stepTab2.className = 'step-nav-btn inactive';
    step1Content.classList.remove('hidden');
    step2Content.classList.add('hidden');
    btnBack.classList.add('hidden');
    btnNext.innerHTML = 'Continue <i data-lucide="arrow-right" class="w-4 h-4"></i>';
  } else {
    stepTab1.className = 'step-nav-btn inactive';
    stepTab2.className = 'step-nav-btn active';
    step1Content.classList.add('hidden');
    step2Content.classList.remove('hidden');
    btnBack.classList.remove('hidden');
    btnNext.innerHTML = 'Copy report <i data-lucide="copy" class="w-4 h-4"></i>';
  }
  refreshIcons();
}

btnNext.addEventListener('click', () => {
  if (currentStep === 1) {
    setCountPair(inputActiveLayersNum, inputActiveLayers, inputLayersNum.value, LIMITS.layers);
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
  const standardLayers = readCount(inputLayersNum, inputLayers, LIMITS.layers.min, LIMITS.layers.max);
  const boxesPerLayer = readCount(inputBoxesNum, inputBoxes, LIMITS.boxes.min, LIMITS.boxes.max);
  const unitsPerBox = parseInt(inputUnits.value, 10) || 0;
  const activeLayers = readCount(inputActiveLayersNum, inputActiveLayers, LIMITS.layers.min, LIMITS.layers.max);
  const includeActive = currentStep === 2 ? checkIncludeActive.checked : true;

  setCountPair(inputLayersNum, inputLayers, standardLayers, LIMITS.layers);
  setCountPair(inputBoxesNum, inputBoxes, boxesPerLayer, LIMITS.boxes);
  setCountPair(inputActiveLayersNum, inputActiveLayers, activeLayers, LIMITS.layers);

  const hasMissing = includeActive && checkMissing.checked;
  const missingBoxes = hasMissing ? parseInt(inputMissingCount.value, 10) || 0 : 0;

  const hasPartial = includeActive && checkPartial.checked;
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

  const boxesPerStandardPallet = standardLayers * boxesPerLayer;
  const unitsPerStandardPallet = boxesPerStandardPallet * unitsPerBox;
  const totalUnitsFromFullPallets = fullPallets * unitsPerStandardPallet;
  const totalBoxesFromFullPallets = fullPallets * boxesPerStandardPallet;

  const boxesPerActivePallet = activeLayers * boxesPerLayer;
  let currentPalletFullBoxes = 0;
  let currentPalletUnits = 0;
  let activePalletBoxesCount = 0;
  let currentPalletRatio = 0;

  if (includeActive) {
    currentPalletFullBoxes = boxesPerActivePallet - missingBoxes;
    if (hasPartial) currentPalletFullBoxes -= 1;
    if (currentPalletFullBoxes < 0) currentPalletFullBoxes = 0;

    currentPalletUnits = currentPalletFullBoxes * unitsPerBox + (hasPartial ? partialUnits : 0);
    activePalletBoxesCount =
      currentPalletFullBoxes + (hasPartial && boxesPerActivePallet - missingBoxes > 0 ? 1 : 0);

    currentPalletRatio = boxesPerStandardPallet > 0 ? activePalletBoxesCount / boxesPerStandardPallet : 0;
    if (hasPartial && boxesPerStandardPallet > 0) {
      const partialRatio = partialUnits / unitsPerBox / boxesPerStandardPallet;
      currentPalletRatio = currentPalletFullBoxes / boxesPerStandardPallet + partialRatio;
    }
  }

  const finalTotalBoxes = totalBoxesFromFullPallets + activePalletBoxesCount;
  const finalTotalUnits = totalUnitsFromFullPallets + currentPalletUnits;
  const finalTotalPallets = includeActive
    ? (fullPallets + currentPalletRatio).toFixed(2)
    : String(fullPallets);

  const breakdownData = {
    includeActive,
    fullPallets,
    standardLayers,
    boxesPerLayer,
    unitsPerBox,
    activeLayers,
    hasMissing,
    missingBoxes,
    hasPartial,
    partialUnits,
    boxesPerStandardPallet,
    unitsPerStandardPallet,
    totalUnitsFromFullPallets,
    totalBoxesFromFullPallets,
    boxesPerActivePallet,
    currentPalletFullBoxes,
    currentPalletUnits,
    activePalletBoxesCount,
    finalTotalBoxes,
    finalTotalUnits,
    finalTotalPallets,
    currentPalletRatio,
  };

  resTotalPallets.innerText = finalTotalPallets;
  resTotalBoxes.innerText = finalTotalBoxes;
  resUnitsBox.innerText = unitsPerBox;
  resTotalUnits.innerText = finalTotalUnits.toLocaleString('en-US');

  updateCalcBreakdownPanel(breakdownData);

  renderFullPalletsStrip(fullPallets, standardLayers, boxesPerLayer);
  updatePresetActiveStates();
  if (currentStep === 2) setIncludeActive(checkIncludeActive.checked);

  const showActivePreview = includeActive && currentStep === 2;
  const displayLayers = showActivePreview ? activeLayers : standardLayers;
  const displayMissing = showActivePreview ? missingBoxes : 0;
  const displayPartial = showActivePreview && hasPartial;
  const displayPartialUnits = showActivePreview ? partialUnits : 0;

  const hidePreview = currentStep === 2 && !includeActive && fullPallets === 0;
  previewEmptyMsg?.classList.toggle('hidden', !hidePreview);
  threeContainer?.classList.toggle('hidden', hidePreview || currentViewMode === '2d');
  twodContainer?.classList.toggle('hidden', hidePreview || currentViewMode === '3d');

  if (viewModeTitle) {
    if (hidePreview) {
      viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span> No preview';
    } else if (currentViewMode === '3d') {
      if (currentStep === 1 || !includeActive) {
        viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span> Standard preview';
      } else {
        viewModeTitle.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span> Active #${fullPallets + 1}`;
      }
    } else {
      viewModeTitle.innerHTML = '<span class="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 2D grid';
    }
  }

  if (hidePreview) return;

  if (currentViewMode === '3d' && webglActive && scene && palletGroup) {
    rebuild3DBoxes(displayLayers, boxesPerLayer, displayMissing, displayPartial, displayPartialUnits, unitsPerBox);
  } else if (!hidePreview) {
    renderFallback2D(displayLayers, boxesPerLayer, displayMissing, displayPartial, displayPartialUnits, unitsPerBox);
  }
}

function renderFallback2D(layers, boxesPerLayer, missingBoxes, hasPartial, partialUnits, unitsPerBox) {
  twodContainer.innerHTML = '';
  const gridContainer = document.createElement('div');
  gridContainer.className = 'w-full max-w-full overflow-x-auto flex flex-col-reverse gap-2 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shadow-xl mx-auto';
  for (let l = 0; l < layers; l++) {
    const isTopLayer = l === layers - 1;
    const layerRow = document.createElement('div');
    layerRow.className = 'flex gap-1.5 justify-center';
    for (let i = 0; i < boxesPerLayer; i++) {
      const box = document.createElement('div');
      const boxSize = boxesPerLayer > 12 ? 'w-6 h-6 text-[8px]' : boxesPerLayer > 8 ? 'w-7 h-7 text-[9px]' : 'w-9 h-9 text-[10px]';
      box.className = `${boxSize} rounded border flex items-center justify-center font-black transition-all shadow-md shrink-0`;
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
  refreshIcons();
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
bindCountPair(inputLayersNum, inputLayers, LIMITS.layers, calculate);
bindCountPair(inputBoxesNum, inputBoxes, LIMITS.boxes, calculate);
bindCountPair(inputActiveLayersNum, inputActiveLayers, LIMITS.layers, calculate);
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

toggleIncludeActive?.addEventListener('click', () => {
  setIncludeActive(!checkIncludeActive.checked);
  calculate();
});

checkIncludeActive?.addEventListener('change', calculate);

btnShowCalc?.addEventListener('click', () => {
  calcBreakdownOpen = !calcBreakdownOpen;
  calcBreakdown?.classList.toggle('hidden', !calcBreakdownOpen);
  btnShowCalc.classList.toggle('bg-blue-500/30', calcBreakdownOpen);
  btnShowCalc.classList.toggle('text-blue-200', calcBreakdownOpen);
});

// Allow editing numbers directly inside the Calc panel.
calcBreakdownContent?.addEventListener('input', (e) => {
  const target = e.target;
  if (!(target instanceof HTMLInputElement)) return;
  const bind = target.dataset.bind;
  if (!bind) return;

  const v = Number.parseInt(target.value || '0', 10) || 0;

  if (bind === 'fullPallets') {
    inputFullPallets.value = String(Math.max(0, Math.min(100, v)));
    rangeFullPallets.value = String(Math.max(0, Math.min(20, v)));
    inputFullPallets.dispatchEvent(new Event('input'));
    return;
  }

  if (bind === 'standardLayers') {
    setCountPair(inputLayersNum, inputLayers, v, LIMITS.layers);
    calculate();
    return;
  }

  if (bind === 'activeLayers') {
    setCountPair(inputActiveLayersNum, inputActiveLayers, v, LIMITS.layers);
    calculate();
    return;
  }

  if (bind === 'boxesPerLayer') {
    setCountPair(inputBoxesNum, inputBoxes, v, LIMITS.boxes);
    calculate();
    return;
  }

  if (bind === 'unitsPerBox') {
    const next = Math.max(1, Math.min(400, v));
    inputUnits.value = String(next);
    inputUnitsNum.value = String(next);
    inputUnits.dispatchEvent(new Event('input'));
    return;
  }

  if (bind === 'missingBoxes') {
    const next = Math.max(0, v);
    checkMissing.checked = next > 0;
    missingControlWrap.classList.toggle('opacity-40', !checkMissing.checked);
    missingControlWrap.classList.toggle('pointer-events-none', !checkMissing.checked);
    inputMissingCount.value = String(Math.max(1, Math.min(parseInt(inputMissingCount.max, 10) || 50, next || 1)));
    if (!checkMissing.checked) {
      inputMissingCount.value = '1';
    }
    calculate();
    return;
  }

  if (bind === 'partialUnits') {
    const next = Math.max(0, v);
    checkPartial.checked = next > 0;
    partialControlWrap.classList.toggle('opacity-40', !checkPartial.checked);
    partialControlWrap.classList.toggle('pointer-events-none', !checkPartial.checked);
    inputPartialUnits.value = String(Math.max(1, Math.min(parseInt(inputPartialUnits.max, 10) || 399, next || 1)));
    if (!checkPartial.checked) inputPartialUnits.value = '1';
    if (next > 0 && !checkIncludeActive.checked) setIncludeActive(true);
    calculate();
  }
});

async function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.remove('translate-y-12', 'opacity-0', 'pointer-events-none');
  setTimeout(() => {
    toast.classList.add('translate-y-12', 'opacity-0', 'pointer-events-none');
  }, 2500);
}

btnCopyReport.addEventListener('click', async () => {
  const mode = checkIncludeActive.checked ? 'Full + Active' : 'Full only';
  const textToCopy = `PALLET INVENTORY REPORT\nMode: ${mode}\nTotal Pallets: ${resTotalPallets.innerText}\nTotal Boxes: ${resTotalBoxes.innerText}\nTotal Units: ${resTotalUnits.innerText}`;
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

refreshIcons();
setIncludeActive(true);
init3D();
calculate();
setStep(1);
