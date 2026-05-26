function errorHandler(err, req, res, _next) {
  console.error('Error:', err);

  if (err.code && err.code.startsWith('P')) {
    return res.status(400).json({
      success: false,
      error: err.message,
      detail: err.detail || null,
      code: err.code,
    });
  }

  if (err.status === 409) {
    return res.status(409).json({ success: false, error: err.message });
  }

  if (err.status === 404) {
    return res.status(404).json({ success: false, error: err.message });
  }

  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal server error',
  });
}

module.exports = errorHandler;
