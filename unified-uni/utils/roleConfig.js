// 不同角色的tabbar配置
export const roleTabbarConfig = {
  // 学生端tabbar配置
  student: {
    navItems: [
      { path: "pages/student/home/home", label: "首页", icon: "home", isAI: false },
      { path: "pages/student/order/order", label: "点餐", icon: "cart", isAI: false },
      { path: "pages/student/ai-assistant/aiAssistant", label: "AI 智膳伙伴", icon: "chatbubble", isAI: false },
      { path: "pages/student/report/report", label: "报告", icon: "list", isAI: false },
      { path: "pages/student/profile/profile", label: "我的", icon: "person", isAI: false },
    ],
  },
  // 家长端tabbar配置
  parent: {
    navItems: [
      { path: "pages/parent/home/home", label: "首页", icon: "home", isAI: false },
      {
        path: "pages/parent/meal-history/index",
        label: "用餐记录",
        icon: "list",
        isAi: false
      },
      { path: "pages/parent/ai-assistant/aiAssistant", label: "AI 智膳伙伴", icon: "chatbubble", isAI: false },
      { path: "pages/parent/profile/profile", label: "我的", icon: "person", isAI: false },
    ],
  },
  // 学校端tabbar配置
  school: {
    navItems: [
      { path: "pages/school/dashboard/dashboard", label: "监控大屏", icon: "home", isAI: false },
      { path: "pages/school/reports/index", label: "学生健康", icon: "list", isAI: false },
      { path: "pages/school/ai-assistant/aiAssistant", label: "AI助手", icon: "chatbubble", isAI: false },
      { path: "pages/school/education/education", label: "营养教育", icon: "paperplane", isAI: false },
      { path: "pages/school/profile/profile", label: "个人中心", icon: "gear", isAI: false },
    ],
  },
  // 教师端tabbar配置 (作为兼容)
  teacher: {
    navItems: [
      { path: "pages/school/dashboard/dashboard", label: "监控大屏", icon: "home", isAI: false },
      { path: "pages/school/reports/index", label: "学生健康", icon: "list", isAI: false },
      { path: "pages/school/ai-assistant/aiAssistant", label: "AI助手", icon: "chatbubble", isAI: false },
      { path: "pages/school/education/education", label: "营养教育", icon: "paperplane", isAI: false },
      { path: "pages/school/profile/profile", label: "个人中心", icon: "gear", isAI: false },
    ],
  },
  // 食堂端tabbar配置
  canteen: {
    navItems: [
      { path: "pages/canteen/dashboard", label: "AI数据大屏", icon: "home-filled", isAI: false },
      { path: "pages/canteen/menu/menu", label: "菜品管理", icon: "shop-filled", isAI: false },
      { path: "pages/canteen/inventory/inventory", label: "库存管理", icon: "list", isAI: false },
      { path: "pages/canteen/purchase/purchase", label: "采购管理", icon: "cart-filled", isAI: false },
      { path: "pages/canteen/orders/orders", label: "订单管理", icon: "compose", isAI: false },
      { path: "pages/canteen/production/production", label: "生产计划", icon: "calendar-filled", isAI: false },
      { path: "pages/canteen/profile/profile", label: "个人中心", icon: "person-filled", isAI: false },
    ],
  },
};

// 获取角色对应的tabbar配置
export const getTabbarConfigByRole = (role) => {
  if (role === "canteen_admin") {
    role = "canteen";
  }
  return roleTabbarConfig[role] || { navItems: [] };
};
