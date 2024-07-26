const express = require("express");
const { RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");
const { runTask, ESC_CONFIG, subscriber } = require("./config");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 9000;
const app = express();

const io = new Server({ cors: "*" });

io.on("connection", (socket) => {
  socket.on("subscribe", (channel) => {
    console.log("Subscribing to channel", channel);
    socket.join(channel);
    socket.emit("message", `Joined ${channel}`);
  });
});

io.listen(9001, () => console.log("Socket server is running on port 9001"));

app.use(express.json());

app.post("/project", async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ?? generateSlug();

  console.log("Spinning up a container for project", projectSlug);

  const command = new RunTaskCommand({
    cluster: ESC_CONFIG.CLUSTER,
    taskDefinition: ESC_CONFIG.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: ESC_CONFIG.VPC_SUBNETS,
        assignPublicIp: "ENABLED",
        securityGroups: ESC_CONFIG.SECURITY_GROUPS,
      },
    },
    overrides: {
      containerOverrides: [
        {
          name: "builder-image",
          environment: [
            {
              name: "AWS_ACCESS_KEY",
              value: process.env.AWS_ACCESS_KEY,
            },
            {
              name: "AWS_SECRET_KEY",
              value: process.env.AWS_SECRET_KEY,
            },
            {
              name: "REDIS_URL",
              value: process.env.REDIS_URL,
            },
            {
              name: "GIT_REPOSITORY__URL",
              value: gitURL,
            },
            {
              name: "PROJECT_ID",
              value: projectSlug,
            },
          ],
        },
      ],
    },
  });

  await runTask(command);

  return res.json({
    status: "QUEUED",
    data: {
      projectSlug,
      url: `http://${projectSlug}.localhost:8000/`,
    },
  });
});

async function initRedisSubscribe() {
  console.log("Subscribed to logs....");
  subscriber.psubscribe("logs:*");
  subscriber.on("pmessage", (_, channel, message) => {
    io.to(channel).emit("message", message);
  });
}

initRedisSubscribe();

app.listen(PORT, () => console.log(`API server is running on port ${PORT}`));
