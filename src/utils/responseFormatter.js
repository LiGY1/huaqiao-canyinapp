
exports.success = (res, data = null, message = 'success', code = 200) => {
  return res.status(code).json({
    code,
    success: true,
    message,
    data
  });
};

exports.error = (res, message = 'Error occurred', code = 500, errors = null) => {
  return res.status(code).json({
    code,
    success: false,
    message,
    ...(errors && { errors })
  });
};

exports.paginated = (res, data, page, pageSize, total, message = 'success') => {
  return res.status(200).json({
    code: 200,
    success: true,
    message,
    data: {
      list: data,
      pagination: {
        page: parseInt(page),
        pageSize: parseInt(pageSize),
        total,
        totalPages: Math.ceil(total / pageSize)
      }
    }
  });
};

