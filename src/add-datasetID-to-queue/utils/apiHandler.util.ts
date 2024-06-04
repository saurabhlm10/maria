import axios, { AxiosError } from 'axios';
import CustomError from './CustomError.util';

export async function apiHandler(method: string, url: string, data: any = null, headers: any = {}) {
    try {
        const response = await axios({
            method,
            url,
            data,
            headers,
        });

        return response.data.data;
    } catch (error: any) {
        if (error instanceof AxiosError) {
            throw new CustomError(error.response?.data.message, error.response?.status || 400);
        }
    }
}
