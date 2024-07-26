const { ECSClient } = require("@aws-sdk/client-ecs");
const Redis = require("ioredis");


const ecsClient = new ECSClient({
  region: "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
  },
});

async function runTask(command) {
  try {
    await ecsClient.send(command);
  } catch (err) {
    console.error(err);
  }
}

const ESC_CONFIG = {
  CLUSTER: "arn:aws:ecs:ap-south-1:536270426756:cluster/build-cluster",
  TASK: "arn:aws:ecs:ap-south-1:536270426756:task-definition/builder-task",
  VPC_SUBNETS: [
    "subnet-0e58acfb5a291296b",
    "subnet-083ddaffd5aeef48b",
    "subnet-0fc359a13c236a2e0",
  ],
  SECURITY_GROUPS: ["sg-0b7c0b978cc3b8e89"],
};

const subscriber = new Redis(process.env.REDIS_URL);

module.exports = { runTask, ESC_CONFIG, subscriber };
