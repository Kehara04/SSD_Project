const streamifier = require("streamifier");
const cloudinary = require("../config/cloudinary");

const uploadBufferToCloudinary = (fileBuffer, options = {}) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: "auto",
        ...options,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    streamifier.createReadStream(fileBuffer).pipe(stream);
  });

module.exports = {
  uploadBufferToCloudinary,
};