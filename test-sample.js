// 测试文件 - 包含多种代码问题，用于验证 AI Code Review

function getUser(userId) {
  // P0: SQL 注入风险
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.execute(query);

  // P1: 缺少异常处理
  const response = fetch('/api/users/' + userId);
  const data = response.json();
  return data;
}

function calculateTotal(items) {
  // P2: console.log 不应在生产代码中
  console.log('Calculating total for items:', items);

  // P1: debugger 不应在生产代码中
  debugger;

  let total = 0;
  for (let i = 0; i < items.length; i++) {
    // P0: 未检查 null/undefined
    total += items[i].price * items[i].quantity;
  }

  // P2: 使用 var 而非 let/const
  var discount = 0.1;

  return total * (1 - discount);
}

// P1: 空的 catch 块
function processData(data) {
  try {
    JSON.parse(data);
  } catch (e) {
    // 什么都没做
  }
}

// P2: 重复代码
function getUserName(userId) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  db.execute(query);
}
