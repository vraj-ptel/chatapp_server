import { v2 as cloudinary } from "cloudinary";
import { v4 as uuid } from "uuid";
const getBase64 = (file) => {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
}
const uploadFilesToCloudinary = async (files = []) => {
  const uploadPromise = files.map((file) => {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        getBase64(file),
        {
          resource_type: "auto",
          public_id: uuid(),
        },
        (err, result) => {
          if (err) return reject(err);
          else resolve(result);
        }
      );
    });
  });
  try {
    const result = await Promise.all(uploadPromise);
    const formetedResult = result.map((res) => {
        console.log("res",res);
      return { public_id: res.public_id, url: res.secure_url };
    });
    return formetedResult;
  } catch (err) {
    throw new Error("Cloudinary Error");
    console.log(err);
  }
};
export default uploadFilesToCloudinary;
