const mongoose = require('mongoose');
const { PURCHASE_STATUS } = require('../config/constants');

const purchaseOrderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inventory'
    },
    ingredientName: String,
    quantity: {
      type: Number,
      required: true
    },
    unit: String,
    unitPrice: Number,
    totalPrice: Number
  }],
  supplier: {
    type: String,
    required: true
  },
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: Object.values(PURCHASE_STATUS),
    default: PURCHASE_STATUS.PENDING
  },
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  expectedDate: Date,
  receiveDate: Date,
  actualAmount: Number,
  remark: String,
  approvalRemark: String
}, {
  timestamps: true
});

purchaseOrderSchema.pre('save', async function(next) {
  if (this.isNew) {
    this.orderNumber = 'PO' + Date.now();
  }
  next();
});

module.exports = mongoose.model('PurchaseOrder', purchaseOrderSchema);

