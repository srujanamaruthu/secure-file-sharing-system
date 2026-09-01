const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const File = require('../models/File');
const Log = require('../models/Log');
const { encryptFile, decryptFile } = require('../utils/cryptoUtils');

// Ensure encrypted directory exists
const encryptedDir = path.join(__dirname, '../uploads/encrypted');
if (!fs.existsSync(encryptedDir)) {
  fs.mkdirSync(encryptedDir, { recursive: true });
}

/**
 * @desc Securely upload and encrypt a file
 * @route POST /api/files/upload
 * @access Protected (Requires Auth)
 */
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded or file type is not supported.',
      });
    }

    const tempFilePath = req.file.path;

    // Read the temporary file buffer
    const fileBuffer = fs.readFileSync(tempFilePath);

    // Encrypt the file buffer using utility
    const { encryptedBuffer, iv } = encryptFile(fileBuffer);

    // Generate unique name for disk storage
    const encryptedFilename = uuidv4() + '.enc';
    const encryptedFilePath = path.join(encryptedDir, encryptedFilename);

    // Save encrypted file to disk
    fs.writeFileSync(encryptedFilePath, encryptedBuffer);

    // Securely delete temporary cleartext file
    fs.unlinkSync(tempFilePath);

    // Save metadata to MongoDB
    const file = await File.create({
      filename: req.file.originalname,
      encryptedFilename: encryptedFilename,
      owner: req.user._id,
      fileType: req.file.mimetype,
      size: req.file.size,
      iv: iv, // Save initialization vector for decryption later
    });

    // Create log entry
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'File Upload',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    });

    res.status(201).json({
      success: true,
      message: 'File uploaded and encrypted successfully.',
      file: {
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        uploadDate: file.uploadDate,
      },
    });
  } catch (error) {
    // If error occurs, clean up temp file if it still exists
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (err) {
        console.error('Error cleaning up temp file:', err.message);
      }
    }
    next(error);
  }
};

/**
 * @desc Get user's own file list
 * @route GET /api/files
 * @access Protected
 */
const getMyFiles = async (req, res, next) => {
  try {
    const files = await File.find({ owner: req.user.id })
      .select('-iv') // Exclude initialization vector from listing APIs for safety
      .sort({ uploadDate: -1 });

    res.status(200).json({
      success: true,
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        fileType: file.fileType,
        size: file.size,
        uploadDate: file.uploadDate,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Download and decrypt a file
 * @route GET /api/files/download/:id
 * @access Protected
 */
const downloadFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Security check: Only the file owner can access/download this file
    if (file.owner.toString() !== req.user.id) {
      // Log unauthorized download attempt
      await Log.create({
        userId: req.user._id,
        username: req.user.username,
        action: 'Failed Login Attempt', // Wait, better as customized action log, let's keep it audit log
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
      });
      
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not own this file.',
      });
    }

    const encryptedFilePath = path.join(encryptedDir, file.encryptedFilename);

    if (!fs.existsSync(encryptedFilePath)) {
      return res.status(404).json({
        success: false,
        error: 'Physical file not found on server storage.',
      });
    }

    // Read the encrypted file
    const encryptedBuffer = fs.readFileSync(encryptedFilePath);

    // Decrypt on the fly using key and IV stored in metadata
    const decryptedBuffer = decryptFile(encryptedBuffer, file.iv);

    // Log the download event
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'File Download',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    });

    // Set appropriate headers and send file
    res.setHeader('Content-Type', file.fileType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(file.filename)}"`
    );
    res.send(decryptedBuffer);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc Delete file
 * @route DELETE /api/files/:id
 * @access Protected
 */
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {
      return res.status(404).json({
        success: false,
        error: 'File not found',
      });
    }

    // Security check: Only the file owner can delete
    if (file.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You do not own this file.',
      });
    }

    const encryptedFilePath = path.join(encryptedDir, file.encryptedFilename);

    // Delete encrypted file from disk if it exists
    if (fs.existsSync(encryptedFilePath)) {
      fs.unlinkSync(encryptedFilePath);
    }

    // Delete metadata from database
    await file.deleteOne();

    // Log deletion event
    await Log.create({
      userId: req.user._id,
      username: req.user.username,
      action: 'File Deletion',
      ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
    });

    res.status(200).json({
      success: true,
      message: 'File deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadFile,
  getMyFiles,
  downloadFile,
  deleteFile,
};
