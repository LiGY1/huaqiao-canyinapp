const chalk = require("chalk");
const User = require("../../models/User");
const { generateToken, generatePermanentToken } = require("../../utils/jwtUtils");
const { success, error } = require("../../utils/responseFormatter");
const { USER_ROLES } = require("../../config/constants");
const NodeRSA = require('node-rsa');
const { privateKey } = require("../../config/rsaKey");

// ==================== 门户URL配置 ====================
// 支持两种模式：
// 1. 独立端口模式（开发环境，每个前端独立端口）
// 2. 统一端口模式（生产环境，通过路径区分）

// 统一端口模式 - 所有前端通过同一端口的不同路径访问
const USE_UNIFIED_PORT = process.env.USE_UNIFIED_PORT === "true";
const UNIFIED_PORT = process.env.UNIFIED_PORT || "1000";
const UNIFIED_BASE_URL = process.env.UNIFIED_BASE_URL || `http://localhost:${UNIFIED_PORT}`;

// 统一端口模式下的路径映射
const UNIFIED_PORTAL_PATHS = {
  [USER_ROLES.STUDENT]: "/student",
  [USER_ROLES.PARENT]: "/parent",
  [USER_ROLES.TEACHER]: "/teacher",
  [USER_ROLES.PRINCIPAL]: "/teacher", // 校长也使用学校端
  [USER_ROLES.ADMIN]: "/teacher", // 管理员也使用学校端
  [USER_ROLES.CANTEEN_ADMIN]: "/canteen",
  [USER_ROLES.CANTEEN_STAFF]: "/canteen",
};

// 开发环境 - 独立端口模式
const PORTAL_URLS = {
  [USER_ROLES.STUDENT]: "http://localhost:5173", // 学生端
  [USER_ROLES.PARENT]: "http://localhost:5174", // 家长端
  [USER_ROLES.TEACHER]: "http://localhost:5175", // 学校端（教师）
  [USER_ROLES.PRINCIPAL]: "http://localhost:5175", // 学校端（校长）
  [USER_ROLES.ADMIN]: "http://localhost:5175", // 学校端（管理员）
  [USER_ROLES.CANTEEN_ADMIN]: "http://localhost:5176", // 食堂端（管理员）
  [USER_ROLES.CANTEEN_STAFF]: "http://localhost:5176", // 食堂端（员工）
};

// 生产环境 - 独立端口模式（兼容旧配置）
const PRODUCTION_PORTAL_URLS = {
  [USER_ROLES.STUDENT]: process.env.STUDENT_PORTAL_URL || "http://124.223.202.156:3000",
  [USER_ROLES.PARENT]: process.env.PARENT_PORTAL_URL || "http://124.223.202.156:3001",
  [USER_ROLES.TEACHER]: process.env.SCHOOL_PORTAL_URL || "http://124.223.202.156:3002",
  [USER_ROLES.PRINCIPAL]: process.env.SCHOOL_PORTAL_URL || "http://124.223.202.156:3002",
  [USER_ROLES.ADMIN]: process.env.SCHOOL_PORTAL_URL || "http://124.223.202.156:3002",
  [USER_ROLES.CANTEEN_ADMIN]: process.env.CANTEEN_PORTAL_URL || "http://124.223.202.156:3003",
  [USER_ROLES.CANTEEN_STAFF]: process.env.CANTEEN_PORTAL_URL || "http://124.223.202.156:3003",
};

/**
 * 获取角色对应的重定向URL
 * 根据配置返回统一端口路径或独立端口URL
 * @param {string} role - 用户角色
 * @param {object} req - Express 请求对象，用于获取主机名
 */
function getRedirectUrl(role, req = null) {
  if (USE_UNIFIED_PORT) {
    // 统一端口模式：返回路径（包含末尾斜杠，匹配 Vue Router base）
    const path = UNIFIED_PORTAL_PATHS[role] || "/student";

    // 动态获取主机名和协议，支持局域网访问
    // 优先使用请求头中的主机名，而不是配置文件中的固定值
    let baseUrl;
    if (req) {
      // 优先从 X-Forwarded-Host 获取（代理环境），其次从 Host 头获取
      const protocol = req.get("X-Forwarded-Proto") || req.protocol || "http";
      const forwardedHost = req.get("X-Forwarded-Host");
      const hostHeader = req.get("host");

      // 提取主机名（去除端口）
      let host = "localhost";
      if (forwardedHost) {
        host = forwardedHost.split(":")[0];
        console.log(chalk.cyan(`[统一登录] 使用代理转发的主机名: X-Forwarded-Host=${forwardedHost}`));
      } else if (hostHeader) {
        host = hostHeader.split(":")[0];
        console.log(chalk.cyan(`[统一登录] 使用直接访问的主机名: Host=${hostHeader}`));
      }

      baseUrl = `${protocol}://${host}:${UNIFIED_PORT}`;
      console.log(chalk.cyan(`[统一登录] 动态构建跳转URL: protocol=${protocol}, host=${host}, baseUrl=${baseUrl}`));
    } else {
      // 如果没有请求对象，回退到配置文件中的值
      baseUrl = UNIFIED_BASE_URL;
      console.log(chalk.yellow(`[统一登录] 使用配置的 baseUrl: ${baseUrl}`));
    }

    return `${baseUrl}${path}/`; // 添加末尾斜杠
  } else {
    // 独立端口模式：根据环境返回完整URL
    const isDevelopment = process.env.NODE_ENV !== "production";
    const portalUrls = isDevelopment ? PORTAL_URLS : PRODUCTION_PORTAL_URLS;

    // 如果有请求对象，也尝试动态构建URL
    if (req && isDevelopment) {
      const protocol = req.protocol || "http";
      const host = req.get("host")?.split(":")[0] || "localhost";

      // 端口映射
      const portMap = {
        [USER_ROLES.STUDENT]: "5173",
        [USER_ROLES.PARENT]: "5174",
        [USER_ROLES.TEACHER]: "5175",
        [USER_ROLES.PRINCIPAL]: "5175",
        [USER_ROLES.ADMIN]: "5175",
        [USER_ROLES.CANTEEN_ADMIN]: "5176",
        [USER_ROLES.CANTEEN_STAFF]: "5176",
      };

      const port = portMap[role] || "5173";
      return `${protocol}://${host}:${port}`;
    }

    return portalUrls[role] || "http://localhost:5173";
  }
}

/**
 * 验证用户凭证（查找、比对密码、检查激活）
 */
async function verifyUserCredentials(username, password) {
  validateLoginInput(username, password);

  // 查找用户
  const user = await User.findOne({ username }).populate("children", "name studentId class grade");

  // 用户不存在
  if (!user) {
    throw { isBusinessError: true, message: "用户名或密码错误", statusCode: 401 };
  }

  // 验证密码
  const isPasswordMatch = await user.comparePassword(password);
  if (!isPasswordMatch) {
    throw { isBusinessError: true, message: "用户名或密码错误", statusCode: 401 };
  }

  // 检查激活状态
  if (!user.isActive) {
    throw { isBusinessError: true, message: "账号已被禁用，请联系管理员", statusCode: 403 };
  }
  if (user.role === "teacher") {
    user.role = "school"
  }

  return user;
}

/**
 * 确保用户选择的登录角色与账号实际角色匹配
 */
function ensureRoleMatches(user, inputRoleType) {
  // 假设 validateRoleType 是外部引入的工具函数
  const isValid = validateRoleType(user.role, inputRoleType);

  if (!isValid) {
    const roleTypeNames = {
      student: "学生",
      parent: "家长",
      school: "学校人员",
      canteen: "食堂人员",
    };

    // 假设 getRoleType 是根据 user.role 获取对应 roleType 的工具函数
    const actualRoleType = getRoleType(user.role);

    throw {
      isBusinessError: true,
      message: `角色不匹配！您选择的是"${roleTypeNames[inputRoleType]}"，但此账号是"${roleTypeNames[actualRoleType]}"账号`,
      statusCode: 403,
    };
  }
}

/**
 * 构建返回给前端的用户信息对象
 */
function buildUserInfo(user, req) {
  // 基础信息
  const baseInfo = {
    id: user._id,
    username: user.username,
    name: user.name,
    role: user.role,
    avatar: user.avatar,
    tokenType: "standard",
  };

  if (baseInfo.role === "parent") {
    baseInfo.name = /家长/.test(baseInfo.name) ? baseInfo.name[0] + '**家长' : `${baseInfo.name[0]}**`;
  }

  // 根据角色合并特有信息
  const roleSpecificInfo = getRoleSpecificData(user);

  return { ...baseInfo, ...roleSpecificInfo };
}

/**
 * 获取角色特定的数据字段 (内部辅助函数)
 */
function getRoleSpecificData(user) {
  switch (user.role) {
    case USER_ROLES.STUDENT:
      return {
        studentId: user.studentId,
        class: user.class,
        grade: user.grade,
        balance: user.balance,
      };

    case USER_ROLES.PARENT:
      return {
        phone: user.phone,
        children: user.children,
      };

    case USER_ROLES.TEACHER:
    case USER_ROLES.PRINCIPAL:
    case USER_ROLES.ADMIN:
      return {
        department: user.department,
        schoolId: user.schoolId,
        schoolName: user.schoolName || user.schoolId,
        managedClasses: user.managedClasses || [],
      };

    case USER_ROLES.CANTEEN_ADMIN:
    case USER_ROLES.CANTEEN_STAFF:
    default:
      return {};
  }
}

/**
 * 校验登录基础参数
 */
function validateLoginInput(username, password) {
  if (!username || !password) {
    throw { isBusinessError: true, message: "请提供用户名和密码", statusCode: 400 };
  }
}

/**
 * 统一登录接口
 * @param {object} req
 * @param {object} res
 * @returns
 */
exports.login = async (req, res) => {
  try {
    // 1. 初始化key对象，传递私钥
    const key = new NodeRSA(privateKey);
    key.setOptions({ encryptionScheme: 'pkcs1' });

    // 2. 结构出用户名、密码
    let { username, password } = req.body;

    // 3. 使用私钥解密密码
    password = key.decrypt(password, 'utf8');

    // 4. 验证用户账号密码
    const user = await verifyUserCredentials(username, password);

    // 3. 生成 Token
    const token = await generateToken(user._id);

    // 4. 构建用户信息
    const userInfo = buildUserInfo(user, req);

    // 5. 返回token和用户信息
    success(res, { token, userInfo }, "登录成功");
    // --------------------------------------------------
  } catch (err) {
    console.error("[Unified-Login] 登录失败:", err);
    error(res, err.message || "登录失败，请稍后重试", err.statusCode || 500);
  }
};

/**
 * 获取用户信息
 * 需要token认证
 */
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("children", "name studentId class grade");

    if (!user) {
      return error(res, "用户不存在", 404);
    }

    // 获取跳转URL（根据配置模式，传入 req 以支持动态主机名）
    const redirectUrl = getRedirectUrl(user.role, req);

    // 获取角色类型
    const roleType = getRoleType(user.role);

    success(res, {
      ...user.toJSON(),
      redirectUrl,
      roleType,
    });
  } catch (err) {
    console.error("[Unified-Login] 获取用户信息失败:", err);
    error(res, "获取用户信息失败", 500);
  }
};

/**
 * 获取角色对应的门户配置信息
 */
exports.getPortalConfig = async (req, res) => {
  try {
    const isDevelopment = process.env.NODE_ENV !== "production";

    // 动态计算 baseUrl
    let baseUrl = UNIFIED_BASE_URL;
    if (USE_UNIFIED_PORT && req) {
      const protocol = req.protocol || "http";
      const host = req.get("host")?.split(":")[0] || "localhost";
      baseUrl = `${protocol}://${host}:${UNIFIED_PORT}`;
    }

    success(
      res,
      {
        environment: isDevelopment ? "development" : "production",
        unifiedPortMode: USE_UNIFIED_PORT,
        unifiedBaseUrl: USE_UNIFIED_PORT ? baseUrl : null,
        portals: {
          student: {
            role: USER_ROLES.STUDENT,
            url: getRedirectUrl(USER_ROLES.STUDENT, req),
            name: "学生端",
          },
          parent: {
            role: USER_ROLES.PARENT,
            url: getRedirectUrl(USER_ROLES.PARENT, req),
            name: "家长端",
          },
          school: {
            roles: [USER_ROLES.TEACHER, USER_ROLES.PRINCIPAL, USER_ROLES.ADMIN],
            url: getRedirectUrl(USER_ROLES.TEACHER, req),
            name: "学校端",
          },
          canteen: {
            roles: [USER_ROLES.CANTEEN_ADMIN, USER_ROLES.CANTEEN_STAFF],
            url: getRedirectUrl(USER_ROLES.CANTEEN_ADMIN, req),
            name: "食堂端",
          },
        },
      },
      "获取门户配置成功",
    );
  } catch (err) {
    console.error("[Unified-Login] 获取门户配置失败:", err);
    error(res, "获取门户配置失败", 500);
  }
};

/**
 * 获取用户角色对应的角色类型
 */
function getRoleType(userRole) {
  if (userRole === USER_ROLES.STUDENT) {
    return "student";
  } else if (userRole === USER_ROLES.PARENT) {
    return "parent";
  } else if ([USER_ROLES.TEACHER, USER_ROLES.PRINCIPAL, USER_ROLES.ADMIN].includes(userRole)) {
    return "school";
  } else if ([USER_ROLES.CANTEEN_ADMIN, USER_ROLES.CANTEEN_STAFF].includes(userRole)) {
    return "canteen";
  }
  return null;
}

/**
 * 验证用户角色是否匹配选择的角色类型
 */
function validateRoleType(userRole, selectedRoleType) {
  const actualRoleType = getRoleType(userRole);
  return actualRoleType === selectedRoleType;
}

module.exports = exports;
