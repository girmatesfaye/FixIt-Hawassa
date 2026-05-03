export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? "",
    apiKey: process.env.CLOUDINARY_API_KEY ?? "",
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? "",
  },
};

export const isPlaceholderMongoUri = (value: string): boolean => {
  if (!value) return true;

  const placeholderTokens = [
    "<",
    ">",
    "your_username",
    "your_password",
    "placeholder",
  ];
  return placeholderTokens.some((token) => value.toLowerCase().includes(token));
};
