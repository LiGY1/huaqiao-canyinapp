const studentRoutes = require("./student");
const parentRoutes = require("./parent");
const schoolRoutes = require("./school");
const canteenRoutes = require("./canteen");
const unifiedRoutes = require("./unified");
const roleQueryRoutes = require("./roleQuery");
const monitoringRoutes = require("./monitoring");
const tokenManagementRoutes = require("./tokenManagement");
const { testPush } = require("../utils/pushMsg");
const { success } = require("../utils/responseFormatter");

module.exports = [
  {
    path: "/api/unified",
    callback: unifiedRoutes
  },
  {
    path: "/api/student",
    callback: studentRoutes
  },
  {
    path: "/api/parent",
    callback: parentRoutes
  },
  {
    path: "/api/school",
    callback: schoolRoutes
  },
  {
    path: "/api/canteen",
    callback: canteenRoutes
  },
  {
    path: "/api/role-query",
    callback: roleQueryRoutes
  },
  {
    path: "/api/monitoring",
    callback: monitoringRoutes
  },
  {
    path: "/api/token-management",
    callback: tokenManagementRoutes
  },
  {
    path: "/api/test-push",
    callback: async (req, res) => {
      const { data } = await testPush();
      success(res, data.data, '测试推送成功');
    }
  }
]