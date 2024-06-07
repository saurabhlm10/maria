import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ApifyWebhook } from '../types/apifyWebhook.type';
import { apiHandler } from '../utils/apiHandler.util';
import { errorHandler } from '../utils/errorHandler.util';
import { successReturn } from '../utils/successReturn.util';
import CustomError from '../utils/CustomError.util';
import { validate } from '../validator';
import AWS from 'aws-sdk';
const sqs = new AWS.SQS();

export const lambdaHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const invincibleUrl = process.env.InvincibleUrl || '';
    const queueUrl = process.env.MariaQueueUrl || '';

    try {
        const data: ApifyWebhook = JSON.parse(event.body || '');

        const { nicheId, resource } = data;

        const { defaultDatasetId: datasetId } = resource;

        validate('nicheId', nicheId);
        validate('datasetId', datasetId);

        const getUrl = invincibleUrl + '/niche/' + data.nicheId;

        const niche = await apiHandler('get', getUrl);

        if (!niche) throw new CustomError('No niche found', 404);

        // Initiate & Store Status in DB
        const statusBody = {
            nicheId: data.nicheId,
        };

        const params = {
            MessageBody: JSON.stringify({ ...statusBody, datasetId: data.resource.defaultDatasetId }),
            QueueUrl: queueUrl,
        };

        const queueMessage = await sqs.sendMessage(params).promise();

        const postUrl = invincibleUrl + '/nicheApifyDatasetStatus';

        const createdNicheApifyDatasetStatus = await apiHandler('post', postUrl, statusBody);

        return successReturn('Status created Successfully', {
            createdNicheApifyDatasetStatus,
            messageId: queueMessage.MessageId,
        });
    } catch (err) {
        return errorHandler(err);
    }
};
