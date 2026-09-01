const express = require('express');
const router = express.Router();
const { uploadFile, getMyFiles, downloadFile, deleteFile } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All file routes are protected with auth middleware
router.use(protect);

router.post('/upload', upload.single('file'), uploadFile);
router.get('/', getMyFiles);
router.get('/download/:id', downloadFile);
router.delete('/:id', deleteFile);

module.exports = router;
