const autocannon = require('autocannon')

// 配置压测参数
const instance = autocannon({
  url: 'http://192.168.5.103:8080/api/student/meals?category=all&isTest=true',
  connections: 1000, // 并发连接数,模拟多少个客户端同时请求
  pipelining: 1,
  duration: 120,      // 测试持续时间（秒）
  overallRate: 9000,  // 每秒发送多少请求
  headers: {
    'Connection': 'keep-alive',
    'Content-Type': 'application/json',
  }
})

// 监听过程中的事件
autocannon.track(instance, { renderProgressBar: true })

instance.on('done', (result) => {
  console.log('\n--- 测试完成 ---')
  console.log(`平均每秒请求数 (Req/Sec): ${result.requests.average}`)
  console.log(`延迟 (Latency): ${result.latency.average} ms`)
  console.log(`总请求数: ${result.requests.total}`)
  console.log(`吞吐量: ${result.throughput.average / 1024 / 1024} MB/s`)

  if (result.errors > 0) {
    console.warn(`出现错误数: ${result.errors} (可能是服务器过载或端口耗尽)`)
  }
})