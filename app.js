// 設定常數
const RECT_WIDTH = 800;
let RECT_HEIGHT = 400;
let HORIZONTAL_POINTS = 7; // 上下邊各N個點（切成N+1等分）
let VERTICAL_POINTS = 3;   // 左右邊各N個點（切成N+1等分）

// 題庫系統：根據分母定義可用的切分方式
// 格式: { horizontal: 橫向點數, vertical: 縱向點數 }
const QUESTION_BANK = {
  2: [
    { horizontal: 1, vertical: 1 },  // 2x2 = 4格，每2格=1/2
    { horizontal: 1, vertical: 0 },  // 只橫切，2格
    { horizontal: 0, vertical: 1 }   // 只縱切，2格
  ],
  3: [
    { horizontal: 2, vertical: 0 },  // 橫切3等分
    { horizontal: 0, vertical: 2 }   // 縱切3等分
  ],
  4: [
    { horizontal: 3, vertical: 0 },  // 橫切4等分
    { horizontal: 0, vertical: 3 },  // 縱切4等分
    { horizontal: 1, vertical: 1 },  // 2x2 = 4格
    { horizontal: 3, vertical: 1 },  // 4x2 = 8格（但分母是4）
    { horizontal: 1, vertical: 3 }   // 2x4 = 8格（但分母是4）
  ],
  5: [
    { horizontal: 4, vertical: 0 },  // 橫切5等分
    { horizontal: 0, vertical: 4 }   // 縱切5等分
  ],
  6: [
    { horizontal: 5, vertical: 0 },  // 橫切6等分
    { horizontal: 0, vertical: 5 },  // 縱切6等分
    { horizontal: 2, vertical: 1 },  // 3x2 = 6格
    { horizontal: 1, vertical: 2 }   // 2x3 = 6格
  ],
  7: [
    { horizontal: 6, vertical: 0 },  // 橫切7等分
    { horizontal: 0, vertical: 6 }   // 縱切7等分
  ],
  8: [
    { horizontal: 7, vertical: 0 },  // 橫切8等分
    { horizontal: 0, vertical: 7 },  // 縱切8等分
    { horizontal: 3, vertical: 1 },  // 4x2 = 8格
    { horizontal: 1, vertical: 3 },  // 2x4 = 8格
    { horizontal: 7, vertical: 1 },  // 8x2 = 16格（分母8）
    { horizontal: 7, vertical: 3 },  // 8x4 = 32格（分母8）
    { horizontal: 3, vertical: 7 },  // 4x8 = 32格（分母8）
    { horizontal: 3, vertical: 3 }   // 4x4 = 16格（分母8）
  ],
  9: [
    { horizontal: 8, vertical: 0 },  // 橫切9等分
    { horizontal: 0, vertical: 8 },  // 縱切9等分
    { horizontal: 2, vertical: 2 },  // 3x3 = 9格
    { horizontal: 8, vertical: 2 },  // 9x3 = 27格（分母9）
    { horizontal: 2, vertical: 8 }   // 3x9 = 27格（分母9）
  ],
  10: [
    { horizontal: 9, vertical: 0 },  // 橫切10等分
    { horizontal: 0, vertical: 9 },  // 縱切10等分
    { horizontal: 4, vertical: 1 },  // 5x2 = 10格
    { horizontal: 1, vertical: 4 }   // 2x5 = 10格
  ]
};

// 答題系統狀態
const gameState = {
  currentQuestion: 0,      // 當前題目索引 (0-9)
  score: 0,                // 當前得分
  totalQuestions: 10,      // 總題數
  questions: [],           // 生成的題目列表
  isRetry: false,          // 是否為重試（重試不給分）
  targetNumerator: 0,      // 目標分子
  targetDenominator: 0     // 目標分母
};

// 操作模式：'draw' 畫線, 'fill' 填色
let currentMode = 'draw';

// 根據切分配置計算合適的矩形高度（確保可整除）
function calculateRectHeight(config) {
  const verticalDivisions = config.vertical + 1;

  // 基礎高度 800，根據縱向分割調整
  let height = 800;

  // 如果縱向有分割，確保高度可被整除
  if (verticalDivisions > 1) {
    // 找一個接近 800 且可被 verticalDivisions 整除的數
    height = Math.round(800 / verticalDivisions) * verticalDivisions;
  }

  return height;
}

// 載入題目到畫布
function loadQuestion(questionIndex) {
  const question = gameState.questions[questionIndex];
  gameState.targetNumerator = question.numerator;
  gameState.targetDenominator = question.denominator;

  // 更新點位數量
  HORIZONTAL_POINTS = question.config.horizontal;
  VERTICAL_POINTS = question.config.vertical;

  // 更新矩形高度
  RECT_HEIGHT = calculateRectHeight(question.config);

  // 重置狀態
  state.horizontalLines.clear();
  state.verticalLines.clear();
  state.filledAreas.clear();
  state.selectedPoint = null;

  // 重繪畫布
  setupCanvas();
  pointsGroup.innerHTML = '';
  linesGroup.innerHTML = '';
  fillGroup.innerHTML = '';
  createPoints();
  updateRegions();
  renderRegions();
  renderFractionText();
}

// 生成一道題目
function generateQuestion() {
  // 隨機選擇分母 (2-10)
  const denominators = [2, 3, 4, 5, 6, 7, 8, 9, 10];
  const denominator = denominators[Math.floor(Math.random() * denominators.length)];

  // 隨機選擇分子 (1 到 分母-1)
  const numerator = Math.floor(Math.random() * (denominator - 1)) + 1;

  // 從題庫中隨機選擇切分方式
  const configs = QUESTION_BANK[denominator];
  const config = configs[Math.floor(Math.random() * configs.length)];

  return {
    numerator,
    denominator,
    config
  };
}

// 生成所有題目
function generateAllQuestions() {
  gameState.questions = [];
  for (let i = 0; i < gameState.totalQuestions; i++) {
    gameState.questions.push(generateQuestion());
  }
}

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
const fractionText = document.querySelector('#fractionText');
const checkAnswerBtn = document.querySelector('#checkAnswerBtn');
const resetBtn = document.querySelector('#resetBtn');
const scoreDisplay = document.querySelector('#scoreDisplay');
const modeRadios = document.querySelectorAll('input[name="mode"]');

// Dialog 元素
const questionDialog = document.querySelector('#questionDialog');
const correctDialog = document.querySelector('#correctDialog');
const wrongDialog = document.querySelector('#wrongDialog');
const demoDialog = document.querySelector('#demoDialog');
const victoryDialog = document.querySelector('#victoryDialog');
const warningDialog = document.querySelector('#warningDialog');

// 按鈕元素
const startQuestionBtn = document.querySelector('#startQuestionBtn');
const nextQuestionBtn = document.querySelector('#nextQuestionBtn');
const showDemoBtn = document.querySelector('#showDemoBtn');
const understoodBtn = document.querySelector('#understoodBtn');
const restartBtn = document.querySelector('#restartBtn');
const closeWarningBtn = document.querySelector('#closeWarningBtn');

// 音效元素
const correctSound = document.querySelector('#correctSound');
const wrongSound = document.querySelector('#wrongSound');
const victorySound = document.querySelector('#victorySound');


// 初始化
function init() {
  generateAllQuestions();
  bindEvents();
  updateModeClass(); // 設定初始模式 class
  startGame();
}

// 開始遊戲
function startGame() {
  gameState.currentQuestion = 0;
  gameState.score = 0;
  gameState.isRetry = false;
  updateScoreDisplay();
  showQuestionDialog();
}

// 顯示題目 dialog
function showQuestionDialog() {
  const question = gameState.questions[gameState.currentQuestion];
  const questionBody = document.querySelector('#questionBody');
  questionBody.innerHTML = `
    <p>小朋友，請把下面的分數塗上顏色喔！</p>
    <div class="question-fraction">${question.numerator}/${question.denominator}</div>
    <p>先畫線把矩形切分，再把正確的區域塗上顏色！</p>
  `;
  questionDialog.showModal();
}

// 更新分數顯示
function updateScoreDisplay() {
  scoreDisplay.textContent = `${gameState.score} 分`;
}

// 在矩形中央顯示分數文字
function renderFractionText() {
  const question = gameState.questions[gameState.currentQuestion];
  fractionText.textContent = `${question.numerator}/${question.denominator}`;
  fractionText.setAttribute('x', RECT_WIDTH / 2);
  fractionText.setAttribute('y', RECT_HEIGHT / 2);
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
  // 只有在畫線模式才能點擊點位
  if (currentMode !== 'draw') return;

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
  // 只有在填色模式才能填色
  if (currentMode !== 'fill') return;

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

  // 重置模式為畫線
  currentMode = 'draw';
  modeRadios.forEach(radio => {
    radio.checked = radio.value === 'draw';
  });
  updateModeClass();
}

// 綁定事件
function bindEvents() {
  checkAnswerBtn.addEventListener('click', checkAnswer);
  resetBtn.addEventListener('click', reset);
  startQuestionBtn.addEventListener('click', () => {
    questionDialog.close();
    loadQuestion(gameState.currentQuestion);
  });
  nextQuestionBtn.addEventListener('click', () => {
    correctDialog.close();
    goToNextQuestion();
  });
  showDemoBtn.addEventListener('click', () => {
    wrongDialog.close();
    showDemo();
  });
  understoodBtn.addEventListener('click', () => {
    demoDialog.close();
    // 重試：重新載入同一題
    gameState.isRetry = true;
    loadQuestion(gameState.currentQuestion);
  });
  restartBtn.addEventListener('click', () => {
    victoryDialog.close();
    generateAllQuestions();
    startGame();
  });
  closeWarningBtn.addEventListener('click', () => warningDialog.close());

  // 模式切換事件
  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentMode = e.target.value;
      updateModeClass();
      // 切換模式時清除點位選擇
      clearPointSelection();
    });
  });
}

// 更新 body 的模式 class
function updateModeClass() {
  document.body.classList.remove('mode-draw', 'mode-fill');
  document.body.classList.add(`mode-${currentMode}`);
}

// 檢查答案
function checkAnswer() {
  const filledCount = state.filledAreas.size;

  // 檢查是否有填色
  if (filledCount === 0) {
    showWarning('還沒有塗顏色喔！請先把正確的區域塗上顏色！');
    return;
  }

  // 計算填色面積比例
  const totalArea = RECT_WIDTH * RECT_HEIGHT;
  let filledArea = 0;

  state.regions.forEach(region => {
    if (state.filledAreas.has(region.id)) {
      filledArea += region.width * region.height;
    }
  });

  const filledRatio = filledArea / totalArea;
  const targetRatio = gameState.targetNumerator / gameState.targetDenominator;

  // 允許一點誤差（處理浮點數問題）
  const isCorrect = Math.abs(filledRatio - targetRatio) < 0.001;

  if (isCorrect) {
    handleCorrectAnswer();
  } else {
    handleWrongAnswer(filledRatio);
  }
}

// 處理答對
function handleCorrectAnswer() {
  correctSound.play();

  // 如果不是重試，加分
  if (!gameState.isRetry) {
    gameState.score += 10;
    updateScoreDisplay();
  }

  const correctBody = document.querySelector('#correctBody');
  const encouragements = [
    '你好棒喔！繼續加油！',
    '太厲害了！你是分數小達人！',
    '答對了！你真聰明！',
    '很好很好！再接再厲！',
    '哇！你做得太棒了！'
  ];
  const msg = encouragements[Math.floor(Math.random() * encouragements.length)];

  if (gameState.isRetry) {
    correctBody.innerHTML = `<p>${msg}</p><p style="color: #888; font-size: 0.9rem;">（重試不加分喔）</p>`;
  } else {
    correctBody.innerHTML = `<p>${msg}</p><p style="color: #4CAF50; font-weight: bold;">+10 分！</p>`;
  }

  // 檢查是否完成所有題目
  if (gameState.currentQuestion >= gameState.totalQuestions - 1) {
    nextQuestionBtn.textContent = '看看成績！';
  } else {
    nextQuestionBtn.textContent = '下一題';
  }

  correctDialog.showModal();
}

// 處理答錯
function handleWrongAnswer(filledRatio) {
  wrongSound.play();

  const wrongBody = document.querySelector('#wrongBody');
  const targetRatio = gameState.targetNumerator / gameState.targetDenominator;

  let hint = '';
  if (filledRatio > targetRatio) {
    hint = '塗太多了喔！';
  } else {
    hint = '塗得不夠喔！';
  }

  wrongBody.innerHTML = `
    <p>${hint}</p>
    <p>讓我來告訴你正確答案吧！</p>
  `;

  wrongDialog.showModal();
}

// 顯示示範
function showDemo() {
  const question = gameState.questions[gameState.currentQuestion];
  const demoCanvas = document.querySelector('#demoCanvas');

  // 建立示範用的 SVG，比例與實際矩形一致
  const demoWidth = 800;
  const demoHeight = calculateRectHeight(question.config);

  // 計算正確的切分方式
  const hDivisions = question.config.horizontal + 1; // 橫向分割數
  const vDivisions = question.config.vertical + 1;   // 縱向分割數
  const totalCells = hDivisions * vDivisions;
  const cellsToFill = Math.round((question.numerator / question.denominator) * totalCells);

  let svgContent = `
    <svg viewBox="0 0 ${demoWidth} ${demoHeight}" preserveAspectRatio="xMidYMid meet">
      <rect x="0" y="0" width="${demoWidth}" height="${demoHeight}" fill="white" stroke="#4CAF50" stroke-width="2"/>
  `;

  // 畫垂直線
  for (let i = 1; i < hDivisions; i++) {
    const x = (demoWidth / hDivisions) * i;
    svgContent += `<line x1="${x}" y1="0" x2="${x}" y2="${demoHeight}" stroke="#4CAF50" stroke-width="2"/>`;
  }

  // 畫水平線
  for (let i = 1; i < vDivisions; i++) {
    const y = (demoHeight / vDivisions) * i;
    svgContent += `<line x1="0" y1="${y}" x2="${demoWidth}" y2="${y}" stroke="#4CAF50" stroke-width="2"/>`;
  }

  // 填色正確的區域
  const cellWidth = demoWidth / hDivisions;
  const cellHeight = demoHeight / vDivisions;
  let filled = 0;

  for (let row = 0; row < vDivisions && filled < cellsToFill; row++) {
    for (let col = 0; col < hDivisions && filled < cellsToFill; col++) {
      const x = col * cellWidth;
      const y = row * cellHeight;
      svgContent += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="rgba(100, 149, 237, 0.4)" stroke="rgba(100, 149, 237, 0.6)" stroke-width="1"/>`;
      filled++;
    }
  }

  svgContent += '</svg>';
  demoCanvas.innerHTML = svgContent;

  const demoBody = document.querySelector('#demoBody');
  demoBody.innerHTML = `
    <p>正確的做法是這樣喔：</p>
    <p>先把矩形切成 <strong>${totalCells}</strong> 等分</p>
    <p>然後塗 <strong>${cellsToFill}</strong> 格，就是 <strong>${question.numerator}/${question.denominator}</strong> 囉！</p>
    ${demoCanvas.outerHTML}
  `;

  demoDialog.showModal();
}

// 進入下一題
function goToNextQuestion() {
  gameState.currentQuestion++;
  gameState.isRetry = false;

  // 切換回畫線模式
  currentMode = 'draw';
  modeRadios.forEach(radio => {
    radio.checked = radio.value === 'draw';
  });
  updateModeClass();

  if (gameState.currentQuestion >= gameState.totalQuestions) {
    showVictory();
  } else {
    showQuestionDialog();
  }
}

// 顯示勝利畫面
function showVictory() {
  const victoryBody = document.querySelector('#victoryBody');
  const victoryCharacter = document.querySelector('#victoryCharacter');
  const totalScore = gameState.score;

  let message = '';
  if (totalScore === 100) {
    // 滿分：播放勝利音效 + 顯示立繪
    victorySound.play();
    victoryCharacter.style.display = 'block';
    message = '滿分！你是分數小天才！🌟';
  } else {
    // 非滿分：不播放音效、不顯示立繪
    victoryCharacter.style.display = 'none';
    if (totalScore >= 80) {
      message = '非常棒！你對分數很有概念！';
    } else if (totalScore >= 60) {
      message = '不錯喔！再多練習會更厲害！';
    } else {
      message = '繼續加油！多練習就會進步！';
    }
  }

  victoryBody.innerHTML = `
    <p style="font-size: 2rem; color: #4CAF50; font-weight: bold;">${totalScore} 分</p>
    <p>${message}</p>
  `;

  victoryDialog.showModal();
}

// 播放音效
function playSound(sound) {
  sound.currentTime = 0;
  sound.play();
}

// 禁止手機拖曳（防止畫面滑動）
document.addEventListener('touchmove', function(e) {
  // 只在非 dialog 時禁止
  if (!e.target.closest('dialog')) {
    e.preventDefault();
  }
}, { passive: false });

// 啟動應用
init();
