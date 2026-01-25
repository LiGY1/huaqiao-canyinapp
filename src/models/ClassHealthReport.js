const mongoose = require('mongoose');

const classHealthReportSchema = new mongoose.Schema({

  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  filters: {
    grade: String,
    class: String,
    keyword: String,
    healthStatus: String
  },

  scope: {
    type: String,
    required: true
  },

  summary: {
    total: {
      type: Number,
      required: true
    },
    healthy: Number,
    attention: Number,
    abnormal: Number,
    healthyRate: Number,
    avgHeight: Number,
    avgWeight: Number,
    avgBMI: Number,
    avgNutritionScore: Number
  },

  content: {

    overview: {
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
    }
  },

  students: [{
    studentId: String,
    studentName: String,
    healthStatus: String,
    bmi: Number
  }],

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

classHealthReportSchema.index({ generatedBy: 1, createdAt: -1 });

classHealthReportSchema.index({ scope: 1, createdAt: -1 });

module.exports = mongoose.model('ClassHealthReport', classHealthReportSchema);

