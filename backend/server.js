const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const graphData = require('./graph_data');
const { driver, checkConnection, isNeo4jConnected, getSession } = require('./neo4j_driver');

const app = express();
const PORT = process.env.PORT || 5050;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Kiểm tra kết nối Neo4j khi khởi động
checkConnection();

// 1. Kiểm tra trạng thái hệ thống
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    neo4j_connected: isNeo4jConnected(),
    mode: isNeo4jConnected() ? 'Cơ sở dữ liệu đồ thị Neo4j thật (Cổng 7687)' : 'Bộ nhớ đồ thị tri thức nội bộ (In-Memory Engine)',
    shapes_count: graphData.shapes.length,
    transitions_count: graphData.transitions.length
  });
});

// 2. Lấy dữ liệu đồ thị trực quan cho Vis.js từ CSDL Neo4j thật (Nodes và Edges)
app.get('/api/graph', async (req, res) => {
  const shapeLevels = {
    'SHAPE_CONVEX_QUAD': 0,
    'SHAPE_TRAPEZOID': 1,
    'SHAPE_ISOSCELES_TRAPEZOID': 2,
    'SHAPE_RIGHT_TRAPEZOID': 2,
    'SHAPE_PARALLELOGRAM': 2,
    'SHAPE_RECTANGLE': 3,
    'SHAPE_RHOMBUS': 3,
    'SHAPE_SQUARE': 4
  };

  if (isNeo4jConnected()) {
    const session = getSession();
    try {
      const cypherRes = await session.run(`
        MATCH (s:Shape)
        OPTIONAL MATCH (s)-[r:TRANSFORMS_TO]->(t:Shape)
        RETURN s, r, t
      `);

      const nodesMap = new Map();
      const edges = [];
      let edgeIndex = 0;

      cypherRes.records.forEach(rec => {
        const s = rec.get('s').properties;
        if (!nodesMap.has(s.id)) {
          nodesMap.set(s.id, {
            id: s.id,
            label: s.name,
            title: (s.name_en || s.name) + ': ' + (s.definition || ''),
            level: shapeLevels[s.id] !== undefined ? shapeLevels[s.id] : 0,
            color: {
              background: s.color || '#4f46e5',
              border: '#ffffff',
              highlight: { background: '#f59e0b', border: '#ffffff' }
            }
          });
        }

        const r = rec.get('r');
        const t = rec.get('t');
        if (r && t) {
          const tProps = t.properties;
          const rProps = r.properties;
          edges.push({
            id: 'neo4j_trans_' + (edgeIndex++),
            from: s.id,
            to: tProps.id,
            title: 'Dấu hiệu nhận biết: ' + rProps.condition,
            label: rProps.condition.length > 25 ? rProps.condition.substring(0, 25) + '...' : rProps.condition,
            arrows: { to: { enabled: true, scaleFactor: 1 } },
            color: { color: '#3b82f6', highlight: '#f59e0b' },
            width: 2.5
          });
        }
      });

      await session.close();
      return res.json({ nodes: Array.from(nodesMap.values()), edges });
    } catch (err) {
      console.error('Lỗi khi lấy dữ liệu đồ thị từ Neo4j:', err);
      if (session) await session.close();
    }
  }

  // Fallback nếu chưa kết nối Neo4j
  const nodes = graphData.shapes.map(s => ({
    id: s.id,
    label: s.name,
    title: s.name_en + ': ' + s.definition,
    level: shapeLevels[s.id] !== undefined ? shapeLevels[s.id] : 0,
    color: {
      background: s.color || '#4f46e5',
      border: '#ffffff',
      highlight: { background: '#f59e0b', border: '#ffffff' }
    },
    font: { color: '#ffffff', size: 14, face: 'Inter, sans-serif', bold: true },
    shape: 'box',
    margin: { top: 10, bottom: 10, left: 16, right: 16 },
    shadow: { enabled: true, color: 'rgba(0,0,0,0.12)', size: 6, x: 2, y: 3 }
  }));

  const edges = [];
  graphData.transitions.forEach((t, idx) => {
    edges.push({
      id: 'trans_' + idx,
      from: t.from,
      to: t.to,
      label: t.condition.length > 28 ? t.condition.substring(0, 28) + '...' : t.condition,
      arrows: { to: { enabled: true, scaleFactor: 1 } },
      color: { color: '#3b82f6', highlight: '#f59e0b' },
      width: 2,
      font: { size: 11, color: '#1d4ed8', background: '#ffffff', strokeWidth: 0, align: 'horizontal' }
    });
  });

  res.json({ nodes, edges });
});

// 3. Lấy danh sách tất cả các hình
app.get('/api/shapes', async (req, res) => {
  if (isNeo4jConnected()) {
    const session = getSession();
    try {
      const cypherRes = await session.run(`
        MATCH (s:Shape)
        RETURN s.id AS id, s.name AS name, s.name_en AS name_en, s.sides_count AS sides_count, s.definition AS definition, s.color AS color
      `);
      const list = cypherRes.records.map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        name_en: r.get('name_en'),
        sides_count: r.get('sides_count'),
        definition: r.get('definition'),
        color: r.get('color')
      }));
      await session.close();
      return res.json(list);
    } catch (err) {
      console.error('Lỗi lấy shapes từ Neo4j:', err);
      if (session) await session.close();
    }
  }

  const list = graphData.shapes.map(s => ({
    id: s.id,
    name: s.name,
    name_en: s.name_en,
    category: s.category,
    sides_count: s.sides_count,
    definition: s.definition,
    color: s.color,
    svg_type: s.svg_type
  }));
  res.json(list);
});

// 4. Lấy chi tiết đầy đủ một hình khi người dùng nhấp chuột (UC03)
app.get('/api/shapes/:id', (req, res) => {
  const shape = graphData.shapes.find(s => s.id === req.params.id || s.name.toLowerCase() === req.params.id.toLowerCase());
  if (!shape) {
    return res.status(404).json({ error: 'Không tìm thấy hình học yêu cầu' });
  }

  // Lấy các hình cha (kế thừa)
  const parents = graphData.shapes
    .filter(s => (shape.parents || []).includes(s.id))
    .map(s => ({ id: s.id, name: s.name }));

  // Lấy các hình có thể biến đổi đến
  const nextShapes = graphData.transitions
    .filter(t => t.from === shape.id)
    .map(t => {
      const target = graphData.shapes.find(s => s.id === t.to);
      return { id: t.to, name: target ? target.name : t.to, condition: t.condition };
    });

  // Lấy các hình có thể biến đổi thành hình này
  const prevShapes = graphData.transitions
    .filter(t => t.to === shape.id)
    .map(t => {
      const source = graphData.shapes.find(s => s.id === t.from);
      return { id: t.from, name: source ? source.name : t.from, condition: t.condition };
    });

  res.json({
    ...shape,
    parents,
    next_shapes: nextShapes,
    prev_shapes: prevShapes
  });
});

// 4.5. API Mẹo nhớ & Thảo luận cộng đồng (Persistence API)
const USER_TIPS_FILE = path.join(__dirname, 'user_tips.json');

function getUserTips() {
  if (!fs.existsSync(USER_TIPS_FILE)) return [];
  try {
    const raw = fs.readFileSync(USER_TIPS_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

function saveUserTips(tips) {
  try {
    fs.writeFileSync(USER_TIPS_FILE, JSON.stringify(tips, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi khi ghi user_tips.json:', err);
  }
}

app.get('/api/user-tips', (req, res) => {
  const shapeId = req.query.shape_id;
  let tips = getUserTips();
  if (shapeId) {
    tips = tips.filter(t => t.shape_id === shapeId || t.shape_id === 'ALL');
  }
  res.json(tips);
});

app.post('/api/user-tips', (req, res) => {
  const { shape_id, title, content, type, author } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Nội dung không được để trống' });
  }
  const newTip = {
    id: 'UTIP_' + Date.now(),
    shape_id: shape_id || 'ALL',
    title: title || 'Mẹo nhớ & Thảo luận đóng góp',
    content: content.trim(),
    type: type || 'Thơ ghi nhớ',
    author: author || 'Học sinh / Giáo viên',
    created_at: new Date().toISOString()
  };
  const tips = getUserTips();
  tips.unshift(newTip);
  saveUserTips(tips);
  res.json({ success: true, tip: newTip });
});

// 5. Máy tính toán chu vi và diện tích động (UC04)
app.post('/api/calculate', (req, res) => {
  const { shape_id, formula_type, inputs } = req.body;
  const shape = graphData.shapes.find(s => s.id === shape_id);
  if (!shape) return res.status(404).json({ error: 'Hình học không tồn tại' });

  const formula = shape.formulas.find(f => f.type === formula_type);
  if (!formula) return res.status(404).json({ error: 'Không tìm thấy công thức này' });

  // Kiểm tra tham số hợp lệ
  const parsedInputs = {};
  for (const p of formula.params) {
    const val = parseFloat(inputs[p.name]);
    if (isNaN(val) || val <= 0) {
      return res.status(400).json({ error: 'Giá trị tham số ' + p.label + ' phải là số dương lớn hơn 0' });
    }
    parsedInputs[p.name] = val;
  }

  let result = 0;
  let steps = [];

  try {
    if (shape.id === 'SHAPE_SQUARE') {
      const a = parsedInputs['a'];
      if (formula_type === 'Chu vi') {
        result = 4 * a;
        steps = [
          'Bước 1: Áp dụng công thức chu vi hình vuông P = 4 × a',
          'Bước 2: Thay số a = ' + a + ' cm vào công thức',
          'Bước 3: P = 4 × ' + a + ' = ' + result + ' cm'
        ];
      } else {
        result = a * a;
        steps = [
          'Bước 1: Áp dụng công thức diện tích hình vuông S = a²',
          'Bước 2: Thay số a = ' + a + ' cm vào công thức',
          'Bước 3: S = ' + a + ' × ' + a + ' = ' + result + ' cm²'
        ];
      }
    } else if (shape.id === 'SHAPE_RECTANGLE') {
      const a = parsedInputs['a'];
      const b = parsedInputs['b'];
      if (formula_type === 'Chu vi') {
        result = (a + b) * 2;
        steps = [
          'Bước 1: Áp dụng công thức chu vi hình chữ nhật P = (dài + rộng) × 2',
          'Bước 2: Thay số dài = ' + a + ' cm, rộng = ' + b + ' cm',
          'Bước 3: P = (' + a + ' + ' + b + ') × 2 = ' + (a + b) + ' × 2 = ' + result + ' cm'
        ];
      } else {
        result = a * b;
        steps = [
          'Bước 1: Áp dụng công thức diện tích hình chữ nhật S = dài × rộng',
          'Bước 2: Thay số S = ' + a + ' × ' + b,
          'Bước 3: S = ' + result + ' cm²'
        ];
      }
    } else if (shape.id === 'SHAPE_ISOSCELES_TRAPEZOID' || shape.id === 'SHAPE_TRAPEZOID' || shape.id === 'SHAPE_RIGHT_TRAPEZOID') {
      const a = parsedInputs['a'];
      const b = parsedInputs['b'];
      if (formula_type === 'Diện tích') {
        const h = parsedInputs['h'];
        result = ((a + b) * h) / 2;
        steps = [
          'Bước 1: Áp dụng công thức diện tích hình thang S = (đáy lớn + đáy nhỏ) × chiều cao / 2',
          'Bước 2: Thay số: đáy lớn a = ' + a + ' cm, đáy nhỏ b = ' + b + ' cm, chiều cao h = ' + h + ' cm',
          'Bước 3: S = (' + a + ' + ' + b + ') × ' + h + ' / 2 = ' + (a + b) + ' × ' + h + ' / 2 = ' + result + ' cm²'
        ];
      } else if (shape.id === 'SHAPE_ISOSCELES_TRAPEZOID' && formula_type === 'Chu vi') {
        const c = parsedInputs['c'];
        result = a + b + 2 * c;
        steps = [
          'Bước 1: Áp dụng công thức chu vi hình thang cân P = đáy lớn + đáy nhỏ + 2 × cạnh bên',
          'Bước 2: Thay số a = ' + a + ' cm, b = ' + b + ' cm, c = ' + c + ' cm',
          'Bước 3: P = ' + a + ' + ' + b + ' + 2 × ' + c + ' = ' + result + ' cm'
        ];
      }
    } else if (shape.id === 'SHAPE_RHOMBUS') {
      if (formula_type === 'Diện tích') {
        const d1 = parsedInputs['d1'];
        const d2 = parsedInputs['d2'];
        result = 0.5 * d1 * d2;
        steps = [
          'Bước 1: Áp dụng công thức diện tích hình thoi S = (d₁ × d₂) / 2',
          'Bước 2: Thay độ dài hai đường chéo d₁ = ' + d1 + ' cm, d₂ = ' + d2 + ' cm',
          'Bước 3: S = (' + d1 + ' × ' + d2 + ') / 2 = ' + result + ' cm²'
        ];
      } else {
        const a = parsedInputs['a'];
        result = 4 * a;
        steps = [
          'Bước 1: Áp dụng công thức chu vi hình thoi P = 4 × a',
          'Bước 2: Thay cạnh a = ' + a + ' cm',
          'Bước 3: P = 4 × ' + a + ' = ' + result + ' cm'
        ];
      }
    } else {
      result = 0;
      steps = ['Áp dụng công thức toán học chuẩn theo SGK.'];
    }

    res.json({
      success: true,
      result: Math.round(result * 100) / 100,
      unit: formula.unit,
      steps: steps
    });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi trong quá trình tính toán: ' + err.message });
  }
});

// 6. Tìm đường chứng minh ngắn nhất (Shortest Path - UC05)
app.post('/api/proof-path', (req, res) => {
  const { from_id, to_id } = req.body;
  if (!from_id || !to_id) {
    return res.status(400).json({ error: 'Vui lòng chọn hình xuất phát và hình đích đến' });
  }
  if (from_id === to_id) {
    return res.status(400).json({ error: 'Hình xuất phát và hình đích đến phải khác nhau' });
  }

  // Thuật toán BFS tìm tất cả các đường đi ngắn nhất
  const queue = [[from_id]];
  const allPaths = [];
  let minLength = Infinity;

  while (queue.length > 0) {
    const currentPath = queue.shift();
    const lastNode = currentPath[currentPath.length - 1];

    if (lastNode === to_id) {
      if (currentPath.length <= minLength) {
        minLength = currentPath.length;
        allPaths.push(currentPath);
      }
      continue;
    }

    if (currentPath.length >= minLength) continue;

    const nextEdges = graphData.transitions.filter(t => t.from === lastNode);
    for (const edge of nextEdges) {
      if (!currentPath.includes(edge.to)) {
        queue.push([...currentPath, edge.to]);
      }
    }
  }

  if (allPaths.length === 0) {
    return res.json({
      found: false,
      message: 'Không tìm thấy lộ trình chuyển đổi trực tiếp trong hệ tiên đề giữa hai hình này.'
    });
  }

  const formattedPaths = allPaths.map((p, pIdx) => {
    const steps = [];
    for (let i = 0; i < p.length - 1; i++) {
      const fromShape = graphData.shapes.find(s => s.id === p[i]);
      const toShape = graphData.shapes.find(s => s.id === p[i + 1]);
      const edge = graphData.transitions.find(t => t.from === p[i] && t.to === p[i + 1]);
      steps.push({
        step_num: i + 1,
        from_id: p[i],
        to_id: p[i + 1],
        from_name: fromShape ? fromShape.name : p[i],
        to_name: toShape ? toShape.name : p[i + 1],
        condition: edge ? edge.condition : 'Thêm điều kiện hình học'
      });
    }
    return {
      path_index: pIdx + 1,
      title: 'Lộ trình ' + (pIdx + 1) + ' (Qua ' + steps.map(s => s.to_name).join(' → ') + ')',
      steps: steps
    };
  });

  res.json({
    found: true,
    total_paths: formattedPaths.length,
    paths: formattedPaths
  });
});

// 7. So sánh hai hình học phẳng (Shape Comparison Matrix - UC06)
app.post('/api/compare', (req, res) => {
  const { shape1_id, shape2_id } = req.body;
  const s1 = graphData.shapes.find(s => s.id === shape1_id);
  const s2 = graphData.shapes.find(s => s.id === shape2_id);

  if (!s1 || !s2) {
    return res.status(404).json({ error: 'Không tìm thấy một trong hai hình học để so sánh' });
  }
  if (s1.id === s2.id) {
    return res.status(400).json({ error: 'Vui lòng chọn hai hình khác nhau để so sánh' });
  }

  const common = [];
  const s1Unique = [];
  const s2Unique = [];

  if (s1.category === s2.category) {
    common.push('Đều thuộc nhóm ' + (s1.category === 'CAT_QUAD' ? 'Tứ giác (đa giác 4 cạnh)' : 'Tam giác') + '.');
    common.push('Tổng các góc trong đều bằng ' + s1.sum_interior_angles + ' độ.');
  }

  if (s1.id === 'SHAPE_RECTANGLE' && s2.id === 'SHAPE_RHOMBUS') {
    common.push('Đều là trường hợp đặc biệt của hình bình hành.');
    common.push('Các cặp cạnh đối đều song song với nhau.');
    common.push('Hai đường chéo đều cắt nhau tại trung điểm của mỗi đường.');
    s1Unique.push('Bốn góc đều bằng nhau và bằng 90 độ.');
    s1Unique.push('Hai đường chéo có độ dài bằng nhau.');
    s2Unique.push('Bốn cạnh đều có độ dài bằng nhau.');
    s2Unique.push('Hai đường chéo vuông góc với nhau và là đường phân giác của các góc.');
  } else {
    s1.properties.forEach(p => {
      const match = s2.properties.find(p2 => p2.category === p.category && p2.description === p.description);
      if (match) {
        if (!common.includes(p.description)) common.push(p.description);
      } else {
        s1Unique.push(p.category + ': ' + p.description);
      }
    });

    s2.properties.forEach(p => {
      const match = s1.properties.find(p1 => p1.category === p.category && p1.description === p.description);
      if (!match) {
        s2Unique.push(p.category + ': ' + p.description);
      }
    });
  }

  let combinationResult = null;
  if ((s1.id === 'SHAPE_RECTANGLE' && s2.id === 'SHAPE_RHOMBUS') || (s1.id === 'SHAPE_RHOMBUS' && s2.id === 'SHAPE_RECTANGLE')) {
    combinationResult = 'Khi một tứ giác vừa mang đầy đủ tính chất của hình chữ nhật, vừa mang tính chất của hình thoi thì tứ giác đó chính là HÌNH VUÔNG!';
  }

  res.json({
    shape1: { id: s1.id, name: s1.name },
    shape2: { id: s2.id, name: s2.name },
    common_points: common,
    shape1_unique: s1Unique,
    shape2_unique: s2Unique,
    combination_result: combinationResult
  });
});

// 8. Ngân hàng câu hỏi trắc nghiệm kèm gợi ý ba tầng (UC07)
app.get('/api/quiz', (req, res) => {
  res.json(graphData.quizzes);
});

// 9. Trợ lý ảo GeoBot giải đáp thắc mắc hình học (UC08)
app.post('/api/chatbot', (req, res) => {
  const question = req.body.question || req.body.message;
  if (!question || question.trim() === '') {
    return res.status(400).json({ error: 'Vui lòng nhập câu hỏi' });
  }

  const q = question.toLowerCase();
  let answer = '';
  let relatedShapeId = null;

  if (q.includes('thang cân') || q.includes('hình thang cân')) {
    relatedShapeId = 'SHAPE_ISOSCELES_TRAPEZOID';
    if (q.includes('diện tích') || q.includes('công thức')) {
      answer = 'Diện tích hình thang cân được tính bằng công thức: S = (đáy lớn + đáy nhỏ) × chiều cao / 2. Bài thơ mẹo: "Đáy lớn đáy nhỏ ta mang cộng vào, thế rồi nhân với chiều cao, chia đôi lấy nửa thế nào cũng ra!".';
    } else if (q.includes('dấu hiệu') || q.includes('nhận biết') || q.includes('chứng minh')) {
      answer = 'Có hai dấu hiệu chính để nhận biết hình thang cân: (1) Hình thang có hai góc kề một đáy bằng nhau; (2) Hình thang có hai đường chéo bằng nhau. Chú ý bẫy: hai cạnh bên bằng nhau chưa chắc là hình thang cân đâu nhé!';
    } else {
      answer = 'Hình thang cân là hình thang có hai góc kề một đáy bằng nhau. Hình này có tính chất hai cạnh bên bằng nhau, hai đường chéo bằng nhau và có một trục đối xứng đi qua trung điểm hai đáy.';
    }
  } else if (q.includes('vuông') || q.includes('hình vuông')) {
    relatedShapeId = 'SHAPE_SQUARE';
    if (q.includes('diện tích')) {
      answer = 'Diện tích hình vuông tính bằng: S = a² (cạnh nhân chính nó). Chu vi P = 4a.';
    } else if (q.includes('thoi')) {
      answer = 'Để hình thoi biến thành hình vuông, bạn chỉ cần chỉ ra thêm một góc vuông hoặc hai đường chéo bằng nhau là xong!';
    } else {
      answer = 'Hình vuông là tứ giác đều hoàn hảo nhất: có bốn cạnh bằng nhau và bốn góc vuông. Nó vừa là hình chữ nhật đặc biệt, vừa là hình thoi đặc biệt.';
    }
  } else if (q.includes('thoi') || q.includes('hình thoi')) {
    relatedShapeId = 'SHAPE_RHOMBUS';
    answer = 'Hình thoi là tứ giác có bốn cạnh bằng nhau. Điểm đặc biệt nhất của hình thoi là hai đường chéo vuông góc với nhau tại trung điểm và diện tích tính bằng nửa tích hai đường chéo: S = (d₁ × d₂) / 2.';
  } else if (q.includes('chữ nhật') || q.includes('hình chữ nhật')) {
    relatedShapeId = 'SHAPE_RECTANGLE';
    answer = 'Hình chữ nhật là tứ giác có bốn góc vuông. Hai đường chéo bằng nhau và cắt nhau tại trung điểm. Diện tích S = dài × rộng.';
  } else if (q.includes('chào') || q.includes('hello') || q.includes('bạn là ai')) {
    answer = 'Chào bạn! Mình là GeoBot - Trợ lý tri thức hình học phẳng. Bạn có thể hỏi mình bất kỳ câu hỏi nào về định nghĩa, tính chất, công thức hay cách chứng minh các hình học 2D nhé!';
  } else {
    answer = 'Câu hỏi thú vị đấy! Trong hình học phẳng, bạn có thể xem chi tiết các tính chất và cách chứng minh bằng cách nhấp trực tiếp vào các quả cầu hình học trên bản đồ hoặc chọn chức năng "Chỉ đường chứng minh" nhé!';
  }

  res.json({
    reply: answer,
    related_shape_id: relatedShapeId
  });
});

// =====================================================================
// 10. QUẢN LÝ VÒNG ĐỜI NỘI DUNG VÀ THẨM ĐỊNH SGK (UC10)
// =====================================================================

// Danh sách các bản ghi biên soạn và thẩm định trong bộ nhớ
let pendingSubmissions = [
  {
    id: 'DRAFT_001',
    type: 'Tính chất mới',
    shape_id: 'SHAPE_ISOSCELES_TRAPEZOID',
    shape_name: 'Hình thang cân',
    title: 'Trục đối xứng của hình thang cân',
    content: 'Đường thẳng đi qua trung điểm hai đáy của hình thang cân là trục đối xứng của hình thang cân đó.',
    source_id: 'SGK Toán 8 - Kết nối tri thức',
    source_locator: 'Chương 3, bài 2, trang 64',
    author: 'GV. Nguyễn Thảo Vy',
    status: 'IN_REVIEW',
    created_at: '2026-10-05 08:30:00',
    review_note: ''
  },
  {
    id: 'DRAFT_002',
    type: 'Câu hỏi trắc nghiệm',
    shape_id: 'SHAPE_PARALLELOGRAM',
    shape_name: 'Hình bình hành',
    title: 'Tính chất hai đường chéo hình bình hành',
    content: 'Trong hình bình hành, hai đường chéo có tính chất gì đặc biệt?',
    options: ['Vuông góc với nhau', 'Cắt nhau tại trung điểm của mỗi đường', 'Bằng nhau', 'Là đường phân giác'],
    answer: 1,
    source_id: 'SGK Toán 8 - Cánh Diều',
    source_locator: 'Chương 5, bài 3, trang 102',
    author: 'GV. Trần Anh Tuấn',
    status: 'IN_REVIEW',
    created_at: '2026-10-05 10:15:00',
    review_note: ''
  }
];

// Lấy danh sách nội dung đang chờ thẩm định
app.get('/api/content/pending', (req, res) => {
  const pending = pendingSubmissions.filter(item => item.status === 'IN_REVIEW');
  res.json(pending);
});

// Lấy tất cả lịch sử biên soạn (bao gồm cả đã duyệt và từ chối)
app.get('/api/content/all', (req, res) => {
  res.json(pendingSubmissions);
});

// Giáo viên thêm mới bản ghi và gửi thẩm định
app.post('/api/content/draft', (req, res) => {
  const { type, shape_id, title, content, source_id, source_locator, author, options, answer } = req.body;

  // Ràng buộc bắt buộc: Phải có nguồn sách giáo khoa và vị trí trang sách
  if (!source_id || source_id.trim() === '' || !source_locator || source_locator.trim() === '') {
    return res.status(400).json({
      error: 'Bắt buộc phải điền đầy đủ Mã bộ sách (source_id) và Vị trí trang sách (source_locator) để đối chiếu kiểm chứng.'
    });
  }

  if (!title || title.trim() === '' || !content || content.trim() === '') {
    return res.status(400).json({ error: 'Tiêu đề và nội dung không được để trống.' });
  }

  const shape = graphData.shapes.find(s => s.id === shape_id);
  const newId = 'DRAFT_' + String(pendingSubmissions.length + 1).padStart(3, '0');

  const newDraft = {
    id: newId,
    type: type || 'Tính chất mới',
    shape_id: shape_id || 'SHAPE_CONVEX_QUAD',
    shape_name: shape ? shape.name : 'Tứ giác',
    title: title.trim(),
    content: content.trim(),
    options: options || [],
    answer: answer !== undefined ? parseInt(answer) : 0,
    source_id: source_id.trim(),
    source_locator: source_locator.trim(),
    author: author || 'Giáo viên bộ môn',
    status: 'IN_REVIEW',
    created_at: new Date().toISOString().replace('T', ' ').substring(0, 19),
    review_note: ''
  };

  pendingSubmissions.unshift(newDraft);

  res.json({
    success: true,
    message: 'Nội dung đã được lưu và gửi đến hàng đợi thẩm định của tổ trưởng chuyên môn.',
    item: newDraft
  });
});

// Quản trị viên / Tổ trưởng chuyên môn phê duyệt hoặc từ chối
app.post('/api/content/review', (req, res) => {
  const { id, action, note, reviewer } = req.body;
  const draft = pendingSubmissions.find(item => item.id === id);

  if (!draft) {
    return res.status(404).json({ error: 'Không tìm thấy bản ghi cần thẩm định.' });
  }

  if (action === 'APPROVED') {
    draft.status = 'APPROVED';
    draft.verified_by = reviewer || 'Tổ trưởng chuyên môn Toán';
    draft.review_note = note || 'Đã đối chiếu chuẩn xác với sách giáo khoa.';

    // Nếu là tính chất, bổ sung ngay vào đồ thị tri thức
    if (draft.type.includes('Tính chất')) {
      const shape = graphData.shapes.find(s => s.id === draft.shape_id);
      if (shape) {
        shape.properties.push({
          category: 'Đặc điểm bổ sung',
          description: draft.content,
          expr: draft.title
        });
      }
    } else if (draft.type.includes('Trắc nghiệm') || draft.type.includes('Câu hỏi')) {
      graphData.quizzes.push({
        id: 'Q_' + Date.now(),
        shape_id: draft.shape_id,
        question: draft.title + ': ' + draft.content,
        options: draft.options.length > 0 ? draft.options : ['Đáp án A', 'Đáp án B', 'Đáp án C', 'Đáp án D'],
        answer: draft.answer,
        explanation: 'Trích nguồn chuẩn từ ' + draft.source_id + ' (' + draft.source_locator + ').',
        hints: [
          'Gợi ý 1: Hãy xem lại định lý trong sách giáo khoa.',
          'Gợi ý 2: ' + draft.source_locator,
          'Gợi ý 3: Xem kết quả đối chiếu chuẩn SGK.'
        ]
      });
    }

    res.json({
      success: true,
      message: 'Đã phê duyệt thành công! Tri thức mới đã chính thức xuất bản trên đồ thị cho học sinh tra cứu.',
      item: draft
    });
  } else if (action === 'REJECTED') {
    draft.status = 'REJECTED';
    draft.verified_by = reviewer || 'Tổ trưởng chuyên môn Toán';
    draft.review_note = note || 'Nội dung chưa chuẩn xác so với định lý hình học trong sách giáo khoa.';

    res.json({
      success: true,
      message: 'Đã từ chối bản ghi và chuyển phản hồi góp ý đến người biên soạn để chỉnh sửa.',
      item: draft
    });
  } else {
    res.status(400).json({ error: 'Hành động không hợp lệ. Chỉ chấp nhận APPROVED hoặc REJECTED.' });
  }
});

app.listen(PORT, () => {
  console.log('===================================================');
  console.log('ỨNG DỤNG ĐỒ THỊ TRI THỨC HÌNH HỌC PHẲNG (GEOGRAPH)');
  console.log('Đang chạy tại: http://localhost:' + PORT);
  console.log('===================================================');
});
