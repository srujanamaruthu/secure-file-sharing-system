const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: [true, 'Original filename is required'],
    trim: true,
  },
  encryptedFilename: {
    type: String,
    required: [true, 'Encrypted filename is required'],
    unique: true,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'File owner is required'],
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
  fileType: {
    type: String,
    required: [true, 'File type is required'],
  },
  size: {
    type: Number,
    required: [true, 'File size is required'],
  },
  iv: {
    type: String,
    required: [true, 'Encryption initialization vector (IV) is required'],
  },
});

module.exports = mongoose.model('File', fileSchema);
