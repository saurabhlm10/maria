import { APIGatewayProxyResult } from 'aws-lambda';
import CustomError from './CustomError.util';

export function errorHandler(err: any): APIGatewayProxyResult {
    console.log(err);
    if (err instanceof CustomError) {
        return {
            statusCode: err.statusCode,
            body: JSON.stringify({
                message: err.message,
            }),
        };
    }

    const errorMessage = 'some error happened';
    return {
        statusCode: 500,
        body: JSON.stringify({
            message: err.message ?? errorMessage,
            error: err,
        }),
    };
}
