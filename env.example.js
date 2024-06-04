const fs = require("fs");

const path = "./env.json";

const MariaQueueUrl = "";
// const InvincibleUrl = "http://host.docker.internal:3000";
const InvincibleUrl = "";
const SQSExecutionRoleArn = "";
const ApifyToken = "";

// Cloudinary
const CloudinaryApiKey = "";
const CloudinaryApiSecret = "";
const CloudinaryCloudName = "";

const functions = {
  DB: {
    AddDatasetIDToQueueFunction: "AddDatasetIDToQueueFunction",
    AddPostsToDBFunction: "AddPostsToDBFunction",
  },
  Apify: {
    AddPostsToDBFunction: "AddPostsToDBFunction",
  },
  Cloudinary: {
    AddPostsToDBFunction: "AddPostsToDBFunction",
  },
  AWS: {
    AddDatasetIDToQueueFunction: "AddDatasetIDToQueueFunction",
  },
};

const envMapping = {
  Apify: {
    ApifyToken: ApifyToken,
  },
  DB: {
    InvincibleUrl: InvincibleUrl,
  },
  AWS: {
    MariaQueueUrl: MariaQueueUrl,
    SQSExecutionRoleArn: SQSExecutionRoleArn,
  },
  Cloudinary: {
    CloudinaryApiKey: CloudinaryApiKey,
    CloudinaryApiSecret: CloudinaryApiSecret,
    CloudinaryCloudName: CloudinaryCloudName,
  },
};

const createEnvVars = () => {
  const result = {};
  Object.keys(functions).forEach((key) => {
    Object.keys(functions[key]).forEach((functionKey) => {
      const envObject = {};
      Object.keys(envMapping).forEach((envvar) => {
        envObject[envvar] = envMapping[envvar];
      });
      result[functionKey] = { ...result[functionKey], ...envMapping[key] };
    });
  });

  fs.writeFileSync(path, JSON.stringify(result, null, 2));
};

createEnvVars();
