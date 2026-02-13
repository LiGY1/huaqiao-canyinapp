const mongoose = require('mongoose');
const { DISH_CATEGORIES, DISH_STATUS } = require('../config/constants');

const dishSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: Object.values(DISH_CATEGORIES),
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  cost: {
    type: Number,
    default: 0,
    min: 0
  },
  image: {
    type: String,
    default: 'https://via.placeholder.com/150'
  },
  description: String,

  nutrition: {
    calories: {
      type: Number,
      default: 0,
      comment: '热量（千卡）'
    },
    protein: {
      type: Number,
      default: 0,
      comment: '蛋白质（克）'
    },
    fat: {
      type: Number,
      default: 0,
      comment: '脂肪（克）'
    },
    carbs: {
      type: Number,
      default: 0,
      comment: '碳水化合物（克）'
    },
    fiber: {
      type: Number,
      default: 0,
      comment: '膳食纤维（克）'
    },
    vitaminA: {
      type: Number,
      default: 0,
      comment: '维生素A（微克）'
    },
    vitaminC: {
      type: Number,
      default: 0,
      comment: '维生素C（毫克）'
    },
    vitaminD: {
      type: Number,
      default: 0,
      comment: '维生素D（微克）'
    },
    vitaminE: {
      type: Number,
      default: 0,
      comment: '维生素E（毫克）'
    },
    calcium: {
      type: Number,
      default: 0,
      comment: '钙（毫克）'
    },
    iron: {
      type: Number,
      default: 0,
      comment: '铁（毫克）'
    },
    zinc: {
      type: Number,
      default: 0,
      comment: '锌（毫克）'
    },
    sodium: {
      type: Number,
      default: 0,
      comment: '钠（毫克）'
    },
    potassium: {
      type: Number,
      default: 0,
      comment: '钾（毫克）'
    }
  },
  stock: {
    type: Number,
    default: 0
  },
  status: {
    type: Number,
    enum: Object.values(DISH_STATUS),
    default: DISH_STATUS.AVAILABLE
  },
  ingredients: [String],
  allergens: [String],
  isPopular: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0
  },

  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },

  recommendScore: {
    type: Number,
    default: 0
  },

  seasonal: {
    type: Boolean,
    default: false,
    comment: '是否为节气菜品'
  },
  solarTerm: {
    type: String,
    default: '',
    comment: '对应的节气名称（如：霜降、立冬）'
  },
  isRecommended: {
    type: Boolean,
    default: false,
    comment: '是否为推荐菜品'
  },
  nutritionDescription: {
    type: String,
    default: '',
    comment: '营养描述文本（AI生成）'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Dish', dishSchema);

