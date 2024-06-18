export const isVideo = (file: File) => {
  return file.name.includes('mp4, mov');
};
