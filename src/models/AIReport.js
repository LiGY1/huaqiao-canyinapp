const mongoose = require('mongoose');

const aiReportSchema = new mongoose.Schema({

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  reportType: {
    type: String,
    enum: ['weekly', 'monthly'],
    required: true,
    index: true
  },

  dateRange: {
    start: {
      type: Date,
      required: true
    },
    end: {
      type: Date,
      required: true
    }
  },

  content: {

    summary: {
      type: String,
      required: false
    },

    highlights: [{
      type: String
    }],

    suggestions: [{
      type: String
    }],

    nextPlan: {
      type: String
    },

    fullText: {
      type: String
    }
  },

  dataSummary: {
    avgCalories: Number,
    avgProtein: Number,
    avgFat: Number,
    avgCarbs: Number,
    avgFiber: Number,
    totalDays: Number,
    targetCalories: Number,
    nutritionScore: {
      carbs: Number,
      protein: Number,
      fat: Number,
      fiber: Number,
      vitamin: Number
    }
  },

  conversationId: {
    type: String
  },

  status: {
    type: String,
    enum: ['generating', 'completed', 'failed'],
    default: 'generating'
  },

  errorMessage: {
    type: String
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

aiReportSchema.index({ student: 1, reportType: 1, createdAt: -1 });

aiReportSchema.index({ student: 1, 'dateRange.start': 1, 'dateRange.end': 1 });

module.exports = mongoose.model('AIReport', aiReportSchema);

