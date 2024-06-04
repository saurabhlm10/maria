import { v2 as cloudinary } from 'cloudinary';

const cloudinaryApiKey = process.env.CloudinaryApiKey;
const cloudinaryApiSecret = process.env.CloudinaryApiSecret;
const cloudinaryCloudName = process.env.CloudinaryCloudName;

cloudinary.config({
    cloud_name: cloudinaryCloudName,
    api_key: cloudinaryApiKey,
    api_secret: cloudinaryApiSecret,
});

export const uploadToCloud = async (video_url: string) => {
    try {
        const cloudinaryUploadResponse = await cloudinary.uploader.upload(video_url, { resource_type: 'auto' });

        return cloudinaryUploadResponse.secure_url;
    } catch (error: any) {
        throw new Error(error.message);
    }
};
