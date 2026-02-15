const User = require('../models/User');
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const mongoose = require('mongoose');
const { USER_ROLES } = require('../config/constants');
const { generateASCIITable, generateCompactASCIITable, generateMarkdownTable, formatNutritionSummary, formatCompactNutritionSummary } = require('../utils/tableFormatter');
const cache = require('../utils/cache');
const logger = require('../utils/logger');
const preheater = require('../utils/cachePreheating');
const deduplicator = require('../utils/requestDeduplicator');

/**
 * 通用角色查询接口控制器
 * 支持教师、学生、家长三种角色的查询场景
 * 已优化：使用数据库级别的分页和排序，提升查询性能
 */

/**
 * 根据角色和参数查询数据
 */
exports.queryByRole = async (req, res) => {
  try {
    const { role, teacherName, studentName, studentId, parentName, format = 'text', limit, skip, sort, startDate, endDate } = req.query;
    
    // 验证角色
    if (!role || !['teacher', 'student', 'parent', 'all'].includes(role)) {
      return res.status(400).json({
        error: '角色参数无效，必须是 teacher、student、parent 或 all'
      });
    }
    
    // 🚀 Redis缓存：生成缓存键
    const cacheKey = generateCacheKey(role, { teacherName, studentName, studentId, parentName, limit, skip, sort, startDate, endDate });
    
    // 🚀 Redis缓存：尝试从缓存获取
    const cached = await cache.get(cacheKey);
    if (cached) {
      // 简化日志输出
      const roleNames = { teacher: '教师', student: '学生', parent: '家长', all: '全校' };
      const nameText = teacherName || studentName || parentName || '所有数据';
      console.log(`[缓存] ${roleNames[role]}查询 - 命中: ${nameText}`);
      
      // 🚀 智能预热：预测并预热相关数据
      preheater.recordAccess(cacheKey);
      
      // 根据format参数返回不同格式
      if (format === 'json') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        return res.json(compactJSON(cached));
      } else if (format === 'markdown') {
        try {
          res.setHeader('Content-Type', 'text/plain; charset=utf-8');
          const markdownContent = formatAsMarkdown(cached);
          console.log(`[Markdown缓存] 生成成功，长度: ${markdownContent.length} 字符`);
          return res.send(markdownContent);
        } catch (markdownError) {
          console.error('[Markdown缓存] 格式化失败:', markdownError);
          return res.status(500).json({
            error: 'Markdown格式化失败: ' + markdownError.message
          });
        }
      } else {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        return res.send(formatAsASCII(cached));
      }
    }
    
    let result;
    
    // 🚀 请求去重：防止重复查询
    result = await deduplicator.deduplicate(cacheKey, async () => {
    
    // 根据角色执行不同的查询逻辑
      let queryResult;
    try {
      switch (role) {
        case 'teacher':
            queryResult = await queryTeacherData(teacherName, studentName, { limit, skip, sort });
          break;
        case 'student':
            queryResult = await queryStudentData(studentName, studentId, { limit, skip, sort });
          break;
        case 'parent':
            queryResult = await queryParentData(parentName, studentName, studentId, { limit, skip, sort });
            break;
          case 'all':
            queryResult = await queryAllSchoolData({ limit, skip, sort, startDate, endDate });
          break;
      }
    } catch (queryError) {
      console.error('查询执行错误:', queryError);
        throw queryError;
    }
      
      return queryResult;
    }); // 请求去重结束
    
    // 如果查询失败（返回错误对象）
    if (result && result.error) {
      return res.status(400).json(result);
    }
    
    // 🚀 Redis缓存：存入缓存
    const cacheTTL = getCacheTTL(role, { teacherName, studentName, studentId, parentName });
    await cache.set(cacheKey, result, cacheTTL);
    
    // 🚀 记录访问模式（用于预热）
    preheater.recordAccess(cacheKey);
    
    // 简化日志输出
    const roleNames = { teacher: '教师', student: '学生', parent: '家长', all: '全校' };
    const nameText = teacherName || studentName || parentName || '所有数据';
    const ttlText = cacheTTL >= 60 ? `${Math.floor(cacheTTL/60)}分钟` : `${cacheTTL}秒`;
    console.log(`[缓存] ${roleNames[role]}查询 - 已缓存: ${nameText} (${ttlText})`);
    
    // 根据format参数返回不同格式
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      return res.json(compactJSON(result));
    } else if (format === 'markdown') {
      try {
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        const markdownContent = formatAsMarkdown(result);
        console.log(`[Markdown] 生成成功，长度: ${markdownContent.length} 字符`);
        return res.send(markdownContent);
      } catch (markdownError) {
        console.error('[Markdown] 格式化失败:', markdownError);
        console.error('[Markdown] 错误堆栈:', markdownError.stack);
        return res.status(500).json({
          error: 'Markdown格式化失败: ' + markdownError.message
        });
      }
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      return res.send(formatAsASCII(result));
    }
    
  } catch (error) {
    console.error('查询失败:', error);
    return res.status(500).json({
      error: '查询失败: ' + error.message
    });
  }
};

/**
 * 教师查询数据（已优化：数据库级别分页和排序）
 */
async function queryTeacherData(teacherName, studentName, options = {}) {
  if (!teacherName) {
    return { error: '教师查询必须提供 teacherName 参数' };
  }
  
  // 查找教师
  const teacher = await User.findOne({
    name: teacherName,
    role: USER_ROLES.TEACHER
  }).lean();
  
  if (!teacher) {
    return { error: `未找到名为 ${teacherName} 的教师` };
  }
  
  // 检查是否有管理的班级
  if (!teacher.managedClasses || teacher.managedClasses.length === 0) {
    return {
      role: 'teacher',
      teacher: { 
        name: teacher.name, 
        managedClasses: []
      },
      students: [],
      message: '该教师没有管理的班级'
    };
  }
  
  // 构建学生查询条件
  const studentQuery = {
    role: USER_ROLES.STUDENT,
    class: { $in: teacher.managedClasses }
  };
  
  // 如果指定了学生姓名，添加姓名过滤
  if (studentName) {
    const studentNames = studentName.split(',').map(n => n.trim()).filter(Boolean);
    if (studentNames.length > 0) {
      studentQuery.name = { $in: studentNames };
    }
  }
  
  // 解析分页和排序选项
  const { limit, skip, sort } = parseOptions(options);
  
  // 构建查询（使用数据库级别的分页和排序）
  let studentsQuery = User.find(studentQuery).lean();
  
  // 应用排序（数据库级别）
  if (sort) {
    const [field, order] = sort.split(':');
    const sortObj = {};
    // 验证字段名，防止注入
    const allowedFields = ['name', 'studentId', 'class', 'age', 'createdAt', 'updatedAt'];
    if (allowedFields.includes(field)) {
      sortObj[field] = order === 'desc' ? -1 : 1;
      studentsQuery = studentsQuery.sort(sortObj);
    }
  } else {
    // 默认排序：按班级和学号
    studentsQuery = studentsQuery.sort({ class: 1, studentId: 1 });
  }
  
  // 应用分页（数据库级别）
  if (skip && parseInt(skip) > 0) {
    studentsQuery = studentsQuery.skip(parseInt(skip));
  }
  if (limit && parseInt(limit) > 0) {
    studentsQuery = studentsQuery.limit(Math.min(parseInt(limit), 1000)); // 限制最大1000
  }
  
  // 执行查询
  const students = await studentsQuery;
  
  if (students.length === 0) {
    return {
      role: 'teacher',
      teacher: { 
        name: teacher.name, 
        managedClasses: teacher.managedClasses
      },
      students: [],
      message: '未找到匹配的学生'
    };
  }
  
  // 获取学生详细信息（包括家长、订单、营养元素）
  // MongoDB的find查询会自动处理ObjectId，直接使用即可
  const studentIds = students.map(s => s._id);
  
  const studentIdMap = {};
  students.forEach(s => {
    const idStr = s._id.toString();
    studentIdMap[idStr] = s;
  });
  
  // 并行查询家长和订单（提升性能）
  // 修改：无论是否指定学生名字，都查询订单和营养信息
  const [parents, orders] = await Promise.all([
    // 查询家长
    User.find({
      role: USER_ROLES.PARENT,
      children: { $in: studentIds }
    }).select('name children').lean(),
    
    // 查询订单（只查询需要的字段，不populate dish以提高性能）
    Order.find({
      studentUser: { $in: studentIds }
    })
    .select('studentUser orderDate mealType totalAmount status items totalNutrition')
    .sort({ orderDate: -1 })
    .lean()
  ]);
  
  // 构建学生-家长映射
  const studentParentMap = {};
  parents.forEach(parent => {
    (parent.children || []).forEach(childId => {
      const childIdStr = childId.toString();
      if (studentIdMap[childIdStr]) {
        if (!studentParentMap[childIdStr]) {
          studentParentMap[childIdStr] = [];
        }
        studentParentMap[childIdStr].push({
          name: parent.name || ''
        });
      }
    });
  });
  
  // 构建学生-订单映射（始终处理订单数据）
  const studentOrderMap = {};
  orders.forEach(order => {
    // 处理studentUser字段（可能是ObjectId对象或字符串）
    let studentIdStr = null;
    if (order.studentUser) {
      studentIdStr = order.studentUser.toString ? order.studentUser.toString() : String(order.studentUser);
    }
    
    if (studentIdStr && studentIdMap[studentIdStr]) {
      if (!studentOrderMap[studentIdStr]) {
        studentOrderMap[studentIdStr] = [];
      }
      studentOrderMap[studentIdStr].push({
        orderDate: order.orderDate || null,
        mealType: order.mealType || '',
        totalAmount: order.totalAmount || 0,
        status: order.status || '',
        items: (order.items || []).map(item => ({
          dishName: item.dishName || '',
          quantity: item.quantity || 0,
          price: item.price || 0,
          nutrition: item.nutrition || {}
        })),
        totalNutrition: order.totalNutrition || {}
      });
    }
  });
  
  // 组装结果
  const result = {
    role: 'teacher',
    teacher: {
      name: teacher.name || '',
      managedClasses: teacher.managedClasses || []
    },
    students: students.map(student => {
      const studentIdStr = student._id.toString();
      return {
        name: student.name || '',
        studentId: student.studentId || '',
        class: student.class || '',
        grade: student.grade || '',
        age: student.age || null,
        gender: student.gender || '',
        height: student.height || null,
        weight: student.weight || null,
        allergies: student.allergies || [],
        parents: studentParentMap[studentIdStr] || [],
        // 始终包含订单信息（包括营养元素）
        orders: studentOrderMap[studentIdStr] || []
      };
    })
  };
  
  return result;
}

/**
 * 学生查询数据（自查）
 */
async function queryStudentData(studentName, studentId, options = {}) {
  if (!studentName || !studentId) {
    return { error: '学生查询必须同时提供 studentName 和 studentId 参数' };
  }
  
  // 查找学生（必须同时匹配姓名和学号）
  const student = await User.findOne({
    name: studentName.trim(),
    studentId: studentId.trim(),
    role: USER_ROLES.STUDENT
  }).lean();
  
  if (!student) {
    return { error: '学生姓名与学号不匹配或缺失' };
  }
  
  // 并行查询班主任、家长和订单
  const [teacher, parents, ordersResult] = await Promise.all([
    // 查询班主任
    student.class ? User.findOne({
      role: USER_ROLES.TEACHER,
      managedClasses: { $in: [student.class] }
    }).select('name managedClasses').lean() : Promise.resolve(null),
    
    // 查询家长
    User.find({
      role: USER_ROLES.PARENT,
      children: student._id
    }).select('name').lean(),
    
    // 查询订单
    (async () => {
      const { limit, skip, sort } = parseOptions(options);
      
      let ordersQuery = Order.find({
        studentUser: student._id
      })
      .select('orderDate mealType totalAmount status items totalNutrition');
      
      // 应用排序
      if (sort) {
        const [field, order] = sort.split(':');
        const sortObj = {};
        const allowedFields = ['orderDate', 'totalAmount', 'status', 'mealType'];
        if (allowedFields.includes(field)) {
          sortObj[field] = order === 'desc' ? -1 : 1;
          ordersQuery = ordersQuery.sort(sortObj);
        } else {
          ordersQuery = ordersQuery.sort({ orderDate: -1 });
        }
      } else {
        ordersQuery = ordersQuery.sort({ orderDate: -1 });
      }
      
      // 应用分页
      if (skip && parseInt(skip) > 0) {
        ordersQuery = ordersQuery.skip(parseInt(skip));
      }
      if (limit && parseInt(limit) > 0) {
        ordersQuery = ordersQuery.limit(Math.min(parseInt(limit), 1000));
      }
      
      return await ordersQuery.lean();
    })()
  ]);
  
  // 组装结果
  const result = {
    role: 'student',
    student: {
      name: student.name || '',
      studentId: student.studentId || '',
      class: student.class || '',
      grade: student.grade || '',
      age: student.age || null,
      gender: student.gender || '',
      height: student.height || null,
      weight: student.weight || null,
      allergies: student.allergies || [],
      targetCalories: student.targetCalories || null
    },
    teacher: teacher ? {
      name: teacher.name || '',
      managedClasses: teacher.managedClasses || []
    } : null,
    parents: parents.map(p => ({
      name: p.name || ''
    })),
    orders: ordersResult.map(order => ({
      orderDate: order.orderDate || null,
      mealType: order.mealType || '',
      totalAmount: order.totalAmount || 0,
      status: order.status || '',
      items: (order.items || []).map(item => ({
        dishName: item.dishName || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        nutrition: item.nutrition || {}
      })),
      totalNutrition: order.totalNutrition || {}
    }))
  };
  
  return result;
}

/**
 * 家长查询数据
 */
async function queryParentData(parentName, studentName, studentId, options = {}) {
  if (!parentName || !studentName || !studentId) {
    return { error: '家长查询必须同时提供 parentName、studentName 和 studentId 参数' };
  }
  
  // 查找学生
  const student = await User.findOne({
    name: studentName.trim(),
    studentId: studentId.trim(),
    role: USER_ROLES.STUDENT
  }).lean();
  
  if (!student) {
    return { error: '身份校验失败：家长姓名、学生姓名或学号不匹配' };
  }
  
  // 查找家长，验证是否是该学生的家长
  const parent = await User.findOne({
    name: parentName.trim(),
    role: USER_ROLES.PARENT,
    children: student._id
  }).lean();
  
  if (!parent) {
    return { error: '身份校验失败：家长姓名、学生姓名或学号不匹配' };
  }
  
  // 并行查询班主任和订单
  const [teacher, ordersResult] = await Promise.all([
    // 查询班主任
    student.class ? User.findOne({
      role: USER_ROLES.TEACHER,
      managedClasses: { $in: [student.class] }
    }).select('name managedClasses').lean() : Promise.resolve(null),
    
    // 查询订单
    (async () => {
      const { limit, skip, sort } = parseOptions(options);
      
      let ordersQuery = Order.find({
        studentUser: student._id
      })
      .select('orderDate mealType totalAmount status items totalNutrition');
      
      // 应用排序
      if (sort) {
        const [field, order] = sort.split(':');
        const sortObj = {};
        const allowedFields = ['orderDate', 'totalAmount', 'status', 'mealType'];
        if (allowedFields.includes(field)) {
          sortObj[field] = order === 'desc' ? -1 : 1;
          ordersQuery = ordersQuery.sort(sortObj);
        } else {
          ordersQuery = ordersQuery.sort({ orderDate: -1 });
        }
      } else {
        ordersQuery = ordersQuery.sort({ orderDate: -1 });
      }
      
      // 应用分页
      if (skip && parseInt(skip) > 0) {
        ordersQuery = ordersQuery.skip(parseInt(skip));
      }
      if (limit && parseInt(limit) > 0) {
        ordersQuery = ordersQuery.limit(Math.min(parseInt(limit), 1000));
      }
      
      return await ordersQuery.lean();
    })()
  ]);
  
  // 组装结果
  const result = {
    role: 'parent',
    student: {
      name: student.name || '',
      studentId: student.studentId || '',
      class: student.class || '',
      grade: student.grade || '',
      age: student.age || null,
      gender: student.gender || '',
      height: student.height || null,
      weight: student.weight || null,
      allergies: student.allergies || [],
      targetCalories: student.targetCalories || null
    },
    teacher: teacher ? {
      name: teacher.name || '',
      managedClasses: teacher.managedClasses || []
    } : null,
    orders: ordersResult.map(order => ({
      orderDate: order.orderDate || null,
      mealType: order.mealType || '',
      totalAmount: order.totalAmount || 0,
      status: order.status || '',
      items: (order.items || []).map(item => ({
        dishName: item.dishName || '',
        quantity: item.quantity || 0,
        price: item.price || 0,
        nutrition: item.nutrition || {}
      })),
      totalNutrition: order.totalNutrition || {}
    }))
  };
  
  return result;
}

/**
 * 查询全校数据（聚合统计 + 完整人员名单）
 */
async function queryAllSchoolData(options = {}) {
  try {
    console.time('[全校查询] 执行时间');
    
    // 🚀 并行查询：统计数据、订单数据、人员数据
    const [stats, recentOrders, allStudents, allTeachers, allParents] = await Promise.all([
      // 统计数据聚合
      Order.aggregate([
        {
          $group: {
            _id: null,
            totalOrders: { $sum: 1 },
            totalCalories: { $sum: '$totalNutrition.calories' },
            totalProtein: { $sum: '$totalNutrition.protein' },
            totalFat: { $sum: '$totalNutrition.fat' },
            totalCarbs: { $sum: '$totalNutrition.carbs' },
            avgCalories: { $avg: '$totalNutrition.calories' },
            avgProtein: { $avg: '$totalNutrition.protein' },
            avgFat: { $avg: '$totalNutrition.fat' },
            avgCarbs: { $avg: '$totalNutrition.carbs' }
          }
        }
      ]),
      
      // 最近订单（支持日期范围过滤）
      (() => {
        let ordersQuery = Order.find();
        
        // 🆕 日期范围过滤
        if (options.startDate || options.endDate) {
          const dateFilter = {};
          if (options.startDate) {
            const start = new Date(options.startDate);
            start.setHours(0, 0, 0, 0);
            dateFilter.$gte = start;
          }
          if (options.endDate) {
            const end = new Date(options.endDate);
            end.setHours(23, 59, 59, 999);
            dateFilter.$lte = end;
          }
          ordersQuery = ordersQuery.where('orderDate', dateFilter);
        } else if (!options.limit) {
          // 🆕 如果没有指定日期范围也没有limit，默认返回最近30天的数据
          // 这样可以确保大模型能看到足够的历史数据
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          ordersQuery = ordersQuery.where('orderDate').gte(thirtyDaysAgo);
        }
        
        ordersQuery = ordersQuery
          .sort({ orderDate: -1 })
          .populate('user', 'name studentId role')
          .populate('items.dish', 'name');
        
        // 只有在明确指定了limit参数时才应用限制
        if (options.limit && parseInt(options.limit) > 0) {
          ordersQuery = ordersQuery.limit(parseInt(options.limit));
        }
        
        return ordersQuery.lean();
      })(),
      
      // 🆕 所有学生详细信息
      User.find({ role: USER_ROLES.STUDENT })
        .select('name studentId class grade gender phone email age height weight allergies')
        .sort({ class: 1, studentId: 1 })
        .lean(),
      
      // 🆕 所有教师详细信息
      User.find({ role: USER_ROLES.TEACHER })
        .select('name phone email managedClasses')
        .sort({ name: 1 })
        .lean(),
      
      // 🆕 所有家长详细信息
      User.find({ role: USER_ROLES.PARENT })
        .select('name phone email children')
        .sort({ name: 1 })
        .lean()
    ]);
    
    // 🚀 构建学生-家长关系映射
    const studentParentMap = new Map();
    allParents.forEach(parent => {
      if (parent.children && parent.children.length > 0) {
        parent.children.forEach(childId => {
          if (!studentParentMap.has(childId.toString())) {
            studentParentMap.set(childId.toString(), []);
          }
          studentParentMap.get(childId.toString()).push({
            name: parent.name,
            phone: parent.phone,
            email: parent.email
          });
        });
      }
    });
    
    // 🚀 构建班级-教师映射
    const classTeacherMap = new Map();
    allTeachers.forEach(teacher => {
      if (teacher.managedClasses && teacher.managedClasses.length > 0) {
        teacher.managedClasses.forEach(className => {
          classTeacherMap.set(className, teacher.name);
        });
      }
    });
    
    // 🆕 处理学生详细信息（包含家长和班主任）
    const studentsWithDetails = allStudents.map(student => {
      const parents = studentParentMap.get(student._id.toString()) || [];
      const classTeacher = classTeacherMap.get(student.class) || '未分配';
      
      return {
        name: student.name,
        studentId: student.studentId,
        class: student.class,
        grade: student.grade,
        gender: student.gender,
        phone: student.phone,
        email: student.email,
        age: student.age,
        height: student.height,
        weight: student.weight,
        allergies: student.allergies || [],
        classTeacher,
        parents
      };
    });
    
    // 🆕 处理教师详细信息
    const teachersWithDetails = allTeachers.map(teacher => ({
      name: teacher.name,
      phone: teacher.phone,
      email: teacher.email,
      managedClasses: teacher.managedClasses || []
    }));
    
    // 🆕 处理家长详细信息（包含关联的学生）
    const parentsWithDetails = await Promise.all(
      allParents.map(async parent => {
        const childrenDetails = [];
        if (parent.children && parent.children.length > 0) {
          const children = await User.find({
            _id: { $in: parent.children },
            role: USER_ROLES.STUDENT
          }).select('name studentId class').lean();
          
          children.forEach(child => {
            childrenDetails.push({
              name: child.name,
              studentId: child.studentId,
              class: child.class
            });
          });
        }
        
        return {
          name: parent.name,
          phone: parent.phone,
          email: parent.email,
          children: childrenDetails
        };
      })
    );
    
    // 处理订单数据
    const processedOrders = recentOrders.map(order => ({
      orderDate: order.orderDate,
      orderNumber: order.orderNumber,
      mealType: order.mealType,
      userName: order.user?.name || '未知',
      userStudentId: order.user?.studentId || '',
      userRole: order.user?.role || '',
      items: order.items.map(item => ({
        dishName: item.dish?.name || item.dishName || '未知',
        quantity: item.quantity || 1
      })),
      totalNutrition: order.totalNutrition || {}
    }));
    
    console.timeEnd('[全校查询] 执行时间');
    
    // 🆕 分析缺餐情况（帮助大模型快速识别问题）
    const missingMealsAnalysis = analyzeMissingMeals(processedOrders, allStudents);
    
    return {
      role: 'all',
      summary: {
        totalUsers: allStudents.length + allTeachers.length + allParents.length,
        students: allStudents.length,
        teachers: allTeachers.length,
        parents: allParents.length,
        totalOrders: stats[0]?.totalOrders || 0,
        totalNutrition: {
          calories: stats[0]?.totalCalories || 0,
          protein: stats[0]?.totalProtein || 0,
          fat: stats[0]?.totalFat || 0,
          carbs: stats[0]?.totalCarbs || 0
        },
        avgNutrition: {
          calories: stats[0]?.avgCalories || 0,
          protein: stats[0]?.avgProtein || 0,
          fat: stats[0]?.avgFat || 0,
          carbs: stats[0]?.avgCarbs || 0
        }
      },
      // 🆕 完整人员名单
      students: studentsWithDetails,
      teachers: teachersWithDetails,
      parents: parentsWithDetails,
      recentOrders: processedOrders,
      // 🆕 缺餐分析（直接提供给大模型使用）
      missingMealsAnalysis: missingMealsAnalysis
    };
  } catch (error) {
    console.error('[全校查询] 错误:', error);
    return {
      error: '全校数据查询失败: ' + error.message
    };
  }
}

/**
 * 🆕 分析缺餐情况
 * 直接计算哪些学生在哪些日期缺少早餐/午餐/晚餐
 * 避免大模型需要执行复杂的集合差运算
 */
function analyzeMissingMeals(orders, allStudents) {
  if (!orders || orders.length === 0) {
    return {
      note: '当前查询范围内没有订单数据'
    };
  }

  // 按日期分组订单
  const ordersByDate = {};
  orders.forEach(order => {
    if (!order.orderDate) return;
    
    const date = new Date(order.orderDate);
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (!ordersByDate[dateKey]) {
      ordersByDate[dateKey] = {
        breakfast: new Set(),
        lunch: new Set(),
        dinner: new Set()
      };
    }
    
    const studentName = order.userName;
    if (order.mealType === 'breakfast') {
      ordersByDate[dateKey].breakfast.add(studentName);
    } else if (order.mealType === 'lunch') {
      ordersByDate[dateKey].lunch.add(studentName);
    } else if (order.mealType === 'dinner') {
      ordersByDate[dateKey].dinner.add(studentName);
    }
  });

  // 分析每天的缺餐情况
  const missingMealsByDate = {};
  const allStudentNames = allStudents.map(s => s.name);
  
  Object.keys(ordersByDate).sort().forEach(date => {
    const dayData = ordersByDate[date];
    
    // 找出没有早餐的学生
    const missingBreakfast = allStudentNames.filter(name => !dayData.breakfast.has(name));
    // 找出没有午餐的学生
    const missingLunch = allStudentNames.filter(name => !dayData.lunch.has(name));
    // 找出没有晚餐的学生
    const missingDinner = allStudentNames.filter(name => !dayData.dinner.has(name));
    
    if (missingBreakfast.length > 0 || missingLunch.length > 0 || missingDinner.length > 0) {
      missingMealsByDate[date] = {};
      
      if (missingBreakfast.length > 0) {
        missingMealsByDate[date].breakfast = missingBreakfast;
      }
      if (missingLunch.length > 0) {
        missingMealsByDate[date].lunch = missingLunch;
      }
      if (missingDinner.length > 0) {
        missingMealsByDate[date].dinner = missingDinner;
      }
    }
  });

  // 统计每个学生的缺餐情况
  const missingMealsByStudent = {};
  Object.keys(missingMealsByDate).forEach(date => {
    const dayMissing = missingMealsByDate[date];
    
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      if (dayMissing[mealType]) {
        dayMissing[mealType].forEach(studentName => {
          if (!missingMealsByStudent[studentName]) {
            missingMealsByStudent[studentName] = {
              breakfast: [],
              lunch: [],
              dinner: []
            };
          }
          missingMealsByStudent[studentName][mealType].push(date);
        });
      }
    });
  });

  return {
    dateRange: {
      start: Object.keys(ordersByDate)[0] || null,
      end: Object.keys(ordersByDate)[Object.keys(ordersByDate).length - 1] || null
    },
    totalDays: Object.keys(ordersByDate).length,
    missingMealsByDate: missingMealsByDate,
    missingMealsByStudent: missingMealsByStudent,
    note: '此分析直接提供缺餐学生名单，无需大模型自行计算'
  };
}

/**
 * 解析查询选项（分页、排序）
 */
function parseOptions(options) {
  return {
    limit: options.limit ? parseInt(options.limit) : null,
    skip: options.skip ? parseInt(options.skip) : null,
    sort: options.sort || null
  };
}

/**
 * 格式化为ASCII表格
 */
function formatAsASCII(data) {
  if (!data || !data.role) {
    return '数据格式错误';
  }
  
  if (data.role === 'teacher') {
    return formatTeacherDataASCII(data);
  } else if (data.role === 'student') {
    return formatStudentDataASCII(data);
  } else if (data.role === 'parent') {
    return formatParentDataASCII(data);
  } else if (data.role === 'all') {
    return formatAllSchoolDataASCII(data);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * 格式化教师查询结果为ASCII表格（精简版）
 */
function formatTeacherDataASCII(data) {
  let output = [];
  output.push(`教师: ${data.teacher?.name || '未知'} | 班级: ${(data.teacher?.managedClasses || []).join(', ') || '无'}`);
  output.push('');
  
  if (!data.students || data.students.length === 0) {
    output.push(data.message || '未找到学生');
    return output.join('\n');
  }
  
  // 学生基本信息表格（精简版）
  const studentHeaders = ['姓名', '学号', '班级', '性别', '家长'];
  const studentRows = data.students.map(student => {
    const parents = (student.parents || []).map(p => p.name).join(',') || '无';
    return [
      student.name || '',
      student.studentId || '',
      student.class || '',
      student.gender || '',
      parents
    ];
  });
  output.push('学生列表:');
  output.push(generateCompactASCIITable(studentHeaders, studentRows));
  output.push('');
  
  // 每个学生的订单信息（只有在数据中包含orders字段时才显示）
  data.students.forEach((student) => {
    if (student.orders && student.orders.length > 0) {
      const yearRange = getOrderYearRange(student.orders);
      output.push(`${student.name}订单(${student.orders.length}条, ${yearRange}):`);
      // 显示所有订单（教师查询场景）
      const orderHeaders = ['日期', '餐次', '菜品', '营养'];
      const orderRows = student.orders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        translateMealType(order.mealType) || '',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateCompactASCIITable(orderHeaders, orderRows));
      output.push('');
    }
  });
  
  return output.join('\n');
}

/**
 * 格式化学生查询结果为ASCII表格（精简版）
 */
function formatStudentDataASCII(data) {
  let output = [];
  const student = data.student || {};
  output.push(`学生: ${student.name || '未知'}(${student.studentId || '未知'}) | 班级: ${student.class || '无'} | 性别: ${student.gender || '无'}`);
  
  if (data.teacher) {
    output.push(`班主任: ${data.teacher.name || '未知'}`);
  }
  
  if (data.parents && data.parents.length > 0) {
    output.push(`家长: ${data.parents.map(p => p.name).join(', ')}`);
  }
  output.push('');
  
  if (data.orders && data.orders.length > 0) {
    // 显示所有订单（学生自查场景）
    const yearRange = getOrderYearRange(data.orders);
    output.push(`订单记录(${data.orders.length}条, ${yearRange}):`);
    const orderHeaders = ['日期', '餐次', '菜品', '营养'];
    const orderRows = data.orders.map(order => [
      order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
      translateMealType(order.mealType) || '',
      formatDishList(order.items),
      formatCompactNutritionSummary(order.totalNutrition)
    ]);
    output.push(generateCompactASCIITable(orderHeaders, orderRows));
  } else {
    output.push('暂无订单');
  }
  
  return output.join('\n');
}

/**
 * 格式化家长查询结果为ASCII表格（精简版）
 */
function formatParentDataASCII(data) {
  let output = [];
  const student = data.student || {};
  output.push(`学生: ${student.name || '未知'}(${student.studentId || '未知'}) | 班级: ${student.class || '无'} | 性别: ${student.gender || '无'}`);
  
  if (data.teacher) {
    output.push(`班主任: ${data.teacher.name || '未知'}`);
  }
  output.push('');
  
  if (data.orders && data.orders.length > 0) {
    // 显示所有订单（家长查询场景）
    const yearRange = getOrderYearRange(data.orders);
    output.push(`订单记录(${data.orders.length}条, ${yearRange}):`);
    const orderHeaders = ['日期', '餐次', '菜品', '营养'];
    const orderRows = data.orders.map(order => [
      order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
      translateMealType(order.mealType) || '',
      formatDishList(order.items),
      formatCompactNutritionSummary(order.totalNutrition)
    ]);
    output.push(generateCompactASCIITable(orderHeaders, orderRows));
  } else {
    output.push('暂无订单');
  }
  
  return output.join('\n');
}

/**
 * 格式化全校数据为ASCII表格（含完整人员名单）
 */
function formatAllSchoolDataASCII(data) {
  const output = [];
  const summary = data.summary || {};
  
  // 全校数据统计
  output.push('全校数据统计：');
  output.push('');
  output.push(`总用户数: ${summary.totalUsers || 0} (学生: ${summary.students || 0}, 教师: ${summary.teachers || 0}, 家长: ${summary.parents || 0})`);
  output.push(`总订单数: ${summary.totalOrders || 0}`);
  output.push('');
  
  // 教师名单（精简版）
  if (data.teachers && data.teachers.length > 0) {
    output.push(`教师名单(${data.teachers.length}人):`);
    const teacherHeaders = ['姓名', '手机', '管理班级'];
    const teacherRows = data.teachers.map(t => [
      t.name || '',
      t.phone || '未填写',
      (t.managedClasses || []).join(', ') || '无'
    ]);
    output.push(generateCompactASCIITable(teacherHeaders, teacherRows));
    output.push('');
  }
  
  // 学生名单（精简版：只显示基本信息）
  if (data.students && data.students.length > 0) {
    output.push(`学生名单(${data.students.length}人):`);
    const studentHeaders = ['姓名', '学号', '班级', '性别'];
    const studentRows = data.students.map(s => [
      s.name || '',
      s.studentId || '',
      s.class || '',
      s.gender || ''
    ]);
    output.push(generateCompactASCIITable(studentHeaders, studentRows));
    output.push('');
  }
  
  // 家长名单（精简版）
  if (data.parents && data.parents.length > 0) {
    output.push(`家长名单(${data.parents.length}人):`);
    const parentHeaders = ['姓名', '手机', '邮箱', '关联学生'];
    const parentRows = data.parents.map(p => [
      p.name || '',
      p.phone || '未填写',
      p.email || '未填写',
      (p.children || []).map(c => `${c.name}(${c.studentId})`).join(', ') || '无'
    ]);
    output.push(generateCompactASCIITable(parentHeaders, parentRows));
    output.push('');
  }
  
  // 全部订单（按餐次分组）
  if (data.recentOrders && data.recentOrders.length > 0) {
    const yearRange = getOrderYearRange(data.recentOrders);
    
    // 按餐次分组
    const breakfastOrders = data.recentOrders.filter(o => o.mealType === 'breakfast');
    const lunchOrders = data.recentOrders.filter(o => o.mealType === 'lunch');
    const dinnerOrders = data.recentOrders.filter(o => o.mealType === 'dinner');
    const snackOrders = data.recentOrders.filter(o => o.mealType === 'snack');
    
    output.push(`${yearRange}全部订单(${data.recentOrders.length}条):`);
    output.push(`早餐: ${breakfastOrders.length}条 | 午餐: ${lunchOrders.length}条 | 晚餐: ${dinnerOrders.length}条 | 加餐: ${snackOrders.length}条`);
    output.push('');
    
    const orderHeaders = ['日期', '用户', '学号', '餐次', '菜品', '营养'];
    
    // 早餐区域
    if (breakfastOrders.length > 0) {
      output.push(`「早餐订单 (${breakfastOrders.length}条)」`);
      const breakfastRows = breakfastOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '早餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateCompactASCIITable(orderHeaders, breakfastRows));
      output.push('');
    }
    
    // 午餐区域
    if (lunchOrders.length > 0) {
      output.push(`「午餐订单 (${lunchOrders.length}条)」`);
      const lunchRows = lunchOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '午餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateCompactASCIITable(orderHeaders, lunchRows));
      output.push('');
    }
    
    // 晚餐区域
    if (dinnerOrders.length > 0) {
      output.push(`「晚餐订单 (${dinnerOrders.length}条)」`);
      const dinnerRows = dinnerOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '晚餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateCompactASCIITable(orderHeaders, dinnerRows));
      output.push('');
    }
    
    // 加餐区域
    if (snackOrders.length > 0) {
      output.push(`「加餐订单 (${snackOrders.length}条)」`);
      const snackRows = snackOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '加餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateCompactASCIITable(orderHeaders, snackRows));
      output.push('');
    }
  }
  
  // 🆕 缺餐分析（按日期显示）
  if (data.missingMealsAnalysis && data.missingMealsAnalysis.missingMealsByDate) {
    output.push('缺餐分析：');
    output.push('');
    const analysis = data.missingMealsAnalysis;
    
    if (analysis.dateRange) {
      output.push(`数据范围: ${analysis.dateRange.start} 至 ${analysis.dateRange.end} (共${analysis.totalDays}天)`);
      output.push('');
    }
    
    const missingByDate = analysis.missingMealsByDate;
    const dates = Object.keys(missingByDate).sort();
    
    if (dates.length > 0) {
      output.push('按日期分组的缺餐情况：');
      output.push('');
      
      dates.forEach(date => {
        const dayMissing = missingByDate[date];
        const missingList = [];
        
        if (dayMissing.breakfast && dayMissing.breakfast.length > 0) {
          missingList.push(`早餐: ${dayMissing.breakfast.join(', ')}`);
        }
        if (dayMissing.lunch && dayMissing.lunch.length > 0) {
          missingList.push(`午餐: ${dayMissing.lunch.join(', ')}`);
        }
        if (dayMissing.dinner && dayMissing.dinner.length > 0) {
          missingList.push(`晚餐: ${dayMissing.dinner.join(', ')}`);
        }
        
        if (missingList.length > 0) {
          output.push(`${date}: ${missingList.join(' | ')}`);
        } else {
          output.push(`${date}: 全员正常用餐`);
        }
      });
      output.push('');
    }
    
    // 按学生分组显示
    if (analysis.missingMealsByStudent && Object.keys(analysis.missingMealsByStudent).length > 0) {
      output.push('按学生分组的缺餐情况：');
      output.push('');
      
      Object.keys(analysis.missingMealsByStudent).sort().forEach(studentName => {
        const student = analysis.missingMealsByStudent[studentName];
        const studentMissing = [];
        
        if (student.breakfast && student.breakfast.length > 0) {
          studentMissing.push(`早餐: ${student.breakfast.join(', ')}`);
        }
        if (student.lunch && student.lunch.length > 0) {
          studentMissing.push(`午餐: ${student.lunch.join(', ')}`);
        }
        if (student.dinner && student.dinner.length > 0) {
          studentMissing.push(`晚餐: ${student.dinner.join(', ')}`);
        }
        
        if (studentMissing.length > 0) {
          output.push(`${studentName}: ${studentMissing.join(' | ')}`);
        }
      });
      output.push('');
    }
  }
  
  return output.join('\n');
}

/**
 * 格式化全校数据为Markdown（含完整人员名单）
 */
function formatAllSchoolDataMarkdown(data) {
  try {
    const output = [];
    const summary = data.summary || {};
    
    // 精简版：仅显示基本统计信息
    output.push('# 全校数据');
    output.push('');
    output.push(`**用户总数:** ${summary.totalUsers || 0} (学生: ${summary.students || 0}, 教师: ${summary.teachers || 0}, 家长: ${summary.parents || 0})`);
    output.push('');
  
  // 🆕 教师名单
  if (data.teachers && data.teachers.length > 0) {
    output.push(`### 👨‍🏫 教师名单 (${data.teachers.length}人)`);
    output.push('');
    const teacherHeaders = ['姓名', '手机', '邮箱', '管理班级'];
    const teacherRows = data.teachers.map(t => [
      t.name || '',
      t.phone || '未填写',
      t.email || '未填写',
      (t.managedClasses || []).join(', ') || '无'
    ]);
    output.push(generateMarkdownTable(teacherHeaders, teacherRows));
    output.push('');
  }
  
  // 🆕 学生名单
  if (data.students && data.students.length > 0) {
    output.push(`### 👨‍🎓 学生名单 (${data.students.length}人)`);
    output.push('');
    const studentHeaders = ['姓名', '学号', '班级', '性别', '班主任', '家长', '联系方式'];
    const studentRows = data.students.map(s => [
      s.name || '',
      s.studentId || '',
      s.class || '',
      s.gender || '',
      s.classTeacher || '未分配',
      (s.parents || []).map(p => p.name).join(', ') || '无',
      (s.parents || []).map(p => p.phone).filter(p => p).join(', ') || '未填写'
    ]);
    output.push(generateMarkdownTable(studentHeaders, studentRows));
    output.push('');
  }
  
  // 🆕 家长名单
  if (data.parents && data.parents.length > 0) {
    output.push(`### 👨‍👩‍👧‍👦 家长名单 (${data.parents.length}人)`);
    output.push('');
    const parentHeaders = ['姓名', '手机', '邮箱', '关联学生'];
    const parentRows = data.parents.map(p => [
      p.name || '',
      p.phone || '未填写',
      p.email || '未填写',
      (p.children || []).map(c => `${c.name}(${c.studentId})`).join(', ') || '无'
    ]);
    output.push(generateMarkdownTable(parentHeaders, parentRows));
    output.push('');
  }
  
  // 最近订单（按餐次分组）
  if (data.recentOrders && data.recentOrders.length > 0) {
    const yearRange = getOrderYearRange(data.recentOrders);
    
    // 按餐次分组
    const breakfastOrders = data.recentOrders.filter(o => o.mealType === 'breakfast');
    const lunchOrders = data.recentOrders.filter(o => o.mealType === 'lunch');
    const dinnerOrders = data.recentOrders.filter(o => o.mealType === 'dinner');
    const snackOrders = data.recentOrders.filter(o => o.mealType === 'snack');
    
    output.push(`### 📋 ${yearRange}全部订单 (${data.recentOrders.length}条)`);
    output.push('');
    output.push(`**早餐:** ${breakfastOrders.length}条 | **午餐:** ${lunchOrders.length}条 | **晚餐:** ${dinnerOrders.length}条 | **加餐:** ${snackOrders.length}条`);
    output.push('');
    
    const orderHeaders = ['日期', '用户', '学号', '餐次', '菜品', '营养'];
    
    // 早餐区域
    if (breakfastOrders.length > 0) {
      output.push(`#### 🍳 早餐订单 (${breakfastOrders.length}条)`);
      output.push('');
      const breakfastRows = breakfastOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '早餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateMarkdownTable(orderHeaders, breakfastRows));
      output.push('');
    }
    
    // 午餐区域
    if (lunchOrders.length > 0) {
      output.push(`#### 🍱 午餐订单 (${lunchOrders.length}条)`);
      output.push('');
      const lunchRows = lunchOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '午餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateMarkdownTable(orderHeaders, lunchRows));
      output.push('');
    }
    
    // 晚餐区域
    if (dinnerOrders.length > 0) {
      output.push(`#### 🍽️ 晚餐订单 (${dinnerOrders.length}条)`);
      output.push('');
      const dinnerRows = dinnerOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '晚餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateMarkdownTable(orderHeaders, dinnerRows));
      output.push('');
    }
    
    // 加餐区域
    if (snackOrders.length > 0) {
      output.push(`#### 🍎 加餐订单 (${snackOrders.length}条)`);
      output.push('');
      const snackRows = snackOrders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        order.userName || '',
        order.userStudentId || '',
        '加餐',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateMarkdownTable(orderHeaders, snackRows));
      output.push('');
    }
  }
  
  // 🆕 缺餐分析（按日期显示）
  if (data.missingMealsAnalysis && data.missingMealsAnalysis.missingMealsByDate) {
    output.push('### 📊 缺餐分析');
    output.push('');
    const analysis = data.missingMealsAnalysis;
    
    if (analysis.dateRange) {
      output.push(`**数据范围:** ${analysis.dateRange.start} 至 ${analysis.dateRange.end} (共${analysis.totalDays}天)`);
      output.push('');
    }
    
    const missingByDate = analysis.missingMealsByDate;
    const dates = Object.keys(missingByDate).sort();
    
    if (dates.length > 0) {
      output.push('#### 📅 按日期分组的缺餐情况');
      output.push('');
      
      dates.forEach(date => {
        const dayMissing = missingByDate[date];
        const missingList = [];
        
        if (dayMissing.breakfast && dayMissing.breakfast.length > 0) {
          missingList.push(`**早餐:** ${dayMissing.breakfast.join(', ')}`);
        }
        if (dayMissing.lunch && dayMissing.lunch.length > 0) {
          missingList.push(`**午餐:** ${dayMissing.lunch.join(', ')}`);
        }
        if (dayMissing.dinner && dayMissing.dinner.length > 0) {
          missingList.push(`**晚餐:** ${dayMissing.dinner.join(', ')}`);
        }
        
        if (missingList.length > 0) {
          output.push(`**${date}:** ${missingList.join(' | ')}`);
        } else {
          output.push(`**${date}:** ✅ 全员正常用餐`);
        }
        output.push('');
      });
    }
    
    // 按学生分组显示
    if (analysis.missingMealsByStudent && Object.keys(analysis.missingMealsByStudent).length > 0) {
      output.push('#### 👤 按学生分组的缺餐情况');
      output.push('');
      
      Object.keys(analysis.missingMealsByStudent).sort().forEach(studentName => {
        const student = analysis.missingMealsByStudent[studentName];
        const studentMissing = [];
        
        if (student.breakfast && student.breakfast.length > 0) {
          studentMissing.push(`**早餐:** ${student.breakfast.join(', ')}`);
        }
        if (student.lunch && student.lunch.length > 0) {
          studentMissing.push(`**午餐:** ${student.lunch.join(', ')}`);
        }
        if (student.dinner && student.dinner.length > 0) {
          studentMissing.push(`**晚餐:** ${student.dinner.join(', ')}`);
        }
        
        if (studentMissing.length > 0) {
          output.push(`**${studentName}:** ${studentMissing.join(' | ')}`);
          output.push('');
        }
      });
    }
    
    output.push('---');
    output.push('');
    output.push('*此分析直接提供缺餐学生名单，无需大模型自行计算*');
    output.push('');
  }
  
  return output.join('\n');
  } catch (error) {
    console.error('[formatAllSchoolDataMarkdown] 错误:', error);
    console.error('[formatAllSchoolDataMarkdown] 堆栈:', error.stack);
    return `# 全校数据\n\n**错误:** 格式化数据时出错: ${error.message}`;
  }
}

/**
 * 格式化为Markdown表格（精简版）
 */
function formatAsMarkdown(data) {
  if (!data || !data.role) {
    return '数据格式错误';
  }
  
  if (data.role === 'teacher') {
    return formatTeacherDataMarkdown(data);
  } else if (data.role === 'student') {
    return formatStudentDataMarkdown(data);
  } else if (data.role === 'parent') {
    return formatParentDataMarkdown(data);
  } else if (data.role === 'all') {
    return formatAllSchoolDataMarkdown(data);
  }
  return JSON.stringify(data, null, 2);
}

/**
 * 格式化教师查询结果为Markdown
 */
function formatTeacherDataMarkdown(data) {
  let output = [];
  output.push(`**教师:** ${data.teacher?.name || '未知'} | **班级:** ${(data.teacher?.managedClasses || []).join(', ') || '无'}`);
  output.push('');
  
  if (!data.students || data.students.length === 0) {
    output.push(data.message || '未找到学生');
    return output.join('\n');
  }
  
  // 学生基本信息表格
  const studentHeaders = ['姓名', '学号', '班级', '性别', '家长'];
  const studentRows = data.students.map(student => {
    const parents = (student.parents || []).map(p => p.name).join(',') || '无';
    return [
      student.name || '',
      student.studentId || '',
      student.class || '',
      student.gender || '',
      parents
    ];
  });
  output.push('**学生列表:**');
  output.push(generateMarkdownTable(studentHeaders, studentRows));
  output.push('');
  
  // 每个学生的订单信息
  data.students.forEach((student) => {
    if (student.orders && student.orders.length > 0) {
      const yearRange = getOrderYearRange(student.orders);
      output.push(`**${student.name}订单(${student.orders.length}条, ${yearRange}):**`);
      // 显示所有订单（教师查询场景）
      const orderHeaders = ['日期', '餐次', '菜品', '营养'];
      const orderRows = student.orders.map(order => [
        order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
        translateMealType(order.mealType) || '',
        formatDishList(order.items),
        formatCompactNutritionSummary(order.totalNutrition)
      ]);
      output.push(generateMarkdownTable(orderHeaders, orderRows));
      output.push('');
    }
  });
  
  return output.join('\n');
}

/**
 * 格式化学生查询结果为Markdown
 */
function formatStudentDataMarkdown(data) {
  let output = [];
  const student = data.student || {};
  output.push(`**学生:** ${student.name || '未知'}(${student.studentId || '未知'}) | **班级:** ${student.class || '无'} | **性别:** ${student.gender || '无'}`);
  
  if (data.teacher) {
    output.push(`**班主任:** ${data.teacher.name || '未知'}`);
  }
  
  if (data.parents && data.parents.length > 0) {
    output.push(`**家长:** ${data.parents.map(p => p.name).join(', ')}`);
  }
  output.push('');
  
  if (data.orders && data.orders.length > 0) {
    const yearRange = getOrderYearRange(data.orders);
    output.push(`**订单记录(${data.orders.length}条, ${yearRange}):**`);
    const orderHeaders = ['日期', '餐次', '菜品', '营养'];
    const orderRows = data.orders.map(order => [
      order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
      translateMealType(order.mealType) || '',
      formatDishList(order.items),
      formatCompactNutritionSummary(order.totalNutrition)
    ]);
    output.push(generateMarkdownTable(orderHeaders, orderRows));
  } else {
    output.push('暂无订单');
  }
  
  return output.join('\n');
}

/**
 * 格式化家长查询结果为Markdown
 */
function formatParentDataMarkdown(data) {
  let output = [];
  const student = data.student || {};
  output.push(`**学生:** ${student.name || '未知'}(${student.studentId || '未知'}) | **班级:** ${student.class || '无'} | **性别:** ${student.gender || '无'}`);
  
  if (data.teacher) {
    output.push(`**班主任:** ${data.teacher.name || '未知'}`);
  }
  output.push('');
  
  if (data.orders && data.orders.length > 0) {
    const yearRange = getOrderYearRange(data.orders);
    output.push(`**订单记录(${data.orders.length}条, ${yearRange}):**`);
    const orderHeaders = ['日期', '餐次', '菜品', '营养'];
    const orderRows = data.orders.map(order => [
      order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) : '',
      translateMealType(order.mealType) || '',
      formatDishList(order.items),
      formatCompactNutritionSummary(order.totalNutrition)
    ]);
    output.push(generateMarkdownTable(orderHeaders, orderRows));
  } else {
    output.push('暂无订单');
  }
  
  return output.join('\n');
}

/**
 * 翻译餐次为中文
 */
function translateMealType(mealType) {
  const translations = {
    'breakfast': '早餐',
    'lunch': '午餐',
    'dinner': '晚餐',
    'snack': '加餐'
  };
  return translations[mealType] || mealType;
}

/**
 * 获取订单年份范围
 */
function getOrderYearRange(orders) {
  if (!orders || orders.length === 0) return '';
  
  const years = orders
    .map(order => order.orderDate ? new Date(order.orderDate).getFullYear() : null)
    .filter(year => year !== null);
  
  if (years.length === 0) return '';
  
  const uniqueYears = [...new Set(years)].sort();
  
  if (uniqueYears.length === 1) {
    return `${uniqueYears[0]}年`;
  } else {
    return `${uniqueYears[0]}-${uniqueYears[uniqueYears.length - 1]}年`;
  }
}

/**
 * 格式化菜品列表（文本格式）
 */
function formatDishList(items) {
  if (!items || items.length === 0) return '无';
  return items.map(item => {
    const name = item.dishName || '';
    const qty = item.quantity || 1;
    return qty > 1 ? `${name}×${qty}` : name;
  }).join(', ');
}

/**
 * 格式化菜品列表（JSON格式）
 */
function formatDishListForJSON(items) {
  if (!items || items.length === 0) return [];
  return items.map(item => ({
    name: item.dishName || '',
    qty: item.quantity || 1
  }));
}

/**
 * 精简JSON数据（移除不必要的字段和null值）
 */
function compactJSON(data) {
  if (!data) return data;
  
  const compact = { role: data.role };
  
  if (data.role === 'all') {
    // 精简版：仅保留基本用户统计
    compact.summary = {
      totalUsers: data.summary?.totalUsers || 0,
      students: data.summary?.students || 0,
      teachers: data.summary?.teachers || 0,
      parents: data.summary?.parents || 0
    };
    
    // 🆕 缺餐分析（关键！帮助大模型直接找到答案）
    if (data.missingMealsAnalysis) {
      compact.missingMealsAnalysis = data.missingMealsAnalysis;
    }
    
    // 🆕 教师名单
    if (data.teachers && data.teachers.length > 0) {
      compact.teachers = data.teachers.map(t => ({
        name: t.name,
        phone: t.phone || null,
        email: t.email || null,
        classes: t.managedClasses || []
      }));
    }
    
    // 🆕 学生名单
    if (data.students && data.students.length > 0) {
      compact.students = data.students.map(s => ({
        name: s.name,
        studentId: s.studentId,
        class: s.class,
        grade: s.grade,
        gender: s.gender,
        phone: s.phone || null,
        email: s.email || null,
        age: s.age,
        height: s.height,
        weight: s.weight,
        allergies: s.allergies || [],
        classTeacher: s.classTeacher,
        parents: (s.parents || []).map(p => ({
          name: p.name,
          phone: p.phone || null,
          email: p.email || null
        }))
      }));
    }
    
    // 🆕 家长名单
    if (data.parents && data.parents.length > 0) {
      compact.parents = data.parents.map(p => ({
        name: p.name,
        phone: p.phone || null,
        email: p.email || null,
        children: (p.children || []).map(c => ({
          name: c.name,
          studentId: c.studentId,
          class: c.class
        }))
      }));
    }
    
    // 最近订单（按餐次分组）
    if (data.recentOrders && data.recentOrders.length > 0) {
      // 按餐次分组统计
      const breakfastOrders = data.recentOrders.filter(o => o.mealType === 'breakfast');
      const lunchOrders = data.recentOrders.filter(o => o.mealType === 'lunch');
      const dinnerOrders = data.recentOrders.filter(o => o.mealType === 'dinner');
      const snackOrders = data.recentOrders.filter(o => o.mealType === 'snack');
      
      compact.ordersSummary = {
        total: data.recentOrders.length,
        breakfast: breakfastOrders.length,
        lunch: lunchOrders.length,
        dinner: dinnerOrders.length,
        snack: snackOrders.length
      };
      
      const formatOrderForJSON = (order) => ({
        date: order.orderDate ? new Date(order.orderDate).toLocaleDateString('zh-CN') : null,
        user: order.userName,
        studentId: order.userStudentId,
        meal: order.mealType,
        dishes: formatDishListForJSON(order.items),
        nutrition: {
          cal: order.totalNutrition?.calories ? Math.round(order.totalNutrition.calories) : null,
          pro: order.totalNutrition?.protein ? Math.round(order.totalNutrition.protein) : null,
          fat: order.totalNutrition?.fat ? Math.round(order.totalNutrition.fat) : null,
          carb: order.totalNutrition?.carbs ? Math.round(order.totalNutrition.carbs) : null
        }
      });
      
      // 分组存储订单
      compact.ordersByMealType = {
        breakfast: breakfastOrders.map(formatOrderForJSON),
        lunch: lunchOrders.map(formatOrderForJSON),
        dinner: dinnerOrders.map(formatOrderForJSON),
        snack: snackOrders.map(formatOrderForJSON)
      };
      
      // 保留原有的完整列表（向后兼容）
      compact.recentOrders = data.recentOrders.map(formatOrderForJSON);
    }
  } else if (data.role === 'teacher') {
    compact.teacher = {
      name: data.teacher?.name,
      classes: data.teacher?.managedClasses
    };
    
    if (data.students && data.students.length > 0) {
      compact.students = data.students.map(s => {
        const student = {
          name: s.name,
          studentId: s.studentId,
          class: s.class,
          gender: s.gender
        };
        
        if (s.parents && s.parents.length > 0) {
          student.parents = s.parents.map(p => p.name);
        }
        
        if (s.orders && s.orders.length > 0) {
          // 保留所有订单的关键信息（教师查询场景）
          student.orders = s.orders.map(o => ({
            date: o.orderDate ? new Date(o.orderDate).toLocaleDateString('zh-CN') : null,
            meal: o.mealType,
            dishes: formatDishListForJSON(o.items),
            nutrition: {
              cal: o.totalNutrition?.calories ? Math.round(o.totalNutrition.calories) : null,
              pro: o.totalNutrition?.protein ? Math.round(o.totalNutrition.protein) : null,
              fat: o.totalNutrition?.fat ? Math.round(o.totalNutrition.fat) : null,
              carb: o.totalNutrition?.carbs ? Math.round(o.totalNutrition.carbs) : null
            }
          }));
        }
        
        return student;
      });
    }
  } else if (data.role === 'student' || data.role === 'parent') {
    const student = data.student || {};
    compact.student = {
      name: student.name,
      studentId: student.studentId,
      class: student.class,
      gender: student.gender
    };
    
    if (data.teacher) {
      compact.teacher = data.teacher.name;
    }
    
    if (data.parents && data.parents.length > 0) {
      compact.parents = data.parents.map(p => p.name);
    }
    
    if (data.orders && data.orders.length > 0) {
      // 保留所有订单的关键信息
      compact.orders = data.orders.map(o => ({
        date: o.orderDate ? new Date(o.orderDate).toLocaleDateString('zh-CN') : null,
        meal: o.mealType,
        dishes: formatDishListForJSON(o.items),
        nutrition: {
          cal: o.totalNutrition?.calories ? Math.round(o.totalNutrition.calories) : null,
          pro: o.totalNutrition?.protein ? Math.round(o.totalNutrition.protein) : null,
          fat: o.totalNutrition?.fat ? Math.round(o.totalNutrition.fat) : null,
          carb: o.totalNutrition?.carbs ? Math.round(o.totalNutrition.carbs) : null
        }
      }));
    }
  }
  
  // 移除null值
  return JSON.parse(JSON.stringify(compact, (key, value) => value === null ? undefined : value));
}

/**
 * 生成缓存键
 */
function generateCacheKey(role, params) {
  const { teacherName, studentName, studentId, parentName, limit, skip, sort, startDate, endDate } = params;
  
  const keyParts = ['role:query', role];
  
  if (role === 'teacher') {
    keyParts.push(teacherName || 'unknown');
    if (studentName) {
      keyParts.push(`student:${studentName}`);
    }
  } else if (role === 'student') {
    keyParts.push(`${studentName}:${studentId}`);
  } else if (role === 'parent') {
    keyParts.push(`parent:${parentName}`);
    keyParts.push(`student:${studentName}:${studentId}`);
  }
  
  // 🆕 添加日期范围到缓存键
  if (startDate) keyParts.push(`from:${startDate}`);
  if (endDate) keyParts.push(`to:${endDate}`);
  
  // 添加分页和排序参数
  if (limit) keyParts.push(`limit:${limit}`);
  if (skip) keyParts.push(`skip:${skip}`);
  if (sort) keyParts.push(`sort:${sort}`);
  
  return keyParts.join(':');
}

/**
 * 获取缓存过期时间（TTL）
 */
function getCacheTTL(role, params) {
  const { studentName } = params;
  
  // 缓存策略：
  // 1. 全校查询：5分钟（数据量大，但变化相对较少）
  // 2. 教师查询（始终含订单）：3分钟（订单可能更新）
  // 3. 学生自查（含订单）：3分钟
  // 4. 家长查询（含订单）：3分钟
  
  if (role === 'all') {
    return 300; // 5分钟
  } else if (role === 'teacher') {
    return 180; // 3分钟（始终包含订单信息）
  } else if (role === 'student') {
    return 180; // 3分钟
  } else if (role === 'parent') {
    return 180; // 3分钟
  }
  
  return 300; // 默认5分钟
}
