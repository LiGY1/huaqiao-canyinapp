<template>
  <view class="container">
    <!-- 这里可以放 App 的 Logo 或 Loading 动画 -->
  </view>
</template>

<script>
// 导入存储工具
import storage from '../../utils/storage';

export default {
  onLoad() {
    this.checkLogin();
  },
  methods: {
    checkLogin() {
      const token = storage.getToken();

      if (token) {
        // 有 token，获取用户信息
        const userInfo = storage.getUserInfo();
        let redirectUrl = '';
        
        // 根据角色类型跳转到对应页面
        if (userInfo && userInfo.role) {
          switch (userInfo.role) {
            case 'student':
              redirectUrl = '/pages/student/home/home';
              break;
            case 'parent':
              redirectUrl = '/pages/parent/home/home';
              break;
            case 'teacher':
            case 'principal':
            case 'admin':
            case 'super_admin':
              redirectUrl = '/pages/school/dashboard/dashboard';
              break;
            case 'canteen_admin':
            case 'canteen_staff':
              redirectUrl = '/pages/canteen/dashboard';
              break;
            default:
              redirectUrl = '/pages/student/home/home';
          }
        } else {
          // 默认跳转到学生首页
          redirectUrl = '/pages/student/home/home';
        }
        
        // 确保不会跳转到自己，避免无限循环
        if (redirectUrl !== '/pages/index/index') {
          // 使用 reLaunch 关闭启动页，避免用户按返回键回到启动页
          uni.reLaunch({
            url: redirectUrl
          });
        }
      } else {
        // 无 token，跳转到登录页
        // 这里使用 reLaunch 关闭启动页，避免用户按返回键回到启动页
        uni.reLaunch({
          url: '/pages/login/login'
        });
      }
    },
  },
};
</script>
