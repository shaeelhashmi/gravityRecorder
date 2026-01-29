/**
 * Generates a unique signature for a file based on name, size and last modification
 */
export const getFileSignature = (file) => {
    return `${file.size}_${file.lastModified}`;
};
