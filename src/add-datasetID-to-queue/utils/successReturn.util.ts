import { APIGatewayProxyResult } from 'aws-lambda';

export function successReturn(message: string, data: any = {}): APIGatewayProxyResult {
    return {
        statusCode: 200,
        body: JSON.stringify({
            message,
            data,
        }),
    };
}
