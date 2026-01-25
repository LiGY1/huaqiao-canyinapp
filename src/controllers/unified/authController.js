const chalk = require('chalk');
const User = require('../../models/User');
const { generateToken, generatePermanentToken } = require('../../utils/jwtUtils');
const { success, error } = require('../../utils/responseFormatter');
const { USER_ROLES } = require('../../config/constants');

// ==================== 门户URL配置 ====================
// 支持两种模式：
// 1. 独立端口模式（开发环境，每个前端独立端口）
// 2. 统一端口模式（生产环境，通过路径区分）

// 统一端口模式 - 所有前端通过同一端口的不同路径访问
const USE_UNIFIED_PORT = process.env.USE_UNIFIED_PORT === 'true';
const UNIFIED_PORT = process.env.UNIFIED_PORT || '1000';
const UNIFIED_BASE_URL = process.env.UNIFIED_BASE_URL || `http://localhost:${UNIFIED_PORT}`;

// 启动时输出配置信息
console.log(chalk.cyan('==================== 统一登录配置 ===================='));
console.log(chalk.white('  USE_UNIFIED_PORT:'), USE_UNIFIED_PORT ? chalk.green('true (统一端口模式)') : chalk.yellow('false (独立端口模式)'));
console.log(chalk.white('  UNIFIED_PORT:'), chalk.cyan(UNIFIED_PORT));
console.log(chalk.white('  UNIFIED_BASE_URL:'), chalk.cyan(UNIFIED_BASE_URL));
console.log(chalk.white('  支持动态域名:'), chalk.green('✓ 是（优先使用请求头）'));
console.log(chalk.cyan('====================================================\n'));

// 统一端口模式下的路径映射
const UNIFIED_PORTAL_PATHS = {
  [USER_ROLES.STUDENT]: '/student',
  [USER_ROLES.PARENT]: '/parent',
  [USER_ROLES.TEACHER]: '/teacher',
  [USER_ROLES.PRINCIPAL]: '/teacher',  // 校长也使用学校端
  [USER_ROLES.ADMIN]: '/teacher',      // 管理员也使用学校端
  [USER_ROLES.CANTEEN_ADMIN]: '/canteen',
  [USER_ROLES.CANTEEN_STAFF]: '/canteen'
};

// 开发环境 - 独立端口模式
const PORTAL_URLS = {
  [USER_ROLES.STUDENT]: 'http://localhost:5173',           // 学生端
  [USER_ROLES.PARENT]: 'http://localhost:5174',            // 家长端
  [USER_ROLES.TEACHER]: 'http://localhost:5175',           // 学校端（教师）
  [USER_ROLES.PRINCIPAL]: 'http://localhost:5175',         // 学校端（校长）
  [USER_ROLES.ADMIN]: 'http://localhost:5175',             // 学校端（管理员）
  [USER_ROLES.CANTEEN_ADMIN]: 'http://localhost:5176',     // 食堂端（管理员）
  [USER_ROLES.CANTEEN_STAFF]: 'http://localhost:5176'     // 食堂端（员工）
};

// 生产环境 - 独立端口模式（兼容旧配置）
const PRODUCTION_PORTAL_URLS = {
  [USER_ROLES.STUDENT]: process.env.STUDENT_PORTAL_URL || 'http://124.223.202.156:3000',
  [USER_ROLES.PARENT]: process.env.PARENT_PORTAL_URL || 'http://124.223.202.156:3001',
  [USER_ROLES.TEACHER]: process.env.SCHOOL_PORTAL_URL || 'http://124.223.202.156:3002',
  [USER_ROLES.PRINCIPAL]: process.env.SCHOOL_PORTAL_URL || 'http://124.223.202.156:3002',
  [USER_ROLES.ADMIN]: process.env.SCHOOL_PORTAL_URL || 'http://124.223.202.156:3002',
  [USER_ROLES.CANTEEN_ADMIN]: process.env.CANTEEN_PORTAL_URL || 'http://124.223.202.156:3003',
  [USER_ROLES.CANTEEN_STAFF]: process.env.CANTEEN_PORTAL_URL || 'http://124.223.202.156:3003'
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
    const path = UNIFIED_PORTAL_PATHS[role] || '/student';
    
    // 动态获取主机名和协议，支持局域网访问
    // 优先使用请求头中的主机名，而不是配置文件中的固定值
    let baseUrl;
    if (req) {
      // 优先从 X-Forwarded-Host 获取（代理环境），其次从 Host 头获取
      const protocol = req.get('X-Forwarded-Proto') || req.protocol || 'http';
      const forwardedHost = req.get('X-Forwarded-Host');
      const hostHeader = req.get('host');
      
      // 提取主机名（去除端口）
      let host = 'localhost';
      if (forwardedHost) {
        host = forwardedHost.split(':')[0];
        console.log(chalk.cyan(`[统一登录] 使用代理转发的主机名: X-Forwarded-Host=${forwardedHost}`));
      } else if (hostHeader) {
        host = hostHeader.split(':')[0];
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
    const isDevelopment = process.env.NODE_ENV !== 'production';
    const portalUrls = isDevelopment ? PORTAL_URLS : PRODUCTION_PORTAL_URLS;
    
    // 如果有请求对象，也尝试动态构建URL
    if (req && isDevelopment) {
      const protocol = req.protocol || 'http';
      const host = req.get('host')?.split(':')[0] || 'localhost';
      
      // 端口映射
      const portMap = {
        [USER_ROLES.STUDENT]: '5173',
        [USER_ROLES.PARENT]: '5174',
        [USER_ROLES.TEACHER]: '5175',
        [USER_ROLES.PRINCIPAL]: '5175',
        [USER_ROLES.ADMIN]: '5175',
        [USER_ROLES.CANTEEN_ADMIN]: '5176',
        [USER_ROLES.CANTEEN_STAFF]: '5176'
      };
      
      const port = portMap[role] || '5173';
      return `${protocol}://${host}:${port}`;
    }
    
    return portalUrls[role] || 'http://localhost:5173';
  }
}

/**
 * 统一登录接口
 * 根据用户角色自动返回对应的跳转URL
 */
exports.login = async (req, res) => {
  try {
    const { username, password, roleType } = req.body;

    if (!username || !password) {
      return error(res, '请提供用户名和密码', 400);
    }

    if (!roleType) {
      return error(res, '请选择登录身份', 400);
    }

    // 查找用户（不限制角色）
    const user = await User.findOne({ username })
      .populate('children', 'name studentId class grade'); // 如果是家长，加载孩子信息

    if (!user) {
      return error(res, '用户名或密码错误', 401);
    }

    // 验证密码
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return error(res, '用户名或密码错误', 401);
    }

    // 检查账号是否激活
    if (!user.isActive) {
      return error(res, '账号已被禁用，请联系管理员', 403);
    }

    // 验证角色是否匹配
    const roleTypeValid = validateRoleType(user.role, roleType);
    if (!roleTypeValid) {
      const roleTypeNames = {
        'student': '学生',
        'parent': '家长',
        'school': '学校人员',
        'canteen': '食堂人员'
      };
      const actualRoleType = getRoleType(user.role);
      return error(
        res, 
        `角色不匹配！您选择的是"${roleTypeNames[roleType]}"，但此账号是"${roleTypeNames[actualRoleType]}"账号`, 
        403
      );
    }

    // 生成Token
    const token = await generateToken(user._id);

    // 获取跳转URL（根据配置模式，传入 req 以支持动态主机名）
    const redirectUrl = getRedirectUrl(user.role, req);

    // 构建用户信息
    const userInfo = {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      redirectUrl, // 前端根据这个URL进行跳转
      tokenType: 'standard'
    };

    // 根据角色添加额外信息
    switch (user.role) {
      case USER_ROLES.STUDENT:
        userInfo.studentId = user.studentId;
        userInfo.class = user.class;
        userInfo.grade = user.grade;
        userInfo.balance = user.balance;
        break;

      case USER_ROLES.PARENT:
        userInfo.phone = user.phone;
        userInfo.children = user.children;
        break;

      case USER_ROLES.TEACHER:
      case USER_ROLES.PRINCIPAL:
      case USER_ROLES.ADMIN:
        userInfo.department = user.department;
        userInfo.schoolId = user.schoolId;
        userInfo.schoolName = user.schoolName || user.schoolId;
        userInfo.managedClasses = user.managedClasses || [];
        break;

      case USER_ROLES.CANTEEN_ADMIN:
      case USER_ROLES.CANTEEN_STAFF:
        // 食堂人员基本信息已包含
        break;
    }

    console.log(chalk.green(`[统一登录] 用户 ${username} (${user.role}) 登录成功，跳转: ${redirectUrl}`));

    success(res, {
      token,
      userInfo
    }, '登录成功');

  } catch (err) {
    console.error('[Unified-Login] 登录失败:', err);
    error(res, '登录失败，请稍后重试', 500);
  }
};

/**
 * 获取用户信息
 * 需要token认证
 */
exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('children', 'name studentId class grade');

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 获取跳转URL（根据配置模式，传入 req 以支持动态主机名）
    const redirectUrl = getRedirectUrl(user.role, req);

    success(res, {
      ...user.toJSON(),
      redirectUrl
    });
  } catch (err) {
    console.error('[Unified-Login] 获取用户信息失败:', err);
    error(res, '获取用户信息失败', 500);
  }
};

/**
 * 获取角色对应的门户配置信息
 */
exports.getPortalConfig = async (req, res) => {
  try {
    const isDevelopment = process.env.NODE_ENV !== 'production';

    // 动态计算 baseUrl
    let baseUrl = UNIFIED_BASE_URL;
    if (USE_UNIFIED_PORT && req) {
      const protocol = req.protocol || 'http';
      const host = req.get('host')?.split(':')[0] || 'localhost';
      baseUrl = `${protocol}://${host}:${UNIFIED_PORT}`;
    }

    success(res, {
      environment: isDevelopment ? 'development' : 'production',
      unifiedPortMode: USE_UNIFIED_PORT,
      unifiedBaseUrl: USE_UNIFIED_PORT ? baseUrl : null,
      portals: {
        student: { 
          role: USER_ROLES.STUDENT, 
          url: getRedirectUrl(USER_ROLES.STUDENT, req), 
          name: '学生端' 
        },
        parent: { 
          role: USER_ROLES.PARENT, 
          url: getRedirectUrl(USER_ROLES.PARENT, req), 
          name: '家长端' 
        },
        school: { 
          roles: [USER_ROLES.TEACHER, USER_ROLES.PRINCIPAL, USER_ROLES.ADMIN],
          url: getRedirectUrl(USER_ROLES.TEACHER, req),
          name: '学校端'
        },
        canteen: {
          roles: [USER_ROLES.CANTEEN_ADMIN, USER_ROLES.CANTEEN_STAFF],
          url: getRedirectUrl(USER_ROLES.CANTEEN_ADMIN, req),
          name: '食堂端'
        }
      }
    }, '获取门户配置成功');
  } catch (err) {
    console.error('[Unified-Login] 获取门户配置失败:', err);
    error(res, '获取门户配置失败', 500);
  }
};

/**
 * 获取用户角色对应的角色类型
 */
function getRoleType(userRole) {
  if (userRole === USER_ROLES.STUDENT) {
    return 'student';
  } else if (userRole === USER_ROLES.PARENT) {
    return 'parent';
  } else if ([USER_ROLES.TEACHER, USER_ROLES.PRINCIPAL, USER_ROLES.ADMIN].includes(userRole)) {
    return 'school';
  } else if ([USER_ROLES.CANTEEN_ADMIN, USER_ROLES.CANTEEN_STAFF].includes(userRole)) {
    return 'canteen';
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

