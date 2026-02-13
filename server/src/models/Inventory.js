const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['meat', 'vegetable', 'grain', 'seasoning', 'oil', 'dairy', 'other'],
    default: 'other'
  },
  quantity: {
    type: Number,
    required: true,
    default: 0
  },
  unit: {
    type: String,
    required: true,
    default: '斤'
  },
  warningLevel: {
    type: Number,
    default: 100
  },
  unitPrice: {
    type: Number,
    default: 0
  },
  supplier: String,
  lastStockIn: Date,
  expiryDate: Date,
  storageLocation: String,

  stockHistory: [{
    type: {
      type: String,
      enum: ['in', 'out']
    },
    quantity: Number,
    date: Date,
    operator: String,
    remark: String
  }]
}, {
  timestamps: true
});

inventorySchema.virtual('totalValue').get(function() {
  return this.quantity * this.unitPrice;
});

inventorySchema.virtual('isLow').get(function() {
  return this.quantity <= this.warningLevel;
});

module.exports = mongoose.model('Inventory', inventorySchema);

