import { APIGatewayProxyResult, SQSEvent } from 'aws-lambda';
import { errorHandler } from '../utils/errorHandler.util';
import { successReturn } from '../utils/successReturn.util';
import axios from 'axios';
import { apiHandler } from '../utils/apiHandler.util';
import { uploadToCloud } from '../utils/uploadToCloud.util';
import AWS from 'aws-sdk';
import { getMonthAndYear } from '../helpers/getMonthAndYear';
const sqs = new AWS.SQS();

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
    const vulcanQueueUrl = process.env.VulcanQueueUrl || '';
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

        const { month, year } = getMonthAndYear();

        const createTempPostsInDBBody: {
            nicheId: string;
            month: string;
            year: string;
            posts: TempPostItem[];
        } = {
            nicheId,
            month,
            year,
            posts: [],
        };

        // Upload videos and covers to cloud
        const uploadToCloudPromises = datasetItems.map(async (item) => {
            const [mediaResult, coverResult] = await Promise.allSettled([
                uploadToCloud(item.video.url),
                uploadToCloud(item.video.cover),
            ]);

            const media_url = mediaResult.status === 'fulfilled' ? mediaResult.value : null;
            const cover_url = coverResult.status === 'fulfilled' ? coverResult.value : null;

            return {
                media_url,
                cover_url,
                mediaError: mediaResult.status === 'rejected' ? mediaResult.reason : null,
                coverError: coverResult.status === 'rejected' ? coverResult.reason : null,
            };
        });
        const result = await Promise.allSettled(uploadToCloudPromises);

        const successfulUploads: { media_url: string; cover_url: string }[] = [];
        const failedUploads = [];
        const filteredDatasetItems: (TikTokVideo | null)[] = datasetItems.slice();

        result.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                if (res.value.media_url && res.value.cover_url) {
                    successfulUploads.push({ media_url: res.value.media_url, cover_url: res.value.cover_url });
                } else {
                    res.value.mediaError && console.log('Error uploading video: ', res.value.mediaError);
                    res.value.coverError && console.log('Error uploading cover: ', res.value.coverError);
                    filteredDatasetItems[index] = null;
                }
            } else {
                failedUploads.push({ item: datasetItems[index], reason: res.reason });
                filteredDatasetItems[index] = null;
            }
        });

        filteredDatasetItems.forEach((item, i) => {
            if (item) {
                const uploadResult = result[i];
                let media_url = null;
                let cover_url = null;

                if (uploadResult.status === 'fulfilled') {
                    media_url = uploadResult.value.media_url;
                    cover_url = uploadResult.value.cover_url;
                }

                createTempPostsInDBBody.posts.push({
                    source_url: item.postPage,
                    originalViews: item.views,
                    source: 'tiktok',
                    video_url: item.video.url,
                    media_url: media_url as string,
                    cover_url: cover_url as string,
                    caption: item.title,
                });
            }
        });

        const createTempPostsUrl = invincibleUrl + '/rawPosts';

        await apiHandler('post', createTempPostsUrl, createTempPostsInDBBody);

        // Get Collection Page ID Using Name

        const collectionPageName = datasetItems[0].channel.username;
        const getCollectionPageUsingNameUrl = invincibleUrl + '/collectionIGPage/' + collectionPageName;

        const collectionPage = await apiHandler('get', getCollectionPageUsingNameUrl);

        const collectionPageId = collectionPage._id;

        // Add Collection Page to completedCollectionPages
        const addCollectionPageToCompletedCollectionPagesUrl =
            invincibleUrl + '/collectionIGPage/add/completedCollectionPage';

        const addCollectionPageToCompletedCollectionPagesBody = {
            nicheId,
            month,
            year,
            collectionPageId,
        };

        await apiHandler(
            'put',
            addCollectionPageToCompletedCollectionPagesUrl,
            addCollectionPageToCompletedCollectionPagesBody,
        );

        // Check if Niche Post Collection is done
        const nichePostCollectionIsDoneUrl =
            invincibleUrl + '/NicheApifyDatasetStatus/checkNichePostCollection/' + nicheId + '/' + month + '/' + year;
        const nichePostCollectionIsDoneResponse = await apiHandler('get', nichePostCollectionIsDoneUrl);

        // If Niche Post Collection is done put it in vulcan queue

        if (nichePostCollectionIsDoneResponse.completed) {
            const params = {
                MessageBody: JSON.stringify({ nicheId }),
                QueueUrl: vulcanQueueUrl,
            };

            const queueMessage = await sqs.sendMessage(params).promise();
        }

        return successReturn('Message received and stored posts in DB', event.Records);
    } catch (error) {
        return errorHandler(error);
    }
};
