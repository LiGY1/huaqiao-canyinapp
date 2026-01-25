const EducationMaterial = require('../../models/EducationMaterial');
const User = require('../../models/User');
const { success, error, paginated } = require('../../utils/responseFormatter');
const { sendToMultipleClasses, validateWebhook } = require('../../utils/dingtalkUtils');
const { USER_ROLES } = require('../../config/constants');

exports.getMaterials = async (req, res) => {
  try {
    const { type, category, page = 1, pageSize = 10 } = req.query;
    const currentUser = req.user;

    const filter = {};
    if (type) filter.type = type;
    if (category) filter.category = category;

    if (currentUser.role === USER_ROLES.TEACHER) {
      filter.isPublished = true;
    }

    const total = await EducationMaterial.countDocuments(filter);
    const materials = await EducationMaterial.find(filter)
      .populate('author', 'name')
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    paginated(res, materials, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取教育资料失败', 500);
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const currentUser = req.user;

    if (currentUser.role !== USER_ROLES.ADMIN && currentUser.role !== USER_ROLES.PRINCIPAL) {
      return error(res, '只有管理员和校长才能创建教育资料', 403);
    }

    const materialData = {
      ...req.body,
      author: req.user._id,
      authorName: req.user.name
    };

    const material = await EducationMaterial.create(materialData);

    success(res, material, '创建成功', 201);
  } catch (err) {
    console.error('创建教育资料失败:', err);
    error(res, err.message || '创建教育资料失败', 500);
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await EducationMaterial.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!material) {
      return error(res, '资料不存在', 404);
    }

    success(res, material, '更新成功');
  } catch (err) {
    console.error(err);
    error(res, '更新教育资料失败', 500);
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    const { id } = req.params;

    const material = await EducationMaterial.findByIdAndDelete(id);

    if (!material) {
      return error(res, '资料不存在', 404);
    }

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除教育资料失败', 500);
  }
};

exports.publishMaterial = async (req, res) => {
  try {
    const { id } = req.params;
    const { pushToSystem, pushToDingtalk, targetGrade, courseData, dingtalkWebhooks } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== USER_ROLES.ADMIN && currentUser.role !== USER_ROLES.PRINCIPAL) {
      return error(res, '只有管理员和校长才能推送课程', 403);
    }

    let material = await EducationMaterial.findById(id);

    if (!material && courseData) {
      material = await EducationMaterial.create({
        title: courseData.title,
        description: courseData.description,
        type: 'course',
        category: 'nutrition',
        duration: courseData.duration,
        targetGrades: [targetGrade || '全校'],
        isPublished: pushToSystem || false,
        publishDate: new Date(),
        author: currentUser._id,
        authorName: currentUser.name
      });
    } else if (!material) {
      return error(res, '课程不存在', 404);
    }

    let dingtalkResult = null;

    if (pushToSystem && material) {
      material.isPublished = true;
      material.publishDate = new Date();
      material.targetGrades = [targetGrade || '全校'];
      await material.save();
    }

    if (pushToDingtalk && dingtalkWebhooks) {
      const notificationData = {
        title: `新营养课程：${courseData?.title || material.title}`,
        content: courseData?.description || material.description || '请查看系统了解详情',
        targetGrade: targetGrade || '全校',
        targetClass: '全部',
        sendTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      dingtalkResult = await sendToMultipleClasses(dingtalkWebhooks, notificationData);
    }

    success(res, {
      material,
      dingtalkResult
    }, '推送成功');
  } catch (err) {
    console.error('推送失败详细错误:', err);
    error(res, err.message || '推送失败', 500);
  }
};

exports.sendNotification = async (req, res) => {
  try {
    const { title, content, targetGrade, targetClass, sendType, scheduledTime, sendToDingtalk, dingtalkWebhooks } = req.body;
    const currentUser = req.user;

    if (currentUser.role !== USER_ROLES.ADMIN && currentUser.role !== USER_ROLES.PRINCIPAL) {
      return error(res, '只有管理员和校长才能推送班会通知', 403);
    }

    const notification = await EducationMaterial.create({
      title,
      content,
      type: 'class-meeting',
      category: 'nutrition',
      targetGrades: targetGrade === '全校' ? ['全校'] : [targetGrade],
      targetClasses: targetClass === '全部' ? ['全部'] : [targetClass],
      scheduledDate: sendType === 'scheduled' ? new Date(scheduledTime) : new Date(),
      sendDate: sendType === 'immediate' ? new Date() : null,
      author: currentUser._id,
      authorName: currentUser.name,
      isPublished: sendType === 'immediate'
    });

    let dingtalkResult = null;

    if (sendToDingtalk && sendType === 'immediate' && dingtalkWebhooks) {
      const notificationData = {
        title,
        content,
        targetGrade,
        targetClass,
        sendTime: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        })
      };

      dingtalkResult = await sendToMultipleClasses(dingtalkWebhooks, notificationData);
    }

    success(res, {
      notification,
      dingtalkResult
    }, '推送成功', 201);
  } catch (err) {
    console.error(err);
    error(res, '推送失败', 500);
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, pageSize = 10 } = req.query;
    const currentUser = req.user;

    const filter = {
      type: 'class-meeting',
      isPublished: true
    };

    const total = await EducationMaterial.countDocuments(filter);
    const notifications = await EducationMaterial.find(filter)
      .populate('author', 'name')
      .sort({ createdAt: -1 })
      .limit(parseInt(pageSize))
      .skip((parseInt(page) - 1) * parseInt(pageSize));

    const notificationsWithRate = notifications.map(notif => {
      const readRate = notif.readCount > 0
        ? Math.min(100, Math.round((notif.readCount / 100) * 100))
        : 0;

      return {
        ...notif.toObject(),
        readRate,
        status: notif.isPublished ? '已发送' : '待发送'
      };
    });

    paginated(res, notificationsWithRate, page, pageSize, total);
  } catch (err) {
    console.error(err);
    error(res, '获取通知列表失败', 500);
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    if (currentUser.role !== USER_ROLES.ADMIN && currentUser.role !== USER_ROLES.PRINCIPAL) {
      return error(res, '只有管理员和校长才能删除班会通知', 403);
    }

    const notification = await EducationMaterial.findById(id);

    if (!notification) {
      return error(res, '通知不存在', 404);
    }

    await EducationMaterial.findByIdAndDelete(id);

    success(res, null, '删除成功');
  } catch (err) {
    console.error(err);
    error(res, '删除失败', 500);
  }
};

exports.getNotificationDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await EducationMaterial.findById(id)
      .populate('author', 'name');

    if (!notification) {
      return error(res, '通知不存在', 404);
    }

    notification.viewCount += 1;
    await notification.save();

    success(res, notification);
  } catch (err) {
    console.error(err);
    error(res, '获取通知详情失败', 500);
  }
};

exports.testWebhook = async (req, res) => {
  try {
    const { webhook, secret } = req.body;

    if (!webhook) {
      return error(res, 'Webhook地址不能为空', 400);
    }

    const isValid = await validateWebhook(webhook, secret);

    if (isValid) {
      success(res, null, secret ? '测试成功（已使用加签验证）' : '测试成功');
    } else {
      error(res, '测试失败，请检查Webhook地址和密钥是否正确', 400);
    }
  } catch (err) {
    console.error(err);
    error(res, '测试失败', 500);
  }
};

