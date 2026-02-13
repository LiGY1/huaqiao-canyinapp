const mongoose = require('mongoose');

const productionPlanSchema = new mongoose.Schema({
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish',
    required: true
  },
  dishName: String,
  dishCategory: String,
  dishImage: String,
  date: {
    type: Date,
    required: true
  },
  mealType: {
    type: String,
    enum: ['breakfast', 'lunch', 'dinner'],
    required: true
  },
  plannedQuantity: {
    type: Number,
    required: true,
    min: 0
  },
  completedQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  chef: {
    type: String,
    comment: '负责厨师'
  },
  startTime: Date,
  completedTime: Date,
  remark: String,

  aiSuggested: {
    type: Boolean,
    default: false
  },
  suggestedReason: String,

  usedIngredients: [{
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    ingredientName: String,
    quantity: Number,
    unit: String
  }],

  quality: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    comment: '成品质量'
  },
  qualityRemark: String
}, {
  timestamps: true
});

productionPlanSchema.index({ date: 1, mealType: 1, status: 1 });
productionPlanSchema.index({ dish: 1, date: 1 });

module.exports = mongoose.model('ProductionPlan', productionPlanSchema);

