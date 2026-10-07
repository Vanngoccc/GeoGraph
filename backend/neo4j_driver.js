const neo4j = require('neo4j-driver');
require('dotenv').config();

const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
const user = process.env.NEO4J_USER || 'neo4j';
const password = process.env.NEO4J_PASSWORD || '11111111';

let driver = null;
let isConnected = false;

try {
  driver = neo4j.driver(uri, neo4j.auth.basic(user, password), {
    maxConnectionLifetime: 3 * 60 * 60 * 1000,
    maxConnectionPoolSize: 50,
    connectionAcquisitionTimeout: 2000
  });
} catch (err) {
  console.log('Chua the khoi tao driver Neo4j:', err.message);
}

async function checkConnection() {
  if (!driver) return false;
  try {
    const serverInfo = await driver.getServerInfo();
    isConnected = true;
    console.log('Ket noi Neo4j thanh cong toi:', serverInfo.address);
    return true;
  } catch (err) {
    isConnected = false;
    console.log('Neo4j chua san sang tren cong 7687. He thong tu dong chuyen sang che do bo nho do thi noi bo.');
    return false;
  }
}

function getSession() {
  if (!driver) return null;
  return driver.session();
}

module.exports = {
  driver,
  checkConnection,
  getSession,
  isNeo4jConnected: () => isConnected
};
