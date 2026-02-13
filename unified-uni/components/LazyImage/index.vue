<template>
  <view class="lazy-image-box" :id="elId">
    <image
      :class="{ show: isLoaded }"
      :src="isShow ? currentSrc : placeholder"
      @load="onLoad"
      @error="onError"
      mode="aspectFill"
      style="width: 100%; height: 100%; opacity: 0; transition: opacity 0.3s"
    />
  </view>
</template>

<script>
export default {
  props: {
    src: { type: String, required: true },
    placeholder: { type: String, default: "/static/loading.png" }, // 你的占位图
  },
  data() {
    return {
      elId: "lazy_" + Math.random().toString(36).substr(2),
      isShow: false, // 是否开始加载
      isLoaded: false, // 是否加载完毕
      currentSrc: this.src,
      errorImg: "/static/loadingErrorImg.svg"
    };
  },
  watch: {
    src(newVal) {
      this.currentSrc = newVal;
      this.isLoaded = false;
    }
  },
  mounted() {
    this.observe();
  },
  destroyed() {
    if (this.observer) {
      this.observer.disconnect();
    }
  },
  methods: {
    observe() {
      this.observer = uni.createIntersectionObserver(this);
      // 监听当前组件相对于视窗的位置
      this.observer.relativeToViewport({ bottom: 100 }).observe(`#${this.elId}`, (res) => {
        if (res.intersectionRatio > 0) {
          this.isShow = true;
          // 图片进入视口后，停止监听以节省性能
          this.observer.disconnect();
        }
      });
    },
    onLoad() {
      // 图片网络请求完成，执行淡入动画
      this.isLoaded = true;
    },
    onError() {
      // 加载失败，替换为错误占位图
      if (!this.isShow) return; // 关键修复：当还在显示占位图时，忽略占位图的加载失败
      if (this.currentSrc !== this.errorImg) {
        this.currentSrc = this.errorImg;
        this.isLoaded = true; // 即使是错误图也要显示出来
      }
    }
  },
};
</script>

<style scoped>
.show {
  opacity: 1 !important;
}
</style>
