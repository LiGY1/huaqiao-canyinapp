<template>
  <view class="agreement-page">
    <scroll-view scroll-y class="scroll-content">
      <view class="content-wrapper">
        <view class="header">
          <text class="title">隐私政策</text>
          <text class="update-time">更新日期：2024年1月1日</text>
        </view>

        <view class="section">
          <text class="section-title">一、信息收集</text>
          <text class="section-content">
            我们会收集以下信息以提供服务：\n
            1. 基本信息：姓名、学号、班级等\n
            2. 订餐信息：订单记录、饮食偏好等\n
            3. 健康信息：体检数据、营养记录等（仅限授权使用）
          </text>
        </view>

        <view class="section">
          <text class="section-title">二、信息使用</text>
          <text class="section-content">
            我们收集的信息将用于：\n
            1. 提供订餐、营养管理等服务\n
            2. 改进系统功能和用户体验\n
            3. 生成统计报告（不包含个人身份信息）
          </text>
        </view>

        <view class="section">
          <text class="section-title">三、信息保护</text>
          <text class="section-content">
            我们采取以下措施保护您的信息：\n
            1. 使用加密技术传输和存储数据\n
            2. 严格限制员工访问权限\n
            3. 定期进行安全审计和漏洞修复
          </text>
        </view>

        <view class="section">
          <text class="section-title">四、信息共享</text>
          <text class="section-content">
            除以下情况外，我们不会与第三方共享您的个人信息：\n
            1. 获得您的明确同意\n
            2. 法律法规要求\n
            3. 保护用户或公众的重大利益
          </text>
        </view>

        <view class="section">
          <text class="section-title">五、未成年人保护</text>
          <text class="section-content">
            我们特别重视未成年人的隐私保护。对于未成年用户的信息，
            我们会采取更严格的保护措施，并在必要时征得监护人同意。
          </text>
        </view>

        <view class="section">
          <text class="section-title">六、您的权利</text>
          <text class="section-content">
            您有权：\n
            1. 查询、更正您的个人信息\n
            2. 删除或注销账号\n
            3. 撤回授权同意\n
            4. 投诉举报
          </text>
        </view>

        <view class="section">
          <text class="section-title">七、Cookie使用</text>
          <text class="section-content">
            我们使用Cookie和类似技术来改善用户体验。
            您可以通过浏览器设置管理Cookie，但这可能影响部分功能使用。
          </text>
        </view>

        <view class="section">
          <text class="section-title">八、政策更新</text>
          <text class="section-content">
            我们可能会不时更新本隐私政策。重大变更时，我们会通过系统通知您。
          </text>
        </view>

        <view class="section">
          <text class="section-title">九、联系我们</text>
          <text class="section-content">
            如对本隐私政策有任何疑问或建议，请联系学校管理员。
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
