const chalk = require('chalk');
const User = require('../../models/User');
const { generateToken } = require('../../utils/jwtUtils');
const { success, error } = require('../../utils/responseFormatter');
const { USER_ROLES } = require('../../config/constants');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '请提供用户名和密码', 400);
    }

    const user = await User.findOne({ username, role: USER_ROLES.PARENT })
      .populate('children', 'name studentId class grade');

    if (!user) {
      return error(res, '用户名或密码错误', 401);
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return error(res, '用户名或密码错误', 401);
    }

    const token = await generateToken(user._id);

    success(res, {
      token,
      userInfo: {
        id: user._id,
        username: user.username,
        name: user.name,
        phone: user.phone,
        avatar: user.avatar,
        role: user.role,
        children: user.children
      }
    }, '登录成功');
  } catch (err) {
    console.error(err);
    error(res, '登录失败', 500);
  }
};

exports.register = async (req, res) => {
  try {
    const { username, password, name, phone, childStudentId } = req.body;

    if (!username || !password || !name) {
      return error(res, '请填写必需字段', 400);
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return error(res, '用户名已存在', 400);
    }

    let childId = null;
    if (childStudentId) {
      const child = await User.findOne({
        studentId: childStudentId,
        role: USER_ROLES.STUDENT
      });
      if (child) {
        childId = child._id;
      }
    }

    const user = await User.create({
      username,
      password,
      name,
      phone,
      role: USER_ROLES.PARENT,
      children: childId ? [childId] : []
    });

    success(res, { id: user._id }, '注册成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '注册失败', 500);
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    console.log('获取家长用户信息，用户ID:', req.user?._id);

    if (!req.user || !req.user._id) {
      console.error('req.user 不存在或没有_id');
      return error(res, '用户认证信息无效', 401);
    }

    const user = await User.findById(req.user._id)
      .populate({
        path: 'children',
        select: 'name studentId class grade age gender height weight school'
      })
      .select('-password');

    if (!user) {
      console.error('未找到用户:', req.user._id);
      return error(res, '用户不存在', 404);
    }

    console.log(chalk.green(`[家长] 获取用户信息: ${user.name} (孩子数: ${user.children?.length || 0})`));
    success(res, user);
  } catch (err) {
    console.error('获取用户信息失败:', err);
    console.error('错误详情:', err.message);
    console.error('错误堆栈:', err.stack);
    error(res, '获取用户信息失败', 500);
  }
};

exports.bindChild = async (req, res) => {
  try {
    const { studentId } = req.body;

    const child = await User.findOne({
      studentId,
      role: USER_ROLES.STUDENT
    });

    if (!child) {
      return error(res, '未找到该学生', 404);
    }

    const parent = await User.findById(req.user._id);

    if (parent.children.includes(child._id)) {
      return error(res, '该学生已绑定', 400);
    }

    parent.children.push(child._id);
    await parent.save();

    success(res, { childId: child._id }, '绑定成功');
  } catch (err) {
    console.error(err);
    error(res, '绑定失败', 500);
  }
};

exports.getReminderSettings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return error(res, '用户认证信息无效', 401);
    }

    const user = await User.findById(req.user._id).select('reminderSettings');

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 如果用户还没有提醒设置，返回默认值
    const settings = user.reminderSettings || {
      breakfast: true,
      lunch: true,
      dinner: true,
      dailySummary: true,
      nutritionAlert: false,
      healthTips: true
    };

    success(res, settings);
  } catch (err) {
    console.error('获取提醒设置失败:', err);
    error(res, '获取提醒设置失败', 500);
  }
};

exports.updateReminderSettings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return error(res, '用户认证信息无效', 401);
    }

    const { breakfast, lunch, dinner, dailySummary, nutritionAlert, healthTips } = req.body;

    const user = await User.findById(req.user._id);

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    // 更新提醒设置
    user.reminderSettings = {
      breakfast: breakfast !== undefined ? breakfast : true,
      lunch: lunch !== undefined ? lunch : true,
      dinner: dinner !== undefined ? dinner : true,
      dailySummary: dailySummary !== undefined ? dailySummary : true,
      nutritionAlert: nutritionAlert !== undefined ? nutritionAlert : false,
      healthTips: healthTips !== undefined ? healthTips : true
    };

    await user.save();

    console.log(chalk.green(`[家长] 更新提醒设置: ${user.name}`));
    success(res, user.reminderSettings, '提醒设置已更新');
  } catch (err) {
    console.error('更新提醒设置失败:', err);
    error(res, '更新提醒设置失败', 500);
  }
};

