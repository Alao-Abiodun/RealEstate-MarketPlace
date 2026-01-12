export const removePasswordFromObject = (data) => {
    const { password, ...rest } = data.toJSON()
    return rest;
}