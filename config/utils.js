export const generateTimestampUserId = () => {
  return `${new Date().getTime()}-${Math.floor(
    1000000 + Math.random() * 9000000,
  )}`;
};
