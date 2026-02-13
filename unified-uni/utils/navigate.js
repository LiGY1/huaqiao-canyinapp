// Shared navigation helper used by tabbar and other components.
// Tries switchTab -> redirectTo -> navigateTo, mirroring commonTabbar logic.
export default function navigate(path) {
  if (!path || path === "#") return;

  const formattedPath = path.startsWith("/") ? path : `/${path}`;

  uni.switchTab({
    url: formattedPath,
    fail: (err) => {
      // If it's not a tab page, try redirectTo
      console.warn("switchTab failed, trying redirectTo:", err);
      uni.redirectTo({
        url: formattedPath,
        fail: (err2) => {
          console.error("Navigation failed, falling back to navigateTo:", err2);
          // Last resort
          uni.navigateTo({ url: formattedPath });
        },
      });
    },
  });
}
