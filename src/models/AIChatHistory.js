const mongoose = require('mongoose');

const aiChatHistorySchema = new mongoose.Schema({

  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  source: {
    type: String,
    enum: ['student', 'parent', 'school', 'canteen'],
    required: true,
    index: true,
    default: 'student'
  },

  conversationId: {
    type: String,
    index: true,
    default: ''
  },

  sender: {
    type: String,
    enum: ['user', 'ai'],
    required: true
  },

  userMessage: {
    type: String,
    default: ''
  },

  aiMessage: {
    type: String,
    default: ''
  },

  files: [{
    filename: String,
    url: String,
    type: {
      type: String,
      enum: ['image', 'video', 'audio', 'document', 'other'],
      default: 'image'
    },
    size: Number,
    mimeType: String
  }],

  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },

  metadata: {

    wrappedQuery: String,

    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },

    responseTime: Number,

    extras: mongoose.Schema.Types.Mixed
  },

  summary: {
    type: String,
    default: ''
  },

  tags: [{
    type: String
  }],

  isFavorite: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

aiChatHistorySchema.index({ user: 1, source: 1, createdAt: -1 });

aiChatHistorySchema.index({ user: 1, source: 1, conversationId: 1 });

aiChatHistorySchema.index({ user: 1, isFavorite: 1, createdAt: -1 });

module.exports = mongoose.model('AIChatHistory', aiChatHistorySchema);

