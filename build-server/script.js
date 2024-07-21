const { exec } = require("child-process");
const path = require("path");
const fs = require("fs");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");

const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script");
  const outDirPath = path.resolve(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", (data) => {
    console.log(data.toString());
  });

  p.stdout.on("data", (data) => {
    console.error(data.toString());
  });

  p.on("close", async () => {
    console.log("Build completed");
    const distFolderPath = path.join(__dirname, "output", "dist");

    const distFolderContent = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    for (const file of distFolderContent) {
      const filePath = path.join(distFolderPath, file);

      if (fs.lstatSync(filePath).isDirectory()) continue;

      console.log(`Uploading ${filePath}...`);

      const command = new PutObjectCommand({
        Bucket: "simple-vercel-output",
        Key: `__output/${PROJECT_ID}/${filePath}`,
        Body: fs.createReadStream(file),
        ContentType: mime.lookup(filePath)
      });

      await s3Client.send(command);

      console.log(`Uploaded ${filePath}`);
    }
    console.log("Done...");
  });
}

init();