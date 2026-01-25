const mongoose = require('mongoose');

const educationMaterialSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['course', 'class-meeting', 'material'],
    required: true
  },
  category: {
    type: String,
    enum: ['nutrition', 'health', 'safety', 'hygiene', 'other'],
    default: 'nutrition'
  },
  content: String,
  fileType: {
    type: String,
    enum: ['ppt', 'pdf', 'video', 'image', 'document', 'link']
  },
  fileUrl: String,
  targetGrades: [String],
  targetClasses: [String],

  duration: Number,
  completionRate: {
    type: Number,
    default: 0
  },

  scheduledDate: Date,
  sendDate: Date,
  readCount: {
    type: Number,
    default: 0
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  authorName: String,
  publishDate: {
    type: Date,
    default: Date.now
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  viewCount: {
    type: Number,
    default: 0
  },
  downloadCount: {
    type: Number,
    default: 0
  },
  description: String,
  tags: [String]
}, {
  timestamps: true
});

module.exports = mongoose.model('EducationMaterial', educationMaterialSchema);

