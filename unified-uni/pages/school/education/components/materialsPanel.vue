<template>
  <view class="materials-panel">
    <view class="action-bar" v-if="!isTeacher">
      <button class="upload-btn" @click="showUploadPopup">
        <uni-icons type="upload" size="18" color="#fff"></uni-icons>
        <text>上传教育材料</text>
      </button>
    </view>

    <view v-if="isTeacher" class="info-alert">
      <uni-icons type="info" size="20" color="#4facfe"></uni-icons>
      <text>这里显示可供下载的营养教育材料</text>
    </view>

    <view class="materials-list">
      <view v-for="material in materials" :key="material.id" class="material-card">
        <view class="icon-box">
          <uni-icons :type="getFileIcon(material.fileType)" size="48" color="#4facfe"></uni-icons>
        </view>
        <view class="material-content">
          <text class="name">{{ material.name }}</text>
          <view class="meta">
            <text>{{ material.type }}</text>
            <text>{{ material.size }}</text>
            <text>{{ material.uploadDate }}</text>
          </view>
          <view class="stats">
            <text>下载: {{ material.downloads }}次</text>
          </view>
        </view>
        <view class="card-footer">
          <view class="footer-btn" @click="previewMaterial(material)">预览</view>
          <view class="footer-btn primary" @click="downloadMaterial(material)">下载</view>
          <view v-if="!isTeacher" class="footer-btn danger" @click="deleteMaterial(material)">删除</view>
        </view>
      </view>
      
      <view v-if="materials.length === 0" class="empty-state">
        <image src="/static/empty.png" mode="aspectFit" class="empty-img"></image>
        <text>暂无相关材料</text>
      </view>
    </view>

    <!-- 上传组件 UniApp 多用 uni.chooseFile 或 uni.chooseImage -->
  </view>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { educationApi } from '@/api/school/education';
import storage from '@/utils/storage';

const isTeacher = ref(true);
const materials = ref([]);
const loading = ref(false);

const loadMaterials = async () => {
  try {
    loading.value = true;
    const res = await educationApi.getMaterials({ type: 'material' });
    if (res.code === 200 || res.success) {
      const data = res.data?.list || res.data || [];
      materials.value = data.map(item => ({
        id: item._id || item.id,
        name: item.title,
        type: getFileTypeLabel(item.fileType),
        size: 'MB', // 模拟
        uploadDate: new Date(item.createdAt).toLocaleDateString(),
        downloads: item.downloadCount || 0,
        fileUrl: item.fileUrl,
        fileType: item.fileType
      }));
    }
  } catch (e) { console.error(e); }
  finally { loading.value = false; }
};

const getFileTypeLabel = (type) => {
  const labels = {
    'ppt': 'PPT课件',
    'pdf': 'PDF文档',
    'video': '视频',
    'image': '图片',
    'document': '文档'
  };
  return labels[type] || '文件';
};

const getFileIcon = (type) => {
  const icons = {
    'ppt': 'paperplane',
    'pdf': 'list',
    'video': 'videocam',
    'image': 'image',
  };
  return icons[type] || 'document';
};

const previewMaterial = (m) => {
  if (m.fileUrl) uni.showToast({ title: '预览开发中', icon: 'none' });
};

const downloadMaterial = (m) => {
  uni.showToast({ title: '开始下载...', icon: 'none' });
};

const deleteMaterial = (m) => {
  uni.showModal({
    title: '提示',
    content: '确定删除该材料吗？',
    success: (res) => { if (res.confirm) uni.showToast({ title: '已删除' }); }
  });
};

const showUploadPopup = () => {
  uni.showToast({ title: '上传功能暂未开放', icon: 'none' });
};

onMounted(() => {
  const userInfo = storage.getUserInfo();
  isTeacher.value = userInfo?.role === 'teacher';
  loadMaterials();
});
</script>

<style lang="scss" scoped>
.materials-panel { padding: 10rpx 0; }

.action-bar {
  margin-bottom: 20rpx;
  .upload-btn {
    background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    color: #fff;
    border-radius: 40rpx;
    height: 80rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12rpx;
    font-size: 28rpx;
    &::after { border: none; }
  }
}

.info-alert {
  background-color: #f0f9ff;
  border: 1rpx solid #bae6fd;
  padding: 24rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 30rpx;
  text { font-size: 24rpx; color: #0369a1; }
}

.material-card {
  background: #fff;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}

.icon-box {
  background-color: #f8fafc;
  height: 160rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.material-content {
  .name { font-size: 30rpx; font-weight: bold; color: #1e293b; margin-bottom: 12rpx; display: block; }
  .meta {
    display: flex;
    gap: 20rpx;
    font-size: 22rpx;
    color: #94a3b8;
    margin-bottom: 20rpx;
  }
  .stats {
    padding-top: 16rpx;
    border-top: 1rpx solid #f1f5f9;
    font-size: 24rpx;
    color: #64748b;
  }
}

.card-footer {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f1f5f9;
  display: flex;
  justify-content: flex-end;
  gap: 30rpx;
  .footer-btn {
    font-size: 26rpx;
    color: #4facfe;
    &.primary { color: #10b981; }
    &.danger { color: #ef4444; }
  }
}

.empty-state {
  padding: 100rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20rpx;
  color: #94a3b8;
  font-size: 28rpx;
  .empty-img { width: 240rpx; height: 240rpx; opacity: 0.5; }
}
</style>
