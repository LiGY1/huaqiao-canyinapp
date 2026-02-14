<template>
  <view class="agreement-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="content-wrapper">
        <view class="header">
          <text class="title">用户协议</text>
          <text class="update-time">更新日期：2024年1月1日</text>
        </view>

        <view class="section">
          <text class="section-title">一、协议的接受</text>
          <text class="section-content">
            欢迎使用智慧校园系统。在使用本系统前，请您仔细阅读本用户协议（以下简称"本协议"）。
            您使用本系统即表示您已阅读、理解并同意接受本协议的全部内容。
          </text>
        </view>

        <view class="section">
          <text class="section-title">二、服务说明</text>
          <text class="section-content">
            智慧校园系统为学生、家长、学校和食堂提供在线订餐、营养管理、健康监测等服务。
            我们致力于为用户提供安全、便捷的校园生活服务。
          </text>
        </view>

        <view class="section">
          <text class="section-title">三、用户账号</text>
          <text class="section-content">
            1. 用户账号由学校统一分配和管理。\n
            2. 用户应妥善保管账号和密码，不得转让或出借给他人使用。\n
            3. 如发现账号被盗用，应立即通知学校管理员。
          </text>
        </view>

        <view class="section">
          <text class="section-title">四、用户行为规范</text>
          <text class="section-content">
            用户在使用本系统时，应遵守国家法律法规，不得：\n
            1. 发布违法、虚假、侵权信息\n
            2. 恶意攻击系统或干扰他人使用\n
            3. 利用系统从事违法活动
          </text>
        </view>

        <view class="section">
          <text class="section-title">五、隐私保护</text>
          <text class="section-content">
            我们重视用户隐私保护，详细内容请参阅《隐私政策》。
          </text>
        </view>

        <view class="section">
          <text class="section-title">六、免责声明</text>
          <text class="section-content">
            1. 因不可抗力导致的服务中断，我们不承担责任。\n
            2. 用户因违反本协议造成的损失，由用户自行承担。
          </text>
        </view>

        <view class="section">
          <text class="section-title">七、协议修改</text>
          <text class="section-content">
            我们有权根据需要修改本协议，修改后的协议将在系统中公布。
            用户继续使用本系统即视为接受修改后的协议。
          </text>
        </view>

        <view class="section">
          <text class="section-title">八、联系我们</text>
          <text class="section-content">
            如对本协议有任何疑问，请联系学校管理员。
          </text>
        </view>

        <view class="footer">
          <text class="footer-text">智慧校园系统</text>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup>
// 页面逻辑
</script>

<style lang="scss" scoped>
.agreement-page {
  width: 100%;
  height: 100vh;
  background: #f9fafb;
}

.scroll-content {
  width: 100%;
  height: 100%;
}

.content-wrapper {
  padding: 40rpx;
}

.header {
  text-align: center;
  margin-bottom: 60rpx;
}

.title {
  display: block;
  font-size: 48rpx;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 20rpx;
}

.update-time {
  display: block;
  font-size: 24rpx;
  color: #9ca3af;
}

.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.section-title {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #374151;
  margin-bottom: 20rpx;
}

.section-content {
  display: block;
  font-size: 28rpx;
  color: #6b7280;
  line-height: 1.8;
  white-space: pre-line;
}

.footer {
  text-align: center;
  padding: 60rpx 0;
}

.footer-text {
  font-size: 24rpx;
  color: #9ca3af;
}
</style>
