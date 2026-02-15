module.exports = (req, res, next) => {
  // 静态资源缓存策略
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
    // 静态资源缓存 7 天
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
  } else if (req.url.startsWith("/api/")) {
    // API 请求不缓存（或使用协商缓存）
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
}