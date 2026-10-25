const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

// Middleware to check for validation errors from express-validator
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path || err.param,
      message: err.msg,
    }));

    return res.status(400).json({
      success: false,
      message: extractedErrors[0].message || 'Invalid input provided',
      errors: extractedErrors,
    });
  }
  next();
};

// Validate a specific param as valid MongoDB ObjectId
const validateObjectId = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ID format for parameter '${paramName}'`,
      });
    }
    next();
  };
};

module.exports = {
  validateRequest,
  validateObjectId,
};
