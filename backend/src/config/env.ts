export const env = {
  port: Number(process.env.PORT ?? 4000),
  mongoUri: process.env.MONGODB_URI ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "dev-only-change-me",
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
