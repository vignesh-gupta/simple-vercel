const express = require("express");
const httpProxy = require("http-proxy");

const PORT = process.env.PORT || 8000;
const BASE_URL =
  "https://simple-vercel-output.s3.ap-south-1.amazonaws.com/__outputs";

const app = express();

const proxy = httpProxy.createProxy();

app.use((req, res) => {
  const hostname = req.hostname;
  const subdomain = hostname.split(".")[0];
  const resolvesTo = `${BASE_URL}/${subdomain}`;

  return proxy.web(req, res, { target: resolvesTo, changeOrigin: true });
});

proxy.on("proxyReq", (proxyReq, req, res) => {
  const url = req.url;
  // console.log("url", url);
  if (url === "/") proxyReq.path += "index.html";

  return proxyReq;
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
