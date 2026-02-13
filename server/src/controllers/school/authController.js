const User = require('../../models/User');
const { generateToken, generatePermanentToken } = require('../../utils/jwtUtils');
const { success, error } = require('../../utils/responseFormatter');
const { USER_ROLES } = require('../../config/constants');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, '请提供用户名和密码', 400);
    }

    const user = await User.findOne({
      username,
      role: { $in: [USER_ROLES.ADMIN, USER_ROLES.PRINCIPAL, USER_ROLES.TEACHER] }
    });

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
        role: user.role,
        department: user.department,
        schoolId: user.schoolId,
        schoolName: user.schoolName || user.schoolId,
        managedClasses: user.managedClasses || [],
        avatar: user.avatar,
        tokenType: 'standard'
      }
    }, '登录成功');
  } catch (err) {
    console.error(err);
    error(res, '登录失败', 500);
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');

    const userInfo = {
      ...user.toObject(),
      schoolName: user.schoolName || user.schoolId
    };

    success(res, userInfo);
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

exports.updateProfile = async (req, res) => {
  try {
    const { name, email, phone } = req.body;
    const userId = req.user._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (phone) updateData.phone = phone;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return error(res, '用户不存在', 404);
    }

    success(res, user, '个人信息更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新个人信息失败', 500);
  }
};

