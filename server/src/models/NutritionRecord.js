const mongoose = require('mongoose');

const nutritionRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },

  intake: {
    calories: {
      type: Number,
      default: 0
    },
    protein: {
      type: Number,
      default: 0
    },
    fat: {
      type: Number,
      default: 0
    },
    carbs: {
      type: Number,
      default: 0
    },
    fiber: {
      type: Number,
      default: 0
    },
    vitaminC: {
      type: Number,
      default: 0
    },
    iron: {
      type: Number,
      default: 0
    },
    sugar: {
      type: Number,
      default: 0
    }
  },

  meals: [{
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    mealType: String,
    time: Date,
    items: [String]
  }],

  weight: Number,
  bloodPressure: String,
  bloodSugar: Number,
  notes: String
}, {
  timestamps: true
});

nutritionRecordSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('NutritionRecord', nutritionRecordSchema);

