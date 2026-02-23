'use strict';
const uniPush = uniCloud.getPushManager({
	appId: "__UNI__CA00E85"
})
const db = uniCloud.database();


exports.main = async (event) => {
	let obj = JSON.parse(event.body)
	const cidCollection = db.collection('user_cid');
	const {
		data
	} = await cidCollection.where({
		isValid: true
	}).get()
	const cids = data.map(item => item.cid);

const res = await uniPush.sendMessage({
    "push_clientid": cids,
    "title": obj.title,
    "content": obj.content,
    "payload": { "data": "test" },
    "force_notification": true,
    "request_id": obj.request_id,
    "options": {
        "HW": {
            // 【重要】华为通知参数配置
            // LOW: 普通(静默), NORMAL: 重要(可能有声)
            "/message/android/notification/importance": "NORMAL",
            
            // 【重要】消息分类
            // 如果没申请私信权益，测试时用 WORK 或 IM 可能会被修正，但比不填好
            // 尝试声明为“社交通讯”或“服务提醒”
            "/message/android/category": "IM", 
            
            // 设置默认铃声和震动
            "/message/android/notification/default_sound": true,
            "/message/android/notification/vibrate_timings": ["100", "200", "100"],
            
            // 点击动作：打开应用
            "/message/android/action/type": 3,
            "/message/android/action/param/appPkgName": "uni.app.UNICA00E85"
        }
    }
  })

	console.log(res, "res>>>");
	return res
};