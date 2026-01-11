export const removePasswordFromObject = (data) => {
    const { password, ...rest } = data;
    return rest;
}