const express = require("express");
const { ECSClient, RunTaskCommand } = require("@aws-sdk/client-ecs");
const { generateSlug } = require("random-word-slugs");

const PORT = process.env.PORT || 9000;

const app = express();

app.use(express.json());

const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

const config = {
  CLUSTER: "arn:aws:ecs:ap-south-1:536270426756:cluster/build-cluster",
  TASK: "arn:aws:ecs:ap-south-1:536270426756:task-definition/builder-task",
};

app.post("/project", async (req, res) => {
  const { gitURL, slug } = req.body;
  const projectSlug = slug ?? generateSlug();

  console.log("Spinning up a container for project", projectSlug);

  const command = new RunTaskCommand({
    cluster: config.CLUSTER,
    taskDefinition: config.TASK,
    launchType: "FARGATE",
    count: 1,
    networkConfiguration: {
      awsvpcConfiguration: {
        subnets: [
          "subnet-0e58acfb5a291296b",
          "subnet-083ddaffd5aeef48b",
          "subnet-0fc359a13c236a2e0",
        ],
        assignPublicIp: "ENABLED",
        securityGroups: ["sg-0b7c0b978cc3b8e89"],
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

  await ecsClient.send(command);
  

  return res.json({
    status: "QUEUED",
    data: {
      projectSlug,
      url: `http://${projectSlug}.localhost:8000/`,
    },
  });
});

app.listen(PORT, () => console.log(`API server is running on port ${PORT}`));
