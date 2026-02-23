const axios = require('axios');

const { getCurrentSolarTerm } = require('./solarTermUtils');
exports.testPush = async () => {
  try {
    // 获取当前节气信息
    const solarTermInfo = getCurrentSolarTerm();

    // 构造推送数据
    const pushData = {
      title: `${solarTermInfo.name}节气提醒`,
      content: `${solarTermInfo.description} - ${solarTermInfo.healthTips}`,
      request_id: Date.now().toString(),
      payload: {
        data: "1",
        solarTerm: solarTermInfo.name,
        season: solarTermInfo.season,
        date: solarTermInfo.date
      }
    };

    // 发送推送请求
    const response = await axios.post(
      'https://env-00jy5xm8ecxi.dev-hz.cloudbasefunction.cn/push',
      pushData,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10秒超时
      }
    );
    return response;
  } catch (err) {
    console.error('[测试推送] 推送失败:', err.message);
  }
};
