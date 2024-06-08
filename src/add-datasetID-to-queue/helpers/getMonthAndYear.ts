import { ENV } from '../constants';

export const getMonthAndYear = () => {
    const { months } = ENV;
    const date = new Date();

    const monthNumber = date.getMonth();
    const year = String(date.getFullYear());

    const month = months[monthNumber];

    return { month, year };
};
