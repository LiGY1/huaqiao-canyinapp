import App from "./App";

import "./uni.scss";
import "@/router/interceptor.js";

(function () {
  function at(n) {
    // 将 n 转换为整数
    n = Math.trunc(n) || 0;
    // 支持负数索引
    if (n < 0) n += this.length;
    // 边界检查
    if (n < 0 || n >= this.length) return undefined;
    return this[n];
  }

  // 为数组添加 .at()
  if (!Array.prototype.at) {
    Object.defineProperty(Array.prototype, "at", {
      value: at,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  // 为字符串添加 .at() (marked.js 可能也需要这个)
  if (!String.prototype.at) {
    Object.defineProperty(String.prototype, "at", {
      value: at,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }
})();

// #ifdef VUE3
import { createSSRApp } from "vue";
export function createApp() {
  const app = createSSRApp(App);
  return {
    app,
  };
}
// #endif
