const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { USER_ROLES } = require('../config/constants');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: Object.values(USER_ROLES),
    required: true
  },
  email: {
    type: String,
    sparse: true,
    trim: true
  },
  phone: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  children: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  studentId: String,
  class: String,
  grade: String,
  age: Number,
  gender: String,
  height: Number,
  weight: Number,
  allergies: [String],
  hasDiabetes: {
    type: Boolean,
    default: false
  },
  hasHereditaryDisease: {
    type: Boolean,
    default: false
  },
  hereditaryDiseaseDesc: String,
  targetCalories: {
    type: Number,
    default: 2000
  },

  balance: {
    type: Number,
    default: 0,
    min: 0
  },



  schoolId: String,
  schoolName: String,
  department: String,

  managedClasses: [String],

  isActive: {
    type: Boolean,
    default: true
  },

  // Token管理字段
  lastTokenReset: {
    type: Date,
    default: null
  },

  // 提醒设置（仅用于家长）
  reminderSettings: {
    type: {
      breakfast: { type: Boolean, default: true },
      lunch: { type: Boolean, default: true },
      dinner: { type: Boolean, default: true },
      dailySummary: { type: Boolean, default: true },
      nutritionAlert: { type: Boolean, default: false },
      healthTips: { type: Boolean, default: true }
    },
    default: () => ({
      breakfast: true,
      lunch: true,
      dinner: true,
      dailySummary: true,
      nutritionAlert: false,
      healthTips: true
    })
  }
}, {
  timestamps: true
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

