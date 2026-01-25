const User = require("../../models/User");
const { generateToken } = require("../../utils/jwtUtils");
const { success, error } = require("../../utils/responseFormatter");
const { USER_ROLES } = require("../../config/constants");

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return error(res, "请提供用户名和密码", 400);
    }

    const user = await User.findOne({
      username,
      role: USER_ROLES.STUDENT,
    });

    if (!user) {
      return error(res, "用户名或密码错误", 401);
    }

    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return error(res, "用户名或密码错误", 401);
    }

    const token = await generateToken(user._id);

    const userInfo = {
      id: user._id,
      username: user.username,
      name: user.name,
      avatar: user.avatar,
      role: user.role,
    };

    if (user.role === USER_ROLES.STUDENT) {
      userInfo.studentId = user.studentId;
      userInfo.class = user.class;
      userInfo.grade = user.grade;
    }

    success(res, { token, userInfo }, "登录成功");
  } catch (err) {
    console.error(err);
    error(res, "登录失败", 500);
  }
};

exports.register = async (req, res) => {
  try {
    const {
      username,
      password,
      name,
      studentId,
      class: studentClass,
      age,
      gender,
      height,
      weight,
      allergies,
      hasDiabetes,
      hasHereditaryDisease,
      hereditaryDiseaseDesc,
      targetCalories,
    } = req.body;

    if (!username || !password || !name) {
      return error(res, "请填写必需字段", 400);
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return error(res, "用户名已存在", 400);
    }

    const user = await User.create({
      username,
      password,
      name,
      studentId,
      class: studentClass,
      age,
      gender,
      height,
      weight,
      allergies: allergies || [],
      hasDiabetes: hasDiabetes || false,
      hasHereditaryDisease: hasHereditaryDisease || false,
      hereditaryDiseaseDesc,
      targetCalories: targetCalories || 2000,
      role: USER_ROLES.STUDENT,
    });

    success(res, { id: user._id }, "注册成功", 201);
  } catch (err) {
    console.error(err);
    error(res, "注册失败", 500);
  }
};

exports.getUserInfo = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    success(res, {
      id: user._id,
      username: user.username,
      name: user.name,
      studentId: user.studentId,
      class: user.class,
      age: user.age,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      avatar: user.avatar,
      allergies: user.allergies || [],
      hasDiabetes: user.hasDiabetes,
      hasHereditaryDisease: user.hasHereditaryDisease,
      hereditaryDiseaseDesc: user.hereditaryDiseaseDesc,
      targetCalories: user.targetCalories,
      balance: user.balance || 0,
    });
  } catch (err) {
    console.error(err);
    error(res, "获取用户信息失败", 500);
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.username;
    delete updates.role;
    delete updates.balance;

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true }).select(
      "-password",
    );

    success(res, user, "更新成功");
  } catch (err) {
    console.error(err);
    error(res, "更新失败", 500);
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("balance");

    success(res, {
      balance: user.balance || 0,
    });
  } catch (err) {
    console.error(err);
    error(res, "获取余额失败", 500);
  }
};

exports.recharge = async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return error(res, "充值金额必须大于0", 400);
    }

    if (amount > 10000) {
      return error(res, "单次充值金额不能超过10000元", 400);
    }

    const user = await User.findById(req.user._id);
    user.balance = (user.balance || 0) + amount;
    await user.save();

    success(
      res,
      {
        balance: user.balance,
        rechargeAmount: amount,
      },
      "充值成功",
    );
  } catch (err) {
    console.error(err);
    error(res, "充值失败", 500);
  }
};

exports.verifyStudentId = async (req, res) => {
  try {
    const { studentId } = req.body;

    if (!studentId) {
      return error(res, "请提供学号", 400);
    }

    const student = await User.findOne({
      studentId,
      role: USER_ROLES.STUDENT,
    }).select("_id name studentId class grade");

    if (!student) {
      return error(res, "未找到该学生", 404);
    }

    success(
      res,
      {
        _id: student._id,
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        grade: student.grade,
      },
      "验证成功",
    );
  } catch (err) {
    console.error(err);
    error(res, "验证失败", 500);
  }
};

exports.getBoundParents = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return error(res, "用户认证信息无效", 401);
    }

    // 查找所有将该学生绑定为孩子的家长
    const parents = await User.find({
      role: USER_ROLES.PARENT,
      children: req.user._id,
    })
      .select("name phone email avatar")
      .lean();

    // 格式化返回数据
    const parentsList = parents.map((parent) => ({
      id: parent._id,
      name: parent.name || "未设置姓名",
      phone: parent.phone || "未设置手机号",
      email: parent.email || "",
      avatar: parent.avatar || "",
    }));

    success(res, {
      parents: parentsList,
      count: parentsList.length,
    });
  } catch (err) {
    console.error("获取绑定家长失败:", err);
    error(res, "获取绑定家长失败", 500);
  }
};
