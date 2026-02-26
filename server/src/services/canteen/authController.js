const User = require('../../models/User');
const Order = require('../../models/Order');
const ProductionPlan = require('../../models/ProductionPlan');
const { generateToken, revokeToken } = require('../../utils/jwtUtils');
const { success, error } = require('../../utils/responseFormatter');
const { USER_ROLES } = require('../../config/constants');
const { getStartOfDay, getEndOfDay } = require('../../utils/dateUtils');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;


    if (!username || !password) {
      return error(res, '请提供用户名和密码', 400);
    }

    // 先查找用户，不限制角色，以便诊断
    const user = await User.findOne({ username });
    
    if (!user) {
      return error(res, '用户名或密码错误', 401);
    }

    // 检查用户角色
    if (![USER_ROLES.CANTEEN_ADMIN, USER_ROLES.CANTEEN_STAFF].includes(user.role)) {
      return error(res, '该账号不是食堂端账号，请使用正确的登录入口', 403);
    }

    // 检查用户是否激活
    if (user.isActive === false) {
      return error(res, '账号已被禁用，请联系管理员', 403);
    }

    // 验证密码
    const isPasswordMatch = await user.comparePassword(password);
    
    if (!isPasswordMatch) {
      return error(res, '用户名或密码错误', 401);
    }


    const token = await generateToken(user._id);
    

    success(res, {
      token,
      user: {
        id: user._id,
        username: user.username,
        name: user.name,
        role: user.role,
        avatar: user.avatar
      }
    }, '登录成功');
  } catch (err) {
    console.error('[食堂端登录] 登录异常:', err);
    console.error('[食堂端登录] 错误堆栈:', err.stack);
    error(res, '登录失败: ' + (err.message || '服务器错误'), 500);
  }
};

exports.logout = async (req, res) => {
  try {
    // 从请求中获取 token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.query.token) {
      token = req.query.token;
    }

    // 如果找到 token，从 Redis 中撤销它
    if (token) {
      await revokeToken(token);
    }

    success(res, null, '登出成功');
  } catch (err) {
    console.error(err);
    error(res, '登出失败', 500);
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    success(res, user);
  } catch (err) {
    console.error(err);
    error(res, '获取用户信息失败', 500);
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    const isMatch = await user.comparePassword(oldPassword);
    if (!isMatch) {
      return error(res, '原密码错误', 400);
    }

    user.password = newPassword;
    await user.save();

    success(res, null, '密码修改成功');
  } catch (err) {
    console.error(err);
    error(res, '密码修改失败', 500);
  }
};

exports.updateUserInfo = async (req, res) => {
  try {
    const { name, phone, email, avatar } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return error(res, '用户不存在', 404);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (email) user.email = email;
    if (avatar) user.avatar = avatar;

    await user.save();

    const updatedUser = await User.findById(req.user._id).select('-password');
    success(res, updatedUser, '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新用户信息失败', 500);
  }
};

exports.getWorkStatistics = async (req, res) => {
  try {
    const userId = req.user._id;
    const today = new Date();

    const todayStart = getStartOfDay(today);
    const todayEnd = getEndOfDay(today);

    const todayOrders = await Order.find({
      orderDate: { $gte: todayStart, $lte: todayEnd }
    });

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekOrders = await Order.find({
      orderDate: { $gte: weekStart, $lte: todayEnd }
    });

    const todayProduction = await ProductionPlan.find({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const weekProduction = await ProductionPlan.find({
      date: { $gte: weekStart, $lte: todayEnd }
    });

    const statistics = {
      today: {
        orders: todayOrders.length,
        revenue: todayOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        production: todayProduction.length,
        productionCompleted: todayProduction.filter(p => p.status === 'completed').length
      },
      week: {
        orders: weekOrders.length,
        revenue: weekOrders.reduce((sum, order) => sum + order.totalAmount, 0),
        production: weekProduction.length,
        productionCompleted: weekProduction.filter(p => p.status === 'completed').length
      },
      total: {
        orders: await Order.countDocuments(),
        production: await ProductionPlan.countDocuments()
      }
    };

    success(res, statistics);
  } catch (err) {
    console.error(err);
    error(res, '获取工作统计失败', 500);
  }
};

