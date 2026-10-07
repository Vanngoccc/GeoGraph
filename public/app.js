// GeoGraph - Trực quan hóa tri thức hình học phẳng
let allShapes = [];
let networkInstance = null;
let currentModalShape = null;
let currentFormulaType = 'Diện tích';
let currentRole = 'ALL';
let currentView = 'sandbox';

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

async function initApp() {
  await loadStatus();
  await loadShapesList();
  initGeometrySandbox();
  initGraph();
  loadProofSelects();
  loadCompareSelects();
  loadPendingCount();
}

// 1. Kiểm tra trạng thái hệ thống
async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    const banner = document.getElementById('systemModeText');
    if (banner) {
      banner.textContent = data.mode + ' (' + data.shapes_count + ' hình học)';
    }
  } catch (err) {
    console.log('Chưa kết nối API status:', err);
  }
}

// 2. Chuyển đổi giữa 3 chế độ xem chính
function switchView(view) {
  currentView = view;
  const sandboxWrap = document.getElementById('sandboxContainerWrapper');
  const graphWrap = document.getElementById('graphContainerWrapper');
  const cardsWrap = document.getElementById('cardsContainerWrapper');

  const btnSandbox = document.getElementById('btnViewSandbox');
  const btnGraph = document.getElementById('btnViewGraph');
  const btnCards = document.getElementById('btnViewCards');

  // Đặt lại style các nút tab
  const activeClass = 'px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-all bg-white shadow-sm';
  const inactiveClass = 'px-3.5 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all text-slate-600 hover:text-slate-900';

  sandboxWrap.classList.add('hidden');
  graphWrap.classList.add('hidden');
  cardsWrap.classList.add('hidden');

  btnSandbox.className = inactiveClass;
  btnGraph.className = inactiveClass;
  btnCards.className = inactiveClass;

  if (view === 'sandbox') {
    sandboxWrap.classList.remove('hidden');
    btnSandbox.className = activeClass + ' text-sky-600';
    setTimeout(drawGeometrySandbox, 50);
  } else if (view === 'graph') {
    graphWrap.classList.remove('hidden');
    btnGraph.className = activeClass + ' text-indigo-600';
    if (!networkInstance) {
      initGraph();
    } else {
      setTimeout(() => {
        networkInstance.setSize('100%', '580px');
        networkInstance.redraw();
        networkInstance.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      }, 100);
    }
  } else {
    cardsWrap.classList.remove('hidden');
    btnCards.className = activeClass + ' text-slate-800';
  }
}

// =====================================================================
// 3. XƯỞNG HÌNH HỌC TƯƠNG TÁC ĐỘNG (KÉO GÓC, KÉO CẠNH TRỰC TIẾP)
// =====================================================================

let geoPoints = {
  A: { x: 200, y: 80 },
  B: { x: 440, y: 80 },
  C: { x: 440, y: 320 },
  D: { x: 200, y: 320 }
};

let activeDragTarget = null; // 'A', 'B', 'C', 'D' hoặc cạnh 'AB', 'BC', 'CD', 'DA'
let dragStartMouse = { x: 0, y: 0 };
let dragStartPoints = null;

function initGeometrySandbox() {
  const svg = document.getElementById('geometrySvg');
  if (!svg) return;

  svg.onmousedown = handleSvgMouseDown;
  window.onmousemove = handleSvgMouseMove;
  window.onmouseup = handleSvgMouseUp;

  // Hỗ trợ cảm ứng điện thoại, máy tính bảng
  svg.ontouchstart = handleSvgTouchStart;
  window.ontouchmove = handleSvgTouchMove;
  window.ontouchend = handleSvgMouseUp;

  drawGeometrySandbox();
}

let isGridSnapEnabled = true;
let currentSnapStatusText = '';

function toggleGridSnap(enabled) {
  isGridSnapEnabled = enabled;
  drawGeometrySandbox();
}

function snapCoordVal(val, step = 10) {
  if (!isGridSnapEnabled) return val;
  return Math.round(val / step) * step;
}

function getSvgCoords(e) {
  const svg = document.getElementById('geometrySvg');
  const rect = svg.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  
  const scaleX = 640 / rect.width;
  const scaleY = 400 / rect.height;

  let x = Math.round((clientX - rect.left) * scaleX);
  let y = Math.round((clientY - rect.top) * scaleY);

  if (isGridSnapEnabled) {
    x = snapCoordVal(x, 10);
    y = snapCoordVal(y, 10);
  }

  return { x: Math.max(30, Math.min(610, x)), y: Math.max(30, Math.min(370, y)) };
}

function applyMagneticSnap(targetKey) {
  currentSnapStatusText = '';
  if (!isGridSnapEnabled || !targetKey || targetKey.length !== 1) return;

  const targetPt = geoPoints[targetKey];
  const pxToCm = 20;

  // 1. Hít dóng hàng ngang / hàng dọc với các đỉnh khác
  const otherKeys = ['A', 'B', 'C', 'D'].filter(k => k !== targetKey);
  
  for (const k of otherKeys) {
    if (Math.abs(targetPt.x - geoPoints[k].x) <= 10) {
      targetPt.x = geoPoints[k].x;
      currentSnapStatusText = `🧲 Hít thẳng hàng dọc với đỉnh ${k}`;
      break;
    }
  }

  for (const k of otherKeys) {
    if (Math.abs(targetPt.y - geoPoints[k].y) <= 10) {
      targetPt.y = geoPoints[k].y;
      currentSnapStatusText = `🧲 Hít thẳng hàng ngang với đỉnh ${k}`;
      break;
    }
  }

  // 2. Hít độ dài bằng nhau giữa các cạnh (Equal Length Magnetic Snap)
  const getLen = (p1Key, p2Key) => {
    const p1 = geoPoints[p1Key];
    const p2 = geoPoints[p2Key];
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  };

  const adjEdges = {
    'A': [['A', 'B'], ['D', 'A']],
    'B': [['A', 'B'], ['B', 'C']],
    'C': [['B', 'C'], ['C', 'D']],
    'D': [['C', 'D'], ['D', 'A']]
  }[targetKey];

  const oppEdge = {
    'A': ['B', 'C'],
    'B': ['C', 'D'],
    'C': ['D', 'A'],
    'D': ['A', 'B']
  }[targetKey];

  const oppLen = getLen(oppEdge[0], oppEdge[1]);
  for (const [e1, e2] of adjEdges) {
    const l1 = getLen(e1, e2);
    if (Math.abs(l1 - oppLen) <= 12 && Math.abs(l1 - oppLen) > 0.1) {
      const fixedPt = (e1 === targetKey) ? geoPoints[e2] : geoPoints[e1];
      const curDist = Math.hypot(targetPt.x - fixedPt.x, targetPt.y - fixedPt.y);
      if (curDist > 0) {
        const uX = (targetPt.x - fixedPt.x) / curDist;
        const uY = (targetPt.y - fixedPt.y) / curDist;
        targetPt.x = Math.round(fixedPt.x + uX * oppLen);
        targetPt.y = Math.round(fixedPt.y + uY * oppLen);
        currentSnapStatusText = `🧲 Hít bằng độ dài cạnh đối ${(oppLen / pxToCm).toFixed(1)} cm`;
        break;
      }
    }
  }
}

function handleSvgMouseDown(e) {
  const coords = getSvgCoords(e);
  dragStartMouse = coords;
  dragStartPoints = JSON.parse(JSON.stringify(geoPoints));

  // 1. Kiểm tra nhấp trúng đỉnh (ưu tiên bán kính bắt điểm rộng 24px)
  for (const key of ['A', 'B', 'C', 'D']) {
    const pt = geoPoints[key];
    const dist = Math.hypot(pt.x - coords.x, pt.y - coords.y);
    if (dist <= 24) {
      activeDragTarget = key;
      return;
    }
  }

  // 2. Kiểm tra nhấp trúng cạnh
  const edges = [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']];
  for (const [p1, p2] of edges) {
    if (isPointNearSegment(coords, geoPoints[p1], geoPoints[p2], 16)) {
      activeDragTarget = p1 + p2;
      return;
    }
  }
}

function handleSvgTouchStart(e) {
  handleSvgMouseDown(e);
  if (activeDragTarget) e.preventDefault();
}

function handleSvgMouseMove(e) {
  const coords = getSvgCoords(e);
  const coordsLabel = document.getElementById('canvasCoordsText');

  if (!activeDragTarget) {
    if (coordsLabel) coordsLabel.textContent = `Tọa độ con trỏ: (${coords.x}, ${coords.y})`;
    return;
  }

  const dx = coords.x - dragStartMouse.x;
  const dy = coords.y - dragStartMouse.y;

  if (activeDragTarget.length === 1) {
    // Kéo 1 đỉnh
    geoPoints[activeDragTarget].x = Math.max(30, Math.min(610, dragStartPoints[activeDragTarget].x + dx));
    geoPoints[activeDragTarget].y = Math.max(30, Math.min(370, dragStartPoints[activeDragTarget].y + dy));

    // Bắt điểm từ tính thông minh (Hít bằng nhau, hít dóng hàng)
    applyMagneticSnap(activeDragTarget);
  } else if (activeDragTarget.length === 2) {
    // Kéo 1 cạnh (tịnh tiến cả 2 đỉnh)
    const p1 = activeDragTarget[0];
    const p2 = activeDragTarget[1];
    geoPoints[p1].x = Math.max(30, Math.min(610, dragStartPoints[p1].x + dx));
    geoPoints[p1].y = Math.max(30, Math.min(370, dragStartPoints[p1].y + dy));
    geoPoints[p2].x = Math.max(30, Math.min(610, dragStartPoints[p2].x + dx));
    geoPoints[p2].y = Math.max(30, Math.min(370, dragStartPoints[p2].y + dy));
  }

  if (coordsLabel) {
    coordsLabel.textContent = currentSnapStatusText || `Tọa độ con trỏ: (${coords.x}, ${coords.y})`;
  }

  drawGeometrySandbox();
}

function handleSvgTouchMove(e) {
  if (activeDragTarget) {
    handleSvgMouseMove(e);
    e.preventDefault();
  }
}

function handleSvgMouseUp() {
  activeDragTarget = null;
  dragStartPoints = null;
}

function isPointNearSegment(p, a, b, maxDist) {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
  if (l2 === 0) return Math.hypot(p.x - a.x, p.y - a.y) <= maxDist;
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  const projX = a.x + t * (b.x - a.x);
  const projY = a.y + t * (b.y - a.y);
  return Math.hypot(p.x - projX, p.y - projY) <= maxDist;
}

function snapToPreset(type) {
  if (type === 'SQUARE') {
    geoPoints = { A: { x: 200, y: 80 }, B: { x: 440, y: 80 }, C: { x: 440, y: 320 }, D: { x: 200, y: 320 } };
  } else if (type === 'RECTANGLE') {
    geoPoints = { A: { x: 140, y: 110 }, B: { x: 500, y: 110 }, C: { x: 500, y: 290 }, D: { x: 140, y: 290 } };
  } else if (type === 'RHOMBUS') {
    geoPoints = { A: { x: 320, y: 80 }, B: { x: 480, y: 200 }, C: { x: 320, y: 320 }, D: { x: 160, y: 200 } };
  } else if (type === 'PARALLELOGRAM') {
    geoPoints = { A: { x: 200, y: 100 }, B: { x: 440, y: 100 }, C: { x: 380, y: 260 }, D: { x: 140, y: 260 } };
  } else if (type === 'ISOSCELES_TRAPEZOID') {
    geoPoints = { A: { x: 220, y: 100 }, B: { x: 420, y: 100 }, C: { x: 500, y: 260 }, D: { x: 140, y: 260 } };
  } else if (type === 'RIGHT_TRAPEZOID') {
    geoPoints = { A: { x: 180, y: 100 }, B: { x: 420, y: 100 }, C: { x: 500, y: 260 }, D: { x: 180, y: 260 } };
  } else if (type === 'FREE') {
    geoPoints = { A: { x: 160, y: 90 }, B: { x: 470, y: 120 }, C: { x: 430, y: 320 }, D: { x: 190, y: 300 } };
  }
  drawGeometrySandbox();
}


// =====================================================================
// GIẢI THUẬT KIỂM TRA HÌNH HỌC: TỰ CẮT, TÍNH LỒI & GỠ CHÉO CẠNH
// =====================================================================

function checkSegmentsIntersect(p1, p2, p3, p4) {
  function ccw(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }

  const cp1 = ccw(p1, p2, p3);
  const cp2 = ccw(p1, p2, p4);
  const cp3 = ccw(p3, p4, p1);
  const cp4 = ccw(p3, p4, p2);

  const str1 = ((cp1 > 1e-4 && cp2 < -1e-4) || (cp1 < -1e-4 && cp2 > 1e-4));
  const str2 = ((cp3 > 1e-4 && cp4 < -1e-4) || (cp3 < -1e-4 && cp4 > 1e-4));

  if (str1 && str2) {
    const a1 = p2.y - p1.y;
    const b1 = p1.x - p2.x;
    const c1 = a1 * p1.x + b1 * p1.y;

    const a2 = p4.y - p3.y;
    const b2 = p3.x - p4.x;
    const c2 = a2 * p3.x + b2 * p3.y;

    const det = a1 * b2 - a2 * b1;
    if (Math.abs(det) > 1e-4) {
      const ix = (b2 * c1 - b1 * c2) / det;
      const iy = (a1 * c2 - a2 * c1) / det;
      return { intersects: true, point: { x: Math.round(ix), y: Math.round(iy) } };
    }
    return { intersects: true, point: null };
  }
  return { intersects: false, point: null };
}

function checkIsConvex(A, B, C, D) {
  function ccw(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  }
  const z1 = ccw(D, A, B);
  const z2 = ccw(A, B, C);
  const z3 = ccw(B, C, D);
  const z4 = ccw(C, D, A);

  const allPos = (z1 > 1e-4 && z2 > 1e-4 && z3 > 1e-4 && z4 > 1e-4);
  const allNeg = (z1 < -1e-4 && z2 < -1e-4 && z3 < -1e-4 && z4 < -1e-4);
  return allPos || allNeg;
}

function autoUntangleGeometry() {
  const A = geoPoints.A, B = geoPoints.B, C = geoPoints.C, D = geoPoints.D;
  const intersectAB_CD = checkSegmentsIntersect(A, B, C, D);
  const intersectBC_DA = checkSegmentsIntersect(B, C, D, A);
  const isSelfIntersecting = intersectAB_CD.intersects || intersectBC_DA.intersects;

  // BƯỚC 1: NẾU BỊ TỰ CẮT (CHÉO CẠNH), SẮP XẾP LẠI THEO THỨ TỰ VÒNG CHU VI
  if (isSelfIntersecting) {
    const pts = [
      { key: 'A', x: geoPoints.A.x, y: geoPoints.A.y },
      { key: 'B', x: geoPoints.B.x, y: geoPoints.B.y },
      { key: 'C', x: geoPoints.C.x, y: geoPoints.C.y },
      { key: 'D', x: geoPoints.D.x, y: geoPoints.D.y }
    ];

    const cx = (pts[0].x + pts[1].x + pts[2].x + pts[3].x) / 4;
    const cy = (pts[0].y + pts[1].y + pts[2].y + pts[3].y) / 4;

    pts.forEach(p => {
      p.angle = Math.atan2(p.y - cy, p.x - cx);
    });

    pts.sort((a, b) => a.angle - b.angle);

    let bestIdx = 0;
    let minDiff = 999999;
    pts.forEach((p, idx) => {
      const diff = Math.hypot(p.x - (cx - 100), p.y - (cy - 100));
      if (diff < minDiff) {
        minDiff = diff;
        bestIdx = idx;
      }
    });

    const ordered = [];
    for (let i = 0; i < 4; i++) {
      ordered.push(pts[(bestIdx + i) % 4]);
    }

    geoPoints.A = { x: ordered[0].x, y: ordered[0].y };
    geoPoints.B = { x: ordered[1].x, y: ordered[1].y };
    geoPoints.C = { x: ordered[2].x, y: ordered[2].y };
    geoPoints.D = { x: ordered[3].x, y: ordered[3].y };
  }

  // BƯỚC 2: NẾU LÀ TỨ GIÁC LÕM (CÓ ĐỈNH BỊ THỤT VÀO TRONG), ĐẨY ĐỈNH ĐÓ RA NGOÀI ĐỂ THÀNH TỨ GIÁC LỒI
  if (!checkIsConvex(geoPoints.A, geoPoints.B, geoPoints.C, geoPoints.D)) {
    const pts = geoPoints;
    const order = ['A', 'B', 'C', 'D'];
    const z = {};

    function ccw(a, b, c) {
      return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
    }

    for (let i = 0; i < 4; i++) {
      const pPrev = pts[order[(i - 1 + 4) % 4]];
      const pCurr = pts[order[i]];
      const pNext = pts[order[(i + 1) % 4]];
      z[order[i]] = ccw(pPrev, pCurr, pNext);
    }

    const posCount = order.filter(k => z[k] > 1e-4).length;
    const negCount = order.filter(k => z[k] < -1e-4).length;

    let concaveKey = null;
    if (posCount === 3 && negCount === 1) {
      concaveKey = order.find(k => z[k] < -1e-4);
    } else if (negCount === 3 && posCount === 1) {
      concaveKey = order.find(k => z[k] > 1e-4);
    }

    if (concaveKey) {
      const idx = order.indexOf(concaveKey);
      const pPrev = pts[order[(idx - 1 + 4) % 4]];
      const pNext = pts[order[(idx + 1) % 4]];
      const pOpp = pts[order[(idx + 2) % 4]];

      // Phản xạ đẩy đỉnh lõm ra ngoài bằng phép bù hình bình hành
      let newX = Math.round(pPrev.x + pNext.x - pOpp.x);
      let newY = Math.round(pPrev.y + pNext.y - pOpp.y);

      // Giới hạn trong bảng vẽ [40, 600] và [40, 360]
      newX = Math.max(40, Math.min(600, newX));
      newY = Math.max(40, Math.min(360, newY));

      pts[concaveKey].x = newX;
      pts[concaveKey].y = newY;
    }

    // Nếu vẫn chưa lồi (do quá sát biên hoặc suy biến), đặt về mẫu tứ giác tự do lồi đẹp
    if (!checkIsConvex(geoPoints.A, geoPoints.B, geoPoints.C, geoPoints.D)) {
      snapToPreset('FREE');
      return;
    }
  }

  drawGeometrySandbox();
}

// Vẽ xưởng hình học và tính toán thời gian thực
function drawGeometrySandbox() {
  const svg = document.getElementById('geometrySvg');
  if (!svg) return;

  const showDiagonals = document.getElementById('chkShowDiagonals').checked;
  const showAngles = document.getElementById('chkShowAngles').checked;

  const A = geoPoints.A, B = geoPoints.B, C = geoPoints.C, D = geoPoints.D;
  const pxToCm = 20; // 20 điểm ảnh = 1 cm

  // Tính độ dài các cạnh
  const dAB = Math.hypot(B.x - A.x, B.y - A.y) / pxToCm;
  const dBC = Math.hypot(C.x - B.x, C.y - B.y) / pxToCm;
  const dCD = Math.hypot(D.x - C.x, D.y - C.y) / pxToCm;
  const dDA = Math.hypot(A.x - D.x, A.y - D.y) / pxToCm;

  // Tính độ dài 2 đường chéo
  const dAC = Math.hypot(C.x - A.x, C.y - A.y) / pxToCm;
  const dBD = Math.hypot(D.x - B.x, D.y - B.y) / pxToCm;

  // Tính góc tại mỗi đỉnh (tính theo độ)
  const angleA = calculateInteriorAngle(D, A, B);
  const angleB = calculateInteriorAngle(A, B, C);
  const angleC = calculateInteriorAngle(B, C, D);
  const angleD = calculateInteriorAngle(C, D, A);

  // Cập nhật số liệu hiển thị vào các ô nhập liệu (nếu người dùng không đang gõ)
  const activeId = document.activeElement ? document.activeElement.id : null;

  const setInputValue = (id, val) => {
    const el = document.getElementById(id);
    if (el && activeId !== id) el.value = val;
  };

  const setTextValue = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setInputValue('input_side_ab', dAB.toFixed(1));
  setInputValue('input_side_bc', dBC.toFixed(1));
  setInputValue('input_side_cd', dCD.toFixed(1));
  setInputValue('input_side_da', dDA.toFixed(1));

  setInputValue('input_angle_a', Math.round(angleA));
  setInputValue('input_angle_b', Math.round(angleB));
  setInputValue('input_angle_c', Math.round(angleC));
  setInputValue('input_angle_d', Math.round(angleD));

  setTextValue('stat_diag_ac', dAC.toFixed(1) + ' cm');
  setTextValue('stat_diag_bd', dBD.toFixed(1) + ' cm');

  // Kiểm tra giao cắt cạnh (tự cắt / cánh bướm)
  const intersectAB_CD = checkSegmentsIntersect(A, B, C, D);
  const intersectBC_DA = checkSegmentsIntersect(B, C, D, A);
  const isSelfIntersecting = intersectAB_CD.intersects || intersectBC_DA.intersects;
  const isConvexQuad = !isSelfIntersecting && checkIsConvex(A, B, C, D);

  const sumAngleEl = document.getElementById('labelAngleSum');
  if (sumAngleEl) {
    if (isSelfIntersecting) {
      sumAngleEl.textContent = 'Tổng góc không hợp lệ (tự cắt)';
      sumAngleEl.className = 'text-[10px] text-rose-500 font-bold';
    } else if (!isConvexQuad) {
      sumAngleEl.textContent = 'Góc tứ giác lõm';
      sumAngleEl.className = 'text-[10px] text-amber-500 font-bold';
    } else {
      sumAngleEl.textContent = 'Tổng góc = 360°';
      sumAngleEl.className = 'text-[10px] text-slate-400 font-normal';
    }
  }

  // Hiển thị hoặc ẩn nút gỡ chéo cạnh hoặc nắn lồi trên thanh công cụ
  const btnUntangle = document.getElementById('btnToolbarUntangle');
  if (btnUntangle) {
    if (isSelfIntersecting) {
      btnUntangle.classList.remove('hidden');
      btnUntangle.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i><span>Gỡ chéo cạnh</span>';
      btnUntangle.title = 'Tự động sắp xếp lại các đỉnh để gỡ chéo cạnh';
    } else if (!isConvexQuad) {
      btnUntangle.classList.remove('hidden');
      btnUntangle.innerHTML = '<i class="fa-solid fa-rotate-right mr-1"></i><span>Nắn thành tứ giác lồi</span>';
      btnUntangle.title = 'Tự động đẩy đỉnh lõm ra ngoài để tạo tứ giác lồi';
    } else {
      btnUntangle.classList.add('hidden');
    }
  }

  // Nhận diện hình dạng thời gian thực
  classifyAndDisplayShape(dAB, dBC, dCD, dDA, angleA, angleB, angleC, angleD, dAC, dBD, A, B, C, D, isSelfIntersecting, isConvexQuad, intersectAB_CD, intersectBC_DA);

  // Xây dựng các phần tử SVG
  let svgContent = '';

  // Lưới ô vuông mờ
  svgContent += `
    <defs>
      <pattern id="gridPattern" width="20" height="20" patternUnits="userSpaceOnUse">
        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
      </pattern>
    </defs>
    <rect width="640" height="400" fill="url(#gridPattern)"/>
  `;

  // Hai đường chéo AC và BD
  if (showDiagonals) {
    svgContent += `
      <line x1="${A.x}" y1="${A.y}" x2="${C.x}" y2="${C.y}" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="2"/>
      <line x1="${B.x}" y1="${B.y}" x2="${D.x}" y2="${D.y}" stroke="#94a3b8" stroke-dasharray="5,5" stroke-width="2"/>
    `;
  }

  // Đa giác tô màu mờ (đổi màu cảnh báo nếu tự cắt hoặc lõm)
  let polyFill = 'rgba(56, 189, 248, 0.18)';
  let polyStroke = 'rgba(56, 189, 248, 0.5)';
  if (isSelfIntersecting) {
    polyFill = 'rgba(244, 63, 94, 0.16)';
    polyStroke = 'rgba(244, 63, 94, 0.6)';
  } else if (!isConvexQuad) {
    polyFill = 'rgba(245, 158, 11, 0.15)';
    polyStroke = 'rgba(245, 158, 11, 0.6)';
  }

  svgContent += `
    <polygon points="${A.x},${A.y} ${B.x},${B.y} ${C.x},${C.y} ${D.x},${D.y}" 
             fill="${polyFill}" stroke="${polyStroke}" stroke-width="2"/>
  `;

  // Nếu tự cắt: vẽ điểm cắt vi phạm định nghĩa SGK
  const interPt = intersectAB_CD.intersects ? intersectAB_CD.point : (intersectBC_DA.intersects ? intersectBC_DA.point : null);
  if (interPt) {
    svgContent += `
      <g>
        <circle cx="${interPt.x}" cy="${interPt.y}" r="18" fill="rgba(239, 68, 68, 0.25)" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3"/>
        <circle cx="${interPt.x}" cy="${interPt.y}" r="6.5" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
        <rect x="${interPt.x - 70}" y="${interPt.y - 30}" width="140" height="22" rx="7" fill="#881337" stroke="#f43f5e" stroke-width="1.2" opacity="0.95"/>
        <text x="${interPt.x}" y="${interPt.y - 15}" fill="#ffffff" font-size="10.5" font-family="sans-serif" font-weight="bold" text-anchor="middle">Điểm cắt vi phạm SGK</text>
      </g>
    `;
  }

  // Cung góc và ký hiệu góc vuông
  if (showAngles) {
    svgContent += drawAngleSymbol(D, A, B, angleA, 'A');
    svgContent += drawAngleSymbol(A, B, C, angleB, 'B');
    svgContent += drawAngleSymbol(B, C, D, angleC, 'C');
    svgContent += drawAngleSymbol(C, D, A, angleD, 'D');
  }

  // Vẽ 4 cạnh tương tác
  const edgeList = [
    { p1: A, p2: B, name: 'AB', len: dAB },
    { p1: B, p2: C, name: 'BC', len: dBC },
    { p1: C, p2: D, name: 'CD', len: dCD },
    { p1: D, p2: A, name: 'DA', len: dDA }
  ];

  edgeList.forEach(e => {
    const isCrossing = (
      (intersectAB_CD.intersects && (e.name === 'AB' || e.name === 'CD')) ||
      (intersectBC_DA.intersects && (e.name === 'BC' || e.name === 'DA'))
    );
    const strokeCol = isCrossing ? '#f43f5e' : (!isConvexQuad ? '#f59e0b' : '#38bdf8');
    const badgeStroke = isCrossing ? '#f43f5e' : (!isConvexQuad ? '#f59e0b' : '#38bdf8');

    // Vùng chạm bắt điểm rộng
    svgContent += `
      <line x1="${e.p1.x}" y1="${e.p1.y}" x2="${e.p2.x}" y2="${e.p2.y}" 
            stroke="transparent" stroke-width="24" class="cursor-grab"/>
    `;
    // Cạnh hiển thị sắc nét
    svgContent += `
      <line x1="${e.p1.x}" y1="${e.p1.y}" x2="${e.p2.x}" y2="${e.p2.y}" 
            stroke="${strokeCol}" stroke-width="${isCrossing ? 5.5 : 4.5}" stroke-linecap="round"/>
    `;
    // Nhãn độ dài cạnh ở trung điểm
    const mx = (e.p1.x + e.p2.x) / 2;
    const my = (e.p1.y + e.p2.y) / 2;
    svgContent += `
      <rect x="${mx - 24}" y="${my - 11}" width="48" height="22" rx="7" fill="#0f172a" stroke="${badgeStroke}" stroke-width="1" opacity="0.9"/>
      <text x="${mx}" y="${my + 4}" fill="#f8fafc" font-size="11" font-family="monospace" text-anchor="middle" font-weight="bold">${e.len.toFixed(1)} cm</text>
    `;
  });

  // Vẽ 4 đỉnh A, B, C, D (có vòng hào quang kéo thả)
  const vertexList = [
    { pt: A, label: 'A', color: '#6366f1' },
    { pt: B, label: 'B', color: '#0ea5e9' },
    { pt: C, label: 'C', color: '#10b981' },
    { pt: D, label: 'D', color: '#f59e0b' }
  ];

  vertexList.forEach(v => {
    svgContent += `
      <!-- Vòng hào quang bắt điểm -->
      <circle cx="${v.pt.x}" cy="${v.pt.y}" r="22" fill="transparent" class="cursor-pointer"/>
      <circle cx="${v.pt.x}" cy="${v.pt.y}" r="14" fill="${v.color}" opacity="0.25"/>
      <circle cx="${v.pt.x}" cy="${v.pt.y}" r="9" fill="${v.color}" stroke="#ffffff" stroke-width="2.5" class="cursor-pointer shadow-lg"/>
      <text x="${v.pt.x}" y="${v.pt.y - 14}" fill="#ffffff" font-size="14" font-family="Quicksand, sans-serif" font-weight="bold" text-anchor="middle">${v.label}</text>
    `;
  });

  svg.innerHTML = svgContent;
}

function calculateInteriorAngle(pPrev, pCurr, pNext) {
  const v1 = { x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y };
  const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };

  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.hypot(v1.x, v1.y);
  const mag2 = Math.hypot(v2.x, v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;

  let cosVal = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return Math.acos(cosVal) * (180 / Math.PI);
}

function drawAngleSymbol(pPrev, pCurr, pNext, angleDeg, vertexLabel) {
  // Nếu góc gần bằng 90 độ (87 - 93 độ): vẽ ký hiệu góc vuông màu vàng
  if (Math.abs(angleDeg - 90) <= 3) {
    const size = 16;
    const v1 = { x: pPrev.x - pCurr.x, y: pPrev.y - pCurr.y };
    const v2 = { x: pNext.x - pCurr.x, y: pNext.y - pCurr.y };
    const m1 = Math.hypot(v1.x, v1.y) || 1;
    const m2 = Math.hypot(v2.x, v2.y) || 1;
    const u1 = { x: (v1.x / m1) * size, y: (v1.y / m1) * size };
    const u2 = { x: (v2.x / m2) * size, y: (v2.y / m2) * size };

    const c1 = { x: pCurr.x + u1.x, y: pCurr.y + u1.y };
    const c2 = { x: pCurr.x + u1.x + u2.x, y: pCurr.y + u1.y + u2.y };
    const c3 = { x: pCurr.x + u2.x, y: pCurr.y + u2.y };

    return `
      <polyline points="${c1.x},${c1.y} ${c2.x},${c2.y} ${c3.x},${c3.y}" fill="none" stroke="#f59e0b" stroke-width="2.5"/>
      <circle cx="${pCurr.x + (u1.x + u2.x) * 0.5}" cy="${pCurr.y + (u1.y + u2.y) * 0.5}" r="2" fill="#f59e0b"/>
    `;
  }

  // Vẽ cung tròn góc
  const r = 20;
  const a1 = Math.atan2(pPrev.y - pCurr.y, pPrev.x - pCurr.x);
  const a2 = Math.atan2(pNext.y - pCurr.y, pNext.x - pCurr.x);
  const x1 = pCurr.x + r * Math.cos(a1);
  const y1 = pCurr.y + r * Math.sin(a1);
  const x2 = pCurr.x + r * Math.cos(a2);
  const y2 = pCurr.y + r * Math.sin(a2);

  return `
    <path d="M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}" fill="none" stroke="rgba(245,158,11,0.7)" stroke-width="2"/>
    <text x="${pCurr.x + 30 * Math.cos((a1 + a2) / 2)}" y="${pCurr.y + 30 * Math.sin((a1 + a2) / 2)}" fill="#fcd34d" font-size="10" font-family="monospace" font-weight="bold">${Math.round(angleDeg)}°</text>
  `;
}

// Nhận diện định lý hình học và giải thích
function classifyAndDisplayShape(dAB, dBC, dCD, dDA, aA, aB, aC, aD, dAC, dBD, A, B, C, D, isSelfIntersecting, isConvexQuad, intersectAB_CD, intersectBC_DA) {
  // Nếu chưa truyền vào tham số kiểm tra thì tự tính
  if (typeof isSelfIntersecting === 'undefined') {
    intersectAB_CD = checkSegmentsIntersect(A, B, C, D);
    intersectBC_DA = checkSegmentsIntersect(B, C, D, A);
    isSelfIntersecting = intersectAB_CD.intersects || intersectBC_DA.intersects;
    isConvexQuad = !isSelfIntersecting && checkIsConvex(A, B, C, D);
  }

  const epsLen = 0.5; // Dung sai độ dài (cm)
  const epsAngle = 4; // Dung sai góc (độ)

  let shapeName = 'Tứ giác thường';
  let reason = 'Tứ giác có 4 đỉnh và 4 cạnh khép kín, chưa thỏa mãn điều kiện song song hay góc vuông.';
  let matchedId = 'SHAPE_CONVEX_QUAD';
  let statusBadgeType = 'VALID'; // 'VALID', 'INVALID_CROSS', 'CONCAVE'

  if (isSelfIntersecting) {
    shapeName = 'Tứ giác tự cắt (Cạnh bắt chéo)';
    const pairName = (intersectAB_CD && intersectAB_CD.intersects) ? 'AB và CD' : 'BC và DA';
    reason = `Hai cạnh đối ${pairName} đang cắt chéo nhau (hình cánh bướm). Theo định nghĩa SGK Toán 8 (Chương 3 - Bài 1), tứ giác gồm 4 đoạn thẳng khép kín và không có 2 đoạn thẳng nào cắt nhau ngoài các đầu mút chung. Do đó hình này vi phạm định nghĩa và không được công nhận là một tứ giác.`;
    matchedId = 'SHAPE_SELF_INTERSECTING';
    statusBadgeType = 'INVALID_CROSS';
  } else if (!isConvexQuad) {
    shapeName = 'Tứ giác lõm (Phi lồi)';
    reason = 'Tứ giác có 1 góc trong lớn hơn 180° (đỉnh bị thụt vào trong). Theo quy ước SGK Toán 8: "Khi nói đến tứ giác mà không chú thích gì thêm, ta hiểu đó là tứ giác lồi". Do đó tứ giác lõm không thuộc phạm vi nghiên cứu các định lý phổ thông.';
    matchedId = 'SHAPE_CONCAVE_QUAD';
    statusBadgeType = 'CONCAVE';
  } else {
    // TỨ GIÁC LỒI HỢP LỆ -> XÉT TIẾP ĐỊNH LÝ CÁC HÌNH ĐẶC BIỆT
    const isRightA = Math.abs(aA - 90) <= epsAngle;
    const isRightB = Math.abs(aB - 90) <= epsAngle;
    const isRightC = Math.abs(aC - 90) <= epsAngle;
    const isRightD = Math.abs(aD - 90) <= epsAngle;
    const hasFourRightAngles = isRightA && isRightB && isRightC && isRightD;
    const hasAtLeastOneRight = isRightA || isRightB || isRightC || isRightD;

    const allSidesEqual = (
      Math.abs(dAB - dBC) <= epsLen &&
      Math.abs(dBC - dCD) <= epsLen &&
      Math.abs(dCD - dDA) <= epsLen
    );

    const oppSidesEqual = (
      Math.abs(dAB - dCD) <= epsLen &&
      Math.abs(dBC - dDA) <= epsLen
    );

    const diagonalsEqual = Math.abs(dAC - dBD) <= epsLen;

    const vAB = { x: B.x - A.x, y: B.y - A.y };
    const vDC = { x: C.x - D.x, y: C.y - D.y };
    const cross1 = Math.abs(vAB.x * vDC.y - vAB.y * vDC.x) / (Math.hypot(vAB.x, vAB.y) * Math.hypot(vDC.x, vDC.y) || 1);
    const isAbParallelCd = cross1 <= 0.08;

    const vAD = { x: D.x - A.x, y: D.y - A.y };
    const vBC = { x: C.x - B.x, y: C.y - B.y };
    const cross2 = Math.abs(vAD.x * vBC.y - vAD.y * vBC.x) / (Math.hypot(vAD.x, vAD.y) * Math.hypot(vBC.x, vBC.y) || 1);
    const isAdParallelBc = cross2 <= 0.08;

    const bothPairsParallel = isAbParallelCd && isAdParallelBc;
    const onePairParallel = isAbParallelCd || isAdParallelBc;

    if (allSidesEqual && (hasFourRightAngles || diagonalsEqual)) {
      shapeName = 'Hình vuông';
      reason = 'Bốn cạnh bằng nhau và bốn góc bằng 90 độ (hai đường chéo bằng nhau và vuông góc).';
      matchedId = 'SHAPE_SQUARE';
    } else if (hasFourRightAngles || (bothPairsParallel && diagonalsEqual)) {
      shapeName = 'Hình chữ nhật';
      reason = 'Tứ giác có bốn góc vuông và hai đường chéo bằng nhau.';
      matchedId = 'SHAPE_RECTANGLE';
    } else if (allSidesEqual || (bothPairsParallel && Math.abs(dAB - dBC) <= epsLen)) {
      shapeName = 'Hình thoi';
      reason = 'Tứ giác có bốn cạnh bằng nhau (hai đường chéo vuông góc với nhau).';
      matchedId = 'SHAPE_RHOMBUS';
    } else if (bothPairsParallel || oppSidesEqual) {
      shapeName = 'Hình bình hành';
      reason = 'Có các cặp cạnh đối song song và bằng nhau từng đôi một.';
      matchedId = 'SHAPE_PARALLELOGRAM';
    } else if (onePairParallel) {
      if (diagonalsEqual || Math.abs(aC - aD) <= epsAngle || Math.abs(aA - aB) <= epsAngle) {
        shapeName = 'Hình thang cân';
        reason = 'Hình thang có hai đường chéo bằng nhau (hoặc hai góc kề một đáy bằng nhau).';
        matchedId = 'SHAPE_ISOSCELES_TRAPEZOID';
      } else if (hasAtLeastOneRight) {
        shapeName = 'Hình thang vuông';
        reason = 'Hình thang có một góc vuông.';
        matchedId = 'SHAPE_RIGHT_TRAPEZOID';
      } else {
        shapeName = 'Hình thang';
        reason = 'Tứ giác có hai cạnh đối song song.';
        matchedId = 'SHAPE_TRAPEZOID';
      }
    }
  }

  // Cập nhật DOM bảng nhận diện định lý
  const nameEl = document.getElementById('detectedShapeName');
  const reasonEl = document.getElementById('detectedShapeReason');
  const btnDetails = document.getElementById('btnOpenDetectedDetails');
  const badgeEl = document.getElementById('shapeAccuracyBadge');
  const detectionBox = document.getElementById('sandboxDetectionBox');

  if (nameEl) nameEl.textContent = shapeName;
  if (reasonEl) reasonEl.textContent = reason;

  if (statusBadgeType === 'INVALID_CROSS') {
    if (nameEl) nameEl.className = "text-2xl font-bold text-rose-700 font-['Quicksand']";
    if (detectionBox) detectionBox.className = "p-5 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-white border-2 border-rose-300 shadow-md";
    if (badgeEl) badgeEl.innerHTML = '<span class="text-xs text-rose-700 font-bold bg-rose-100 px-2.5 py-1 rounded-full border border-rose-300 flex items-center"><i class="fa-solid fa-triangle-exclamation mr-1 text-rose-600"></i>Cạnh bị cắt chéo</span>';
    if (btnDetails) {
      btnDetails.className = "px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1";
      btnDetails.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles mr-1"></i><span>Gỡ rối hình</span>';
      btnDetails.onclick = autoUntangleGeometry;
    }
  } else if (statusBadgeType === 'CONCAVE') {
    if (nameEl) nameEl.className = "text-2xl font-bold text-amber-700 font-['Quicksand']";
    if (detectionBox) detectionBox.className = "p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-sky-50 to-white border-2 border-amber-200 shadow-md";
    if (badgeEl) badgeEl.innerHTML = '<span class="text-xs text-amber-700 font-bold bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center"><i class="fa-solid fa-circle-exclamation mr-1 text-amber-600"></i>Tứ giác lõm</span>';
    if (btnDetails) {
      btnDetails.className = "px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1";
      btnDetails.innerHTML = '<i class="fa-solid fa-rotate-right mr-1"></i><span>Nắn lồi hình</span>';
      btnDetails.onclick = autoUntangleGeometry;
    }
  } else {
    if (nameEl) nameEl.className = "text-2xl font-bold text-indigo-900 font-['Quicksand']";
    if (detectionBox) detectionBox.className = "p-5 rounded-3xl bg-gradient-to-br from-indigo-50 via-sky-50 to-white border-2 border-indigo-200 shadow-md";
    if (badgeEl) badgeEl.innerHTML = '<span class="text-xs text-emerald-700 font-bold flex items-center"><i class="fa-solid fa-circle-check mr-1 text-emerald-600"></i>Đã khớp tính chất</span>';
    if (btnDetails) {
      btnDetails.className = "px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1";
      btnDetails.innerHTML = '<span>Tính chất &amp; công thức</span><i class="fa-solid fa-arrow-right text-[10px]"></i>';
      btnDetails.onclick = () => { openShapeModal(matchedId); };
    }
  }

  // Cập nhật bài toán chứng minh chuẩn SGK Toán 8 theo đúng hình đang hiển thị
  updateProofProblem(matchedId, shapeName, {
    dAB: dAB.toFixed(1),
    dBC: dBC.toFixed(1),
    dCD: dCD.toFixed(1),
    dDA: dDA.toFixed(1),
    aA: Math.round(aA),
    aB: Math.round(aB),
    aC: Math.round(aC),
    aD: Math.round(aD),
    dAC: dAC.toFixed(1),
    dBD: dBD.toFixed(1)
  });
}

// =====================================================================
// 4. BẢN ĐỒ ĐỒ THỊ VIS.JS PHÂN TẦNG RÕ RÀNG
// =====================================================================

let nodesDataSetGlobal = null;
let lastHighlightedNodeId = null;

async function initGraph() {
  const container = document.getElementById('graphCanvas');
  try {
    const res = await fetch('/api/graph');
    const data = await res.json();

    // Khởi tạo vis.DataSet cho nodes và edges để ghim vị trí (fixed: true) khi kéo thả
    const nodesDataSet = new vis.DataSet(data.nodes.map(n => {
      const mainColor = (n.color && n.color.background) ? n.color.background : '#4f46e5';
      return {
        id: n.id,
        label: n.label,
        title: n.title,
        baseColor: mainColor,
        shape: 'dot',
        size: 24,
        color: {
          background: mainColor,
          border: '#ffffff',
          highlight: { background: '#f59e0b', border: '#ffffff' }
        },
        font: {
          color: '#1e293b',
          size: 12,
          face: 'Inter, sans-serif',
          bold: true,
          vadjust: -38
        },
        borderWidth: 2.5,
        shadow: { enabled: true, color: 'rgba(0,0,0,0.18)', size: 6, x: 2, y: 3 }
      };
    }));

    nodesDataSetGlobal = nodesDataSet;

    const edgesDataSet = new vis.DataSet(data.edges.map(e => ({
      id: e.id,
      from: e.from,
      to: e.to,
      title: '🔗 Dấu hiệu nhận biết: ' + (e.label || e.title),
      label: '', // Ẩn nhãn chữ mặc định trên đường nối giúp sơ đồ siêu gọn gàng!
      conditionText: e.label || e.title,
      color: { color: '#6366f1', highlight: '#f59e0b', hover: '#f59e0b' },
      width: 2.5,
      arrows: { to: { enabled: true, scaleFactor: 0.85 } },
      smooth: { type: 'continuous', roundness: 0.2 }
    })));

    const options = {
      physics: {
        enabled: true,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -220,
          centralGravity: 0.025,
          springLength: 135,
          springConstant: 0.06,
          damping: 0.45
        },
        stabilization: {
          enabled: true,
          iterations: 150,
          updateInterval: 20,
          fit: true
        }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        dragNodes: true,
        dragView: true,
        zoomView: true
      }
    };

    networkInstance = new vis.Network(container, { nodes: nodesDataSet, edges: edgesDataSet }, options);

    setTimeout(() => {
      if (networkInstance) {
        networkInstance.setSize('100%', '580px');
        networkInstance.redraw();
        networkInstance.fit();
      }
    }, 200);

    // Khi bắt đầu giữ chuột kéo (dragStart): Mở khóa vị trí để di chuyển mượt mà
    networkInstance.on('dragStart', function(params) {
      if (params.nodes && params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        nodesDataSet.update({
          id: nodeId,
          fixed: { x: false, y: false }
        });
      }
    });

    // Khi thả chuột ra (dragEnd): Đứng yên cố định vị trí vừa thả
    networkInstance.on('dragEnd', function(params) {
      if (params.nodes && params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        nodesDataSet.update({
          id: nodeId,
          fixed: { x: true, y: true }
        });
      }
    });

    // Sự kiện Click Node / Edge
    networkInstance.on('click', function(params) {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        setMiniCanvasPreset(nodeId);
        // Trì hoãn 500ms để xem trọn vẹn hoạt hình biến hình mượt mà trên canvas mini
        setTimeout(() => {
          openShapeModal(nodeId);
        }, 500);
      } else if (params.edges.length > 0) {
        const edgeId = params.edges[0];
        const edgeObj = edgesDataSet.get(edgeId);
        if (edgeObj) {
          const fromNode = nodesDataSet.get(edgeObj.from);
          const toNode = nodesDataSet.get(edgeObj.to);
          const fromName = fromNode ? fromNode.label : edgeObj.from;
          const toName = toNode ? toNode.label : edgeObj.to;
          
          const banner = document.getElementById('graphEdgeDetailsBanner');
          const txt = document.getElementById('txtGraphEdgeDetails');
          if (banner && txt) {
            txt.innerHTML = `<b>🔗 [${fromName} ➔ ${toName}]:</b> ${edgeObj.conditionText || edgeObj.title}`;
            banner.classList.remove('hidden');
          }
        }
      }
    });

    // Sự kiện Rê chuột (Hover) vào đường nối quan hệ
    networkInstance.on('hoverEdge', function(params) {
      const edgeObj = edgesDataSet.get(params.edge);
      if (edgeObj) {
        const fromNode = nodesDataSet.get(edgeObj.from);
        const toNode = nodesDataSet.get(edgeObj.to);
        const fromName = fromNode ? fromNode.label : edgeObj.from;
        const toName = toNode ? toNode.label : edgeObj.to;
        
        const banner = document.getElementById('graphEdgeDetailsBanner');
        const txt = document.getElementById('txtGraphEdgeDetails');
        if (banner && txt) {
          txt.innerHTML = `<b>🔗 [${fromName} ➔ ${toName}]:</b> ${edgeObj.conditionText || edgeObj.title}`;
          banner.classList.remove('hidden');
        }
      }
    });

    networkInstance.once('stabilizationIterationsDone', function () {
      networkInstance.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      setTimeout(initMiniGraphCanvas, 300);
    });
  } catch (err) {
    console.error('Lỗi khi vẽ đồ thị Vis.js:', err);
  }
}

// =====================================================================
// 4.5. XƯỞNG VẼ TƯƠNG TÁC ĐỘNG TRỰC TIẾP TRÊN BẢN ĐỒ SƠ ĐỒ NEO4J
// =====================================================================

let currentMiniMatchedId = 'SHAPE_CONVEX_QUAD';
let miniPoints = {
  A: { x: 50, y: 35 },
  B: { x: 210, y: 45 },
  C: { x: 190, y: 145 },
  D: { x: 45, y: 135 }
};
let miniDragTarget = null;

function initMiniGraphCanvas() {
  const canvas = document.getElementById('miniGraphInteractiveCanvas');
  if (!canvas) return;

  function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  canvas.onmousedown = (e) => {
    const pos = getMousePos(e);
    for (const k of ['A', 'B', 'C', 'D']) {
      const pt = miniPoints[k];
      const dist = Math.hypot(pos.x - pt.x, pos.y - pt.y);
      if (dist < 14) {
        miniDragTarget = k;
        break;
      }
    }
  };

  canvas.onmousemove = (e) => {
    if (!miniDragTarget) return;
    const pos = getMousePos(e);
    miniPoints[miniDragTarget] = {
      x: Math.max(15, Math.min(255, pos.x)),
      y: Math.max(15, Math.min(165, pos.y))
    };
    drawMiniCanvas();
  };

  window.addEventListener('mouseup', () => {
    miniDragTarget = null;
  });

  // Hỗ trợ cảm ứng trên điện thoại cho Canvas mini
  canvas.ontouchstart = (e) => {
    if (!e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    for (const k of ['A', 'B', 'C', 'D']) {
      const pt = miniPoints[k];
      const dist = Math.hypot(pos.x - pt.x, pos.y - pt.y);
      if (dist < 24) {
        miniDragTarget = k;
        e.preventDefault();
        break;
      }
    }
  };

  window.addEventListener('touchmove', (e) => {
    if (!miniDragTarget || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const pos = { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    miniPoints[miniDragTarget] = {
      x: Math.max(15, Math.min(255, pos.x)),
      y: Math.max(15, Math.min(165, pos.y))
    };
    drawMiniCanvas();
    e.preventDefault();
  }, { passive: false });

  window.addEventListener('touchend', () => {
    miniDragTarget = null;
  });

  drawMiniCanvas();
}

function drawMiniCanvas() {
  const canvas = document.getElementById('miniGraphInteractiveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Khung lưới tỏa nhẹ
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 15) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 15) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }

  // Kiểm tra giao cắt cạnh (tự cắt / lõm)
  const intersectAB_CD = checkSegmentsIntersect(miniPoints.A, miniPoints.B, miniPoints.C, miniPoints.D);
  const intersectBC_DA = checkSegmentsIntersect(miniPoints.B, miniPoints.C, miniPoints.D, miniPoints.A);
  const isMiniSelfIntersecting = intersectAB_CD.intersects || intersectBC_DA.intersects;
  const isMiniConvex = !isMiniSelfIntersecting && checkIsConvex(miniPoints.A, miniPoints.B, miniPoints.C, miniPoints.D);

  // Vẽ đa giác ABCD
  const pts = [miniPoints.A, miniPoints.B, miniPoints.C, miniPoints.D];
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.forEach(p => ctx.lineTo(p.x, p.y));
  ctx.closePath();

  if (isMiniSelfIntersecting) {
    ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.strokeStyle = '#ef4444';
  } else if (!isMiniConvex) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.strokeStyle = '#f59e0b';
  } else {
    ctx.fillStyle = 'rgba(56, 189, 248, 0.18)';
    ctx.strokeStyle = '#38bdf8';
  }
  ctx.lineWidth = 2.5;
  ctx.fill();
  ctx.stroke();

  // Nếu bị tự cắt (kéo chéo qua nhau), vẽ điểm vi phạm màu đỏ rực
  const interPt = intersectAB_CD.intersects ? intersectAB_CD.point : (intersectBC_DA.intersects ? intersectBC_DA.point : null);
  if (interPt) {
    ctx.beginPath();
    ctx.arc(interPt.x, interPt.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✖ Vi phạm', interPt.x, Math.max(15, interPt.y - 12));
  }

  // Vẽ 2 đường chéo đứt nét
  ctx.setLineDash([3, 3]);
  ctx.strokeStyle = 'rgba(255,255,255,0.3)';
  ctx.beginPath(); ctx.moveTo(miniPoints.A.x, miniPoints.A.y); ctx.lineTo(miniPoints.C.x, miniPoints.C.y); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(miniPoints.B.x, miniPoints.B.y); ctx.lineTo(miniPoints.D.x, miniPoints.D.y); ctx.stroke();
  ctx.setLineDash([]);

  // Vẽ các tay cầm đỉnh A, B, C, D
  const labelOffsets = {
    A: { dx: -10, dy: -6 },
    B: { dx: 10, dy: -6 },
    C: { dx: 10, dy: 14 },
    D: { dx: -10, dy: 14 }
  };

  for (const k of ['A', 'B', 'C', 'D']) {
    const pt = miniPoints[k];
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, miniDragTarget === k ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = miniDragTarget === k ? '#f59e0b' : (isMiniSelfIntersecting ? '#ef4444' : '#38bdf8');
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const off = labelOffsets[k];
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(k, pt.x + off.dx, pt.y + off.dy);
  }

  // Nhận dạng hình học trực tiếp
  const dAB = Math.hypot(miniPoints.B.x - miniPoints.A.x, miniPoints.B.y - miniPoints.A.y);
  const dBC = Math.hypot(miniPoints.C.x - miniPoints.B.x, miniPoints.C.y - miniPoints.B.y);
  const dCD = Math.hypot(miniPoints.D.x - miniPoints.C.x, miniPoints.D.y - miniPoints.C.y);
  const dDA = Math.hypot(miniPoints.A.x - miniPoints.D.x, miniPoints.A.y - miniPoints.D.y);

  function getAngleDeg(p1, p2, p3) {
    const a = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const b = Math.hypot(p3.x - p2.x, p3.y - p2.y);
    const c = Math.hypot(p3.x - p1.x, p3.y - p1.y);
    if (a * b === 0) return 0;
    const rad = Math.acos(Math.max(-1, Math.min(1, (a*a + b*b - c*c) / (2 * a * b))));
    return Math.round(rad * (180 / Math.PI));
  }

  const angA = getAngleDeg(miniPoints.D, miniPoints.A, miniPoints.B);
  const angB = getAngleDeg(miniPoints.A, miniPoints.B, miniPoints.C);

  const sidesEl = document.getElementById('miniTextSides');
  if (sidesEl) sidesEl.textContent = `Cạnh: AB=${(dAB/20).toFixed(1)} BC=${(dBC/20).toFixed(1)} (cm)`;

  const anglesEl = document.getElementById('miniTextAngles');
  if (anglesEl) anglesEl.textContent = `Góc: ∠A=${angA}° ∠B=${angB}°`;

  const vAB = { x: miniPoints.B.x - miniPoints.A.x, y: miniPoints.B.y - miniPoints.A.y };
  const vDC = { x: miniPoints.C.x - miniPoints.D.x, y: miniPoints.C.y - miniPoints.D.y };
  const cross1 = Math.abs(vAB.x * vDC.y - vAB.y * vDC.x);
  const isParallelTopBottom = cross1 < 400;

  const vAD = { x: miniPoints.D.x - miniPoints.A.x, y: miniPoints.D.y - miniPoints.A.y };
  const vBC = { x: miniPoints.C.x - miniPoints.B.x, y: miniPoints.C.y - miniPoints.B.y };
  const cross2 = Math.abs(vAD.x * vBC.y - vAD.y * vBC.x);
  const isParallelLeftRight = cross2 < 400;

  let matchedId = 'SHAPE_CONVEX_QUAD';
  let shapeName = 'Tứ giác';

  if (isParallelTopBottom && isParallelLeftRight) {
    const dotA = vAB.x * vAD.x + vAB.y * vAD.y;
    const isRight = Math.abs(dotA) < 500;
    const equalSides = Math.abs(dAB - dBC) < 12;

    if (isRight && equalSides) {
      matchedId = 'SHAPE_SQUARE'; shapeName = 'Hình vuông';
    } else if (isRight) {
      matchedId = 'SHAPE_RECTANGLE'; shapeName = 'Hình chữ nhật';
    } else if (equalSides) {
      matchedId = 'SHAPE_RHOMBUS'; shapeName = 'Hình thoi';
    } else {
      matchedId = 'SHAPE_PARALLELOGRAM'; shapeName = 'Hình bình hành';
    }
  } else if (isParallelTopBottom || isParallelLeftRight) {
    const isRight = Math.abs(vAB.x * vAD.x + vAB.y * vAD.y) < 500;
    if (isRight) {
      matchedId = 'SHAPE_RIGHT_TRAPEZOID'; shapeName = 'Hình thang vuông';
    } else {
      matchedId = 'SHAPE_TRAPEZOID'; shapeName = 'Hình thang';
    }
  }

  currentMiniMatchedId = matchedId;
  const badge = document.getElementById('miniCanvasShapeBadge');
  if (badge) {
    if (isMiniSelfIntersecting) {
      badge.textContent = '⚠️ Tự cắt (Vi phạm)';
      badge.className = 'text-[10px] font-bold bg-rose-500/40 text-rose-200 border border-rose-500 px-2 py-0.5 rounded-full animate-pulse';
    } else if (!isMiniConvex) {
      badge.textContent = '⚠️ Tứ giác lõm';
      badge.className = 'text-[10px] font-bold bg-amber-500/40 text-amber-200 border border-amber-500 px-2 py-0.5 rounded-full animate-pulse';
    } else {
      badge.textContent = shapeName;
      badge.className = 'text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 px-2 py-0.5 rounded-full';
    }
  }

  // Đồng bộ tác động trực tiếp sang Quả cầu Node tương ứng trên Sơ đồ Neo4j
    // Nút thông minh linh hoạt trên thanh tiêu đề Sơ đồ Đồ thị
  const btnGraphUntangle = document.getElementById('btnGraphUntangle');
  const txtGraphUntangle = document.getElementById('txtGraphUntangle');
  if (btnGraphUntangle) {
    if (isMiniSelfIntersecting) {
      btnGraphUntangle.classList.remove('hidden');
      btnGraphUntangle.className = 'px-3 py-1.5 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer animate-pulse';
      btnGraphUntangle.title = 'Tự động sắp xếp lại các đỉnh để gỡ chéo cạnh bị cắt';
      if (txtGraphUntangle) txtGraphUntangle.textContent = 'Gỡ rối hình';
    } else if (!isMiniConvex) {
      btnGraphUntangle.classList.remove('hidden');
      btnGraphUntangle.className = 'px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold rounded-xl text-xs shadow-sm transition-all flex items-center space-x-1.5 cursor-pointer animate-pulse';
      btnGraphUntangle.title = 'Tự động đẩy đỉnh lõm ra ngoài để tạo tứ giác lồi';
      if (txtGraphUntangle) txtGraphUntangle.textContent = 'Nắn lồi hình';
    } else {
      btnGraphUntangle.classList.add('hidden');
    }
  }

  highlightNeo4jNode(matchedId);
}

let isGraphSplitMode = true;

function toggleGraphLayoutMode() {
  isGraphSplitMode = !isGraphSplitMode;
  const leftCol = document.getElementById('graphLeftCol');
  const rightCol = document.getElementById('graphRightCol');
  const txtBtn = document.getElementById('txtToggleGraphLayout');

  if (isGraphSplitMode) {
    leftCol.className = 'lg:col-span-6 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[580px]';
    rightCol.className = 'lg:col-span-6 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-4 flex flex-col justify-between space-y-3';
    if (txtBtn) txtBtn.textContent = 'Toàn màn hình';
  } else {
    leftCol.className = 'lg:col-span-12 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden flex flex-col min-h-[580px]';
    rightCol.className = 'lg:col-span-12 bg-slate-900 rounded-3xl border border-slate-800 shadow-xl p-4 flex flex-col justify-between space-y-3';
    if (txtBtn) txtBtn.textContent = 'Chia đôi 50:50';
  }

  setTimeout(() => {
    if (networkInstance) {
      networkInstance.setSize('100%', '580px');
      networkInstance.redraw();
      networkInstance.fit();
    }
  }, 100);
}

function fitGraphViewClean() {
  if (!networkInstance) return;
  networkInstance.fit({
    animation: { duration: 500, easingFunction: 'easeInOutQuad' }
  });
}

function snapMiniPreset(type) {
  if (type === 'SQUARE') setMiniCanvasPreset('SHAPE_SQUARE');
  else if (type === 'RECTANGLE') setMiniCanvasPreset('SHAPE_RECTANGLE');
  else if (type === 'RHOMBUS') setMiniCanvasPreset('SHAPE_RHOMBUS');
  else if (type === 'PARALLELOGRAM') setMiniCanvasPreset('SHAPE_PARALLELOGRAM');
  else if (type === 'TRAPEZOID') setMiniCanvasPreset('SHAPE_TRAPEZOID');
}

function autoUntangleMiniGeometry() {
  miniPoints = { A: { x: 65, y: 35 }, B: { x: 265, y: 45 }, C: { x: 235, y: 175 }, D: { x: 55, y: 165 } };
  drawMiniCanvas();
}

let miniAnimationId = null;

function setMiniCanvasPreset(shapeId) {
  let targetPoints = { A: { x: 65, y: 35 }, B: { x: 265, y: 45 }, C: { x: 235, y: 175 }, D: { x: 55, y: 165 } };

  if (shapeId === 'SHAPE_SQUARE') {
    targetPoints = { A: { x: 95, y: 35 }, B: { x: 235, y: 35 }, C: { x: 235, y: 175 }, D: { x: 95, y: 175 } };
  } else if (shapeId === 'SHAPE_RECTANGLE') {
    targetPoints = { A: { x: 55, y: 45 }, B: { x: 275, y: 45 }, C: { x: 275, y: 165 }, D: { x: 55, y: 165 } };
  } else if (shapeId === 'SHAPE_RHOMBUS') {
    targetPoints = { A: { x: 165, y: 20 }, B: { x: 265, y: 105 }, C: { x: 165, y: 190 }, D: { x: 65, y: 105 } };
  } else if (shapeId === 'SHAPE_PARALLELOGRAM') {
    targetPoints = { A: { x: 85, y: 40 }, B: { x: 275, y: 40 }, C: { x: 235, y: 170 }, D: { x: 45, y: 170 } };
  } else if (shapeId === 'SHAPE_ISOSCELES_TRAPEZOID') {
    targetPoints = { A: { x: 85, y: 40 }, B: { x: 235, y: 40 }, C: { x: 285, y: 170 }, D: { x: 35, y: 170 } };
  } else if (shapeId === 'SHAPE_RIGHT_TRAPEZOID') {
    targetPoints = { A: { x: 65, y: 40 }, B: { x: 225, y: 40 }, C: { x: 285, y: 170 }, D: { x: 65, y: 170 } };
  } else if (shapeId === 'SHAPE_TRAPEZOID') {
    targetPoints = { A: { x: 85, y: 40 }, B: { x: 225, y: 40 }, C: { x: 285, y: 170 }, D: { x: 35, y: 170 } };
  }

  if (miniAnimationId) {
    cancelAnimationFrame(miniAnimationId);
    miniAnimationId = null;
  }

  const startPoints = JSON.parse(JSON.stringify(miniPoints));
  const startTime = performance.now();
  const duration = 400;

  function animateFrame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    const easeProgress = 1 - (1 - progress) * (1 - progress);

    for (const k of ['A', 'B', 'C', 'D']) {
      miniPoints[k].x = startPoints[k].x + (targetPoints[k].x - startPoints[k].x) * easeProgress;
      miniPoints[k].y = startPoints[k].y + (targetPoints[k].y - startPoints[k].y) * easeProgress;
    }

    drawMiniCanvas();

    if (progress < 1) {
      miniAnimationId = requestAnimationFrame(animateFrame);
    } else {
      miniAnimationId = null;
    }
  }

  miniAnimationId = requestAnimationFrame(animateFrame);
}


function highlightNeo4jNode(nodeId) {
  if (!networkInstance || !nodesDataSetGlobal) return;
  if (lastHighlightedNodeId === nodeId) return;
  lastHighlightedNodeId = nodeId;

  try {
    const allNodes = nodesDataSetGlobal.get();
    const updates = [];

    allNodes.forEach(n => {
      const isTarget = (n.id === nodeId);
      const baseColor = n.baseColor || (n.color && n.color.background) || '#4f46e5';

      if (isTarget) {
        // HIỆU ỨNG PHÁT SÁNG VÀNG RỰC RỠ NỔI BẬT KHÔNG ĐÈ LÊN NODE KHÁC
        updates.push({
          id: n.id,
          size: 36,
          borderWidth: 5,
          color: {
            background: '#f59e0b',
            border: '#ffffff',
            highlight: { background: '#f59e0b', border: '#ffffff' }
          },
          font: {
            color: '#d97706',
            size: 14,
            face: 'Inter, sans-serif',
            bold: true,
            vadjust: -48
          },
          shadow: { enabled: true, color: 'rgba(245, 158, 11, 0.85)', size: 22, x: 0, y: 0 }
        });
      } else {
        updates.push({
          id: n.id,
          size: 24,
          borderWidth: 2.5,
          color: {
            background: baseColor,
            border: '#ffffff',
            highlight: { background: '#f59e0b', border: '#ffffff' }
          },
          font: {
            color: '#1e293b',
            size: 12,
            face: 'Inter, sans-serif',
            bold: true,
            vadjust: -38
          },
          shadow: { enabled: true, color: 'rgba(0,0,0,0.18)', size: 6, x: 2, y: 3 }
        });
      }
    });

    nodesDataSetGlobal.update(updates);
    networkInstance.selectNodes([nodeId]);

    // Phóng to camera nhẹ nhàng tập trung góc nhìn vào Node đang chọn
    networkInstance.focus(nodeId, {
      scale: 1.05,
      animation: { duration: 400, easingFunction: 'easeInOutQuad' }
    });
  } catch (e) {
    console.error('Lỗi highlight node Neo4j:', e);
  }
}

// =====================================================================
// 5. DANH SÁCH THẺ HÌNH HỌC
// =====================================================================

async function loadShapesList() {
  try {
    const res = await fetch('/api/shapes');
    allShapes = await res.json();

    const grid = document.getElementById('shapesCardsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    allShapes.forEach(shape => {
      const card = document.createElement('div');
      card.className = 'bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group';
      card.onclick = () => openShapeModal(shape.id);

      card.innerHTML = `
        <div>
          <div class="flex items-center justify-between mb-3">
            <span class="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-base font-bold shadow-sm" style="background-color: ${shape.color || '#4f46e5'}">
              <i class="fa-solid fa-shapes"></i>
            </span>
            <span class="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">${shape.sides_count} cạnh</span>
          </div>
          <h3 class="text-base font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">${shape.name}</h3>
          <p class="text-[11px] text-slate-400 font-medium mb-2">${shape.name_en || ''}</p>
          <p class="text-xs text-slate-600 line-clamp-3 leading-relaxed">${shape.definition}</p>
        </div>
        <div class="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-indigo-600 font-semibold">
          <span>Xem chi tiết hồ sơ</span>
          <i class="fa-solid fa-arrow-right text-[11px] group-hover:translate-x-1 transition-transform"></i>
        </div>
      `;
      grid.appendChild(card);
    });

    const countBadge = document.getElementById('totalShapesCountBadge');
    if (countBadge) countBadge.textContent = allShapes.length + ' hình học';
  } catch (err) {
    console.error('Lỗi tải danh sách hình:', err);
  }
}

// =====================================================================
// 6. HỒ SƠ CHI TIẾT HÌNH HỌC (MODAL)
// =====================================================================

let currentOpenShapeIdForTip = 'SHAPE_SQUARE';

async function openShapeModal(shapeId) {
  currentOpenShapeIdForTip = shapeId;
  try {
    const res = await fetch('/api/shapes/' + shapeId);
    const shape = await res.json();
    currentModalShape = shape;

    document.getElementById('modalShapeTitle').textContent = shape.name;
    document.getElementById('modalShapeSub').textContent = (shape.name_en || '') + ' - Hồ sơ kiến thức & đặc điểm tính chất SGK Toán 8';
    document.getElementById('modalShapeIcon').style.backgroundColor = shape.color || '#4f46e5';
    document.getElementById('modalDefinition').textContent = shape.definition;

    const englishBadge = document.getElementById('modalShapeEnglishBadge');
    if (englishBadge) englishBadge.textContent = shape.name_en || '';

    // Hình vẽ SVG minh họa trực quan trong Modal
    const svgContainer = document.getElementById('modalSvgContainer');
    if (svgContainer) {
      svgContainer.innerHTML = getShapeSvgPreview(shape.id, shape.color || '#38bdf8', 'rgba(56, 189, 248, 0.2)');
    }

    const btnOpenSandbox = document.getElementById('btnModalOpenInSandbox');
    if (btnOpenSandbox) {
      btnOpenSandbox.onclick = () => loadShapeToSandbox(shape.id);
    }

    // Danh sách phân loại tính chất độc đáo & nổi bật
    const propsList = document.getElementById('modalPropertiesList');
    propsList.innerHTML = '';
    (shape.properties || []).forEach(p => {
      const pEl = document.createElement('div');
      
      let categoryIcon = 'fa-shapes';
      let catBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      const catText = (p.category || 'Tính chất').toLowerCase();

      if (catText.includes('cạnh') || catText.includes('độ dài')) {
        categoryIcon = 'fa-ruler-combined';
        catBg = 'bg-sky-50 text-sky-700 border-sky-200';
      } else if (catText.includes('góc')) {
        categoryIcon = 'fa-compass-drafting';
        catBg = 'bg-indigo-50 text-indigo-700 border-indigo-200';
      } else if (catText.includes('éo') || catText.includes('chéo')) {
        categoryIcon = 'fa-xmark';
        catBg = 'bg-purple-50 text-purple-700 border-purple-200';
      } else if (catText.includes('x xứng') || catText.includes('đối xứng')) {
        categoryIcon = 'fa-atom';
        catBg = 'bg-emerald-50 text-emerald-700 border-emerald-200';
      }

      pEl.className = 'p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between space-y-2.5 group';
      pEl.innerHTML = `
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${catBg} flex items-center space-x-1">
              <i class="fa-solid ${categoryIcon} text-[10px]"></i>
              <span>${p.category || 'Tính chất'}</span>
            </span>
            <span class="text-[10px] text-slate-400 font-bold">SGK Toán 8</span>
          </div>
          <p class="text-xs text-slate-700 leading-relaxed font-medium pt-0.5">${p.description}</p>
        </div>
        ${p.expr ? `
          <div class="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span class="text-[10px] text-slate-400 font-semibold">Công thức ký hiệu:</span>
            <span class="px-2.5 py-1 bg-slate-900 text-amber-300 font-mono font-bold text-xs rounded-xl border border-slate-800 shadow-inner">${p.expr}</span>
          </div>
        ` : ''}
      `;
      propsList.appendChild(pEl);
    });

    // Cấu hình máy tính công thức
    setupFormulaCalculator(shape);

    // Danh sách chuyển tiếp (Tab 3)
    const prevList = document.getElementById('modalPrevShapesList');
    if (prevList) {
      prevList.innerHTML = '';
      if (!shape.prev_shapes || shape.prev_shapes.length === 0) {
        prevList.innerHTML = '<div class="p-4 bg-slate-50 text-slate-400 text-xs rounded-2xl border border-slate-200 italic">Đây là hình khởi đầu cơ bản trong hệ thống tri thức.</div>';
      } else {
        shape.prev_shapes.forEach(prev => {
          const item = document.createElement('div');
          item.className = 'p-4 bg-white rounded-3xl border border-indigo-200 shadow-2xs hover:shadow-md transition-all space-y-3';
          const miniSvg = getShapeSvgPreview(prev.id, '#6366f1', 'rgba(99, 102, 241, 0.2)');
          item.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div class="sm:col-span-5">${miniSvg}</div>
              <div class="sm:col-span-7 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-indigo-900 text-sm cursor-pointer hover:underline" onclick="openShapeModal('${prev.id}')">${prev.name}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">HÌNH TIỀN THÂN</span>
                </div>
                <div class="p-2.5 bg-indigo-50/80 rounded-xl border border-indigo-100 text-xs text-indigo-950 leading-relaxed font-medium">
                  <b class="text-indigo-800"><i class="fa-solid fa-key mr-1"></i>Điều kiện nâng cấp:</b> ${prev.condition}
                </div>
                <button onclick="openShapeModal('${prev.id}')" class="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1">
                  <i class="fa-solid fa-shapes"></i>
                  <span>Xem hồ sơ ${prev.name}</span>
                </button>
              </div>
            </div>
          `;
          prevList.appendChild(item);
        });
      }
    }

    const nextList = document.getElementById('modalNextShapesList');
    if (nextList) {
      nextList.innerHTML = '';
      if (!shape.next_shapes || shape.next_shapes.length === 0) {
        nextList.innerHTML = '<div class="p-4 bg-slate-50 text-slate-400 text-xs rounded-2xl border border-slate-200 italic">Không có hình kế thừa tiếp theo (đây là hình học có tính đối xứng cao nhất).</div>';
      } else {
        shape.next_shapes.forEach(next => {
          const item = document.createElement('div');
          item.className = 'p-4 bg-white rounded-3xl border border-emerald-200 shadow-2xs hover:shadow-md transition-all space-y-3';
          const miniSvg = getShapeSvgPreview(next.id, '#10b981', 'rgba(16, 185, 129, 0.2)');
          item.innerHTML = `
            <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
              <div class="sm:col-span-5">${miniSvg}</div>
              <div class="sm:col-span-7 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-bold text-emerald-900 text-sm cursor-pointer hover:underline" onclick="openShapeModal('${next.id}')">${next.name}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">HÌNH BẬC CAO HƠN</span>
                </div>
                <div class="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs text-emerald-950 leading-relaxed font-medium">
                  <b class="text-emerald-800"><i class="fa-solid fa-key mr-1"></i>Điều kiện phát triển:</b> ${next.condition}
                </div>
                <button onclick="openShapeModal('${next.id}')" class="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1">
                  <i class="fa-solid fa-shapes"></i>
                  <span>Xem hồ sơ ${next.name}</span>
                </button>
              </div>
            </div>
          `;
          nextList.appendChild(item);
        });
      }
    }

    // Danh sách mẹo nhớ & thơ vui (Tab 4)
    const tipsList = document.getElementById('modalTipsList');
    if (tipsList) {
      tipsList.innerHTML = '';
      if (!shape.tips || shape.tips.length === 0) {
        tipsList.innerHTML = '<div class="p-4 bg-slate-50 text-slate-400 text-xs rounded-2xl border border-slate-200 italic">Chưa có bài thơ hoặc mẹo nhớ cho hình này.</div>';
      } else {
        shape.tips.forEach(tip => {
          const tEl = document.createElement('div');
          const isPoem = (tip.type === 'Thơ ghi nhớ' || tip.type === 'Thơ');
          
          if (isPoem) {
            tEl.className = 'p-5 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 rounded-3xl border border-amber-200/90 shadow-sm space-y-3 relative overflow-hidden';
            tEl.innerHTML = `
              <div class="flex items-center justify-between pb-2 border-b border-amber-200/80">
                <h5 class="font-bold text-amber-900 text-xs flex items-center space-x-1.5">
                  <i class="fa-solid fa-scroll text-amber-600 text-sm"></i>
                  <span>${tip.title || 'Bài thơ ghi nhớ'}</span>
                </h5>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200/80 text-amber-900 border border-amber-300">THƠ THẦN ĐỒNG</span>
              </div>
              <p class="whitespace-pre-line leading-relaxed text-amber-950 font-['Quicksand',sans-serif] text-sm italic pl-3 border-l-4 border-amber-500 py-1.5 font-bold bg-amber-100/40 rounded-r-2xl">${tip.content}</p>
            `;
          } else {
            tEl.className = 'p-5 bg-gradient-to-br from-rose-50 via-pink-50 to-white rounded-3xl border border-rose-200 shadow-sm space-y-3';
            tEl.innerHTML = `
              <div class="flex items-center justify-between pb-2 border-b border-rose-200/80">
                <h5 class="font-bold text-rose-900 text-xs flex items-center space-x-1.5">
                  <i class="fa-solid fa-triangle-exclamation text-rose-600 text-sm"></i>
                  <span>${tip.title || 'Mẹo né bẫy bài thi'}</span>
                </h5>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">CẢNH BÁO BẪY THI</span>
              </div>
              <p class="leading-relaxed text-slate-800 text-xs font-medium pt-1">${tip.content}</p>
            `;
          }
          tipsList.appendChild(tEl);
        });
      }
    }

    // Nguồn sách giáo khoa (Tab 5)
    const srcEl = document.getElementById('modalSourceId');
    const locEl = document.getElementById('modalSourceLocator');
    const verEl = document.getElementById('modalVerifiedBy');
    if (srcEl) srcEl.textContent = shape.source_id || 'SGK Toán 8 - Bộ sách Kết nối tri thức với cuộc sống';
    if (locEl) locEl.textContent = shape.source_locator || 'Chương III: Tứ giác - Bài học chuẩn GDPT 2018';
    if (verEl) verEl.textContent = shape.verified_by || 'Hội đồng Chuyên môn Thẩm định SGK';

    switchTab('props');
    document.getElementById('shapeDetailModal').classList.remove('hidden');
  } catch (err) {
    console.error('Lỗi khi tải chi tiết hình:', err);
  }
}

function closeShapeModal() {
  document.getElementById('shapeDetailModal').classList.add('hidden');
}

function switchTab(tab) {
  const tabs = ['props', 'calc', 'trans', 'tips', 'source'];
  tabs.forEach(t => {
    const btn = document.getElementById('tab' + t.charAt(0).toUpperCase() + t.slice(1));
    const content = document.getElementById('tabContent' + t.charAt(0).toUpperCase() + t.slice(1));
    if (t === tab) {
      btn.className = 'py-3 text-indigo-600 border-b-2 border-indigo-600 transition-all whitespace-nowrap font-bold';
      content.classList.remove('hidden');
    } else {
      btn.className = 'py-3 hover:text-slate-800 transition-all whitespace-nowrap font-medium text-slate-500';
      content.classList.add('hidden');
    }
  });
}

// 7. Cấu hình máy tính công thức động
function setupFormulaCalculator(shape) {
  currentFormulaType = 'Diện tích';
  selectFormulaType('Diện tích');
}

function formatFormulaString(str) {
  if (!str) return '';
  return str
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '($1) / $2')
    .replace(/\\times/g, ' × ')
    .replace(/\\cdot/g, ' · ')
    .replace(/\^2/g, '²')
    .replace(/\^3/g, '³')
    .replace(/\\sqrt\{([^}]+)\}/g, '√($1)');
}

function selectFormulaType(type) {
  currentFormulaType = type;
  const btnArea = document.getElementById('btnFormArea');
  const btnPerim = document.getElementById('btnFormPerim');
  const resBox = document.getElementById('calculationResultBox');
  if (resBox) resBox.classList.add('hidden');

  if (type === 'Diện tích') {
    if (btnArea) btnArea.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all flex items-center space-x-1.5';
    if (btnPerim) btnPerim.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-200 transition-all flex items-center space-x-1.5';
  } else {
    if (btnPerim) btnPerim.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-sm transition-all flex items-center space-x-1.5';
    if (btnArea) btnArea.className = 'px-4 py-2 rounded-xl text-xs font-bold bg-white text-slate-700 hover:bg-slate-200 transition-all flex items-center space-x-1.5';
  }

  if (!currentModalShape || !currentModalShape.formulas) return;

  let formula = currentModalShape.formulas.find(f => f.type.toLowerCase().includes(type.toLowerCase()));
  if (!formula && currentModalShape.formulas.length > 0) {
    formula = currentModalShape.formulas[0];
  }

  const latexEl = document.getElementById('calcFormulaLatex');
  const nameBadge = document.getElementById('calcFormulaNameBadge');
  const descText = document.getElementById('calcFormulaDescText');
  const inputsContainer = document.getElementById('calcInputsContainer');
  inputsContainer.innerHTML = '';

  if (formula) {
    if (latexEl) latexEl.textContent = formatFormulaString(formula.latex);
    if (nameBadge) nameBadge.textContent = formula.type || (type + ' chuẩn SGK');
    if (descText) descText.textContent = formula.note || (`Công thức tính ${type.toLowerCase()} của ${currentModalShape.name}`);

    if (formula.params) {
      formula.params.forEach(p => {
        const pKey = p.key || p.name;
        const defaultVal = p.default || 5;

        const field = document.createElement('div');
        field.className = 'p-3.5 bg-white rounded-2xl border border-slate-200 space-y-2.5 shadow-2xs hover:border-indigo-300 transition-all';
        field.innerHTML = `
          <div class="flex items-center justify-between text-xs">
            <label class="font-bold text-slate-700 flex items-center space-x-1.5">
              <span class="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-mono font-bold">${pKey}</span>
              <span>${p.label}:</span>
            </label>
            <span class="font-mono font-bold text-indigo-600 text-xs px-2 py-0.5 bg-indigo-50 rounded-lg border border-indigo-100" id="val_badge_${pKey}">${defaultVal} cm</span>
          </div>
          <div class="flex items-center space-x-3 pt-1">
            <input type="range" id="range_param_${pKey}" min="1" max="30" step="0.5" value="${defaultVal}" 
                   oninput="syncParamInput('${pKey}', this.value)" 
                   class="w-full accent-indigo-600 cursor-pointer">
            <input type="number" id="input_param_${pKey}" value="${defaultVal}" min="0.1" max="100" step="0.5" 
                   oninput="syncParamRange('${pKey}', this.value)" 
                   class="w-16 px-2 py-1 text-center font-mono font-bold bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-indigo-500 text-slate-800 shadow-2xs">
          </div>
        `;
        inputsContainer.appendChild(field);
      });
    }
    setTimeout(executeCalculation, 80);
  } else {
    if (latexEl) latexEl.textContent = 'Công thức chuẩn sách giáo khoa';
    inputsContainer.innerHTML = '<p class="text-xs text-slate-400 italic">Chưa có thông số cho công thức này.</p>';
  }
}

function syncParamInput(pKey, val) {
  const inputEl = document.getElementById('input_param_' + pKey);
  const badgeEl = document.getElementById('val_badge_' + pKey);
  if (inputEl) inputEl.value = val;
  if (badgeEl) badgeEl.textContent = val + ' cm';
  executeCalculation();
}

function syncParamRange(pKey, val) {
  const rangeEl = document.getElementById('range_param_' + pKey);
  const badgeEl = document.getElementById('val_badge_' + pKey);
  if (rangeEl) rangeEl.value = val;
  if (badgeEl) badgeEl.textContent = val + ' cm';
  executeCalculation();
}

async function executeCalculation() {
  if (!currentModalShape) return;

  let formula = currentModalShape.formulas.find(f => f.type.toLowerCase().includes(currentFormulaType.toLowerCase()));
  if (!formula && currentModalShape.formulas.length > 0) formula = currentModalShape.formulas[0];
  if (!formula) return;

  const inputs = {};
  for (const p of (formula.params || [])) {
    const pKey = p.key || p.name;
    const inputEl = document.getElementById('input_param_' + pKey);
    if (!inputEl || !inputEl.value || parseFloat(inputEl.value) <= 0) {
      return;
    }
    inputs[pKey] = inputEl.value;
  }

  try {
    const res = await fetch('/api/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shape_id: currentModalShape.id,
        formula_type: formula.type,
        inputs: inputs
      })
    });

    const data = await res.json();
    if (!res.ok) return;

    const box = document.getElementById('calculationResultBox');
    if (box) box.classList.remove('hidden');
    const finalEl = document.getElementById('calcFinalResult');
    if (finalEl) finalEl.textContent = data.result + ' ' + data.unit;

    const stepList = document.getElementById('calcStepList');
    if (stepList) {
      stepList.innerHTML = '';
      (data.steps || []).forEach((s, idx) => {
        const stepCard = document.createElement('div');
        stepCard.className = 'p-3 bg-white rounded-2xl border border-emerald-200/80 flex items-start space-x-2.5 shadow-2xs';
        stepCard.innerHTML = `
          <span class="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">${idx + 1}</span>
          <span class="text-xs text-slate-800 leading-relaxed font-semibold">${s}</span>
        `;
        stepList.appendChild(stepCard);
      });
    }
  } catch (err) {
    console.error('Lỗi tính toán:', err);
  }
}

// =====================================================================
// 8. PHÂN QUYỀN VAI TRÒ NGƯỜI DÙNG (RBAC)
// =====================================================================

function changeUserRole(role) {
  currentRole = role;
  const btnTeacher = document.getElementById('btnTeacherDraft');
  const btnAdmin = document.getElementById('btnAdminReview');
  const badge = document.getElementById('roleIndicatorBadge');

  if (role === 'STUDENT') {
    btnTeacher.classList.add('hidden');
    btnAdmin.classList.add('hidden');
    badge.textContent = 'Chế độ: Học sinh (Tra cứu, tương tác, trắc nghiệm)';
    badge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200 shadow-sm';
  } else if (role === 'TEACHER') {
    btnTeacher.classList.remove('hidden');
    btnAdmin.classList.add('hidden');
    badge.textContent = 'Chế độ: Giáo viên (Toàn quyền học sinh + Biên soạn tri thức)';
    badge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-teal-100 text-teal-800 border border-teal-200 shadow-sm';
  } else if (role === 'ADMIN') {
    btnTeacher.classList.add('hidden');
    btnAdmin.classList.remove('hidden');
    badge.textContent = 'Chế độ: Quản trị viên (Toàn quyền + Thẩm định duyệt SGK)';
    badge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200 shadow-sm';
  } else {
    // ALL: Toàn quyền
    btnTeacher.classList.remove('hidden');
    btnAdmin.classList.remove('hidden');
    badge.textContent = 'Chế độ: Toàn quyền trải nghiệm (Tất cả vai trò)';
    badge.className = 'px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-indigo-700 border border-indigo-200 shadow-sm';
  }
}

// =====================================================================
// 9. BIÊN SOẠN TRI THỨC MỚI (DÀNH CHO GIÁO VIÊN)
// =====================================================================

function openDraftModal() {
  const select = document.getElementById('draftShapeSelect');
  select.innerHTML = allShapes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  document.getElementById('draftMessageAlert').classList.add('hidden');
  document.getElementById('draftModal').classList.remove('hidden');
}

function closeDraftModal() {
  document.getElementById('draftModal').classList.add('hidden');
}

async function submitDraftContent() {
  const type = document.getElementById('draftTypeSelect').value;
  const shapeId = document.getElementById('draftShapeSelect').value;
  const title = document.getElementById('draftTitleInput').value.trim();
  const content = document.getElementById('draftContentInput').value.trim();
  const sourceId = document.getElementById('draftSourceIdInput').value.trim();
  const sourceLocator = document.getElementById('draftSourceLocatorInput').value.trim();
  const author = document.getElementById('draftAuthorInput').value.trim();
  const msgBox = document.getElementById('draftMessageAlert');

  if (!sourceId || !sourceLocator) {
    msgBox.className = 'p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200';
    msgBox.textContent = 'Bắt buộc phải điền đầy đủ Mã bộ sách (source_id) và Vị trí trang sách (source_locator) để đối chiếu kiểm chứng.';
    msgBox.classList.remove('hidden');
    return;
  }

  if (!title || !content) {
    msgBox.className = 'p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200';
    msgBox.textContent = 'Vui lòng nhập đầy đủ tiêu đề và nội dung chi tiết.';
    msgBox.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch('/api/content/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        shape_id: shapeId,
        title: title,
        content: content,
        source_id: sourceId,
        source_locator: sourceLocator,
        author: author
      })
    });

    const data = await res.json();
    if (!res.ok) {
      msgBox.className = 'p-3 rounded-xl text-xs bg-rose-50 text-rose-700 border border-rose-200';
      msgBox.textContent = data.error || 'Lỗi khi lưu bản ghi.';
      msgBox.classList.remove('hidden');
      return;
    }

    msgBox.className = 'p-3 rounded-xl text-xs bg-emerald-50 text-emerald-800 border border-emerald-200';
    msgBox.textContent = data.message;
    msgBox.classList.remove('hidden');

    document.getElementById('draftTitleInput').value = '';
    document.getElementById('draftContentInput').value = '';
    loadPendingCount();
  } catch (err) {
    console.error('Lỗi gửi biên soạn:', err);
  }
}

// =====================================================================
// 10. THẨM ĐỊNH VÀ PHÊ DUYỆT SGK (DÀNH CHO QUẢN TRỊ VIÊN)
// =====================================================================

async function loadPendingCount() {
  try {
    const res = await fetch('/api/content/pending');
    const data = await res.json();
    const badge = document.getElementById('pendingCountBadge');
    if (badge) badge.textContent = data.length;
  } catch (err) {
    console.log('Chưa tải số lượng duyệt:', err);
  }
}

function openReviewModal() {
  document.getElementById('reviewModal').classList.remove('hidden');
  loadPendingReviews();
}

function closeReviewModal() {
  document.getElementById('reviewModal').classList.add('hidden');
}

async function loadPendingReviews() {
  const container = document.getElementById('reviewItemsList');
  container.innerHTML = '<div class="p-6 text-center text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tải hàng đợi...</div>';

  try {
    const res = await fetch('/api/content/pending');
    const items = await res.json();

    if (items.length === 0) {
      container.innerHTML = '<div class="p-6 text-center bg-slate-50 text-slate-500 rounded-2xl border border-slate-200">Hiện không có nội dung nào đang chờ duyệt. Tất cả tri thức đã được thẩm định chuẩn SGK!</div>';
      return;
    }

    container.innerHTML = '';
    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3';
      card.innerHTML = `
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-2">
            <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">${item.type}</span>
            <span class="font-bold text-slate-800 text-xs">${item.shape_name}</span>
          </div>
          <span class="text-[11px] text-amber-700 font-bold px-2 py-0.5 bg-amber-50 rounded-full border border-amber-200">CHỜ DUYỆT</span>
        </div>
        <h5 class="text-xs font-bold text-slate-800">${item.title}</h5>
        <p class="text-xs text-slate-600 leading-relaxed">${item.content}</p>
        <div class="p-3 bg-white rounded-xl border border-slate-200 text-[11px] space-y-1">
          <div class="flex justify-between">
            <span class="text-slate-500">Mã sách SGK:</span>
            <span class="font-mono font-bold text-slate-700">${item.source_id}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Vị trí bài/trang:</span>
            <span class="font-bold text-slate-700">${item.source_locator}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-slate-500">Người biên soạn:</span>
            <span class="text-slate-700">${item.author} (${item.created_at})</span>
          </div>
        </div>
        <div class="flex items-center justify-end space-x-2 pt-2 border-t border-slate-200/60">
          <button onclick="reviewContent('${item.id}', 'REJECTED')" class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white border border-rose-200 text-rose-700 hover:bg-rose-50 transition-all flex items-center space-x-1">
            <i class="fa-solid fa-xmark"></i>
            <span>Từ chối</span>
          </button>
          <button onclick="reviewContent('${item.id}', 'APPROVED')" class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition-all flex items-center space-x-1">
            <i class="fa-solid fa-check"></i>
            <span>Duyệt & Xuất bản</span>
          </button>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (err) {
    container.innerHTML = '<div class="p-4 bg-rose-50 text-rose-700 rounded-xl">Lỗi khi tải hàng đợi duyệt</div>';
  }
}

async function reviewContent(id, action) {
  let note = '';
  if (action === 'REJECTED') {
    note = prompt('Vui lòng nhập lý do từ chối (ví dụ: sai lệch định lý, cần kiểm tra lại trang sách):');
    if (note === null) return;
  }

  try {
    const res = await fetch('/api/content/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: id,
        action: action,
        note: note,
        reviewer: 'Tổ trưởng chuyên môn Toán'
      })
    });

    const data = await res.json();
    alert(data.message);
    loadPendingReviews();
    loadPendingCount();
    loadShapesList();
  } catch (err) {
    console.error('Lỗi khi thẩm định:', err);
  }
}

// =====================================================================
// 11. CHỈ ĐƯỜNG CHỨNG MINH HÌNH HỌC (UC05)
// =====================================================================

function loadProofSelects() {
  const startSel = document.getElementById('proofStartSelect');
  const endSel = document.getElementById('proofEndSelect');
  if (!startSel || !endSel) return;

  const optionsHtml = allShapes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  startSel.innerHTML = optionsHtml;
  endSel.innerHTML = optionsHtml;

  startSel.value = 'SHAPE_CONVEX_QUAD';
  endSel.value = 'SHAPE_SQUARE';
}

function openProofModal() {
  loadProofSelects();
  document.getElementById('proofPathModal').classList.remove('hidden');
  findProofPath();
}

function closeProofModal() {
  document.getElementById('proofPathModal').classList.add('hidden');
}

async function findProofPath() {
  const fromId = document.getElementById('proofStartSelect').value;
  const toId = document.getElementById('proofEndSelect').value;
  const resultsBox = document.getElementById('proofResultsBox');

  resultsBox.innerHTML = '<div class="p-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang tìm lộ trình tối ưu...</div>';

  try {
    const res = await fetch('/api/proof-path', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_id: fromId, to_id: toId })
    });

    const data = await res.json();
    if (!res.ok) {
      resultsBox.innerHTML = '<div class="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">' + (data.error || 'Lỗi tìm đường') + '</div>';
      return;
    }

    if (!data.found) {
      resultsBox.innerHTML = '<div class="p-6 bg-slate-50 text-slate-600 text-xs rounded-2xl border border-slate-200 text-center">' + data.message + '</div>';
      return;
    }

    resultsBox.innerHTML = '';
    data.paths.forEach((p, pIdx) => {
      const pathCard = document.createElement('div');
      pathCard.className = 'p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4';

      let stepsHtml = '';
      p.steps.forEach(s => {
        const svgFrom = getShapeSvgPreview(s.from_id, '#38bdf8', 'rgba(56, 189, 248, 0.2)');
        const svgTo = getShapeSvgPreview(s.to_id, '#10b981', 'rgba(16, 185, 129, 0.2)');

        stepsHtml += `
          <div class="p-3 bg-white rounded-2xl border border-slate-200/80 space-y-2 shadow-2xs">
            <div class="flex items-center space-x-2 text-xs">
              <div class="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-[11px] flex items-center justify-center flex-shrink-0">${s.step_num}</div>
              <div class="font-bold text-slate-800">${s.from_name} <i class="fa-solid fa-arrow-right text-[10px] text-slate-400 mx-1"></i> ${s.to_name}</div>
            </div>

            <div class="grid grid-cols-12 gap-2 items-center p-2.5 bg-slate-900 rounded-2xl border border-slate-800">
              <div class="col-span-5 text-center space-y-1">
                <span class="text-[11px] font-bold text-sky-400 block">${s.from_name}</span>
                ${svgFrom}
              </div>
              <div class="col-span-2 flex flex-col items-center justify-center text-center">
                <i class="fa-solid fa-arrow-right text-emerald-400 text-xl animate-pulse"></i>
                <span class="text-[9px] text-slate-400 mt-1 font-mono">Biến đổi</span>
              </div>
              <div class="col-span-5 text-center space-y-1">
                <span class="text-[11px] font-bold text-emerald-400 block">${s.to_name}</span>
                ${svgTo}
              </div>
            </div>

            <div class="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
              <b class="text-emerald-800"><i class="fa-solid fa-key mr-1"></i>Dấu hiệu nhận biết:</b> ${s.condition}
            </div>
          </div>
        `;
      });

      pathCard.innerHTML = `
        <div class="flex items-center justify-between pb-2 border-b border-slate-200">
          <span class="text-xs font-bold text-emerald-800">${p.title}</span>
          <span class="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">${p.steps.length} bước chuyển</span>
        </div>
        <div class="space-y-3">${stepsHtml}</div>
      `;
      resultsBox.appendChild(pathCard);
    });
  } catch (err) {
    console.error('Lỗi tìm đường chứng minh:', err);
  }
}

// =====================================================================
// 12. SO SÁNH ĐỐI CHIẾU HAI HÌNH HỌC (UC06)
// =====================================================================

function loadCompareSelects() {
  const sel1 = document.getElementById('compareSelect1');
  const sel2 = document.getElementById('compareSelect2');
  if (!sel1 || !sel2) return;

  const optionsHtml = allShapes.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  sel1.innerHTML = optionsHtml;
  sel2.innerHTML = optionsHtml;

  sel1.value = 'SHAPE_RECTANGLE';
  sel2.value = 'SHAPE_RHOMBUS';
}

function openCompareModal() {
  loadCompareSelects();
  document.getElementById('compareModal').classList.remove('hidden');
  compareShapes();
}

function closeCompareModal() {
  document.getElementById('compareModal').classList.add('hidden');
}

function getShapeSvgPreview(shapeId, strokeColor = "#38bdf8", fillColor = "rgba(56, 189, 248, 0.15)") {
  let vA = { x: 40, y: 35 }, vB = { x: 200, y: 35 }, vC = { x: 200, y: 125 }, vD = { x: 40, y: 125 };
  let showDiagonals = true;
  let isCross = false;
  let interPt = null;

  if (shapeId === 'SHAPE_SQUARE') {
    vA = { x: 70, y: 30 }; vB = { x: 170, y: 30 }; vC = { x: 170, y: 130 }; vD = { x: 70, y: 130 };
  } else if (shapeId === 'SHAPE_RECTANGLE') {
    vA = { x: 40, y: 40 }; vB = { x: 200, y: 40 }; vC = { x: 200, y: 120 }; vD = { x: 40, y: 120 };
  } else if (shapeId === 'SHAPE_RHOMBUS') {
    vA = { x: 120, y: 20 }; vB = { x: 195, y: 80 }; vC = { x: 120, y: 140 }; vD = { x: 45, y: 80 };
  } else if (shapeId === 'SHAPE_PARALLELOGRAM') {
    vA = { x: 75, y: 35 }; vB = { x: 205, y: 35 }; vC = { x: 165, y: 125 }; vD = { x: 35, y: 125 };
  } else if (shapeId === 'SHAPE_ISOSCELES_TRAPEZOID') {
    vA = { x: 75, y: 35 }; vB = { x: 165, y: 35 }; vC = { x: 205, y: 125 }; vD = { x: 35, y: 125 };
  } else if (shapeId === 'SHAPE_RIGHT_TRAPEZOID') {
    vA = { x: 50, y: 35 }; vB = { x: 150, y: 35 }; vC = { x: 205, y: 125 }; vD = { x: 50, y: 125 };
  } else if (shapeId === 'SHAPE_TRAPEZOID') {
    vA = { x: 70, y: 35 }; vB = { x: 150, y: 35 }; vC = { x: 210, y: 125 }; vD = { x: 30, y: 125 };
  } else if (shapeId === 'SHAPE_QUADRILATERAL' || shapeId === 'SHAPE_CONVEX_QUAD') {
    vA = { x: 50, y: 30 }; vB = { x: 190, y: 45 }; vC = { x: 165, y: 130 }; vD = { x: 40, y: 110 };
  } else if (shapeId === 'SHAPE_SELF_INTERSECTING') {
    vA = { x: 40, y: 35 }; vB = { x: 200, y: 125 }; vC = { x: 200, y: 35 }; vD = { x: 40, y: 125 };
    isCross = true;
    interPt = { x: 120, y: 80 };
  } else if (shapeId === 'SHAPE_CONCAVE_QUAD') {
    vA = { x: 40, y: 30 }; vB = { x: 200, y: 40 }; vC = { x: 115, y: 85 }; vD = { x: 40, y: 130 };
  }

  const pathD = `M ${vA.x} ${vA.y} L ${vB.x} ${vB.y} L ${vC.x} ${vC.y} L ${vD.x} ${vD.y} Z`;

  let extraSvg = '';
  if (showDiagonals && !isCross) {
    extraSvg += `
      <line x1="${vA.x}" y1="${vA.y}" x2="${vC.x}" y2="${vC.y}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="3,3" stroke-width="1.2"/>
      <line x1="${vB.x}" y1="${vB.y}" x2="${vD.x}" y2="${vD.y}" stroke="rgba(255,255,255,0.25)" stroke-dasharray="3,3" stroke-width="1.2"/>
    `;
  }

  if (isCross && interPt) {
    extraSvg += `
      <circle cx="${interPt.x}" cy="${interPt.y}" r="4.5" fill="#ef4444" stroke="#ffffff" stroke-width="1"/>
    `;
  }

  const labels = [
    { pt: vA, label: 'A', dx: -12, dy: -6 },
    { pt: vB, label: 'B', dx: 12, dy: -6 },
    { pt: vC, label: 'C', dx: 12, dy: 14 },
    { pt: vD, label: 'D', dx: -12, dy: 14 }
  ];

  labels.forEach(l => {
    extraSvg += `
      <circle cx="${l.pt.x}" cy="${l.pt.y}" r="3.5" fill="${strokeColor}" stroke="#ffffff" stroke-width="1.2"/>
      <text x="${l.pt.x + l.dx}" y="${l.pt.y + l.dy}" fill="#f8fafc" font-size="11" font-family="Quicksand, sans-serif" font-weight="bold" text-anchor="middle">${l.label}</text>
    `;
  });

  const randId = Math.floor(Math.random() * 100000);

  return `
    <svg class="w-full h-32 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner select-none" viewBox="0 0 240 160">
      <defs>
        <pattern id="grid_cmp_${shapeId}_${randId}" width="16" height="16" patternUnits="userSpaceOnUse">
          <path d="M 16 0 L 0 0 0 16" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"/>
        </pattern>
      </defs>
      <rect width="240" height="160" fill="url(#grid_cmp_${shapeId}_${randId})"/>
      <path d="${pathD}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.5" stroke-linejoin="round"/>
      ${extraSvg}
    </svg>
  `;
}

function loadShapeToSandbox(shapeId) {
  closeProofModal();
  closeCompareModal();
  closeShapeModal();
  switchView('sandbox');
  if (shapeId === 'SHAPE_SQUARE') snapToPreset('SQUARE');
  else if (shapeId === 'SHAPE_RECTANGLE') snapToPreset('RECTANGLE');
  else if (shapeId === 'SHAPE_RHOMBUS') snapToPreset('RHOMBUS');
  else if (shapeId === 'SHAPE_PARALLELOGRAM') snapToPreset('PARALLELOGRAM');
  else if (shapeId === 'SHAPE_ISOSCELES_TRAPEZOID') snapToPreset('ISOSCELES_TRAPEZOID');
  else if (shapeId === 'SHAPE_RIGHT_TRAPEZOID') snapToPreset('RIGHT_TRAPEZOID');
  else snapToPreset('FREE');
}

async function compareShapes() {
  const id1 = document.getElementById('compareSelect1').value;
  const id2 = document.getElementById('compareSelect2').value;
  const box = document.getElementById('compareResultsBox');

  box.innerHTML = '<div class="p-6 text-center text-xs text-slate-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i>Đang đối chiếu...</div>';

  try {
    const res = await fetch('/api/compare', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shape1_id: id1, shape2_id: id2 })
    });

    const data = await res.json();
    if (!res.ok) {
      box.innerHTML = '<div class="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200">' + (data.error || 'Lỗi so sánh') + '</div>';
      return;
    }

    let commonHtml = data.common_points.map(c => '<li class="text-xs text-slate-700 flex items-start space-x-2"><i class="fa-solid fa-circle-check text-emerald-500 text-[10px] mt-1"></i><span>' + c + '</span></li>').join('');
    let s1Html = data.shape1_unique.map(u => '<li class="text-xs text-slate-700 flex items-start space-x-2"><i class="fa-solid fa-diamond text-indigo-500 text-[10px] mt-1"></i><span>' + u + '</span></li>').join('');
    let s2Html = data.shape2_unique.map(u => '<li class="text-xs text-slate-700 flex items-start space-x-2"><i class="fa-solid fa-diamond text-amber-500 text-[10px] mt-1"></i><span>' + u + '</span></li>').join('');

    const svg1 = getShapeSvgPreview(id1, '#6366f1', 'rgba(99, 102, 241, 0.2)');
    const svg2 = getShapeSvgPreview(id2, '#f59e0b', 'rgba(245, 158, 11, 0.2)');

    box.innerHTML = `
      <div class="grid grid-cols-2 gap-3 mb-3">
        <div class="space-y-1 text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all cursor-pointer group" onclick="loadShapeToSandbox('${id1}')" title="Bấm để nạp hình này ra bàn vẽ tương tác">
          <span class="text-xs font-bold text-indigo-700 block">${data.shape1.name}</span>
          ${svg1}
          <span class="text-[10px] text-indigo-600 font-bold block mt-1 group-hover:underline"><i class="fa-solid fa-hand-pointer mr-1"></i>Nạp ra bàn vẽ tương tác</span>
        </div>
        <div class="space-y-1 text-center p-2.5 bg-slate-50 rounded-2xl border border-slate-200 hover:border-amber-300 transition-all cursor-pointer group" onclick="loadShapeToSandbox('${id2}')" title="Bấm để nạp hình này ra bàn vẽ tương tác">
          <span class="text-xs font-bold text-amber-700 block">${data.shape2.name}</span>
          ${svg2}
          <span class="text-[10px] text-amber-600 font-bold block mt-1 group-hover:underline"><i class="fa-solid fa-hand-pointer mr-1"></i>Nạp ra bàn vẽ tương tác</span>
        </div>
      </div>

      <div class="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-2">
        <h5 class="text-xs font-bold text-emerald-900 flex items-center space-x-1.5">
          <i class="fa-solid fa-handshake text-emerald-600"></i>
          <span>Điểm tương đồng giữa hai hình</span>
        </h5>
        <ul class="space-y-1.5 pl-1">${commonHtml}</ul>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div class="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-2">
          <h5 class="text-xs font-bold text-indigo-900 flex items-center space-x-1.5">
            <i class="fa-solid fa-fingerprint text-indigo-600"></i>
            <span>Đặc trưng riêng của ${data.shape1.name}</span>
          </h5>
          <ul class="space-y-1.5 pl-1">${s1Html}</ul>
        </div>

        <div class="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 space-y-2">
          <h5 class="text-xs font-bold text-amber-900 flex items-center space-x-1.5">
            <i class="fa-solid fa-fingerprint text-amber-600"></i>
            <span>Đặc trưng riêng của ${data.shape2.name}</span>
          </h5>
          <ul class="space-y-1.5 pl-1">${s2Html}</ul>
        </div>
      </div>
    `;
  } catch (err) {
    console.error('Lỗi khi so sánh hai hình:', err);
  }
}

// =====================================================================
// 13. PHÒNG TRẮC NGHIỆM GỢI Ý 3 TẦNG (UC07)
// =====================================================================

let quizList = [];
let currentQuizIdx = 0;
let quizScore = 0;
let currentHintLevel = 0;

async function openQuizModal() {
  document.getElementById('quizModal').classList.remove('hidden');
  try {
    const res = await fetch('/api/quiz');
    quizList = await res.json();
    currentQuizIdx = 0;
    quizScore = 0;
    renderQuizQuestion();
  } catch (err) {
    console.error('Lỗi tải câu hỏi trắc nghiệm:', err);
  }
}

function closeQuizModal() {
  document.getElementById('quizModal').classList.add('hidden');
}

function renderQuizQuestion() {
  if (quizList.length === 0) return;
  const q = quizList[currentQuizIdx];
  currentHintLevel = 0;

  document.getElementById('quizProgressText').textContent = `Câu hỏi ${currentQuizIdx + 1} / ${quizList.length}`;
  document.getElementById('quizScoreText').textContent = `Điểm số: ${quizScore}`;
  document.getElementById('quizQuestionTitle').textContent = q.question;
  document.getElementById('hintCurrentLevel').textContent = '0';
  document.getElementById('quizHintsList').innerHTML = '<p class="text-[11px] text-slate-400 italic">Chưa mở gợi ý nào. Nhấp vào "Mở gợi ý tiếp theo" nếu bạn gặp khó khăn.</p>';

  const fbBox = document.getElementById('quizFeedbackBox');
  fbBox.classList.add('hidden');

  const container = document.getElementById('quizOptionsContainer');
  container.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'w-full p-3 rounded-2xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left text-xs text-slate-700 font-medium flex items-center space-x-3 transition-all';
    btn.onclick = () => selectQuizAnswer(idx);
    btn.innerHTML = `
      <span class="w-6 h-6 rounded-full bg-slate-100 font-bold text-slate-600 flex items-center justify-center text-[11px] flex-shrink-0">${labels[idx]}</span>
      <span class="flex-1">${opt}</span>
    `;
    container.appendChild(btn);
  });
}

function selectQuizAnswer(chosenIdx) {
  const q = quizList[currentQuizIdx];
  const fbBox = document.getElementById('quizFeedbackBox');
  fbBox.classList.remove('hidden');

  if (chosenIdx === q.answer) {
    quizScore += 10;
    document.getElementById('quizScoreText').textContent = `Điểm số: ${quizScore}`;
    fbBox.className = 'p-4 rounded-2xl text-xs bg-emerald-50 text-emerald-900 border border-emerald-200 space-y-1 animate-fade-in';
    fbBox.innerHTML = `
      <div class="font-bold flex items-center space-x-1.5 text-emerald-800">
        <i class="fa-solid fa-circle-check text-emerald-600"></i>
        <span>Chính xác tuyệt đối!</span>
      </div>
      <p class="text-slate-600 leading-relaxed">${q.explanation}</p>
    `;
  } else {
    fbBox.className = 'p-4 rounded-2xl text-xs bg-rose-50 text-rose-900 border border-rose-200 space-y-1 animate-fade-in';
    fbBox.innerHTML = `
      <div class="font-bold flex items-center space-x-1.5 text-rose-800">
        <i class="fa-solid fa-circle-xmark text-rose-600"></i>
        <span>Chưa chính xác rồi!</span>
      </div>
      <p class="text-slate-600 leading-relaxed">${q.explanation}</p>
    `;
  }
}

function showNextHint() {
  const q = quizList[currentQuizIdx];
  if (!q.hints || currentHintLevel >= q.hints.length) {
    alert('Đã mở toàn bộ các tầng gợi ý cho câu hỏi này!');
    return;
  }

  currentHintLevel++;
  document.getElementById('hintCurrentLevel').textContent = currentHintLevel;

  const hintsList = document.getElementById('quizHintsList');
  if (currentHintLevel === 1) hintsList.innerHTML = '';

  const hintEl = document.createElement('div');
  hintEl.className = 'p-2.5 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 flex items-start space-x-2 animate-slide-up';
  hintEl.innerHTML = `
    <span class="font-bold text-amber-700 flex-shrink-0">Tầng ${currentHintLevel}:</span>
    <span class="leading-relaxed">${q.hints[currentHintLevel - 1]}</span>
  `;
  hintsList.appendChild(hintEl);
}

function prevQuestion() {
  if (currentQuizIdx > 0) {
    currentQuizIdx--;
    renderQuizQuestion();
  }
}

function nextQuestion() {
  if (currentQuizIdx < quizList.length - 1) {
    currentQuizIdx++;
    renderQuizQuestion();
  }
}

// =====================================================================
// 14. TRỢ LÝ HỌC TẬP GEOBOT (UC08)
// =====================================================================

function toggleChatbot() {
  const box = document.getElementById('chatbotBox');
  box.classList.toggle('hidden');
}

async function sendChatMessage() {
  const input = document.getElementById('chatInput');
  const question = input.value.trim();
  if (!question) return;

  const messages = document.getElementById('chatMessages');

  const userMsg = document.createElement('div');
  userMsg.className = 'flex items-start justify-end space-x-2';
  userMsg.innerHTML = '<div class="p-3 bg-indigo-600 text-white rounded-2xl rounded-tr-none leading-relaxed text-xs max-w-[85%]">' + question + '</div>';
  messages.appendChild(userMsg);

  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: question })
    });
    const data = await res.json();

    const botMsg = document.createElement('div');
    botMsg.className = 'flex items-start space-x-2';

    let openBtn = '';
    if (data.related_shape_id) {
      openBtn = `<button onclick="openShapeModal('${data.related_shape_id}')" class="mt-2 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 block underline"><i class="fa-solid fa-eye mr-1"></i>Mở hồ sơ hình này ra xem thử</button>`;
    }

    botMsg.innerHTML = `
      <div class="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] flex-shrink-0 mt-0.5">
        <i class="fa-solid fa-robot"></i>
      </div>
      <div class="p-3 bg-slate-100 rounded-2xl rounded-tl-none text-slate-700 leading-relaxed text-xs max-w-[85%]">
        ${data.reply}
        ${openBtn}
      </div>
    `;
    messages.appendChild(botMsg);
    messages.scrollTop = messages.scrollHeight;
  } catch (err) {
    console.error('Lỗi trợ lý ảo:', err);
  }
}

// =====================================================================
// XỬ LÝ NHẬP ĐỘ DÀI CẠNH VÀ SỐ ĐO GÓC TRỰC TIẾP TỪ NGƯỜI DÙNG
// =====================================================================

function handleSideInputChange(side, val) {
  const lenCm = parseFloat(val);
  if (isNaN(lenCm) || lenCm <= 0) return;
  const targetPx = Math.max(30, Math.min(500, lenCm * 20));

  const A = geoPoints.A, B = geoPoints.B, C = geoPoints.C, D = geoPoints.D;
  const isParallelogramLike = (
    Math.abs((B.x - A.x) - (C.x - D.x)) < 15 && 
    Math.abs((B.y - A.y) - (C.y - D.y)) < 15 &&
    Math.abs((D.x - A.x) - (C.x - B.x)) < 15 && 
    Math.abs((D.y - A.y) - (C.y - B.y)) < 15
  );

  if (side === 'AB') {
    const curLen = Math.hypot(B.x - A.x, B.y - A.y) || 1;
    const uX = (B.x - A.x) / curLen;
    const uY = (B.y - A.y) / curLen;
    const oldBx = B.x, oldBy = B.y;
    B.x = Math.max(30, Math.min(610, Math.round(A.x + uX * targetPx)));
    B.y = Math.max(30, Math.min(370, Math.round(A.y + uY * targetPx)));
    if (isParallelogramLike) {
      const deltaX = B.x - oldBx;
      const deltaY = B.y - oldBy;
      C.x = Math.max(30, Math.min(610, C.x + deltaX));
      C.y = Math.max(30, Math.min(370, C.y + deltaY));
    }
  } else if (side === 'BC') {
    const curLen = Math.hypot(C.x - B.x, C.y - B.y) || 1;
    const uX = (C.x - B.x) / curLen;
    const uY = (C.y - B.y) / curLen;
    const oldCx = C.x, oldCy = C.y;
    C.x = Math.max(30, Math.min(610, Math.round(B.x + uX * targetPx)));
    C.y = Math.max(30, Math.min(370, Math.round(B.y + uY * targetPx)));
    if (isParallelogramLike) {
      const deltaX = C.x - oldCx;
      const deltaY = C.y - oldCy;
      D.x = Math.max(30, Math.min(610, D.x + deltaX));
      D.y = Math.max(30, Math.min(370, D.y + deltaY));
    }
  } else if (side === 'CD') {
    const curLen = Math.hypot(D.x - C.x, D.y - C.y) || 1;
    const uX = (D.x - C.x) / curLen;
    const uY = (D.y - C.y) / curLen;
    D.x = Math.max(30, Math.min(610, Math.round(C.x + uX * targetPx)));
    D.y = Math.max(30, Math.min(370, Math.round(C.y + uY * targetPx)));
  } else if (side === 'DA') {
    const curLen = Math.hypot(A.x - D.x, A.y - D.y) || 1;
    const uX = (D.x - A.x) / curLen;
    const uY = (D.y - A.y) / curLen;
    D.x = Math.max(30, Math.min(610, Math.round(A.x + uX * targetPx)));
    D.y = Math.max(30, Math.min(370, Math.round(A.y + uY * targetPx)));
  }

  drawGeometrySandbox();
}

function handleAngleInputChange(vertex, val) {
  const targetDeg = parseFloat(val);
  if (isNaN(targetDeg) || targetDeg < 20 || targetDeg > 160) return;
  const targetRad = (targetDeg * Math.PI) / 180;

  const A = geoPoints.A, B = geoPoints.B, C = geoPoints.C, D = geoPoints.D;
  const isParallelogramLike = (
    Math.abs((B.x - A.x) - (C.x - D.x)) < 15 && 
    Math.abs((B.y - A.y) - (C.y - D.y)) < 15 &&
    Math.abs((D.x - A.x) - (C.x - B.x)) < 15 && 
    Math.abs((D.y - A.y) - (C.y - B.y)) < 15
  );

  if (vertex === 'A') {
    const angleAB = Math.atan2(B.y - A.y, B.x - A.x);
    const lenAD = Math.hypot(D.x - A.x, D.y - A.y);
    const angleAD = angleAB + targetRad;
    D.x = Math.max(30, Math.min(610, Math.round(A.x + lenAD * Math.cos(angleAD))));
    D.y = Math.max(30, Math.min(370, Math.round(A.y + lenAD * Math.sin(angleAD))));
    if (isParallelogramLike) {
      C.x = Math.max(30, Math.min(610, B.x + (D.x - A.x)));
      C.y = Math.max(30, Math.min(370, B.y + (D.y - A.y)));
    }
  } else if (vertex === 'B') {
    const angleBA = Math.atan2(A.y - B.y, A.x - B.x);
    const lenBC = Math.hypot(C.x - B.x, C.y - B.y);
    const angleBC = angleBA - targetRad;
    C.x = Math.max(30, Math.min(610, Math.round(B.x + lenBC * Math.cos(angleBC))));
    C.y = Math.max(30, Math.min(370, Math.round(B.y + lenBC * Math.sin(angleBC))));
    if (isParallelogramLike) {
      D.x = Math.max(30, Math.min(610, A.x + (C.x - B.x)));
      D.y = Math.max(30, Math.min(370, A.y + (C.y - B.y)));
    }
  } else if (vertex === 'C') {
    const angleCB = Math.atan2(B.y - C.y, B.x - C.x);
    const lenCD = Math.hypot(D.x - C.x, D.y - C.y);
    const angleCD = angleCB + targetRad;
    D.x = Math.max(30, Math.min(610, Math.round(C.x + lenCD * Math.cos(angleCD))));
    D.y = Math.max(30, Math.min(370, Math.round(C.y + lenCD * Math.sin(angleCD))));
  } else if (vertex === 'D') {
    const angleDC = Math.atan2(C.y - D.y, C.x - D.x);
    const lenDA = Math.hypot(A.x - D.x, A.y - D.y);
    const angleDA = angleDC - targetRad;
    A.x = Math.max(30, Math.min(610, Math.round(D.x + lenDA * Math.cos(angleDA))));
    A.y = Math.max(30, Math.min(370, Math.round(D.y + lenDA * Math.sin(angleDA))));
  }

  drawGeometrySandbox();
}

// =====================================================================
// BÀI TOÁN CHỨNG MINH & THỰC TẾ GẮN LIỀN VỚI HÌNH ĐANG HIỂN THỊ (SGK TOÁN 8)
// =====================================================================

let isProofSolutionVisible = false;
let currentProblemVariant = 'PROOF'; // 'PROOF', 'CALC', 'REAL'
let currentRandomSeed = 0;

function changeProblemVariant(variant) {
  currentProblemVariant = variant;
  ['PROOF', 'CALC', 'REAL'].forEach(v => {
    const btn = document.getElementById('btnProbVar' + v);
    if (btn) {
      if (v === variant) {
        btn.className = 'px-2.5 py-1 rounded-lg font-bold bg-amber-500 text-white shadow-xs';
      } else {
        btn.className = 'px-2.5 py-1 rounded-lg font-medium text-slate-600 hover:text-slate-900';
      }
    }
  });
  drawGeometrySandbox();
}

function randomizeCurrentProblem() {
  currentRandomSeed = (currentRandomSeed + 1) % 10;
  drawGeometrySandbox();
}

function toggleProofSolution() {
  const box = document.getElementById('proofSolutionDetailBox');
  const txt = document.getElementById('txtToggleSolution');
  const btn = document.getElementById('btnToggleSolution');
  if (!box) return;
  isProofSolutionVisible = !isProofSolutionVisible;
  if (isProofSolutionVisible) {
    box.classList.remove('hidden');
    if (txt) txt.textContent = 'Ẩn hướng dẫn & lời giải mẫu';
    if (btn) {
      btn.classList.add('bg-indigo-50', 'text-indigo-700', 'border-indigo-300');
    }
  } else {
    box.classList.add('hidden');
    if (txt) txt.textContent = 'Xem hướng dẫn & lời giải mẫu';
    if (btn) {
      btn.classList.remove('bg-indigo-50', 'text-indigo-700', 'border-indigo-300');
    }
  }
}

function updateProofProblem(shapeId, shapeName, m) {
  const stmtEl = document.getElementById('proofProblemStatement');
  const hypEl = document.getElementById('proofProblemHypothesis');
  const conclEl = document.getElementById('proofProblemConclusion');
  const stepsEl = document.getElementById('proofProblemSteps');
  const badgeEl = document.getElementById('proofProblemBadge');
  const subEl = document.getElementById('proofProblemSubtitle');

  if (!stmtEl || !hypEl || !conclEl || !stepsEl) return;

  const ab = parseFloat(m.dAB) || 0;
  const bc = parseFloat(m.dBC) || 0;
  const cd = parseFloat(m.dCD) || 0;
  const da = parseFloat(m.dDA) || 0;
  const ac = parseFloat(m.dAC) || 0;
  const bd = parseFloat(m.dBD) || 0;
  const aA = parseInt(m.aA) || 0;
  const aB = parseInt(m.aB) || 0;
  const aC = parseInt(m.aC) || 0;
  const aD = parseInt(m.aD) || 0;

  const perim = (ab + bc + cd + da).toFixed(1);
  const pyth = (ab**2 + bc**2).toFixed(1);
  const seedIdx = Math.abs(currentRandomSeed) % 10;

  let varName = currentProblemVariant === 'PROOF' ? 'Dạng 1: Chứng minh' : currentProblemVariant === 'CALC' ? 'Dạng 2: Tính toán' : 'Dạng 3: Thực tế';
  if (badgeEl) badgeEl.textContent = `${varName} - Bài ${seedIdx + 1}/10`;
  if (subEl) subEl.textContent = `Số đo bàn vẽ: AB=${m.dAB}cm, BC=${m.dBC}cm, CD=${m.dCD}cm, DA=${m.dDA}cm | ∠A=${m.aA}°, ∠B=${m.aB}°`;

  let stmt = '';
  let hyp = [];
  let concl = [];
  let steps = [];

  if (shapeId === 'SHAPE_SELF_INTERSECTING') {
    stmt = `Quan sát hình vẽ trên bàn vẽ gồm 4 điểm A, B, C, D với AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm. Hai đoạn AB và CD đang cắt nhau tại điểm M tạo hình cánh bướm. Dựa vào SGK Toán 8, hãy xét xem hình này có phải là tứ giác hay không.`;
    hyp = [
      `Bốn điểm A, B, C, D phân biệt trên mặt phẳng`,
      `Số đo: AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm`,
      `Hai đoạn đối nhau AB và CD cắt nhau tại điểm M`
    ];
    concl = [
      `a) Hình trên KHÔNG PHẢI là tứ giác theo định nghĩa SGK Toán 8`,
      `b) Nêu giải pháp nắn lồi hình trên bàn vẽ`
    ];
    steps = [
      `<b>Bước 1 (Định nghĩa SGK Toán 8):</b> Tứ giác ABCD là hình gồm 4 đoạn thẳng AB, BC, CD, DA trong đó không có 2 đoạn nào cắt nhau ngoài các đầu mút chung.`,
      `<b>Bước 2 (Phân tích lỗi):</b> Hai đoạn AB và CD cắt nhau tại M (không phải đỉnh). Do đó vi phạm định nghĩa tứ giác.`,
      `<b>Bước 3 (Khắc phục):</b> Nhấn nút gỡ chéo cạnh ở bảng công cụ để đưa về tứ giác lồi hợp lệ.`
    ];
  } else if (shapeId === 'SHAPE_CONCAVE_QUAD') {
    stmt = `Cho tứ giác ABCD có AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm. Một góc trong của tứ giác lớn hơn 180° (tứ giác lõm). Hãy phân biệt với tứ giác lồi.`;
    hyp = [
      `Tứ giác ABCD không tự cắt`,
      `Tồn tại một góc trong lớn hơn 180°`
    ];
    concl = [
      `a) Tứ giác ABCD là tứ giác lõm (không lồi)`,
      `b) Quy ước học tập SGK Toán 8 chỉ xét tứ giác lồi`
    ];
    steps = [
      `<b>Bước 1:</b> Đường thẳng chứa cạnh bất kỳ cắt tứ giác thành 2 phần thuộc 2 nửa mặt phẳng khác nhau.`,
      `<b>Bước 2:</b> SGK Toán 8 quy ước khi nói tứ giác mà không chú thích thêm thì mặc định là tứ giác lồi.`,
      `<b>Bước 3:</b> Nhấn nút nắn lồi hình ở thanh công cụ.`
    ];
  } else if (currentProblemVariant === 'PROOF') {
    // =========================================================================
    // DẠNG 1: BÀI TOÁN CHỨNG MINH LÝ THUYẾT (10 BÀI DẠNG CHUẨN SGK / SHAPE)
    // =========================================================================
    if (shapeId === 'SHAPE_SQUARE') {
      const pBank = [
        {
          stmt: `Cho tứ giác ABCD có 4 cạnh bằng nhau AB = BC = CD = DA = ${m.dAB} cm và góc ∠A = 90°. Hai đường chéo AC = BD = ${m.dAC} cm cắt nhau tại O.`,
          hyp: [`AB = BC = CD = DA = ${m.dAB} cm`, `∠A = ${m.aA}° (= 90°)`, `AC cắt BD tại O`],
          concl: [`a) Chứng minh ABCD là hình vuông`, `b) Chứng minh AC ⊥ BD tại O`],
          steps: [
            `<b>Bước 1:</b> Tứ giác ABCD có 4 cạnh bằng nhau nên là hình thoi.`,
            `<b>Bước 2:</b> Hình thoi ABCD lại có góc ∠A = 90° nên là hình vuông.`,
            `<b>Bước 3:</b> Trong hình vuông, 2 đường chéo bằng nhau AC = BD = ${m.dAC} cm và vuông góc với nhau tại trung điểm O.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Hai đường chéo AC và BD cắt nhau tại O. Chứng minh 4 tam giác △OAB, △OBC, △OCD, △ODA là 4 tam giác vuông cân bằng nhau.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `AC cắt BD tại O`],
          concl: [`a) Chứng minh OA = OB = OC = OD = ${(ac/2).toFixed(1)} cm`, `b) Chứng minh △OAB = △OBC = △OCD = △ODA và vuông cân`],
          steps: [
            `<b>Bước 1:</b> Hình vuông có 2 đường chéo vuông góc tại trung điểm O và AC = BD = ${m.dAC} cm, suy ra OA = OB = OC = OD = ${(ac/2).toFixed(1)} cm.`,
            `<b>Bước 2:</b> Các tam giác △OAB, △OBC, △OCD, △ODA có 2 cạnh bằng nhau và góc giữa bằng 90° nên là các tam giác vuông cân bằng nhau.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Trên AB lấy M, trên BC lấy N sao cho AM = BN = ${(ab*0.3).toFixed(1)} cm. Chứng minh AN = DM và AN ⊥ DM.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `AM = BN = ${(ab*0.3).toFixed(1)} cm`],
          concl: [`a) Chứng minh △ADM = △BAN`, `b) Chứng minh AN = DM và AN ⊥ DM`],
          steps: [
            `<b>Bước 1:</b> Xét △ADM và △BAN: AD = AB = ${m.dAB} cm, ∠DAB = ∠ABC = 90°, AM = BN. Do đó △ADM = △BAN (c-g-c).`,
            `<b>Bước 2:</b> Suy ra AN = DM. Gọi I là giao điểm AN và DM, ta có ∠ADM = ∠BAN $\Rightarrow$ ∠AID = 90° hay AN ⊥ DM.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Gọi E, F, G, H lần lượt là trung điểm của AB, BC, CD, DA. Chứng minh tứ giác EFGH là hình vuông.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `E, F, G, H là trung điểm 4 cạnh`],
          concl: [`a) Chứng minh EF = FG = GH = HE = ${(ab*Math.SQRT1_2).toFixed(1)} cm`, `b) Chứng minh EFGH là hình vuông`],
          steps: [
            `<b>Bước 1:</b> Bốn tam giác vuông △AHE, △BEF, △CFG, △DGH bằng nhau (2 cạnh góc vuông bằng nhau ${(ab/2).toFixed(1)} cm).`,
            `<b>Bước 2:</b> Suy ra 4 cạnh huyền bằng nhau EF = FG = GH = HE. Tứ giác EFGH là hình thoi.`,
            `<b>Bước 3:</b> Góc ∠HEF = 180° - 45° - 45° = 90°, hình thoi có 1 góc vuông là hình vuông.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Đường chéo AC cắt BD tại O. Kẻ OH ⊥ AB (H ∈ AB). Chứng minh H là trung điểm AB và OH = ${(ab/2).toFixed(1)} cm.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `O là tâm hình vuông, OH ⊥ AB`],
          concl: [`a) H là trung điểm AB`, `b) OH = ${(ab/2).toFixed(1)} cm`],
          steps: [
            `<b>Bước 1:</b> Tam giác OAB cân tại O (OA = OB). Đường cao OH đồng thời là đường trung tuyến, do đó H là trung điểm AB.`,
            `<b>Bước 2:</b> OH là đường trung bình tam giác ABC $\Rightarrow$ OH = BC / 2 = ${(ab/2).toFixed(1)} cm.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Kẻ AH ⊥ BD tại H. Chứng minh H trùng với giao điểm O của 2 đường chéo, suy ra HB = HD = ${(bd/2).toFixed(1)} cm.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `AH ⊥ BD tại H`],
          concl: [`a) H chính là giao điểm O của 2 đường chéo`, `b) HB = HD = ${(bd/2).toFixed(1)} cm`],
          steps: [
            `<b>Bước 1:</b> Trong hình vuông ABCD, hai đường chéo AC ⊥ BD tại O. Vì qua A chỉ vẽ được 1 đường vuông góc với BD nên H trùng O.`,
            `<b>Bước 2:</b> Do O là trung điểm BD nên HB = HD = BD / 2 = ${(bd/2).toFixed(1)} cm.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD. Trên đường chéo AC lấy P. Kẻ PE ⊥ AB, PF ⊥ AD. Chứng minh AEPF là hình chữ nhật và EF = AP.`,
          hyp: [`Hình vuông ABCD`, `P ∈ AC, PE ⊥ AB, PF ⊥ AD`],
          concl: [`a) Tứ giác AEPF là hình chữ nhật`, `b) EF = AP`],
          steps: [
            `<b>Bước 1:</b> Tứ giác AEPF có 3 góc vuông ∠E = ∠A = ∠F = 90° nên AEPF là hình chữ nhật.`,
            `<b>Bước 2:</b> Hai đường chéo hình chữ nhật AEPF bằng nhau nên EF = AP.`
          ]
        },
        {
          stmt: `Cho tam giác ABC vuông cân tại B (AB = BC = ${m.dAB} cm). Dựng điểm D sao cho AD ⊥ AB và CD ⊥ BC. Chứng minh ABCD là hình vuông.`,
          hyp: [`△ABC vuông cân tại B (AB = BC = ${m.dAB} cm)`, `AD ⊥ AB, CD ⊥ BC`],
          concl: [`a) Tứ giác ABCD có 4 góc vuông`, `b) ABCD là hình vuông cạnh ${m.dAB} cm`],
          steps: [
            `<b>Bước 1:</b> Tứ giác ABCD có 3 góc vuông ∠B = ∠A = ∠C = 90° nên ABCD là hình chữ nhật.`,
            `<b>Bước 2:</b> Hình chữ nhật ABCD có 2 cạnh kề bằng nhau AB = BC = ${m.dAB} cm nên là hình vuông.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD cạnh ${m.dAB} cm. Dựng tam giác đều ABE dựng ra phía ngoài hình vuông. Chứng minh tam giác DEC cân tại E và ∠DEC = 150°.`,
          hyp: [`Hình vuông ABCD cạnh ${m.dAB} cm`, `△ABE đều nằm ngoài ABCD`],
          concl: [`a) △ADE = △BCE`, `b) △DEC cân tại E và ∠DEC = 150°`],
          steps: [
            `<b>Bước 1:</b> AE = BE = AB = AD = BC = ${m.dAB} cm. ∠DAE = 90° + 60° = 150°.`,
            `<b>Bước 2:</b> △ADE cân tại A $\Rightarrow$ ∠ADE = (180° - 150°)/2 = 15°. Tương tự ∠BCE = 15°.`,
            `<b>Bước 3:</b> DE = CE $\Rightarrow$ △DEC cân tại E và ∠DEC = 180° - 2×15° = 150°.`
          ]
        },
        {
          stmt: `Cho hình vuông ABCD có đường chéo AC = BD = ${m.dAC} cm. Chứng minh tổng bình phương 4 cạnh AB² + BC² + CD² + DA² = 2 × AC².`,
          hyp: [`Hình vuông ABCD`, `Đường chéo AC = BD = ${m.dAC} cm`],
          concl: [`a) Biểu diễn cạnh AB theo AC`, `b) AB² + BC² + CD² + DA² = 2 × AC²`],
          steps: [
            `<b>Bước 1:</b> Áp dụng Pythagore: AC² = AB² + BC² = 2 × AB² (do AB = BC).`,
            `<b>Bước 2:</b> Tổng 4 cạnh: AB² + BC² + CD² + DA² = 4 × AB² = 2 × (2 × AB²) = 2 × AC².`
          ]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    } else if (shapeId === 'SHAPE_RECTANGLE') {
      const pBank = [
        {
          stmt: `Cho tứ giác ABCD có ∠A = ∠B = ∠C = 90°, AB = CD = ${m.dAB} cm, BC = DA = ${m.dBC} cm. Chứng minh ABCD là hình chữ nhật.`,
          hyp: [`∠A = ∠B = ∠C = 90°`, `AB = CD = ${m.dAB} cm, BC = DA = ${m.dBC} cm`],
          concl: [`a) Tứ giác ABCD có 4 góc vuông`, `b) ABCD là hình chữ nhật`],
          steps: [
            `<b>Bước 1:</b> Tổng các góc tứ giác = 360° $\Rightarrow$ ∠D = 360° - 270° = 90°.`,
            `<b>Bước 2:</b> Tứ giác có 3 góc vuông là hình chữ nhật.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD có AB = ${m.dAB} cm, BC = ${m.dBC} cm. Chứng minh 2 đường chéo AC = BD = ${m.dAC} cm và cắt nhau tại trung điểm O.`,
          hyp: [`Hình chữ nhật ABCD`, `AB = ${m.dAB} cm, BC = ${m.dBC} cm`],
          concl: [`a) AC = BD = ${m.dAC} cm`, `b) O là trung điểm AC và BD`],
          steps: [
            `<b>Bước 1:</b> △ABC = △BAD (c-g-c) vì AB chung, BC = AD, ∠B = ∠A = 90° $\Rightarrow$ AC = BD.`,
            `<b>Bước 2:</b> Hình chữ nhật là hình bình hành nên 2 đường chéo cắt nhau tại trung điểm O.`
          ]
        },
        {
          stmt: `Cho hình bình hành ABCD có AC = BD = ${m.dAC} cm. Chứng minh ABCD là hình chữ nhật.`,
          hyp: [`Hình bình hành ABCD`, `AC = BD = ${m.dAC} cm`],
          concl: [`ABCD là hình chữ nhật`],
          steps: [
            `<b>Bước 1:</b> Xét △ABC và △BAD có AB chung, BC = AD, AC = BD $\Rightarrow$ △ABC = △BAD (c-c-c).`,
            `<b>Bước 2:</b> ∠ABC = ∠BAD. Mà ∠ABC + ∠BAD = 180° $\Rightarrow$ ∠ABC = ∠BAD = 90° $\Rightarrow$ ABCD là hình chữ nhật.`
          ]
        },
        {
          stmt: `Cho tam giác ABC vuông tại A. Gọi M là trung điểm BC. D đối xứng với A qua M. Chứng minh ABDC là hình chữ nhật.`,
          hyp: [`△ABC vuông tại A`, `M là trung điểm BC, D đối xứng A qua M`],
          concl: [`a) Tứ giác ABDC là hình bình hành`, `b) ABDC là hình chữ nhật`],
          steps: [
            `<b>Bước 1:</b> M là trung điểm BC và AD $\Rightarrow$ ABDC là hình bình hành.`,
            `<b>Bước 2:</b> Hình bình hành ABDC có ∠A = 90° $\Rightarrow$ ABDC là hình chữ nhật.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD. Kẻ AE ⊥ BD, CF ⊥ BD (E, F ∈ BD). Chứng minh AE = CF và AECF là hình bình hành.`,
          hyp: [`Hình chữ nhật ABCD`, `AE ⊥ BD, CF ⊥ BD`],
          concl: [`a) △ADE = △CBF`, `b) AECF là hình bình hành`],
          steps: [
            `<b>Bước 1:</b> △ADE = △CBF (cạnh huyền - góc nhọn: AD = BC, ∠ADE = ∠CBF).`,
            `<b>Bước 2:</b> AE = CF và AE // CF (cùng ⊥ BD) $\Rightarrow$ AECF là hình bình hành.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD. Gọi M, N, P, Q lần lượt là trung điểm AB, BC, CD, DA. Chứng minh MNPQ là hình thoi.`,
          hyp: [`Hình chữ nhật ABCD`, `M, N, P, Q là trung điểm 4 cạnh`],
          concl: [`MN = NP = PQ = QM`, `MNPQ là hình thoi`],
          steps: [
            `<b>Bước 1:</b> 4 tam giác vuông △AQM = △BMN = △CNP = △DPQ (2 cạnh góc vuông bằng nhau).`,
            `<b>Bước 2:</b> Suy ra 4 cạnh huyền MN = NP = PQ = QM $\Rightarrow$ MNPQ là hình thoi.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD (AB = ${m.dAB} cm, BC = ${m.dBC} cm). Kẻ BH ⊥ AC tại H. Chứng minh △ABH ~ △ACB.`,
          hyp: [`Hình chữ nhật ABCD`, `BH ⊥ AC tại H`],
          concl: [`a) △ABH ~ △ACB`, `b) AB² = AH × AC`],
          steps: [
            `<b>Bước 1:</b> Xét △ABH và △ACB: ∠AHB = ∠BAC = 90°, ∠A chung $\Rightarrow$ △ABH ~ △ACB (g-g).`,
            `<b>Bước 2:</b> Tỉ số đồng dạng: AB / AC = AH / AB $\Rightarrow$ AB² = AH × AC.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD tâm O. Chứng minh O cách đều 4 đỉnh A, B, C, D (OA = OB = OC = OD = ${(ac/2).toFixed(1)} cm).`,
          hyp: [`Hình chữ nhật ABCD tâm O`, `AC = BD = ${m.dAC} cm`],
          concl: [`OA = OB = OC = OD = ${(ac/2).toFixed(1)} cm`],
          steps: [
            `<b>Bước 1:</b> O là trung điểm 2 đường chéo AC và BD.`,
            `<b>Bước 2:</b> AC = BD $\Rightarrow$ OA = OC = AC/2 = BD/2 = OB = OD = ${(ac/2).toFixed(1)} cm.`
          ]
        },
        {
          stmt: `Chứng minh các đường phân giác của 4 góc trong hình bình hành cắt nhau tạo thành một hình chữ nhật.`,
          hyp: [`Hình bình hành ABCD`, `4 đường phân giác góc trong cắt nhau tại M, N, P, Q`],
          concl: [`Tứ giác MNPQ là hình chữ nhật`],
          steps: [
            `<b>Bước 1:</b> Tổng 2 góc kề bù = 180° $\Rightarrow$ góc tạo bởi 2 phân giác = 90°.`,
            `<b>Bước 2:</b> Tứ giác MNPQ có 3 góc vuông nên là hình chữ nhật.`
          ]
        },
        {
          stmt: `Cho hình chữ nhật ABCD. Gọi I là trung điểm CD. Chứng minh tam giác AIB cân tại I.`,
          hyp: [`Hình chữ nhật ABCD`, `I là trung điểm CD`],
          concl: [`a) △ADI = △BCI`, `b) IA = IB (△AIB cân tại I)`],
          steps: [
            `<b>Bước 1:</b> Xét △ADI và △BCI: AD = BC, ∠D = ∠C = 90°, DI = CI $\Rightarrow$ △ADI = △BCI (c-g-c).`,
            `<b>Bước 2:</b> Suy ra IA = IB $\Rightarrow$ tam giác AIB cân tại I.`
          ]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    } else if (shapeId === 'SHAPE_RHOMBUS') {
      const pBank = [
        {
          stmt: `Cho tứ giác ABCD có 4 cạnh bằng nhau AB = BC = CD = DA = ${m.dAB} cm. Chứng minh ABCD là hình thoi.`,
          hyp: [`AB = BC = CD = DA = ${m.dAB} cm`],
          concl: [`ABCD là hình thoi`],
          steps: [
            `<b>Bước 1:</b> Theo định nghĩa SGK Toán 8: Tứ giác có 4 cạnh bằng nhau là hình thoi.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD tâm O (AC = ${m.dAC} cm, BD = ${m.dBD} cm). Chứng minh AC ⊥ BD tại O.`,
          hyp: [`Hình thoi ABCD tâm O`],
          concl: [`AC ⊥ BD tại O`, `O là trung điểm AC và BD`],
          steps: [
            `<b>Bước 1:</b> △ABC cân tại B (AB = BC). BO là trung tuyến $\Rightarrow$ BO ⊥ AC hay BD ⊥ AC.`,
            `<b>Bước 2:</b> O là trung điểm mỗi đường chéo.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD. Chứng minh AC là tia phân giác góc ∠A và góc ∠C.`,
          hyp: [`Hình thoi ABCD`],
          concl: [`AC là tia phân giác ∠BAD và ∠BCD`],
          steps: [
            `<b>Bước 1:</b> △ABC cân tại B, đường cao BO đồng thời là phân giác $\Rightarrow$ AC chia đôi góc A và C.`
          ]
        },
        {
          stmt: `Cho hình bình hành ABCD có AC ⊥ BD. Chứng minh ABCD là hình thoi.`,
          hyp: [`Hình bình hành ABCD`, `AC ⊥ BD tại O`],
          concl: [`ABCD là hình thoi`],
          steps: [
            `<b>Bước 1:</b> O là trung điểm AC. BD ⊥ AC tại O $\Rightarrow$ BD là đường trung trực AC $\Rightarrow$ AB = BC.`,
            `<b>Bước 2:</b> Hình bình hành có 2 cạnh kề bằng nhau là hình thoi.`
          ]
        },
        {
          stmt: `Cho hình bình hành ABCD có AC là đường phân giác góc ∠A. Chứng minh ABCD là hình thoi.`,
          hyp: [`Hình bình hành ABCD`, `AC là phân giác ∠BAD`],
          concl: [`ABCD là hình thoi`],
          steps: [
            `<b>Bước 1:</b> AC là phân giác $\Rightarrow$ ∠BAC = ∠DAC. Mà ∠DAC = ∠BCA (so le trong) $\Rightarrow$ ∠BAC = ∠BCA.`,
            `<b>Bước 2:</b> △ABC cân tại B $\Rightarrow$ AB = BC $\Rightarrow$ ABCD là hình thoi.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD. Gọi M, N, P, Q là trung điểm AB, BC, CD, DA. Chứng minh MNPQ là hình chữ nhật.`,
          hyp: [`Hình thoi ABCD`, `M, N, P, Q là trung điểm 4 cạnh`],
          concl: [`Tứ giác MNPQ là hình chữ nhật`],
          steps: [
            `<b>Bước 1:</b> MN // AC, PQ // AC $\Rightarrow$ MN // PQ và MN = AC/2. Tương tự NP // BD $\Rightarrow$ MNPQ là hình bình hành.`,
            `<b>Bước 2:</b> Do AC ⊥ BD nên MN ⊥ NP $\Rightarrow$ MNPQ là hình chữ nhật.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD. Kẻ AH ⊥ CD, AK ⊥ BC (H ∈ CD, K ∈ BC). Chứng minh AH = AK.`,
          hyp: [`Hình thoi ABCD`, `AH ⊥ CD, AK ⊥ BC`],
          concl: [`a) △ABK = △ADH`, `b) AH = AK`],
          steps: [
            `<b>Bước 1:</b> △ABK = △ADH (cạnh huyền - góc nhọn: AB = AD, ∠B = ∠D).`,
            `<b>Bước 2:</b> Suy ra AH = AK.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD có ∠A = 60°, AB = ${m.dAB} cm. Chứng minh tam giác ABD là tam giác đều.`,
          hyp: [`Hình thoi ABCD`, `∠A = 60°, AB = ${m.dAB} cm`],
          concl: [`△ABD đều`, `BD = ${m.dAB} cm`],
          steps: [
            `<b>Bước 1:</b> △ABD cân tại A (AB = AD = ${m.dAB} cm).`,
            `<b>Bước 2:</b> Tam giác cân có 1 góc 60° là tam giác đều $\Rightarrow$ BD = AB = ${m.dAB} cm.`
          ]
        },
        {
          stmt: `Cho tam giác ABC cân tại A. M là trung điểm BC. D đối xứng với A qua M. Chứng minh ABDC là hình thoi.`,
          hyp: [`△ABC cân tại A`, `M trung điểm BC, D đối xứng A qua M`],
          concl: [`ABDC là hình thoi`],
          steps: [
            `<b>Bước 1:</b> ABDC có 2 đường chéo cắt nhau tại trung điểm M $\Rightarrow$ ABDC là hình bình hành.`,
            `<b>Bước 2:</b> △ABC cân tại A $\Rightarrow$ AM ⊥ BC $\Rightarrow$ AD ⊥ BC tại M $\Rightarrow$ ABDC là hình thoi.`
          ]
        },
        {
          stmt: `Cho hình thoi ABCD tâm O. Chứng minh 4 tam giác △OAB = △OBC = △OCD = △ODA.`,
          hyp: [`Hình thoi ABCD tâm O`],
          concl: [`△OAB = △OBC = △OCD = △ODA`],
          steps: [
            `<b>Bước 1:</b> 4 tam giác vuông tại O có 2 cạnh góc vuông bằng nhau từng đôi một OA = OC, OB = OD.`,
            `<b>Bước 2:</b> Suy ra 4 tam giác bằng nhau.`
          ]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    } else if (shapeId === 'SHAPE_PARALLELOGRAM') {
      const pBank = [
        {
          stmt: `Cho tứ giác ABCD có AB = CD = ${m.dAB} cm, BC = DA = ${m.dBC} cm. Chứng minh ABCD là hình bình hành.`,
          hyp: [`AB = CD = ${m.dAB} cm`, `BC = DA = ${m.dBC} cm`],
          concl: [`ABCD là hình bình hành`],
          steps: [`<b>Bước 1:</b> Tứ giác có các cạnh đối bằng nhau là hình bình hành (đpcm).`]
        },
        {
          stmt: `Cho tứ giác ABCD có AB // CD và AB = CD = ${m.dAB} cm. Chứng minh ABCD là hình bình hành.`,
          hyp: [`AB // CD`, `AB = CD = ${m.dAB} cm`],
          concl: [`ABCD là hình bình hành`],
          steps: [`<b>Bước 1:</b> Tứ giác có một cặp cạnh đối song song và bằng nhau là hình bình hành.`]
        },
        {
          stmt: `Cho tứ giác ABCD có ∠A = ∠C = ${m.aA}° và ∠B = ∠D = ${m.aB}°. Chứng minh ABCD là hình bình hành.`,
          hyp: [`∠A = ∠C = ${m.aA}°`, `∠B = ∠D = ${m.aB}°`],
          concl: [`ABCD là hình bình hành`],
          steps: [`<b>Bước 1:</b> Tứ giác có các góc đối bằng nhau là hình bình hành.`]
        },
        {
          stmt: `Cho tứ giác ABCD có 2 đường chéo AC và BD cắt nhau tại trung điểm O. Chứng minh ABCD là hình bình hành.`,
          hyp: [`AC cắt BD tại O`, `OA = OC, OB = OD`],
          concl: [`ABCD là hình bình hành`],
          steps: [`<b>Bước 1:</b> Tứ giác có 2 đường chéo cắt nhau tại trung điểm mỗi đường là hình bình hành.`]
        },
        {
          stmt: `Cho hình bình hành ABCD. Gọi E, F là trung điểm AB, CD. Chứng minh AECF là hình bình hành.`,
          hyp: [`Hình bình hành ABCD`, `E, F là trung điểm AB, CD`],
          concl: [`AECF là hình bình hành`],
          steps: [
            `<b>Bước 1:</b> AE = AB/2, CF = CD/2 $\Rightarrow$ AE = CF. Mặt khác AE // CF.`,
            `<b>Bước 2:</b> Tứ giác AECF có AE // CF và AE = CF nên là hình bình hành.`
          ]
        },
        {
          stmt: `Cho hình bình hành ABCD. Trên BD lấy E, F sao cho DE = BF. Chứng minh AECF là hình bình hành.`,
          hyp: [`Hình bình hành ABCD`, `DE = BF trên BD`],
          concl: [`AECF là hình bình hành`],
          steps: [
            `<b>Bước 1:</b> O là trung điểm BD $\Rightarrow$ OE = OF (vì OD = OB, DE = BF).`,
            `<b>Bước 2:</b> O là trung điểm AC và EF $\Rightarrow$ AECF là hình bình hành.`
          ]
        },
        {
          stmt: `Cho hình bình hành ABCD. Kẻ AE ⊥ BD, CF ⊥ BD. Chứng minh AE = CF và AE // CF.`,
          hyp: [`Hình bình hành ABCD`, `AE ⊥ BD, CF ⊥ BD`],
          concl: [`AE = CF và AE // CF`],
          steps: [
            `<b>Bước 1:</b> △ADE = △CBF (cạnh huyền - góc nhọn) $\Rightarrow$ AE = CF.`,
            `<b>Bước 2:</b> AE và CF cùng ⊥ BD $\Rightarrow$ AE // CF.`
          ]
        },
        {
          stmt: `Cho tam giác ABC. M là trung điểm BC. Lấy D sao cho M là trung điểm AD. Chứng minh ABDC là hình bình hành.`,
          hyp: [`△ABC`, `M trung điểm BC và AD`],
          concl: [`ABDC là hình bình hành`],
          steps: [`<b>Bước 1:</b> Tứ giác ABDC có 2 đường chéo cắt nhau tại trung điểm M nên là hình bình hành.`]
        },
        {
          stmt: `Cho hình bình hành ABCD. Gọi I, K lần lượt là hình chiếu của A, C trên BD. Chứng minh AI = CK.`,
          hyp: [`Hình bình hành ABCD`, `AI ⊥ BD, CK ⊥ BD`],
          concl: [`AI = CK`],
          steps: [`<b>Bước 1:</b> △ABI = △CDK (cạnh huyền - góc nhọn: AB = CD, ∠ABI = ∠CDK) $\Rightarrow$ AI = CK.`]
        },
        {
          stmt: `Chứng minh hai góc kề một cạnh của hình bình hành bù nhau (∠A + ∠B = 180°).`,
          hyp: [`Hình bình hành ABCD (AD // BC)`],
          concl: [`∠A + ∠B = 180°`],
          steps: [`<b>Bước 1:</b> Vì AD // BC nên ∠A và ∠B là hai góc trong cùng phía bù nhau $\Rightarrow$ ∠A + ∠B = 180°.`]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    } else if (shapeId === 'SHAPE_ISOSCELES_TRAPEZOID') {
      const pBank = [
        {
          stmt: `Cho hình thang ABCD (AB // CD) có ∠D = ∠C = ${m.aD}°. Chứng minh ABCD là hình thang cân.`,
          hyp: [`Hình thang ABCD (AB // CD)`, `∠D = ∠C = ${m.aD}°`],
          concl: [`ABCD là hình thang cân`],
          steps: [`<b>Bước 1:</b> Hình thang có 2 góc kề một đáy bằng nhau là hình thang cân.`]
        },
        {
          stmt: `Cho hình thang ABCD (AB // CD) có AC = BD = ${m.dAC} cm. Chứng minh ABCD là hình thang cân.`,
          hyp: [`Hình thang ABCD (AB // CD)`, `AC = BD = ${m.dAC} cm`],
          concl: [`ABCD là hình thang cân`],
          steps: [`<b>Bước 1:</b> Hình thang có 2 đường chéo bằng nhau là hình thang cân.`]
        },
        {
          stmt: `Cho hình thang cân ABCD (AB // CD). Chứng minh 2 cạnh bên bằng nhau AD = BC = ${m.dDA} cm.`,
          hyp: [`Hình thang cân ABCD (AB // CD)`],
          concl: [`AD = BC = ${m.dDA} cm`],
          steps: [`<b>Bước 1:</b> Trong hình thang cân, hai cạnh bên bằng nhau.`]
        },
        {
          stmt: `Cho hình thang cân ABCD. Kẻ AH ⊥ CD, BK ⊥ CD. Chứng minh △ADH = △BCK và DH = CK.`,
          hyp: [`Hình thang cân ABCD`, `AH ⊥ CD, BK ⊥ CD`],
          concl: [`△ADH = △BCK`, `DH = CK`],
          steps: [`<b>Bước 1:</b> △ADH = △BCK (cạnh huyền - góc nhọn: AD = BC, ∠D = ∠C) $\Rightarrow$ DH = CK.`]
        },
        {
          stmt: `Cho hình thang cân ABCD. O là giao điểm AC và BD. Chứng minh △OAB và △OCD là tam giác cân.`,
          hyp: [`Hình thang cân ABCD`, `AC cắt BD tại O`],
          concl: [`△OAB cân tại O`, `△OCD cân tại O`],
          steps: [`<b>Bước 1:</b> ∠ADC = ∠BCD và AC = BD $\Rightarrow$ △ADC = △BCD $\Rightarrow$ ∠ACD = ∠BDC $\Rightarrow$ △OCD cân tại O. Tương tự △OAB cân.`]
        },
        {
          stmt: `Cho hình thang cân ABCD (AB // CD). M, N là trung điểm AB, CD. Chứng minh MN ⊥ AB và MN ⊥ CD.`,
          hyp: [`Hình thang cân ABCD`, `M, N là trung điểm AB, CD`],
          concl: [`MN ⊥ AB, MN ⊥ CD`],
          steps: [`<b>Bước 1:</b> Đường nối trung điểm 2 đáy là trục đối xứng của hình thang cân, vuông góc với 2 đáy.`]
        },
        {
          stmt: `Cho △ABC cân tại A. Kẻ DE // BC (D ∈ AB, E ∈ AC). Chứng minh BDEC là hình thang cân.`,
          hyp: [`△ABC cân tại A`, `DE // BC`],
          concl: [`BDEC là hình thang cân`],
          steps: [`<b>Bước 1:</b> DE // BC $\Rightarrow$ BDEC là hình thang. ∠B = ∠C (△ABC cân) $\Rightarrow$ BDEC là hình thang cân.`]
        },
        {
          stmt: `Cho hình thang cân ABCD (AB // CD). Gọi E là giao điểm kéo dài AD và BC. Chứng minh △EDC cân tại E.`,
          hyp: [`Hình thang cân ABCD`, `E là giao điểm AD và BC`],
          concl: [`△EDC cân tại E`],
          steps: [`<b>Bước 1:</b> ∠EDC = ∠ECD (do ∠ADC = ∠BCD) $\Rightarrow$ △EDC cân tại E.`]
        },
        {
          stmt: `Chứng minh tứ giác có 2 đường chéo bằng nhau và 2 đáy song song là hình thang cân.`,
          hyp: [`Tứ giác ABCD (AB // CD)`, `AC = BD`],
          concl: [`ABCD là hình thang cân`],
          steps: [`<b>Bước 1:</b> Hình thang có 2 đường chéo bằng nhau là hình thang cân.`]
        },
        {
          stmt: `Chứng minh hình thang cân ABCD nội tiếp được trong đường tròn.`,
          hyp: [`Hình thang cân ABCD (AB // CD)`],
          concl: [`Tứ giác ABCD nội tiếp đường tròn`],
          steps: [`<b>Bước 1:</b> ∠A + ∠C = 180° (do ∠A + ∠D = 180° và ∠D = ∠C) $\Rightarrow$ tứ giác có tổng 2 góc đối = 180° nên nội tiếp được.`]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    } else {
      // Shape tổng quát / Hình thang khác
      const pBank = [
        {
          stmt: `Cho tứ giác ABCD có AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm; ∠A = ${m.aA}°, ∠B = ${m.aB}°, ∠C = ${m.aC}°. Tính góc ∠D.`,
          hyp: [`Số đo 4 cạnh: ${m.dAB}, ${m.dBC}, ${m.dCD}, ${m.dDA} cm`, `Góc: ∠A = ${m.aA}°, ∠B = ${m.aB}°, ∠C = ${m.aC}°`],
          concl: [`∠D = ${m.aD}°`],
          steps: [`<b>Bước 1:</b> Tổng 4 góc trong tứ giác = 360° $\Rightarrow$ ∠D = 360° - (${m.aA}° + ${m.aB}° + ${m.aC}°) = ${m.aD}°.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Chứng minh tổng 4 góc ngoài của tứ giác bằng 360°.`,
          hyp: [`Tứ giác ABCD lồi`],
          concl: [`Tổng 4 góc ngoài = 360°`],
          steps: [`<b>Bước 1:</b> Mỗi góc ngoài kề bù với 1 góc trong: (180° - A) + (180° - B) + (180° - C) + (180° - D) = 720° - 360° = 360°.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Chứng minh AB + BC + CD + DA > AC + BD.`,
          hyp: [`Tứ giác ABCD lồi`],
          concl: [`Chu vi P > AC + BD`],
          steps: [`<b>Bước 1:</b> Áp dụng bất đẳng thức tam giác trong △ABC, △ADC, △ABD, △BCD $\Rightarrow$ Chu vi lớn hơn tổng 2 đường chéo.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Gọi O là giao điểm AC và BD. Chứng minh AC + BD < AB + BC + CD + DA.`,
          hyp: [`Tứ giác ABCD`, `AC cắt BD tại O`],
          concl: [`OA + OB + OC + OD < P`],
          steps: [`<b>Bước 1:</b> OA + OB < AB, OB + OC < BC, OC + OD < CD, OD + OA < DA. Cộng lại $\Rightarrow$ AC + BD < Chu vi.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Gọi E, F, G, H là trung điểm AB, BC, CD, DA. Chứng minh EFGH là hình bình hành.`,
          hyp: [`Tứ giác ABCD lồi`, `E, F, G, H là trung điểm 4 cạnh`],
          concl: [`EFGH là hình bình hành (Varignon)`],
          steps: [`<b>Bước 1:</b> EF // AC, GH // AC, EF = GH = AC/2 $\Rightarrow$ EFGH là hình bình hành Varignon.`]
        },
        {
          stmt: `Cho hình thang ABCD (AB // CD). Chứng minh ∠A + ∠D = 180° và ∠B + ∠C = 180°.`,
          hyp: [`Hình thang ABCD (AB // CD)`],
          concl: [`∠A + ∠D = 180°`, `∠B + ∠C = 180°`],
          steps: [`<b>Bước 1:</b> Do AB // CD nên hai góc trong cùng phía bù nhau.`]
        },
        {
          stmt: `Cho hình thang ABCD (AB // CD) có AB = ${m.dAB} cm, CD = ${m.dCD} cm. Đường trung bình MN nối trung điểm 2 cạnh bên. Tính MN.`,
          hyp: [`Hình thang ABCD (AB // CD)`, `AB = ${m.dAB} cm, CD = ${m.dCD} cm`],
          concl: [`MN = ${((ab+cd)/2).toFixed(1)} cm`],
          steps: [`<b>Bước 1:</b> MN = (AB + CD) / 2 = (${m.dAB} + ${m.dCD}) / 2 = ${((ab+cd)/2).toFixed(1)} cm.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Gọi M, N là trung điểm AB, CD. Chứng minh MN ≤ (AD + BC)/2.`,
          hyp: [`Tứ giác ABCD`, `M, N trung điểm AB, CD`],
          concl: [`MN ≤ (AD + BC)/2`],
          steps: [`<b>Bước 1:</b> Gọi K là trung điểm AC. MK = BC/2, KN = AD/2. MN ≤ MK + KN = (AD + BC)/2.`]
        },
        {
          stmt: `Cho hình thang ABCD (AB // CD). Gọi I, K là trung điểm 2 đường chéo AC, BD. Tính IK.`,
          hyp: [`Hình thang ABCD (AB // CD)`, `I, K là trung điểm AC, BD`],
          concl: [`IK = |CD - AB| / 2`],
          steps: [`<b>Bước 1:</b> IK = (CD - AB) / 2 = |${m.dCD} - ${m.dAB}| / 2 = ${(Math.abs(cd-ab)/2).toFixed(1)} cm.`]
        },
        {
          stmt: `Cho tứ giác ABCD. Chứng minh nếu 2 đường chéo AC ⊥ BD thì AB² + CD² = BC² + DA².`,
          hyp: [`Tứ giác ABCD`, `AC ⊥ BD tại O`],
          concl: [`AB² + CD² = BC² + DA²`],
          steps: [`<b>Bước 1:</b> Áp dụng Pythagore cho 4 tam giác vuông tại O $\Rightarrow$ OA² + OB² + OC² + OD² cho cả 2 vế bằng nhau.`]
        }
      ];
      const p = pBank[seedIdx];
      stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;
    }

  } else if (currentProblemVariant === 'CALC') {
    // =========================================================================
    // DẠNG 2: BÀI TOÁN TÍNH TOÁN (10 BÀI TÍNH SỐ ĐO SỐNG BÀN VẼ / SHAPE)
    // =========================================================================
    let areaVal = 0;
    let areaFormula = '';

    if (shapeId === 'SHAPE_SQUARE') {
      areaVal = (ab * ab).toFixed(1);
      areaFormula = `S = AB² = ${ab} × ${ab} = ${areaVal} cm²`;
    } else if (shapeId === 'SHAPE_RECTANGLE') {
      areaVal = (ab * bc).toFixed(1);
      areaFormula = `S = AB × BC = ${ab} × ${bc} = ${areaVal} cm²`;
    } else if (shapeId === 'SHAPE_RHOMBUS') {
      areaVal = (0.5 * ac * bd).toFixed(1);
      areaFormula = `S = (1/2) × AC × BD = (1/2) × ${ac} × ${bd} = ${areaVal} cm²`;
    } else if (shapeId === 'SHAPE_PARALLELOGRAM') {
      const radA = (aA * Math.PI) / 180;
      const h = (da * Math.sin(radA)).toFixed(1);
      areaVal = (ab * parseFloat(h)).toFixed(1);
      areaFormula = `S = AB × h = ${ab} × ${h} = ${areaVal} cm²`;
    } else {
      const radD = (aD * Math.PI) / 180;
      const h = (da * Math.sin(radD)).toFixed(1);
      areaVal = (0.5 * (ab + cd) * parseFloat(h)).toFixed(1);
      areaFormula = `S = ((AB + CD) × h)/2 = ((${ab} + ${cd}) × ${h})/2 = ${areaVal} cm²`;
    }

    const cBank = [
      {
        stmt: `[Dạng 2 - Bài 1/10: Chu vi & Diện tích] Cho ${shapeName} ABCD có AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm. Hãy tính chu vi P và diện tích S của hình này.`,
        hyp: [`Cạnh: AB = ${m.dAB}, BC = ${m.dBC}, CD = ${m.dCD}, DA = ${m.dDA} cm`, `Đường chéo: AC = ${m.dAC}, BD = ${m.dBD} cm`],
        concl: [`a) Chu vi P = ${perim} cm`, `b) Diện tích ${areaFormula}`],
        steps: [
          `<b>Bước 1 (Tính chu vi):</b> P = AB + BC + CD + DA = ${m.dAB} + ${m.dBC} + ${m.dCD} + ${m.dDA} = <b>${perim} cm</b>.`,
          `<b>Bước 2 (Tính diện tích):</b> Áp dụng công thức: <b>${areaFormula}</b>.`
        ]
      },
      {
        stmt: `[Dạng 2 - Bài 2/10: Tổng hai đường chéo] Cho ${shapeName} ABCD đang có 2 đường chéo trên bàn vẽ AC = ${m.dAC} cm và BD = ${m.dBD} cm. Tính tổng độ dài 2 đường chéo và khoảng cách từ tâm O đến các đỉnh.`,
        hyp: [`AC = ${m.dAC} cm, BD = ${m.dBD} cm`, `O là giao điểm AC và BD`],
        concl: [`a) Tổng AC + BD = ${(ac + bd).toFixed(1)} cm`, `b) Bán kính ngoại tiếp OA ≈ ${(ac/2).toFixed(1)} cm`],
        steps: [
          `<b>Bước 1:</b> AC + BD = ${m.dAC} + ${m.dBD} = <b>${(ac + bd).toFixed(1)} cm</b>.`,
          `<b>Bước 2:</b> OA = AC / 2 = ${m.dAC} / 2 = <b>${(ac/2).toFixed(1)} cm</b>.`
        ]
      },
      {
        stmt: `[Dạng 2 - Bài 3/10: Diện tích 4 tam giác con] Cho ${shapeName} ABCD có hai đường chéo AC và BD cắt nhau tại O. Tính diện tích tam giác con △OAB tạo bởi hai đường chéo.`,
        hyp: [`Diện tích toàn phần S = ${areaVal} cm²`, `AC cắt BD tại O`],
        concl: [`a) Diện tích toàn phần S = ${areaVal} cm²`, `b) S(△OAB) = S / 4 = ${(parseFloat(areaVal)/4).toFixed(1)} cm²`],
        steps: [
          `<b>Bước 1:</b> Diện tích toàn phần S = ${areaFormula}.`,
          `<b>Bước 2:</b> Hai đường chéo chia tứ giác thành 4 tam giác nhỏ có diện tích bằng nhau: S(△OAB) = ${areaVal} / 4 = <b>${(parseFloat(areaVal)/4).toFixed(1)} cm²</b>.`
        ]
      },
      {
        stmt: `[Dạng 2 - Bài 4/10: Kiểm tra góc kề & tổng góc] Cho ${shapeName} ABCD có góc ∠A = ${m.aA}°, ∠B = ${m.aB}°. Tính các góc còn lại và kiểm tra tổng 4 góc trong.`,
        hyp: [`∠A = ${m.aA}°, ∠B = ${m.aB}°`],
        concl: [`a) ∠C = ${m.aC}°, ∠D = ${m.aD}°`, `b) Tổng 4 góc = 360°`],
        steps: [
          `<b>Bước 1:</b> Góc kề bù ∠B = 180° - ∠A = 180° - ${m.aA}° = ${m.aB}°.`,
          `<b>Bước 2:</b> Tổng 4 góc = ${m.aA}° + ${m.aB}° + ${m.aC}° + ${m.aD}° = <b>${aA + aB + aC + aD}°</b>.`
        ]
      },
      {
        stmt: `[Dạng 2 - Bài 5/10: Chiều cao & Đường trung bình] Cho ${shapeName} ABCD có AB = ${m.dAB} cm, CD = ${m.dCD} cm. Tính độ dài đường trung bình MN nối trung điểm 2 cạnh bên.`,
        hyp: [`AB = ${m.dAB} cm, CD = ${m.dCD} cm`],
        concl: [`Độ dài đường trung bình MN = ${((ab+cd)/2).toFixed(1)} cm`],
        steps: [
          `<b>Bước 1:</b> Công thức đường trung bình: MN = (AB + CD) / 2 = (${m.dAB} + ${m.dCD}) / 2 = <b>${((ab+cd)/2).toFixed(1)} cm</b>.`
        ]
      },
      {
        stmt: `[Dạng 2 - Bài 6/10: Tỉ số chu vi & diện tích] Cho ${shapeName} ABCD có AB = ${m.dAB} cm, BC = ${m.dBC} cm. Tính tỉ số giữa chu vi P và diện tích S của hình trên.`,
        hyp: [`P = ${perim} cm`, `S = ${areaVal} cm²`],
        concl: [`Tỉ số P / S = ${(parseFloat(perim)/parseFloat(areaVal)).toFixed(2)}`],
        steps: [`<b>Bước 1:</b> P / S = ${perim} / ${areaVal} = <b>${(parseFloat(perim)/parseFloat(areaVal)).toFixed(2)}</b>.`]
      },
      {
        stmt: `[Dạng 2 - Bài 7/10: Diện tích hình trung điểm] Cho ${shapeName} ABCD có diện tích S = ${areaVal} cm². Gọi E, F, G, H là trung điểm 4 cạnh. Tính diện tích tứ giác EFGH.`,
        hyp: [`S(ABCD) = ${areaVal} cm²`, `E, F, G, H là trung điểm 4 cạnh`],
        concl: [`S(EFGH) = S / 2 = ${(parseFloat(areaVal)/2).toFixed(1)} cm²`],
        steps: [`<b>Bước 1:</b> Tứ giác tạo bởi trung điểm 4 cạnh có diện tích bằng một nửa diện tích ban đầu: S(EFGH) = ${areaVal} / 2 = <b>${(parseFloat(areaVal)/2).toFixed(1)} cm²</b>.`]
      },
      {
        stmt: `[Dạng 2 - Bài 8/10: Độ dài đường cao từ đỉnh A] Cho ${shapeName} ABCD có diện tích S = ${areaVal} cm² và đáy AB = ${m.dAB} cm. Tính chiều cao h hạ từ A xuống đáy CD.`,
        hyp: [`S = ${areaVal} cm²`, `Đáy AB = ${m.dAB} cm`],
        concl: [`Chiều cao h = S / AB = ${(parseFloat(areaVal)/ab).toFixed(1)} cm`],
        steps: [`<b>Bước 1:</b> h = S / AB = ${areaVal} / ${m.dAB} = <b>${(parseFloat(areaVal)/ab).toFixed(1)} cm</b>.`]
      },
      {
        stmt: `[Dạng 2 - Bài 9/10: Bán kính đường tròn ngoại tiếp O] Cho ${shapeName} ABCD có đường chéo AC = ${m.dAC} cm. Tính bán kính R của đường tròn ngoại tiếp đi qua các đỉnh.`,
        hyp: [`Đường chéo AC = ${m.dAC} cm`],
        concl: [`Bán kính R = AC / 2 = ${(ac/2).toFixed(1)} cm`],
        steps: [`<b>Bước 1:</b> R = AC / 2 = ${m.dAC} / 2 = <b>${(ac/2).toFixed(1)} cm</b>.`]
      },
      {
        stmt: `[Dạng 2 - Bài 10/10: Tổng bình phương 4 cạnh] Cho ${shapeName} ABCD có các cạnh AB = ${m.dAB} cm, BC = ${m.dBC} cm, CD = ${m.dCD} cm, DA = ${m.dDA} cm. Tính tổng bình phương 4 cạnh AB² + BC² + CD² + DA².`,
        hyp: [`Các cạnh: ${m.dAB}, ${m.dBC}, ${m.dCD}, ${m.dDA} cm`],
        concl: [`Tổng bình phương = ${(ab**2 + bc**2 + cd**2 + da**2).toFixed(1)} cm²`],
        steps: [`<b>Bước 1:</b> AB² + BC² + CD² + DA² = ${(ab**2).toFixed(1)} + ${(bc**2).toFixed(1)} + ${(cd**2).toFixed(1)} + ${(da**2).toFixed(1)} = <b>${(ab**2 + bc**2 + cd**2 + da**2).toFixed(1)} cm²</b>.`]
      }
    ];
    const p = cBank[seedIdx];
    stmt = p.stmt; hyp = p.hyp; concl = p.concl; steps = p.steps;

  } else {
    // =========================================================================
    // DẠNG 3: BÀI TOÁN ỨNG DỤNG THỰC TẾ (10 KỊCH BẢN THỰC TẾ PHONG PHÚ / SHAPE)
    // =========================================================================
    if (shapeId === 'SHAPE_SQUARE') {
      const rBank = [
        { title: 'Gói bánh chưng Tết', desc: `Chiếc bánh chưng vuông ABCD có cạnh ${m.dAB} cm. Buộc 2 dây lạt chéo AC và BD.`, q1: `Tính tổng độ dài 2 dây lạt chéo AC + BD.`, q2: `Tính diện tích phủ lá dong mặt trên.`, unit: 'cm' },
        { title: 'Lát gạch hoa trang trí sảnh', desc: `Viên gạch hoa hình vuông ABCD có cạnh ${m.dAB} cm.`, q1: `Tính diện tích 1 viên gạch.`, q2: `Tính số viên gạch cần để lát sàn 25m².`, unit: 'cm' },
        { title: 'Khung cửa sổ sắt vuông', desc: `Thợ cơ khí hàn khung cửa sổ hình vuông cạnh ${m.dAB} cm có 2 thanh sắt gia cố chéo AC, BD.`, q1: `Tính chu vi khung cửa.`, q2: `Tính độ dài thanh sắt chéo AC.`, unit: 'cm' },
        { title: 'Bàn cờ vua gỗ thủ công', desc: `Bàn cờ vua hình vuông ABCD cạnh ${m.dAB} cm gồm 64 ô vuông nhỏ.`, q1: `Tính diện tích toàn bàn cờ.`, q2: `Tính diện tích mỗi ô nhỏ.`, unit: 'cm' },
        { title: 'Sân chơi thảm cỏ nhân tạo', desc: `Khu sân chơi hình vuông ABCD cạnh ${m.dAB} m.`, q1: `Tính diện tích thảm cỏ cần mua.`, q2: `Tính chi phí với giá 150.000đ/m².`, unit: 'm' },
        { title: 'Mặt đồng hồ treo tường', desc: `Đồng hồ vuông ABCD cạnh ${m.dAB} cm có 2 kim tạo góc vuông tại tâm O.`, q1: `Tính diện tích 1 phần tư đồng hồ.`, q2: `Tính đường chéo mặt đồng hồ.`, unit: 'cm' },
        { title: 'Khung tranh nghệ thuật', desc: `Khung tranh gỗ vuông ABCD cạnh ${m.dAB} cm.`, q1: `Tính tổng chiều dài nẹp gỗ.`, q2: `Tính diện tích kính bảo vệ mặt tranh.`, unit: 'cm' },
        { title: 'Khay nướng bánh quy xuất khẩu', desc: `Khay nướng hình vuông cạnh ${m.dAB} cm xếp bánh quy vuông nhỏ cạnh ${(ab/4).toFixed(1)} cm.`, q1: `Tính diện tích khay nướng.`, q2: `Tính số bánh xếp vừa khay.`, unit: 'cm' },
        { title: 'Giếng trời nhà phố', desc: `Kính cường lực giếng trời hình vuông cạnh ${m.dAB} m.`, q1: `Tính diện tích tấm kính.`, q2: `Tính độ dài khung viền nhôm xingfa.`, unit: 'm' },
        { title: 'Nệm lò xo phòng ngủ', desc: `Tấm nệm lò xo vuông kích thước ${m.dAB} cm × ${m.dAB} cm.`, q1: `Tính diện tích ga phủ nệm.`, q2: `Tính chu vi đường may viền.`, unit: 'cm' }
      ];
      const sc = rBank[seedIdx];
      const area = (ab * ab).toFixed(1);
      stmt = `[Thực tế - ${sc.title}] ${sc.desc}`;
      hyp = [`Mô hình hình vuông ABCD cạnh ${m.dAB} ${sc.unit}`, `Đường chéo AC = BD = ${m.dAC} ${sc.unit}`];
      concl = [`a) ${sc.q1}`, `b) ${sc.q2}`];
      steps = [
        `<b>Bước 1:</b> Áp dụng tính chất hình vuông cạnh ${m.dAB} ${sc.unit}.`,
        `<b>Bước 2 (Giải câu a):</b> Chu vi viền P = 4 × ${m.dAB} = <b>${(ab*4).toFixed(1)} ${sc.unit}</b>. Tổng 2 đường chéo = <b>${(ac*2).toFixed(1)} ${sc.unit}</b>.`,
        `<b>Bước 3 (Giải câu b):</b> Diện tích mặt phủ S = AB² = ${m.dAB} × ${m.dAB} = <b>${area} ${sc.unit}²</b>.`
      ];
    } else if (shapeId === 'SHAPE_RECTANGLE') {
      const rBank = [
        { title: 'Thi công sân bóng đá mini', desc: `Sân bóng hình chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Sơn mảng tường trang trí', desc: `Mảng tường chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Tấm kính bàn làm việc', desc: `Tấm kính cường lực chữ nhật ABCD dài ${m.dAB} cm, rộng ${m.dBC} cm.`, unit: 'cm' },
        { title: 'Vườn rau gia đình', desc: `Vườn rau chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m cần rào lưới B40.`, unit: 'm' },
        { title: 'Màn hình LED ngoài trời', desc: `Màn hình quảng cáo chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Mái hiên di động cuốn', desc: `Mái bạt chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Thảm trải sàn phòng họp', desc: `Thảm chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Hồ bơi vô cực', desc: `Hồ bơi chữ nhật ABCD dài ${m.dAB} m, rộng ${m.dBC} m.`, unit: 'm' },
        { title: 'Hộp quà tặng nơ chéo', desc: `Nắp hộp chữ nhật ABCD dài ${m.dAB} cm, rộng ${m.dBC} cm.`, unit: 'cm' },
        { title: 'Bảng hiệu mika công ty', desc: `Bảng hiệu chữ nhật ABCD dài ${m.dAB} cm, rộng ${m.dBC} cm.`, unit: 'cm' }
      ];
      const sc = rBank[seedIdx];
      const area = (ab * bc).toFixed(1);
      const u = sc.unit;
      stmt = `[Thực tế - ${sc.title}] ${sc.desc} Hãy tính chu vi đường viền và diện tích công trình.`;
      hyp = [`Mô hình hình chữ nhật ABCD`, `Chiều dài AB = ${m.dAB} ${u}`, `Chiều rộng BC = ${m.dBC} ${u}`];
      concl = [`a) Chu vi P = 2 × (AB + BC)`, `b) Diện tích S = AB × BC`];
      steps = [
        `<b>Bước 1 (Chu vi):</b> P = 2 × (${m.dAB} + ${m.dBC}) = <b>${(2*(ab+bc)).toFixed(1)} ${u}</b>.`,
        `<b>Bước 2 (Diện tích):</b> S = ${m.dAB} × ${m.dBC} = <b>${area} ${u}²</b>.`,
        `<b>Bước 3 (Đường chéo gia cố):</b> AC = √(${m.dAB}² + ${m.dBC}²) ≈ <b>${m.dAC} ${u}</b>.`
      ];
    } else if (shapeId === 'SHAPE_RHOMBUS') {
      const area = (0.5 * ac * bd).toFixed(1);
      stmt = `[Thực tế - Thiết kế chiếc diều giấy / mặt đá hình thoi (Mẫu ${seedIdx + 1})] Mô hình hình thoi ABCD có 4 cạnh bằng nhau AB = ${m.dAB} cm và 2 đường chéo AC = ${m.dAC} cm, BD = ${m.dBD} cm.`;
      hyp = [`Hình thoi ABCD cạnh ${m.dAB} cm`, `Đường chéo AC = ${m.dAC} cm, BD = ${m.dBD} cm`];
      concl = [`a) Tính chu vi viền P = 4 × AB`, `b) Tính diện tích phủ S = (1/2) × AC × BD`];
      steps = [
        `<b>Bước 1 (Chu vi):</b> P = 4 × ${m.dAB} = <b>${(ab*4).toFixed(1)} cm</b>.`,
        `<b>Bước 2 (Diện tích):</b> S = (1/2) × ${m.dAC} × ${m.dBD} = <b>${area} cm²</b>.`
      ];
    } else if (shapeId === 'SHAPE_PARALLELOGRAM') {
      const radA = (aA * Math.PI) / 180;
      const h = (da * Math.sin(radA)).toFixed(1);
      const area = (ab * parseFloat(h)).toFixed(1);
      stmt = `[Thực tế - Quy hoạch thửa ruộng / mảng trang trí hình bình hành (Mẫu ${seedIdx + 1})] Thửa ruộng hình bình hành ABCD có đáy AB = ${m.dAB} m, cạnh bên AD = ${m.dDA} m, chiều cao h = ${h} m.`;
      hyp = [`AB = CD = ${m.dAB} m`, `AD = BC = ${m.dDA} m`, `Chiều cao h = ${h} m`];
      concl = [`a) Tính chu vi bờ rào P`, `b) Tính diện tích S`];
      steps = [
        `<b>Bước 1 (Chu vi):</b> P = 2 × (${m.dAB} + ${m.dDA}) = <b>${(2*(ab+da)).toFixed(1)} m</b>.`,
        `<b>Bước 2 (Diện tích):</b> S = AB × h = ${m.dAB} × ${h} = <b>${area} m²</b>.`
      ];
    } else {
      const radD = (aD * Math.PI) / 180;
      const h = (da * Math.sin(radD)).toFixed(1);
      const area = (0.5 * (ab + cd) * parseFloat(h)).toFixed(1);
      stmt = `[Thực tế - Thi công mái nhà / công trình hình thang (Mẫu ${seedIdx + 1})] Công trình ${shapeName} ABCD có đáy nhỏ AB = ${m.dAB} m, đáy lớn CD = ${m.dCD} m, chiều cao h = ${h} m.`;
      hyp = [`Đáy AB = ${m.dAB} m, CD = ${m.dCD} m`, `Chiều cao h = ${h} m`];
      concl = [`a) Tính diện tích phủ S = ((AB + CD) × h) / 2`, `b) Tính chu vi viền xung quanh`];
      steps = [
        `<b>Bước 1 (Tổng 2 đáy):</b> AB + CD = ${m.dAB} + ${m.dCD} = ${(ab+cd).toFixed(1)} m.`,
        `<b>Bước 2 (Diện tích):</b> S = ((${m.dAB} + ${m.dCD}) × ${h}) / 2 = <b>${area} m²</b>.`
      ];
    }
  }

  stmtEl.textContent = stmt;
  hypEl.innerHTML = hyp.map(h => `<li><i class="fa-solid fa-angle-right text-indigo-500 mr-1.5"></i>${h}}
</li>`).join('');
  conclEl.innerHTML = concl.map(c => `<li><i class="fa-solid fa-circle-check text-emerald-500 mr-1.5"></i>${c}</li>`).join('');
  stepsEl.innerHTML = steps.map(s => `<div class="p-2.5 bg-white/80 rounded-xl border border-emerald-100 shadow-2xs">${s}</div>`).join('');
}


// =====================================================================
// 7. HÀM THẢO LUẬN & ĐÓNG GÓP MẸO NHỚ CỘNG ĐỒNG (USER TIPS PERSISTENCE)
// =====================================================================
async function loadUserTipsForShape(shapeId) {
  const tipsList = document.getElementById('modalTipsList');
  if (!tipsList) return;
  try {
    const res = await fetch('/api/user-tips?shape_id=' + shapeId);
    if (res.ok) {
      const userTips = await res.json();
      userTips.forEach(tip => {
        const uEl = document.createElement('div');
        uEl.className = 'p-5 bg-gradient-to-br from-indigo-50 via-sky-50 to-white rounded-3xl border-2 border-indigo-300 shadow-sm space-y-3 relative overflow-hidden';
        uEl.innerHTML = `
          <div class="flex items-center justify-between pb-2 border-b border-indigo-200">
            <h5 class="font-bold text-indigo-900 text-xs flex items-center space-x-1.5">
              <i class="fa-solid fa-user-pen text-indigo-600 text-sm"></i>
              <span>${tip.title || 'Mẹo nhớ & Thảo luận đóng góp'}</span>
            </h5>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">ĐÓNG GÓP CỘNG ĐỒNG</span>
          </div>
          <p class="whitespace-pre-line leading-relaxed text-slate-800 text-xs font-medium pl-3 border-l-4 border-indigo-500 py-1 bg-white/70 rounded-r-2xl">${tip.content}</p>
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-indigo-100">
            <span><i class="fa-solid fa-circle-user text-indigo-500 mr-1"></i>${tip.author || 'Thầy cô / Học sinh'}</span>
            <span class="font-mono text-[10px] text-slate-400">${new Date(tip.created_at).toLocaleDateString('vi-VN')}</span>
          </div>
        `;
        tipsList.prepend(uEl);
      });
    }
  } catch (err) {
    console.warn('Lỗi tải user tips:', err);
  }
}

async function submitUserTip() {
  const authorInput = document.getElementById('inputTipAuthor');
  const typeSelect = document.getElementById('selectTipType');
  const titleInput = document.getElementById('inputTipTitle');
  const contentInput = document.getElementById('inputTipContent');

  const content = contentInput ? contentInput.value.trim() : '';
  if (!content) {
    alert('Vui lòng nhập nội dung bài thơ, mẹo nhớ hoặc thắc mắc thảo luận của bạn!');
    return;
  }

  const payload = {
    shape_id: currentOpenShapeIdForTip || 'ALL',
    author: authorInput && authorInput.value.trim() ? authorInput.value.trim() : 'Học sinh / Giáo viên',
    type: typeSelect ? typeSelect.value : 'Thơ ghi nhớ',
    title: titleInput && titleInput.value.trim() ? titleInput.value.trim() : 'Mẹo nhớ & Thảo luận đóng góp',
    content: content
  };

  try {
    const res = await fetch('/api/user-tips', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (res.ok && data.success) {
      if (contentInput) contentInput.value = '';
      if (titleInput) titleInput.value = '';

      const tipsList = document.getElementById('modalTipsList');
      if (tipsList) {
        const uEl = document.createElement('div');
        uEl.className = 'p-5 bg-gradient-to-br from-emerald-50 via-teal-50 to-white rounded-3xl border-2 border-emerald-300 shadow-md space-y-3 relative overflow-hidden animate-fade-in';
        uEl.innerHTML = `
          <div class="flex items-center justify-between pb-2 border-b border-emerald-200">
            <h5 class="font-bold text-emerald-950 text-xs flex items-center space-x-1.5">
              <i class="fa-solid fa-circle-check text-emerald-600 text-sm"></i>
              <span>${data.tip.title}</span>
            </h5>
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200 text-emerald-900 border border-emerald-400">VỪA ĐĂNG &amp; ĐÃ LƯU</span>
          </div>
          <p class="whitespace-pre-line leading-relaxed text-slate-800 text-xs font-medium pl-3 border-l-4 border-emerald-500 py-1 bg-white/70 rounded-r-2xl">${data.tip.content}</p>
          <div class="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-1 border-t border-emerald-100">
            <span><i class="fa-solid fa-circle-user text-emerald-600 mr-1"></i>${data.tip.author}</span>
            <span class="font-mono text-[10px] text-slate-400">Vừa xong</span>
          </div>
        `;
        tipsList.prepend(uEl);
      }
      alert('🎉 Đã ghi nhớ và đăng tải thành công mẹo nhớ / bài thơ của bạn vào CSDL!');
    } else {
      alert(data.error || 'Có lỗi xảy ra khi lưu bài viết');
    }
  } catch (err) {
    console.error('Lỗi khi gửi user tip:', err);
    alert('Không thể kết nối đến máy chủ để lưu bài viết');
  }
}
