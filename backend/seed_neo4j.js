const fs = require('fs');
const path = require('path');
const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || '11111111';

async function seedDatabase() {
  console.log(`Đang kết nối tới Neo4j tại ${uri}...`);
  const driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
  const session = driver.session();

  try {
    const cypherPath = path.join(__dirname, 'seed_data.cypher');
    const cypherContent = fs.readFileSync(cypherPath, 'utf8');

    // Tách các câu lệnh Cypher và loại bỏ comment //
    const statements = cypherContent
      .split(';')
      .map(s => s.replace(/\/\/.*$/gm, '').trim())
      .filter(s => s.length > 0);

    console.log(`Đã đọc ${statements.length} câu lệnh Cypher. Bắt đầu nạp dữ liệu vào Neo4j...`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      try {
        await session.run(stmt);
      } catch (err) {
        console.warn(`Lưu ý ở câu lệnh ${i + 1}: ${err.message}`);
      }
    }

    console.log('✅ Đã nạp thành công toàn bộ đồ thị tri thức Tứ giác vào Neo4j!');
  } catch (err) {
    console.error('❌ Lỗi nạp dữ liệu Neo4j:', err.message);
  } finally {
    await session.close();
    await driver.close();
  }
}

seedDatabase();
