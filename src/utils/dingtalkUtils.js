

const axios = require('axios');
const crypto = require('crypto');

function generateSign(secret) {
  const timestamp = Date.now();
  const stringToSign = `${timestamp}\n${secret}`;

  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(stringToSign);
  const sign = encodeURIComponent(hmac.digest('base64'));

  return {
    timestamp,
    sign
  };
}

async function sendTextMessage(webhook, message, secret = null) {
  try {
    let url = webhook;

    if (secret) {
      const { timestamp, sign } = generateSign(secret);
      url = `${webhook}&timestamp=${timestamp}&sign=${sign}`;
    }

    const data = {
      msgtype: 'text',
      text: {
        content: message.content
      },
      at: {
        atMobiles: message.atMobiles || [],
        isAtAll: message.isAtAll || false
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.data.errcode === 0,
      message: response.data.errmsg,
      data: response.data
    };
  } catch (error) {
    console.error('钉钉推送失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

async function sendMarkdownMessage(webhook, message, secret = null) {
  try {
    let url = webhook;

    if (secret) {
      const { timestamp, sign } = generateSign(secret);
      url = `${webhook}&timestamp=${timestamp}&sign=${sign}`;
    }

    const data = {
      msgtype: 'markdown',
      markdown: {
        title: message.title,
        text: message.text
      },
      at: {
        atMobiles: message.atMobiles || [],
        isAtAll: message.isAtAll || false
      }
    };

    const response = await axios.post(url, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: response.data.errcode === 0,
      message: response.data.errmsg,
      data: response.data
    };
  } catch (error) {
    console.error('钉钉推送失败:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

async function sendClassMeetingNotification(webhook, notification, secret = null) {
  const { title, content, targetGrade, targetClass, sendTime } = notification;

  const markdownText = `
### ${title}

**推送对象**: ${targetGrade} ${targetClass}

**发送时间**: ${sendTime}

---

${content}

---

*来自校园膳食助手系统*
  `.trim();

  return await sendMarkdownMessage(webhook, {
    title: title,
    text: markdownText,
    isAtAll: true
  }, secret);
}

async function sendToMultipleClasses(config, notification) {
  const results = [];
  const { targetGrade, targetClass } = notification;

  const targetClasses = [];

  if (targetGrade === '全校' || targetGrade === '所有班主任') {

    targetClasses.push(...Object.keys(config));
  } else if (targetClass === '全部' || targetClass === '全部班级') {

    Object.keys(config).forEach(key => {
      if (key.includes(targetGrade)) {
        targetClasses.push(key);
      }
    });
  } else {

    const classKey = `${targetGrade}${targetClass}`;
    const exactMatch = Object.keys(config).find(k => k === classKey || k.endsWith(targetClass));
    if (exactMatch) {
      targetClasses.push(exactMatch);
    }
  }

  for (const classKey of targetClasses) {
    const classConfig = config[classKey];
    if (!classConfig) continue;

    let webhook, secret;
    if (typeof classConfig === 'string') {

      webhook = classConfig;
      secret = null;
    } else {

      webhook = classConfig.webhook;
      secret = classConfig.secret || null;
    }

    if (webhook) {
      const result = await sendClassMeetingNotification(webhook, notification, secret);
      results.push({
        class: classKey,
        ...result
      });
    }
  }

  return {
    total: targetClasses.length,
    success: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

async function validateWebhook(webhook, secret = null) {
  try {
    const result = await sendTextMessage(webhook, {
      content: '钉钉机器人连接测试成功！'
    }, secret);
    return result.success;
  } catch (error) {
    return false;
  }
}

module.exports = {
  generateSign,
  sendTextMessage,
  sendMarkdownMessage,
  sendClassMeetingNotification,
  sendToMultipleClasses,
  validateWebhook
};

