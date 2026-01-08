/**
    * Converts pixel values to rem values based on a root font size of 16px.
    * @param px - The pixel value to converted
    * @returns The converted rem value 
*/

export const pxToRem = (px: number): string => {
    return `${px / 16}rem`;
}