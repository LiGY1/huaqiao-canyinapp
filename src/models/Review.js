const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true
  },
  dish: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Dish'
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  taste: {
    type: Number,
    min: 1,
    max: 5
  },
  freshness: {
    type: Number,
    min: 1,
    max: 5
  },
  portionSize: {
    type: Number,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    maxlength: 500
  },
  images: [String],
  isAnonymous: {
    type: Boolean,
    default: false
  },
  reply: {
    content: String,
    repliedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    repliedAt: Date
  }
}, {
  timestamps: true
});

reviewSchema.index({ user: 1 });
reviewSchema.index({ order: 1 });
reviewSchema.index({ dish: 1 });
reviewSchema.index({ rating: 1 });

module.exports = mongoose.model('Review', reviewSchema);

