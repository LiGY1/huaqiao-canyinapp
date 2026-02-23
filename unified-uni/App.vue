<script>
	export default {
		onLaunch: function() {
			console.log("App Launch");
			uni.getPushClientId({
				success: async (res) => {
					let push_clientid = res.cid;
					console.log("客户端推送标识:", push_clientid);
					const resp = await uniCloud.callFunction({
						name: "bindCid",
						data: {
							cid: push_clientid,
						},
					});
					console.log(resp);
				},
				fail(err) {
					console.log(err);
				},
			});

			uni.onPushMessage((res) => {
				console.log("收到推送消息：", res); //监听推送消息
				if (res.type === "receive") {
					uni.createPushMessage({
						title: res.data.title || "新通知",
						content: res.data.content || "点击查看详情",
						payload: res.data.payload
					});
				}

				// type: "click" 表示用户点击了通知栏消息
				if (res.type === "click") {
					// 这里处理点击跳转逻辑
					console.log("用户点击了通知", res.data);
				}
			});
		},
	};
</script>

<style>
	/*每个页面公共css */
</style>