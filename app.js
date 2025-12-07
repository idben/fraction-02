// 設定常數
const RECT_WIDTH = 800;
const RECT_HEIGHT = 400;
const HORIZONTAL_POINTS = 7; // 上下邊各7個點（切成8等分）
const VERTICAL_POINTS = 3;   // 左右邊各3個點（切成4等分）

// 動態取得圓點半徑（從 CSS 變數讀取）
function getPointRadius() {
  const pointDiameter = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--point-diameter'));
  return pointDiameter / 2;
}

// 狀態管理
const state = {
  verticalLines: new Set(),   // 儲存垂直線（上下連接）"index"
  horizontalLines: new Set(), // 儲存水平線（左右連接）"index"
  filledAreas: new Set(),     // 儲存已填色的區域
  selectedPoint: null,        // 當前選中的點
  regions: []                 // 分割後的所有區域
};

// DOM 元素
const canvas = document.querySelector('#fractionCanvas');
const mainRect = document.querySelector('#mainRect');
const pointsGroup = document.querySelector('#pointsGroup');
const linesGroup = document.querySelector('#linesGroup');
const fillGroup = document.querySelector('#fillGroup');
const showResultBtn = document.querySelector('#showResultBtn');
const resetBtn = document.querySelector('#resetBtn');
const resultDialog = document.querySelector('#resultDialog');
const warningDialog = document.querySelector('#warningDialog');
const closeDialogBtn = document.querySelector('#closeDialogBtn');
const closeWarningBtn = document.querySelector('#closeWarningBtn');

// 初始化
function init() {
  setupCanvas();
  createPoints();
  updateRegions();
  bindEvents();
}

// 設置畫布
function setupCanvas() {
  // 增加 viewBox 範圍以容納邊緣的點
  const pointRadius = getPointRadius();
  const padding = pointRadius * 2;
  canvas.setAttribute('viewBox', `-${padding} -${padding} ${RECT_WIDTH + padding * 2} ${RECT_HEIGHT + padding * 2}`);
  mainRect.setAttribute('x', 0);
  mainRect.setAttribute('y', 0);
  mainRect.setAttribute('width', RECT_WIDTH);
  mainRect.setAttribute('height', RECT_HEIGHT);
}

// 建立點位
function createPoints() {
  // 上邊的點（用於垂直線）
  for (let i = 0; i < HORIZONTAL_POINTS; i++) {
    createPoint('top', i);
  }

  // 下邊的點（用於垂直線）
  for (let i = 0; i < HORIZONTAL_POINTS; i++) {
    createPoint('bottom', i);
  }

  // 左邊的點（用於水平線）
  for (let i = 0; i < VERTICAL_POINTS; i++) {
    createPoint('left', i);
  }

  // 右邊的點（用於水平線）
  for (let i = 0; i < VERTICAL_POINTS; i++) {
    createPoint('right', i);
  }
}

// 建立單個點（使用圓形，但會被矩形遮住一半形成半圓效果）
function createPoint(side, index) {
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const pos = getPointPosition(side, index);
  const pointRadius = getPointRadius();

  circle.setAttribute('cx', pos.x);
  circle.setAttribute('cy', pos.y);
  circle.setAttribute('r', pointRadius);
  circle.setAttribute('class', 'point');
  circle.setAttribute('fill', '#4CAF50');
  circle.dataset.side = side;
  circle.dataset.index = index;

  circle.addEventListener('click', handlePointClick);

  pointsGroup.appendChild(circle);
}

// 計算點的位置
function getPointPosition(side, index) {
  if (side === 'top') {
    const x = (RECT_WIDTH / (HORIZONTAL_POINTS + 1)) * (index + 1);
    return { x, y: 0 };
  } else if (side === 'bottom') {
    const x = (RECT_WIDTH / (HORIZONTAL_POINTS + 1)) * (index + 1);
    return { x, y: RECT_HEIGHT };
  } else if (side === 'left') {
    const y = (RECT_HEIGHT / (VERTICAL_POINTS + 1)) * (index + 1);
    return { x: 0, y };
  } else if (side === 'right') {
    const y = (RECT_HEIGHT / (VERTICAL_POINTS + 1)) * (index + 1);
    return { x: RECT_WIDTH, y };
  }
}

// 處理點擊點位
function handlePointClick(event) {
  const clickedPoint = event.target;
  const side = clickedPoint.dataset.side;
  const index = parseInt(clickedPoint.dataset.index);

  // 如果沒有選中的點，這是第一個點
  if (!state.selectedPoint) {
    state.selectedPoint = { side, index, element: clickedPoint };
    clickedPoint.classList.add('active');
    highlightConnectablePoints(side, index);
  } else {
    // 檢查是否點擊同一個點（取消選擇）
    if (state.selectedPoint.element === clickedPoint) {
      clearPointSelection();
      return;
    }

    // 檢查是否可以連線
    if (canConnect(state.selectedPoint.side, side)) {
      const lineKey = createLine(state.selectedPoint, { side, index });

      // 檢查是否重複
      if (lineKey) {
        updateRegions();
        renderRegions();
      }
    }

    clearPointSelection();
  }
}

// 檢查兩個點是否可以連線
function canConnect(side1, side2) {
  return (side1 === 'top' && side2 === 'bottom') ||
         (side1 === 'bottom' && side2 === 'top') ||
         (side1 === 'left' && side2 === 'right') ||
         (side1 === 'right' && side2 === 'left');
}

// 建立線條（如果已存在則刪除）
function createLine(point1, point2) {
  let lineKey, isVertical;

  if (point1.side === 'top' || point1.side === 'bottom') {
    // 垂直線（上下連接）
    const topIndex = point1.side === 'top' ? point1.index : point2.index;
    const bottomIndex = point1.side === 'bottom' ? point1.index : point2.index;

    if (topIndex !== bottomIndex) return null; // 不同位置不能連線

    lineKey = `v-${topIndex}`;
    isVertical = true;

    // 檢查是否已存在，如果存在就刪除
    if (state.verticalLines.has(lineKey)) {
      deleteLine(lineKey);
      return null;
    }

    state.verticalLines.add(lineKey);
  } else {
    // 水平線（左右連接）
    const leftIndex = point1.side === 'left' ? point1.index : point2.index;
    const rightIndex = point1.side === 'right' ? point1.index : point2.index;

    if (leftIndex !== rightIndex) return null; // 不同位置不能連線

    lineKey = `h-${leftIndex}`;
    isVertical = false;

    // 檢查是否已存在，如果存在就刪除
    if (state.horizontalLines.has(lineKey)) {
      deleteLine(lineKey);
      return null;
    }

    state.horizontalLines.add(lineKey);
  }

  drawLine(point1, point2, lineKey, isVertical);
  return lineKey;
}

// 刪除線條（共用函數）
function deleteLine(lineKey) {
  // 從狀態中移除
  if (lineKey.startsWith('v-')) {
    state.verticalLines.delete(lineKey);
  } else if (lineKey.startsWith('h-')) {
    state.horizontalLines.delete(lineKey);
  }

  // 找到並移除 DOM 元素
  const lineElement = document.querySelector(`[data-line-key="${lineKey}"]`);
  if (lineElement) {
    lineElement.remove();
  }

  // 更新區域
  updateRegions();
  renderRegions();
}

// 繪製線條
function drawLine(point1, point2, lineKey, isHorizontal) {
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  const pos1 = getPointPosition(point1.side, point1.index);
  const pos2 = getPointPosition(point2.side, point2.index);

  line.setAttribute('x1', pos1.x);
  line.setAttribute('y1', pos1.y);
  line.setAttribute('x2', pos2.x);
  line.setAttribute('y2', pos2.y);
  line.setAttribute('class', 'division-line');
  line.dataset.lineKey = lineKey;

  line.addEventListener('click', handleLineClick);

  linesGroup.appendChild(line);
}

// 處理點擊線條（刪除）
function handleLineClick(event) {
  event.stopPropagation();
  const line = event.target;
  const lineKey = line.dataset.lineKey;

  deleteLine(lineKey);
}

// 高亮可連接的點
function highlightConnectablePoints(side, index) {
  const points = document.querySelectorAll('.point');
  points.forEach(point => {
    const pSide = point.dataset.side;
    const pIndex = parseInt(point.dataset.index);

    if (canConnect(side, pSide) && pIndex === index) {
      point.classList.add('highlighted');
    }
  });
}

// 清除點選狀態
function clearPointSelection() {
  if (state.selectedPoint) {
    state.selectedPoint.element.classList.remove('active');
    state.selectedPoint = null;
  }

  const points = document.querySelectorAll('.point');
  points.forEach(point => {
    point.classList.remove('highlighted');
  });
}

// 更新區域（計算所有分割區域）
function updateRegions() {
  // 垂直線產生 X 座標（左右分割）
  const xPositions = [0, RECT_WIDTH];
  state.verticalLines.forEach(lineKey => {
    const index = parseInt(lineKey.split('-')[1]);
    const x = (RECT_WIDTH / (HORIZONTAL_POINTS + 1)) * (index + 1);
    xPositions.push(x);
  });
  xPositions.sort((a, b) => a - b);

  // 水平線產生 Y 座標（上下分割）
  const yPositions = [0, RECT_HEIGHT];
  state.horizontalLines.forEach(lineKey => {
    const index = parseInt(lineKey.split('-')[1]);
    const y = (RECT_HEIGHT / (VERTICAL_POINTS + 1)) * (index + 1);
    yPositions.push(y);
  });
  yPositions.sort((a, b) => a - b);

  // 建立所有區域
  state.regions = [];
  for (let i = 0; i < xPositions.length - 1; i++) {
    for (let j = 0; j < yPositions.length - 1; j++) {
      state.regions.push({
        x: xPositions[i],
        y: yPositions[j],
        width: xPositions[i + 1] - xPositions[i],
        height: yPositions[j + 1] - yPositions[j],
        id: `region-${i}-${j}`
      });
    }
  }
}

// 渲染區域
function renderRegions() {
  // 清空填色區域
  fillGroup.innerHTML = '';

  // 重新建立所有區域
  state.regions.forEach(region => {
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', region.x);
    rect.setAttribute('y', region.y);
    rect.setAttribute('width', region.width);
    rect.setAttribute('height', region.height);
    rect.setAttribute('class', 'fill-area');
    rect.dataset.regionId = region.id;

    // 如果之前已填色，保持填色狀態
    if (state.filledAreas.has(region.id)) {
      rect.classList.add('filled');
    } else {
      rect.setAttribute('fill', 'transparent');
    }

    rect.addEventListener('click', handleRegionClick);

    fillGroup.appendChild(rect);
  });
}

// 處理點擊區域（填色/取消填色）
function handleRegionClick(event) {
  const rect = event.target;
  const regionId = rect.dataset.regionId;

  if (state.filledAreas.has(regionId)) {
    // 取消填色
    state.filledAreas.delete(regionId);
    rect.classList.remove('filled');
    rect.setAttribute('fill', 'transparent');
  } else {
    // 填色
    state.filledAreas.add(regionId);
    rect.classList.add('filled');
  }
}

// 計算最大公約數（用於化簡分數）
function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

// 化簡分數
function simplifyFraction(numerator, denominator) {
  const divisor = gcd(numerator, denominator);
  return {
    numerator: numerator / divisor,
    denominator: denominator / divisor
  };
}

// 顯示結果
function showResult() {
  const filledRegionsCount = state.filledAreas.size;

  // 檢查是否有填色
  if (filledRegionsCount === 0) {
    showWarning('請先填色後再計算結果！');
    return;
  }

  // 計算總面積和填色面積
  const totalArea = RECT_WIDTH * RECT_HEIGHT;
  let filledArea = 0;

  // 計算所有填色區域的面積
  state.regions.forEach(region => {
    if (state.filledAreas.has(region.id)) {
      filledArea += region.width * region.height;
    }
  });

  // 將面積轉換為分數（以總面積為分母）
  // 為了得到最簡分數，我們需要找到填色面積和總面積的比例
  // 使用四捨五入到最接近的整數比例
  const ratio = filledArea / totalArea;

  // 將比例轉換為分數
  // 找一個合適的分母來表示這個比例
  let numerator = Math.round(filledArea);
  let denominator = Math.round(totalArea);

  // 化簡分數
  const simplified = simplifyFraction(numerator, denominator);

  // 顯示結果
  const dialogBody = document.querySelector('#dialogBody');
  dialogBody.innerHTML = `
    <p><strong>填色區域：</strong>${filledRegionsCount} 個</p>
    <p><strong>總區域數：</strong>${state.regions.length} 個</p>
    <p><strong>填色面積：</strong>${Math.round(filledArea)} px²</p>
    <p><strong>總面積：</strong>${totalArea} px²</p>
    <p><strong>面積比例：</strong>${(ratio * 100).toFixed(2)}%</p>
    <p><strong>原始分數：</strong>${numerator}/${denominator}</p>
    <p><strong>化簡分數：</strong>${simplified.numerator}/${simplified.denominator}</p>
  `;

  resultDialog.showModal();
}

// 顯示警告
function showWarning(message) {
  const warningBody = document.querySelector('#warningBody');
  warningBody.textContent = message;
  warningDialog.showModal();
}

// 重置
function reset() {
  // 清除狀態
  state.horizontalLines.clear();
  state.verticalLines.clear();
  state.filledAreas.clear();
  state.selectedPoint = null;

  // 清除線條
  linesGroup.innerHTML = '';

  // 清除填色
  fillGroup.innerHTML = '';

  // 重置區域
  updateRegions();
  renderRegions();

  // 清除點的高亮
  clearPointSelection();
}

// 綁定事件
function bindEvents() {
  showResultBtn.addEventListener('click', showResult);
  resetBtn.addEventListener('click', reset);
  closeDialogBtn.addEventListener('click', () => resultDialog.close());
  closeWarningBtn.addEventListener('click', () => warningDialog.close());
}

// 啟動應用
init();
