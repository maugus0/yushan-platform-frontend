export const IMAGE_BASE_URL =
  process.env.REACT_APP_IMAGE_BASE_URL ||
  (process.env.REACT_APP_API_URL
    ? process.env.REACT_APP_API_URL.replace('/api', '/images')
    : '/api/v1/images');
