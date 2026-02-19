const mongoose = require('mongoose');
const { ORDER_STATUS, MEAL_TYPES } = require('../config/constants');

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  studentUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // 菜品列表
  items: [{
    dish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Dish',
      required: true
    },
    dishName: String,
    dishCategory: String,
    dishImage: String,
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    // 每个菜品记录的营养信息
    nutrition: {
      calories: Number,
      protein: Number,
      fat: Number,
      carbs: Number,
      fiber: Number,
      vitaminA: Number,
      vitaminC: Number,
      vitaminD: Number,
      vitaminE: Number,
      calcium: Number,
      iron: Number,
      zinc: Number,
      sodium: Number,
      potassium: Number
    }
  }],
  // 三餐分类
  mealType: {
    type: String,
    enum: Object.values(MEAL_TYPES)
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PENDING
  },

  orderDate: {
    type: Date,
    default: Date.now
  },
  scheduledDate: Date,
  completedAt: Date,
  remark: String,

  location: {
    campus: {
      type: String,
      default: '主校区',
      comment: '校区'
    },
    canteen: {
      type: String,
      default: '第一食堂',
      comment: '食堂'
    },
    floor: {
      type: String,
      default: '1楼',
      comment: '楼层'
    },
    window: {
      type: String,
      default: '1号窗口',
      comment: '窗口'
    }
  },

  totalNutrition: {
    calories: Number,
    protein: Number,
    fat: Number,
    carbs: Number,
    fiber: Number,
    vitaminA: Number,
    vitaminC: Number,
    vitaminD: Number,
    vitaminE: Number,
    calcium: Number,
    iron: Number,
    zinc: Number,
    sodium: Number,
    potassium: Number
  }
}, {
  timestamps: true
});

orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    this.orderNumber = 'ORDER' + Date.now() + Math.floor(Math.random() * 1000);
  }
  next();
});

// 订单保存后清除相关缓存（仅单个订单操作，insertMany不会触发此hook）
orderSchema.post('save', async function () {
  try {
    const logger = require('../utils/logger');
    // 清除所有角色查询缓存（因为订单变更会影响所有查询）
    const { invalidateAllRoleQueryCache } = require('../utils/roleQueryCache');
    const deletedCount = await invalidateAllRoleQueryCache();

    logger.info('订单操作', `订单 ${this.orderNumber} 已保存`, `已清除 ${deletedCount} 个缓存键`);
  } catch (error) {
    // 缓存清除失败不应该影响订单保存
    const logger = require('../utils/logger');
    logger.error('订单操作', `订单 ${this.orderNumber} 保存后清除缓存失败`, error.message);
  }
});

// 订单删除后清除缓存
orderSchema.post('deleteOne', { document: true, query: false }, async function () {
  try {
    const logger = require('../utils/logger');
    const { invalidateAllRoleQueryCache } = require('../utils/roleQueryCache');
    const deletedCount = await invalidateAllRoleQueryCache();

    logger.info('订单操作', `订单 ${this.orderNumber} 已删除`, `已清除 ${deletedCount} 个缓存键`);
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('订单操作', `订单 ${this.orderNumber} 删除后清除缓存失败`, error.message);
  }
});

// 批量删除后清除缓存
orderSchema.post('deleteMany', async function () {
  try {
    const logger = require('../utils/logger');
    const { invalidateAllRoleQueryCache } = require('../utils/roleQueryCache');
    const deletedCount = await invalidateAllRoleQueryCache();

    logger.info('订单操作', '批量删除订单完成', `已清除 ${deletedCount} 个缓存键`);
  } catch (error) {
    const logger = require('../utils/logger');
    logger.error('订单操作', '批量删除订单后清除缓存失败', error.message);
  }
});

module.exports = mongoose.model('Order', orderSchema);

