import { defineConfig } from "vite";
import uni from "@dcloudio/vite-plugin-uni";
import { babel } from "@rollup/plugin-babel";

export default defineConfig({
  plugins: [
    uni(),
    // 添加 Babel 插件，专门处理 mp-html
    babel({
      // ⚠️ 强制让 Babel 处理 node_modules 中的 mp-html
      include: [/mp-html/],
      exclude: [/\?vue&type=style/, /\.css$/],
      extensions: [".js", ".vue", ".mjs", ".ts"],
      babelHelpers: "bundled",
      presets: [
        [
          "@babel/preset-env",
          {
            // 目标设置为旧版安卓/iOS，强迫它转换正则
            targets: {
              chrome: "58",
              ios: "10",
              android: "6",
            },
            useBuiltIns: false,
          },
        ],
      ],
    }),
  ],
  build: {
    target: "es2015",
    minify: "terser",
  },
});
