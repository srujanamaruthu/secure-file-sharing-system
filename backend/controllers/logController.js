const Log = require('../models/Log');

/**
 * @desc Get user activity logs
 * @route GET /api/logs
 * @access Protected (Requires Auth)
 */
const getMyLogs = async (req, res, next) => {
  try {
    // Find logs that either match the user ID or the username
    const logs = await Log.find({
      $or: [
        { userId: req.user.id },
        { username: req.user.username }
      ]
    })
    .sort({ timestamp: -1 })
    .limit(100); // Limit to last 100 entries for performance

    res.status(200).json({
      success: true,
      logs: logs.map(log => ({
        id: log._id,
        action: log.action,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress,
      })),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyLogs,
};
