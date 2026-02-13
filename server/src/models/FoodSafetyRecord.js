const mongoose = require('mongoose');

const foodSafetyRecordSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['inspection', 'disinfection', 'temperature'],
    required: true
  },

  ingredient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory'
  },
  ingredientName: String,
  supplier: String,
  quantity: Number,
  unit: String,
  qualityStatus: {
    type: String,
    enum: ['qualified', 'unqualified', 'pending']
  },
  temperature: Number,
  freshness: String,

  area: String,
  method: {
    type: String,
    enum: ['UV', 'chemical', 'heat', 'other']
  },
  concentration: String,
  duration: Number,

  inspector: String,
  date: {
    type: Date,
    default: Date.now
  },
  result: String,
  remark: String,
  images: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('FoodSafetyRecord', foodSafetyRecordSchema);

