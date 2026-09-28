// const errorHandler = (err, req, res, next) => {
//     console.error(err.stack);
  
//     res.status(err.statusCode || 500).json({
//       message: err.message || "Internal server error",
//     });
//   };
  
//   module.exports = errorHandler;

const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: "File size exceeds the allowed 10 MB limit",
    });
  }

  res.status(err.statusCode || 500).json({
    message: err.message || "Internal server error",
  });
};

module.exports = errorHandler;