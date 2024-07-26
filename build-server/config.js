const { S3Client } = require("@aws-sdk/client-s3");
const Redis = require("ioredis");

const PROJECT_ID = process.env.PROJECT_ID;

const publisher = new Redis(process.env.REDIS_URL);
function publishLog(log) {
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

async function sendS3Command(command) {
  try {
    await s3Client.send(command);
  } catch (err) {
    console.error(err);
    publishLog(`Error: ${err}`);
  }
}

module.exports = { sendS3Command, publishLog };
