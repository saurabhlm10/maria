export function validate(param: string, value: any): true {
    if (!value) {
        throw new Error(`${param} is required`);
    }

    return true;
}
