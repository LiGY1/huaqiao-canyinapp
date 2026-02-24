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
		"payload": {
			"data": "test"
		},
		"force_notification": true,
		"request_id": obj.request_id,
		"options": {
			"HW": {
				"/message/android/notification/importance": "NORMAL",
				"/message/android/category": "IM",
				"/message/android/notification/default_sound": true,
				"/message/android/notification/vibrate_timings": ["100", "200", "100"],
				"/message/android/action/type": 3,
				"/message/android/action/param/appPkgName": "uni.app.UNICA00E85"
			}
		}
	})

	console.log(res);
	return res
};