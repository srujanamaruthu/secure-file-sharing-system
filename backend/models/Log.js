const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null, // Null for unauthenticated attempts (e.g. failed login)
  },
  username: {
    type: String,
    required: [true, 'Username is required for security logging'],
    trim: true,
  },
  action: {
    type: String,
    required: [true, 'Log action is required'],
    enum: [
      'User Registration',
      'User Login',
      'User Logout',
      'File Upload',
      'File Download',
      'File Deletion',
      'Failed Login Attempt',
    ],
  },
  ipAddress: {
    type: String,
    default: 'Unknown',
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Log', logSchema);
