const mongoose = require('mongoose');

const physicalExamSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  examDate: {
    type: Date,
    required: true
  },
  height: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  bmi: Number,
  vision: {
    left: String,
    right: String
  },
  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },
  heartRate: Number,
  hemoglobin: Number,
  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },
  nutritionScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  notes: String,
  examiner: String
}, {
  timestamps: true
});

physicalExamSchema.pre('save', function(next) {
  if (this.height && this.weight) {
    const heightInMeters = this.height / 100;
    this.bmi = (this.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  next();
});

module.exports = mongoose.model('PhysicalExam', physicalExamSchema);

