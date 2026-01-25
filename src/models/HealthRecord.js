const mongoose = require('mongoose');

const healthRecordSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },

  weight: Number,
  height: Number,
  bmi: Number,

  bloodPressure: {
    systolic: Number,
    diastolic: Number
  },

  bloodSugar: {
    fasting: Number,
    postprandial: Number
  },

  temperature: Number,

  heartRate: Number,

  sleepHours: Number,

  exerciseMinutes: Number,

  waterIntake: Number,

  healthStatus: {
    type: String,
    enum: ['excellent', 'good', 'fair', 'poor'],
    default: 'good'
  },

  symptoms: [String],

  notes: String
}, {
  timestamps: true
});

healthRecordSchema.index({ user: 1, date: -1 });

healthRecordSchema.pre('save', function(next) {
  if (this.weight && this.height) {
    const heightInMeters = this.height / 100;
    this.bmi = Number((this.weight / (heightInMeters * heightInMeters)).toFixed(1));
  }
  next();
});

module.exports = mongoose.model('HealthRecord', healthRecordSchema);

