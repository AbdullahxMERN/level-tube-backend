import { v2 as cloudinary } from "cloudinary";

import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log(process.env.CLOUDINARY_NAME);

console.log(process.env.CLOUDINARY_API_KEY);

console.log(process.env.CLOUDINARY_API_SECRET);
const uploadOnCloud = async (localPath) => {
  try {
    if (!localPath) return null;
    const response = await cloudinary.uploader.upload(localPath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localPath);
    return response;
  } catch (error) {
    console.error("Cloudinary upload error:", error.message);
    if (localPath && fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
    return null;
  }
};

const getPublicIdAndTypeFromUrl = (url) => {
  if (!url) return { publicId: null, resourceType: null };
  const parts = url.split("/");
  const uploadIndex = parts.indexOf("upload");
  if (uploadIndex === -1) return { publicId: null, resourceType: null };

  const resourceType = parts[uploadIndex - 1] || "image";

  let publicIdParts = parts.slice(uploadIndex + 1);
  if (publicIdParts[0].match(/^v\d+$/)) {
    publicIdParts = publicIdParts.slice(1);
  }

  const publicIdWithExtension = publicIdParts.join("/");
  const lastDotIndex = publicIdWithExtension.lastIndexOf(".");
  const publicId =
    lastDotIndex === -1
      ? publicIdWithExtension
      : publicIdWithExtension.substring(0, lastDotIndex);

  return { publicId, resourceType };
};

const deleteFromCloudinary = async (urlOrPublicId, resourceType = "image") => {
  try {
    if (!urlOrPublicId) return null;

    let publicId = urlOrPublicId;
    let type = resourceType;

    // Check if it's a URL
    if (
      urlOrPublicId.includes("res.cloudinary.com") ||
      urlOrPublicId.startsWith("http")
    ) {
      const extracted = getPublicIdAndTypeFromUrl(urlOrPublicId);
      if (extracted.publicId) {
        publicId = extracted.publicId;
        type = extracted.resourceType;
      }
    }

    const response = await cloudinary.uploader.destroy(publicId, {
      resource_type: type,
    });

    return response;
  } catch (error) {
    console.error("Error deleting from Cloudinary:", error);
    return null;
  }
};

export { uploadOnCloud, deleteFromCloudinary };
