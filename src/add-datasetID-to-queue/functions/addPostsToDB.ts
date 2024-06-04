import { APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { errorHandler } from '../utils/errorHandler.util';
import { successReturn } from '../utils/successReturn.util';
import axios from 'axios';
import { apiHandler } from '../utils/apiHandler.util';
import { uploadToCloud } from '../utils/uploadToCloud.util';

interface Message {
    nicheId: string;
    datasetId: string;
}

interface TikTokVideo {
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    shares: number;
    bookmarks: number;
    hashtags: string[];
    channel: {
        name: string;
        username: string;
        id: string;
        url: string;
        avatar: string;
        verified: boolean;
        followers: number;
        following: number;
        videos: number;
    };
    uploadedAt: number;
    uploadedAtFormatted: string;
    video: {
        width: number;
        height: number;
        ratio: string;
        duration: number;
        url: string;
        cover: string;
        thumbnail: string;
    };
    song: {
        id: number;
        title: string;
        artist: string;
        album: string | null;
        duration: number;
        cover: string;
    };
    postPage: string;
}

interface TempPostItem {
    source_url: string;
    originalViews: number;
    source: string;
    video_url: string;
    cover_url: string;
    media_url: string;
    caption: string;
}

export const lambdaHandler = async (event: SQSEvent): Promise<APIGatewayProxyResult> => {
    const invincibleUrl = process.env.InvincibleUrl;
    try {
        const message = JSON.parse(event.Records[0].body) as Message;

        const { nicheId, datasetId } = message;

        const getDatasetUrl = 'https://api.apify.com/v2/datasets/' + datasetId + '/items';

        const params = {
            token: process.env.ApifyToken,
            format: 'json',
        };

        const response = await axios.get(getDatasetUrl, { params });

        const datasetItems: TikTokVideo[] = response.data;

        const createTempPostsInDBBody: {
            nicheId: string;
            datasetId: string;
            posts: TempPostItem[];
        } = {
            nicheId,
            datasetId,
            posts: [],
        };

        const uploadToCloudPromises = datasetItems.map(async (item) => {
            const [media_url, cover_url] = await Promise.all([
                uploadToCloud(item.video.url),
                uploadToCloud(item.video.cover),
            ]);

            return { media_url, cover_url };
        });

        const result = await Promise.all(uploadToCloudPromises);

        datasetItems.forEach((item, i) => {
            createTempPostsInDBBody.posts.push({
                source_url: item.postPage,
                originalViews: item.views,
                source: 'tiktok',
                video_url: item.video.url,
                media_url: result[i].media_url,
                cover_url: result[i].cover_url,
                caption: item.title,
            });
        });

        const createTempPostsUrl = invincibleUrl + '/rawPosts';

        await apiHandler('post', createTempPostsUrl, createTempPostsInDBBody);

        return successReturn('Message received and stored posts in DB', event.Records);
    } catch (error) {
        return errorHandler(error);
    }
};
