/**
 * 数据库查询优化工具
 * 提供批量查询、聚合查询等优化方法
 */

const User = require('../models/User');
const Order = require('../models/Order');
const { USER_ROLES } = require('../config/constants');

/**
 * 批量查询学生及其关联数据（教师、家长）
 * 解决 N+1 查询问题
 */
exports.batchQueryStudentsWithRelations = async (query, options = {}) => {
  const { limit = 20, select, sort = { class: 1, studentId: 1 } } = options;

  // 1. 查询学生
  const students = await User.find(query)
    .select(select || '-password')
    .sort(sort)
    .limit(parseInt(limit))
    .lean();

  if (students.length === 0) {
    return { students: [], teachers: [], parents: [], studentParentMap: {}, classTeacherMap: {} };
  }

  // 2. 收集所有班级和学生ID
  const classes = [...new Set(students.map(s => s.class).filter(Boolean))];
  const studentIds = students.map(s => s._id);

  // 3. 批量查询教师（通过班级）
  const teachersPromise = classes.length > 0
    ? User.find({
        role: USER_ROLES.TEACHER,
        managedClasses: { $in: classes }
      }).select('name phone managedClasses').lean()
    : Promise.resolve([]);

  // 4. 批量查询家长（通过学生ID）
  const parentsPromise = User.find({
    role: USER_ROLES.PARENT,
    children: { $in: studentIds }
  }).select('name phone children').lean();

  // 5. 并行执行查询
  const [teachers, parents] = await Promise.all([teachersPromise, parentsPromise]);

  // 6. 构建映射关系
  const classTeacherMap = {};
  teachers.forEach(teacher => {
    (teacher.managedClasses || []).forEach(cls => {
      if (!classTeacherMap[cls]) {
        classTeacherMap[cls] = teacher;
      }
    });
  });

  const studentParentMap = {};
  parents.forEach(parent => {
    (parent.children || []).forEach(childId => {
      const childIdStr = childId.toString();
      if (!studentParentMap[childIdStr]) {
        studentParentMap[childIdStr] = [];
      }
      studentParentMap[childIdStr].push({
        name: parent.name,
        phone: parent.phone
      });
    });
  });

  return {
    students,
    teachers,
    parents,
    studentParentMap,
    classTeacherMap
  };
};

/**
 * 批量查询订单及其关联数据（用户、菜品）
 */
exports.batchQueryOrdersWithRelations = async (query, options = {}) => {
  const { limit = 50, select, sort = { orderDate: -1 } } = options;

  const orders = await Order.find(query)
    .populate('user', 'name studentId class')
    .populate('items.dish', 'name nutrition')
    .select(select)
    .sort(sort)
    .limit(parseInt(limit))
    .lean();

  return orders;
};

/**
 * 使用聚合管道优化统计查询
 */
exports.aggregateStatistics = async (dataScope) => {
  const accessFilter = require('./accessFilter').applyDataScopeFilter(dataScope);

  // 学生统计聚合
  const studentStats = await User.aggregate([
    { $match: { role: USER_ROLES.STUDENT, ...accessFilter.studentFilter } },
    {
      $group: {
        _id: '$class',
        count: { $sum: 1 },
        maleCount: {
          $sum: { $cond: [{ $eq: ['$gender', '男'] }, 1, 0] }
        },
        femaleCount: {
          $sum: { $cond: [{ $eq: ['$gender', '女'] }, 1, 0] }
        },
        avgAge: { $avg: '$age' }
      }
    },
    { $sort: { _id: 1 } }
  ]);

  // 订单统计聚合
  const orderStats = await Order.aggregate([
    { $match: accessFilter.orderFilter },
    {
      $group: {
        _id: '$mealType',
        count: { $sum: 1 },
        totalAmount: { $sum: '$totalAmount' }
      }
    }
  ]);

  return {
    studentStats,
    orderStats
  };
};

/**
 * 优化的计数查询（使用 estimatedDocumentCount 当无过滤条件时）
 */
exports.optimizedCount = async (model, query) => {
  // 如果没有查询条件，使用更快的 estimatedDocumentCount
  if (!query || Object.keys(query).length === 0) {
    return await model.estimatedDocumentCount();
  }
  return await model.countDocuments(query);
};

/**
 * 分页查询优化
 */
exports.paginatedQuery = async (model, query, options = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = { createdAt: -1 },
    select,
    populate
  } = options;

  const skip = (page - 1) * limit;

  // 并行执行查询和计数
  const [data, total] = await Promise.all([
    model.find(query)
      .select(select)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate(populate || '')
      .lean(),
    model.countDocuments(query)
  ]);

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1
    }
  };
};

/**
 * 查询缓存键生成器
 */
exports.generateCacheKey = (prefix, params) => {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${JSON.stringify(params[key])}`)
    .join('|');
  return `query:${prefix}:${sortedParams}`;
};

