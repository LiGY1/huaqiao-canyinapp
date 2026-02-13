// main.js

// 1. 定义白名单（不需要登录就能访问的页面）
const whiteList = [
	'/', // 首页
	'/pages/login/login',
	'/pages/register/register'
]

// 2. 需要拦截的 API 列表
const list = ['navigateTo', 'redirectTo', 'reLaunch', 'switchTab']

// 3. 遍历添加拦截器
list.forEach(item => {
	uni.addInterceptor(item, {
		// invoke 钩子：在跳转 API 触发前执行
		invoke(e) {
			// e.url 是即将跳转的页面路径，通常带参数，如 /pages/index/index?id=1
			// 我们只需要路径部分
			const url = e.url.split('?')[0]

			// 获取本地 Token（模拟登录状态检查）
			const token = uni.getStorageSync('token')

			// 如果在白名单中，或者已经有 token，放行
			if (whiteList.includes(url) || token) {
				return true
			}

			// 否则，拦截跳转，并重定向到登录页

			// 注意：使用 uni.navigateTo 跳转到登录页可能会导致死循环或栈溢出，
			// 建议使用 method: 'reLaunch' 或确保 login 页面不在拦截范围内
			uni.reLaunch({
				url: '/pages/login/login'
			})

			return false // 返回 false 表示终止此次跳转
		},
		fail(err) {
			console.error(err)
		}
	})
})