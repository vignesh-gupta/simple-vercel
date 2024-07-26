const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const Redis = require("ioredis");

const publisher = new Redis(process.env.REDIS_URL);
export function publishLog(log) {
  console.log(log);
  publisher.publish(`logs:${PROJECT_ID}`, JSON.stringify({ log }));
}

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

export async function sendS3Command(command) {
  try {
    await s3Client.send(command);
  } catch (err) {
    console.error(err);
    publishLog(`Error: ${err}`);
  }
}
