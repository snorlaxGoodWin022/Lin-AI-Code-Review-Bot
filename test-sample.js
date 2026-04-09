// 测试文件 - 验证增量 review + 多语言支持

function deleteItem(itemId) {
  // P0: SQL 注入
  const query = `DELETE FROM items WHERE id = ${itemId}`;
  db.execute(query);
}

function fetchUser(id) {
  // P1: 缺少 await 和异常处理
  const response = fetch('/api/users/' + id);
  return response.json();
}

function processOrder(order) {
  // P2: console.log
  console.log('Processing order:', order);
  // P1: debugger
  debugger;

  let total = 0;
  for (var i = 0; i < order.items.length; i++) {
    total += order.items[i].price;
  }
  return total;
}
