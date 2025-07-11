// Configure the upload route to handle larger files
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '210mb', // Set to slightly higher than max video size
    },
  },
};
