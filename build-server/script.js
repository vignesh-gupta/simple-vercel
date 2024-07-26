const { exec } = require("child_process");
const path = require("path");
const fs = require("fs");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const mime = require("mime-types");
const { publishLog, sendS3Command } = require("./config");

const PROJECT_ID = process.env.PROJECT_ID;

async function init() {
  console.log("Executing script");
  publishLog("Build Started...");
  const outDirPath = path.resolve(__dirname, "output");

  const p = exec(`cd ${outDirPath} && npm install && npm run build`);

  p.stdout.on("data", (data) => {
    console.log(data.toString());
    publishLog(data.toString());
  });

  p.stdout.on("error", (data) => {
    publishLog("Error: " + data.toString());
  });

  p.on("close", async () => {
    publishLog("Build completed");

    const distFolderPath = path.join(__dirname, "output", "dist");
    const distFolderContents = fs.readdirSync(distFolderPath, {
      recursive: true,
    });

    publishLog("Starting Upload");

    for (const file of distFolderContents) {
      const filePath = path.join(distFolderPath, file);

      if (fs.lstatSync(filePath).isDirectory()) continue;

      publishLog(`Uploading ${filePath}...`);

      const command = new PutObjectCommand({
        Bucket: "simple-vercel-output",
        Key: `__outputs/${PROJECT_ID}/${file}`,
        Body: fs.createReadStream(filePath),
        ContentType: mime.lookup(filePath),
      });

      await sendS3Command(command);

      publishLog(`Uploaded ${filePath}`);
    }

    publishLog("Done...");
  });
}

init();
